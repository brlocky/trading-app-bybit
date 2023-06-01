import { PositionV5 } from 'bybit-api';

type PositionV5FromSubscription = PositionV5 & {
  entryPrice: string;
};

// Mapper function to convert ApiResponse to WsResponse
export const mapApiToWsPositionV5Response = (response: PositionV5FromSubscription): PositionV5 => {
  return {
    ...response,
    avgPrice: response.entryPrice,
  };
};
