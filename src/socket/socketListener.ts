import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { mapApiToWsPositionV5Response, mapKlineObjToCandleStickData } from '../mappers';
import { useSocket } from '../providers';
import {
  selectInterval,
  selectPositions,
  selectTickerInfo,
  updateExecutions,
  updateLastKline,
  updateOrders,
  updatePositions,
  updateTicker,
  updateWallet,
} from '../slices/symbolSlice';

export const SocketListener: React.FC = () => {
  const tickerInfo = useSelector(selectTickerInfo);
  const interval = useSelector(selectInterval);
  const positions = useSelector(selectPositions);
  const dispatch = useDispatch();
  const socket = useSocket();

  const [listeningSymbols, setListeningSymbols] = useState<string[]>([]);
  const [kline, setKline] = useState<string | null>(null);

  const subscribeTicker = (newSymbol: string) => {
    if (listeningSymbols.find((s) => s === newSymbol)) {
      return;
    }

    setListeningSymbols([...listeningSymbols, newSymbol]);
    socket.subscribeV5([`tickers.${newSymbol}`], 'linear', false);
  };

  const unsubscribeTicker = (s: string) => {
    socket.unsubscribeV5([`tickers.${s}`], 'linear', false);
    setListeningSymbols([...listeningSymbols.filter((l) => l !== s)]);
  };

  const resubscribeKline = (s: string, i: string) => {
    if (kline) {
      socket.unsubscribeV5([kline], 'linear', false);
    }
    const newKline = `kline.${i}.${s}`;

    // add delay to avoid issues with main chart data
    // setTimeout(() => socket.subscribeV5([newKline], 'linear', false), 2000);
    socket.subscribeV5([newKline], 'linear', false);

    setKline(newKline);
  };

  useEffect(() => {
    // subsribe one time
    StartListeners();
    socket.subscribeV5(['position', 'wallet', 'order', 'execution'], 'linear', true);
    return () => {
      socket.closeAll();
    };
  }, []);

  useEffect(() => {
    positions.map((p) => subscribeTicker(p.symbol));

    const symbolsToRemove = listeningSymbols.filter((s) => !positions.find((p) => p.symbol === s) && s !== tickerInfo?.symbol);
    symbolsToRemove.map((s) => {
      unsubscribeTicker(s);
    });
  }, [positions]);

  useEffect(() => {
    if (!tickerInfo) {
      return;
    }

    subscribeTicker(tickerInfo.symbol);
    resubscribeKline(tickerInfo.symbol, interval);
  }, [tickerInfo, interval]);

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
          dispatch(updateOrders(data));
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
