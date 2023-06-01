import React, { useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { mapApiToWsPositionV5Response, mapKlineObjToCandleStickData } from '../mappers';
import { useSocket } from '../providers';
import {
  selectTickerInfo,
  updateExecutions,
  updateLastKline,
  updateOrder,
  updatePositions,
  updateTicker,
  updateWallet,
} from '../slices/symbolSlice';

export const SocketListener: React.FC = () => {
  const tickerInfo = useSelector(selectTickerInfo);
  const dispatch = useDispatch();
  const socket = useSocket();

  const lastTickerInfoRef = useRef(tickerInfo);

  useEffect(() => {
    // subsribe one time
    StartListeners();
    socket.subscribeV5(['position', 'wallet', 'order', 'execution'], 'linear', true);
    return () => {
      socket.closeAll();
    };
  }, []);

  useEffect(() => {
    if (!tickerInfo) {
      return;
    }
    if (lastTickerInfoRef.current && tickerInfo !== lastTickerInfoRef.current) {
      StopTickSubscriptions(lastTickerInfoRef.current.symbol);
    }
    lastTickerInfoRef.current = tickerInfo;

    StartTickSubscriptions(tickerInfo.symbol);
  }, [tickerInfo]);

  const StartTickSubscriptions = (s: string) => {
    socket.subscribeV5([`tickers.${s}`, `kline.1.${s}`], 'linear', false);
  };

  const StopTickSubscriptions = (s: string) => {
    socket.unsubscribeV5([`tickers.${s}`, `kline.1.${s}`], 'linear', false);
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
          dispatch(updatePositions(data.map(mapApiToWsPositionV5Response)));
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
