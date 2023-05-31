import React, { useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { mapKlineObjToCandleStickData } from '../mappers';
import { useSocket } from '../providers';
import {
  selectInterval,
  selectSymbol,
  selectTickerInfo,
  updateExecutions,
  updateLastKline,
  updateOrder,
  updatePositions,
  updateTicker,
  updateWallet,
} from '../slices/symbolSlice';

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
    socket.subscribeV5([`tickers.${symbol}`, `kline.${interval}.${symbol}`], 'linear', false);
  };

  const StopSubscriptions = (s: string, i: string) => {
    socket.unsubscribeV5(['position', 'wallet', 'order', 'execution'], 'linear', true);
    socket.unsubscribeV5([`tickers.${s}`, `kline.${i}.${s}`], 'linear', false);
  };

  const StartListeners = () => {
    /** Messages */
    socket.on('update', (socketUpdate) => {
      const { topic, data } = socketUpdate;

      if (topic.startsWith('tickers')) {
        dispatch(updateTicker(data));
        return;
      }

      if (topic.toLowerCase().startsWith('kline')) {
        dispatch(updateLastKline(mapKlineObjToCandleStickData(data[0])));
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
