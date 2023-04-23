import React, {
  PropsWithChildren,
  useEffect,
  useReducer,
  useState,
} from 'react';
import { useSocket } from '../hooks/useSocket';
import {
  SocketContextProvider,
  SocketReducer,
  defaultSocketContextState,
} from './SocketContext';

export type ISocketContextComponentProps = PropsWithChildren


const SocketContextComponent: React.FunctionComponent<
  ISocketContextComponentProps
> = (props) => {
  const { children } = props;

  const socket = useSocket();

  const [SocketState, SocketDispatch] = useReducer(
    SocketReducer,
    defaultSocketContextState
  );
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    SocketDispatch({ type: 'update_socket', payload: socket });
    StartSubscriptions();
    StartListeners();
    setLoading(false);
    // eslint-disable-next-line
  }, []);

  const StartSubscriptions = () => {
    socket.subscribeV5(
      ['position', 'wallet', 'order', 'execution'],
      'linear',
      true
    );
    socket.subscribeV5('tickers.BTCUSDT', 'linear');

  };

  const StartListeners = () => {
    /** Messages */
    socket.on('update', ({ topic, data }) => {
      if (topic.startsWith('tickers')) {
        SocketDispatch({ type: 'update_ticker', payload: data });
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
    });
  };

  if (loading) return <p>... loading Socket IO ....</p>;

  return (
    <SocketContextProvider value={{ SocketState, SocketDispatch }}>
      {children}
    </SocketContextProvider>
  );
};

export default SocketContextComponent;
