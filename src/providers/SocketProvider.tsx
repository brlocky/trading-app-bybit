import { DefaultLogger, WebsocketClient } from 'bybit-api';
import React, { ReactNode, useContext, useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { selectIsAppStarted } from '../store/slices';

// Define the SOCKET context
const SocketContext = React.createContext<WebsocketClient | null>(null);

interface ISocketProviderProps {
  children: ReactNode;
  socketKey: string;
  socketSecret: string;
  testnet?: boolean;
}

// Create the SOCKET provider component
export const SocketProvider: React.FC<ISocketProviderProps> = ({ children, socketKey, socketSecret, testnet }: ISocketProviderProps) => {
  const [socketClient, setSocketClient] = useState<WebsocketClient>();
  const isAppStarted = useSelector(selectIsAppStarted);

  // Disable all logging on the silly level
  const customLogger = {
    ...DefaultLogger,
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    silly: () => {},
  };

  useEffect(() => {
    closeConnection();
    if (!isAppStarted) {
      return;
    }

    // Connect Socket
    const ws = new WebsocketClient(
      {
        key: socketKey ? socketKey : undefined,
        secret: socketSecret ? socketSecret : undefined,
        market: 'v5',
        testnet,
      },
      customLogger,
    );
    setSocketClient(ws);

    console.log('Socket connected');

    return () => {
      closeConnection();
    };
  }, [isAppStarted]);

  const closeConnection = () => {
    if (socketClient) {
      console.log('Socket disconnected');
      socketClient.closeAll();
    }
  };

  return socketClient ? <SocketContext.Provider value={socketClient}>{children}</SocketContext.Provider> : null;
};

// Create a custom hook to access the SOCKET context
export const useSocket = () => {
  const socketClient = useContext(SocketContext);

  if (!socketClient) {
    throw new Error('useSocket must be used within an SocketProvider');
  }

  return socketClient;
};
