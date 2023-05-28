import { OrderSideV5, WebsocketClient } from 'bybit-api';
import OrderbookLevelV5, { LinearInverseInstrumentInfoV5 } from 'bybit-api/lib/types/response/v5-market';
import { OrderBookLevel, OrderBookLevelState, OrderBooksStore } from 'orderbooks';
import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { mapKlineObjToCandleStickData } from '../mappers';
import { IOrderbookResponse } from '../types';
import {
  closeLastKline,
  selectInterval,
  selectSymbol,
  updateExecutions,
  updateLastKline,
  updateOrder,
  updateOrderbook,
  updatePositions,
  updateTicker,
  updateTickerInfo,
  updateWallet,
} from '../slices/symbolSlice';
import { useApi } from '../providers';

interface SocketListenerProps {
  apiKey: string;
  apiSecret: string;
}

interface ISocketUpdate<T> {
  topic: string;
  type: string;
  ts: number;
  data: T;
}

export const SocketListener: React.FC<SocketListenerProps> = ({ apiKey, apiSecret }) => {
  const [socket, setSocket] = useState<WebsocketClient | undefined>(undefined);

  const symbol = useSelector(selectSymbol);
  const interval = useSelector(selectInterval);
  useEffect(() => {
    if (!apiKey || !apiSecret || !symbol) {
      return;
    }

    console.log('Start socket listener', symbol);

    initializeSocketAndListeners(symbol, interval);

    // Clean up the socket connection on component unmount
    return () => {
      if (socket) {
        socket.closeAll();
      }
    };
  }, []);

  const apiClient = useApi();
  const dispatch = useDispatch();

  useEffect(() => {
    console.log('Symbol or Interval changed', symbol, interval, socket);
    if (!socket || !symbol) {
      return;
    }

    console.log('Synbol interval changed xxxx');

    apiClient
      .getInstrumentsInfo({
        category: 'linear',
        symbol: symbol,
      })
      .then((tickerInfo) => {
        dispatch(updateTickerInfo(tickerInfo.result.list[0] as LinearInverseInstrumentInfoV5));
        initializeSocketAndListeners(symbol, interval);
      });
  }, [symbol, interval]);

  const initializeSocketAndListeners = (symbol: string, interval: string) => {
    console.log('initializeSocketAndListeners');
    // Close current connection
    if (socket) {
      console.log('closing socket');
      socket.closeAll();
    }

    const newSocket = new WebsocketClient({
      key: apiKey,
      secret: apiSecret,
      market: 'v5',
    });

    StartListeners(newSocket);
    StartSubscriptions(newSocket, symbol, interval);

    setSocket(newSocket);
    return newSocket;
  };

  const StartSubscriptions = (s: WebsocketClient, symbol: string, interval: string) => {
    s.subscribeV5(['position', 'wallet', 'order', 'execution'], 'linear', true);
    s.subscribeV5([`tickers.${symbol}`, `kline.${interval}.${symbol}`, `orderbook.50.${symbol}`], 'linear', false);
    // s.subscribeV5([`tickers.${symbol}`, `kline.${interval}.${symbol}`], 'linear', false);
  };

  const OrderBooks = new OrderBooksStore({ traceLog: false, checkTimestamps: false });

  // parse orderbook messages, detect snapshot vs delta, and format properties using OrderBookLevel
  function handleOrderbookUpdate(message: ISocketUpdate<IOrderbookResponse[] | IOrderbookResponse>) {
    // eslint-disable-next-line camelcase
    const { type, data, ts } = message;

    if (type == 'snapshot') {
      const allLevels: OrderBookLevelState[] = (data as IOrderbookResponse[])
        .map((o) => {
          const buy = o.b.map((level) => {
            return mapBybitBookSlice(o.s, 'Buy', { price: level[0], size: level[1] });
          });
          const sell = o.a.map((level) => {
            return mapBybitBookSlice(o.s, 'Sell', { price: level[0], size: level[1] });
          });
          return [...buy, ...sell];
        })
        .flat();

      if (allLevels.length) {
        const symbol = allLevels[0][0];

        OrderBooks.handleSnapshot(
          symbol,
          allLevels,
          // eslint-disable-next-line camelcase
          ts / 1000,
        );

        dispatch(updateOrderbook(OrderBooks));
      }
    }

    if (type == 'delta') {
      const orderBookResponse = data as IOrderbookResponse;
      const deleteLevels: OrderBookLevelState[] = [];
      const insertLevels: OrderBookLevelState[] = [];

      const buy = orderBookResponse.b.map((level) => {
        return mapBybitBookSlice(orderBookResponse.s, 'Buy', { price: level[0], size: level[1] });
      });
      const sell = orderBookResponse.a.map((level) => {
        return mapBybitBookSlice(orderBookResponse.s, 'Sell', { price: level[0], size: level[1] });
      });
      const updateLevels = [...buy, ...sell];
      OrderBooks.handleDelta(
        orderBookResponse.s,
        deleteLevels,
        updateLevels,
        insertLevels,
        // eslint-disable-next-line camelcase
        ts / 1000,
      );
      dispatch(updateOrderbook(OrderBooks));
    }
  }

  // Low level map of exchange properties to expected local properties
  function mapBybitBookSlice(symbol: string, side: OrderSideV5, level: OrderbookLevelV5): OrderBookLevelState {
    return OrderBookLevel(symbol, +level.price, side, parseFloat(level.size));
  }

  const StartListeners = (s: WebsocketClient) => {
    /** Messages */
    s.on('update', (socketUpdate) => {
      const { topic, data } = socketUpdate;

      if (topic.startsWith('tickers')) {
        dispatch(updateTicker(data));
        return;
      }

      if (topic.toLowerCase().startsWith('orderbook')) {
        handleOrderbookUpdate(JSON.parse(JSON.stringify(socketUpdate)));
        return;
      }

      if (topic.toLowerCase().startsWith('kline')) {
        if (data[0].confirm) {
          dispatch(closeLastKline(mapKlineObjToCandleStickData(data[0])));
        } else {
          dispatch(updateLastKline(mapKlineObjToCandleStickData(data[0])));
        }

        return;
      }

      switch (topic) {
        case 'position':
          dispatch(updatePositions(data));
          break;

        case 'wallet':
          if (data[0]) {
            dispatch(updateWallet(data[0]));
          }
          break;

        case 'order':
          dispatch(updateOrder(data));
          break;

        case 'execution':
          dispatch(updateExecutions(data));
          break;

        default:
          console.error('Unknown socket update');
          console.error(topic, data);
        //   console.info("update", topic, data);
        //   SocketDispatch({ type: "update_users", payload: users });
      }
    });
  };

  return null; // Or you can return a loading indicator if needed
};
