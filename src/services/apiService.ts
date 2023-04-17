// or
// import { RestClientV5 } from 'bybit-api';

import { OrderParamsV5, PositionInfoParamsV5, RestClientV5 } from "bybit-api";
import { WsConfig } from "../types";

// Interface for request object
interface ApiRequest {
  category: string;
  symbol: string;
  orderType?: string;
  qty?: string;
  side?: string;
  // Add more properties as needed
}

// Interface for response object
interface ApiResponse {
  // Add response properties as needed
}

class ApiService {
  private client: RestClientV5;

  constructor(config: WsConfig) {
    this.client = new RestClientV5(config);
  }

  getPositionInfo = async (
    request: PositionInfoParamsV5
  ): Promise<ApiResponse> => {
    try {
      return this.client.getPositionInfo(request);
    } catch (error) {
      console.error("Failed to get position info:", error);
      throw error;
    }
  };

  submitOrder = async (request: OrderParamsV5): Promise<ApiResponse> => {
    try {
      return this.client.submitOrder(request);
    } catch (error) {
      console.error("Failed to submit order:", error);
      throw error;
    }
  };
}

export default ApiService;
