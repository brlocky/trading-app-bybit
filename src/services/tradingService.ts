import { LinearInverseInstrumentInfoV5, PositionV5, RestClientV5 } from 'bybit-api';
import { toast } from 'react-toastify';

export interface ITradingService {
  addStopLoss: (position: PositionV5, price: string) => Promise<void>;
  addTakeProfit: (position: PositionV5, price: string) => Promise<void>;
  closePosition: (position: PositionV5, qty?: string, price?: string) => Promise<void>;
  getDomNormalizedAggregatorValues: (tickInfo: LinearInverseInstrumentInfoV5) => string[];
  convertToNumber: (value: string) => number;
  formatCurrency: (value: string) => string;
  myFunction1: () => void;
  myFunction2: () => void;
  myFunction3: () => void;
}

export const TradingService = (apiClient: RestClientV5): ITradingService => {
  const getDomNormalizedAggregatorValues = (tickInfo: LinearInverseInstrumentInfoV5): string[] => {
    const multipliers = [1, 2, 4, 10, 20, 50, 100];
    const tickSizeValue = parseFloat(tickInfo.priceFilter.tickSize);
    return multipliers.map((m) => (m * tickSizeValue).toFixed(Number(tickInfo.priceScale)));
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

  const addStopLoss = async (p: PositionV5, price: string) => {
    apiClient
      .setTradingStop({
        positionIdx: p.positionIdx,
        category: 'linear',
        symbol: p.symbol,
        stopLoss: price,
      })
      .then((r) => {
        if (r.retCode !== 0) {
          toast.error(r.retMsg);
        }
      })
      .catch((e) => {
        console.log(e);
      });
  };

  const addTakeProfit = async (p: PositionV5, price: string) => {
    apiClient
      .setTradingStop({
        positionIdx: p.positionIdx,
        category: 'linear',
        symbol: p.symbol,
        takeProfit: price,
      })
      .then((r) => {
        if (r.retCode !== 0) {
          toast.error(r.retMsg);
        }
      })
      .catch((e) => {
        console.log(e);
      });
  };

  const closePosition = async (position: PositionV5, qty?: string, price?: string) => {
    apiClient
      .submitOrder({
        positionIdx: position.positionIdx,
        category: 'linear',
        symbol: position.symbol,
        side: position.side === 'Buy' ? 'Sell' : 'Buy',
        orderType: price ? 'Limit' : 'Market',
        qty: qty ? qty : position.size,
        price: price || undefined,
        timeInForce: price ? 'PostOnly' : 'GTC',
        reduceOnly: true,
      })
      .then((r) => {
        if (r.retCode !== 0) {
          toast.error(r.retMsg);
        }
      })
      .catch((e) => {
        console.log(e);
      });
  };

  return {
    addStopLoss,
    addTakeProfit,
    closePosition,
    getDomNormalizedAggregatorValues,
    convertToNumber,
    formatCurrency,
    myFunction1,
    myFunction2,
    myFunction3,
  };
};
