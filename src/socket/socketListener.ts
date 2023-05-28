import { OrderSideV5, WebsocketClient } from 'bybit-api';
import OrderbookLevelV5 from 'bybit-api/lib/types/response/v5-market';
import { OrderBookLevel, OrderBookLevelState, OrderBooksStore } from 'orderbooks';
import React, { useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';
import { mapKlineObjToCandleStickData } from '../mappers';
import { IOrderbookResponse } from '../types';
import { closeLastKline, updateExecutions, updateLastKline, updateOrder, updateOrderbook, updatePositions, updateTicker, updateWallet } from '../slices/symbolSlice';
import OrderBook from 'orderbooks/lib/OrderBook';

interface SocketListenerProps {
  apiKey: string;
  apiSecret: string;
  symbol: string;
  interval: string;
}

interface ISocketUpdate<T> {
  topic: string;
  type: string;
  ts: number;
  data: T;
}

export const SocketListener: React.FC<SocketListenerProps> = ({ apiKey, apiSecret, symbol, interval }) => {
  const [socket, setSocket] = useState<WebsocketClient | undefined>(undefined);
  const [selectedSymbol, setSelectedSymbol] = useState<string | undefined>(undefined);
  const [selectedInterval, setSelectedInterval] = useState<string | undefined>(undefined);

  const dispatch = useDispatch();
  useEffect(() => {
    if (!apiKey || !apiSecret) {
      return;
    }
    console.log('Start socket listener', symbol);

    setSelectedSymbol(symbol);
    setSelectedInterval(interval);
    initializeSocketAndListeners(symbol, interval);

    // Clean up the socket connection on component unmount
    return () => {
      if (socket) {
        socket.closeAll();
      }
    };
  }, []);

  useEffect(() => {
    if (!socket) {
      return;
    }

    console.log('Synbol interval changed');
    if (selectedSymbol !== symbol) {
      setSelectedSymbol(symbol);
    }
    if (selectedInterval !== interval) {
      setSelectedInterval(interval);
    }

    initializeSocketAndListeners(symbol, interval);
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

    setSocket(newSocket);

    StartListeners(newSocket);
    StartSubscriptions(newSocket, symbol, interval);

    return newSocket;
  };

  const StartSubscriptions = (s: WebsocketClient, symbol: string, interval: string) => {
    s.subscribeV5(['position', 'wallet', 'order', 'execution'], 'linear', true);
    s.subscribeV5([`tickers.${symbol}`, `kline.${interval}.${symbol}`], 'linear', false);
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

        dispatch(updateOrderbook(OrderBooks))
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
      dispatch(updateOrderbook(OrderBooks))
    }

    // console.error('unhandled orderbook update type: ', type);
  }

  // Low level map of exchange properties to expected local properties
  function mapBybitBookSlice(symbol: string, side: OrderSideV5, level: OrderbookLevelV5): OrderBookLevelState {
    return OrderBookLevel(symbol, +level.price, side, parseFloat(level.size));
  }

  const StartListeners = (s: WebsocketClient) => {
    /** Messages */
    s.on('update', (socketUpdate) => {
      const { topic, data } = socketUpdate;

      console.log('socket update', topic)

      if (topic.startsWith('tickers')) {
        dispatch(updateTicker(data));
        return;
      }

      if (topic.toLowerCase().startsWith('orderbook')) {
        handleOrderbookUpdate(socketUpdate);
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
          console.log('--------------- update wallt');
          console.log(data);
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
