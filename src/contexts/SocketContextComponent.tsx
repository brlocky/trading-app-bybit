import React, { PropsWithChildren, useEffect, useReducer, useState } from 'react';
import { useSocket } from '../hooks/useSocket';
import { SocketContextProvider, SocketReducer, defaultSocketContextState } from './SocketContext';

export type ISocketContextComponentProps = PropsWithChildren;

import { OrderBooksStore, OrderBookLevel, OrderBookLevelState } from 'orderbooks';
import { OrderSideV5 } from 'bybit-api';
import { IOrderbookResponse } from '../types';
import OrderbookLevelV5 from 'bybit-api/lib/types/response/v5-market';

interface ISocketUpdate<T> {
  topic: string;
  type: string;
  ts: number;
  data: T;
}

const SocketContextComponent: React.FunctionComponent<ISocketContextComponentProps> = (props) => {
  const { children } = props;

  const socket = useSocket();

  const [SocketState, SocketDispatch] = useReducer(SocketReducer, defaultSocketContextState);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (socket) {
      SocketDispatch({ type: 'update_socket', payload: socket });
    }
    StartSubscriptions();
    StartListeners();
    setLoading(false);

    // eslint-disable-next-line
  }, []);

  const StartSubscriptions = () => {
    if (!socket) return;
    socket.subscribeV5(['position', 'wallet', 'order', 'execution'], 'linear', true);
    socket.subscribeV5(['tickers.BTCUSDT', 'orderbook.500.BTCUSDT'], 'linear');
  };

  const OrderBooks = new OrderBooksStore({ traceLog: false, checkTimestamps: false });

  // parse orderbook messages, detect snapshot vs delta, and format properties using OrderBookLevel
  function handleOrderbookUpdate(
    message: ISocketUpdate<IOrderbookResponse[] | IOrderbookResponse>,
  ) {
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

        SocketDispatch({ type: 'update_orderbook', payload: OrderBooks });
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
      SocketDispatch({ type: 'update_orderbook', payload: OrderBooks });
    }

    // console.error('unhandled orderbook update type: ', type);
  }

  // Low level map of exchange properties to expected local properties
  function mapBybitBookSlice(
    symbol: string,
    side: OrderSideV5,
    level: OrderbookLevelV5,
  ): OrderBookLevelState {
    return OrderBookLevel(symbol, +level.price, side, parseFloat(level.size));
  }

  const StartListeners = () => {
    if (!socket) return;
    /** Messages */
    socket.on('update', (socketUpdate) => {
      const { topic, data } = socketUpdate;
      if (topic.startsWith('tickers')) {
        SocketDispatch({ type: 'update_ticker', payload: data });
      } else {
        if (topic.toLowerCase().startsWith('orderbook')) {
          handleOrderbookUpdate(socketUpdate);
        } else {
          switch (topic) {
            case 'position':
              SocketDispatch({ type: 'update_positions', payload: data });
              break;

            case 'wallet':
              if (data[0]) {
                SocketDispatch({ type: 'update_wallet', payload: data[0] });
              }
              break;

            case 'order':
              SocketDispatch({ type: 'update_orders', payload: data });
              break;

            case 'execution':
              SocketDispatch({ type: 'update_executions', payload: data });
              break;

            default:
              console.error('Unknown socket update');
              console.error(topic, data);
            //   console.info("update", topic, data);
            //   SocketDispatch({ type: "update_users", payload: users });
          }
        }
      }
    });
  };

  if (loading) return <p>... loading Socket IO ....</p>;

  if (!socket) {
    return <>{children}</>;
  }

  return (
    <SocketContextProvider value={{ SocketState, SocketDispatch }}>
      {children}
    </SocketContextProvider>
  );
};

export default SocketContextComponent;
