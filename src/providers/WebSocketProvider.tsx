import React, { createContext, useState } from 'react';
import { WebsocketClient } from 'bybit-api';
import { SettingsService } from '../services';
import { IWsResponseData } from '../types';

const WebSocketContext = createContext<WebsocketClient | null>(null);

interface IWebSocketProviderProps {
  children: React.ReactNode;
}

export const WebSocketProvider: React.FC<IWebSocketProviderProps> = ({
  children,
}) => {
  const [wsClient, setWsClient] = useState<WebsocketClient | null>(null);

  // Initialize the API client once
  if (!wsClient) {
    // Retrieve the API key and API secret from SettingsService
    const { apiKey, apiSecret } = SettingsService.loadSettings();

    const client = new WebsocketClient({
      key: apiKey,
      secret: apiSecret,
      market: 'v5',
    });

    client.subscribeV5(
      ['position', 'wallet', 'order', 'execution'],
      'linear',
      true
    )
    client.subscribeV5('tickers.BTCUSDT', 'linear');


    setWsClient(client);
  }

  return (
    <WebSocketContext.Provider value={wsClient}>
      {children}
    </WebSocketContext.Provider>
  );
};

export const useWebSocket = () => {
  const wsClient = React.useContext(WebSocketContext);

  if (!wsClient) {
    throw new Error('useWebSocket must be used within a WebSocketProvider');
  }

  return wsClient;
};
