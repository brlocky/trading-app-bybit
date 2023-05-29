import { RestClientV5 } from 'bybit-api';
import React, { ReactNode, useContext, useState } from 'react';

// Define the API context
const ApiContext = React.createContext<RestClientV5 | null>(null);

interface IApiProviderProps {
  children: ReactNode;
  apiKey: string;
  apiSecret: string;
  testnet?: boolean;
}

// Create the API provider component
export const ApiProvider: React.FC<IApiProviderProps> = ({ children, apiKey, apiSecret, testnet }: IApiProviderProps) => {
  const [apiClient, setApiClient] = useState<RestClientV5 | null>(null);

  // Initialize the API client once
  if (!apiClient) {
    // Retrieve the API key and API secret from SettingsService
    const client = new RestClientV5({ key: apiKey, secret: apiSecret, testnet: testnet });
    setApiClient(client);
  }

  return <ApiContext.Provider value={apiClient}>{children}</ApiContext.Provider>;
};

// Create a custom hook to access the API context
export const useApi = () => {
  const apiClient = useContext(ApiContext);

  if (!apiClient) {
    throw new Error('useApi must be used within an ApiProvider');
  }

  return apiClient;
};
