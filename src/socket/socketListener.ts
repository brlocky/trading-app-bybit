import { OrderSideV5 } from 'bybit-api';
import OrderbookLevelV5 from 'bybit-api/lib/types/response/v5-market';
import { OrderBookLevel, OrderBookLevelState, OrderBooksStore } from 'orderbooks';
import React, { useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { mapKlineObjToCandleStickData } from '../mappers';
import { IOrderbookResponse } from '../types';
import {
  closeLastKline,
  selectInterval,
  selectSymbol,
  selectTickerInfo,
  updateExecutions,
  updateLastKline,
  updateOrder,
  updateOrderbook,
  updatePositions,
  updateTicker,
  updateWallet,
} from '../slices/symbolSlice';
import { useSocket } from '../providers';

interface ISocketUpdate<T> {
  topic: string;
  type: string;
  ts: number;
  data: T;
}

export const SocketListener: React.FC = () => {
  const symbol = useSelector(selectSymbol);
  const interval = useSelector(selectInterval);
  const tickerInfo = useSelector(selectTickerInfo);
  const dispatch = useDispatch();
  const socket = useSocket();

  const lastSymbolRef = useRef(symbol);
  const lastIntervalRef = useRef(interval);

  useEffect(() => {
    return () => {
      socket.closeAll();
    };
  }, []);

  useEffect(() => {
    if (!tickerInfo) {
      return;
    }
    initializeSocketAndListeners();
  }, [tickerInfo]);

  useEffect(() => {
    if (symbol !== lastSymbolRef.current) {
      StopSubscriptions(lastSymbolRef.current as string, interval);
    }
    lastSymbolRef.current = symbol;
  }, [symbol]);

  useEffect(() => {
    if (interval !== lastIntervalRef.current && symbol) {
      StopSubscriptions(symbol, lastIntervalRef.current as string);
    }
    lastIntervalRef.current = interval;
  }, [interval]);

  const initializeSocketAndListeners = () => {
    StartListeners();
    StartSubscriptions();
  };

  const StartSubscriptions = () => {
    socket.subscribeV5(['position', 'wallet', 'order', 'execution'], 'linear', true);
    socket.subscribeV5([`tickers.${symbol}`, `kline.${interval}.${symbol}`, `orderbook.50.${symbol}`], 'linear', false);
  };

  const StopSubscriptions = (s: string, i: string) => {
    socket.unsubscribeV5(['position', 'wallet', 'order', 'execution'], 'linear', true);
    socket.unsubscribeV5([`tickers.${s}`, `kline.${i}.${s}`, `orderbook.50.${s}`], 'linear', false);
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

  const StartListeners = () => {
    /** Messages */
    socket.on('update', (socketUpdate) => {
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
