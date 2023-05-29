import { WebsocketClient } from 'bybit-api';
import React, { ReactNode, useContext, useState } from 'react';

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
  const [socketClient, setSocketClient] = useState<WebsocketClient | null>(null);

  // Initialize the SOCKET client once
  if (!socketClient) {
    // Retrieve the SOCKET key and SOCKET secret from SettingsService
    const ws = new WebsocketClient({
      key: socketKey,
      secret: socketSecret,
      market: 'v5',
      testnet,
    });
    setSocketClient(ws);
  }

  return <SocketContext.Provider value={socketClient}>{children}</SocketContext.Provider>;
};

// Create a custom hook to access the SOCKET context
export const useSocket = () => {
  const socketClient = useContext(SocketContext);

  if (!socketClient) {
    throw new Error('useSocket must be used within an SocketProvider');
  }

  return socketClient;
};
