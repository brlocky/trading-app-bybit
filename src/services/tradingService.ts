import { LinearPositionIdx, RestClientV5 } from 'bybit-api';
import { IPosition } from '../types';

export interface ITradingService {
  // openLongTrade: (positionSize: string, price?: number) => Promise<void>;
  // openMarketLongTrade: (positionSize: string) => Promise<void>;
  // openMarketShortTrade: (positionSize: string) => Promise<void>;
  // closeLongTrade: (positionSize: string, price?: number) => Promise<void>;
  // openShortTrade: (positionSize: string, price?: number) => Promise<void>;
  // closeShortTrade: (positionSize: string, price?: number) => Promise<void>;
  // closeAllOrders: () => void;

  // cancelOrder: (order: IOrder) => Promise<void>;
  // toggleChase: (order: IOrder) => Promise<void>;

  addStopLoss: (symbol: string, positionSide: LinearPositionIdx, price: string) => Promise<void>;
  closePosition: (position: IPosition, qty: string, price: string) => Promise<void>;
  getDomNormalizedAggregatorValues: () => number[];
  convertToNumber: (value: string) => number;
  formatCurrency: (value: string) => string;
  myFunction1: () => void;
  myFunction2: () => void;
  myFunction3: () => void;
}

export const TradingService = (apiClient: RestClientV5): ITradingService => {
  const getDomNormalizedAggregatorValues = () => {
    const tickerSize = 0.1;
    const multipliers = [1, 2, 4, 10, 20, 50, 100];
    return multipliers.map((m) => m * tickerSize);
  };

  const convertToNumber = (value: string): number => {
    return parseFloat(value);
  };

  const formatCurrency = (value: string): string => {
    return convertToNumber(value).toFixed(2);
  };

  const myFunction1 = () => {
    console.log('myFunction1');
  };

  const myFunction2 = () => {
    console.log('myFunction2');
  };

  const myFunction3 = () => {
    console.log('myFunction3');
  };

  const addStopLoss = async (symbol: string, positionSide: LinearPositionIdx, price: string) => {
    apiClient
      .setTradingStop({
        positionIdx: positionSide,
        category: 'linear',
        symbol: symbol,
        stopLoss: price,
      })
      .catch((e) => {
        console.log(e);
      });
  };

  const closePosition = async (position: IPosition, qty: string, price: string) => {
    apiClient
      .submitOrder({
        positionIdx: position.positionIdx,
        category: 'linear',
        symbol: position.symbol,
        side: position.positionIdx === LinearPositionIdx.BuySide ? 'Sell' : 'Buy',
        orderType: 'Limit',
        qty: qty,
        price: price,
        timeInForce: 'PostOnly',
        reduceOnly: true,
      })
      .catch((e) => {
        console.log(e);
      });
  };

  return {
    addStopLoss,
    closePosition,
    getDomNormalizedAggregatorValues,
    convertToNumber,
    formatCurrency,
    myFunction1,
    myFunction2,
    myFunction3,
  };
};
