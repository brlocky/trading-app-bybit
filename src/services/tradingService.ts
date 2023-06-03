import { LinearInverseInstrumentInfoV5, LinearPositionIdx, OrderSideV5, PositionV5, RestClientV5 } from 'bybit-api';
import { toast } from 'react-toastify';

export interface ITradingService {
  addStopLoss: (position: PositionV5, price: string) => Promise<void>;
  addTakeProfit: (position: PositionV5, price: string) => Promise<void>;
  closePosition: (position: PositionV5, qty?: string, price?: string) => Promise<void>;
  getDomNormalizedAggregatorValues: (tickInfo: LinearInverseInstrumentInfoV5) => string[];
  convertToNumber: (value: string) => number;
  formatCurrency: (value: string) => string;
  openLongTrade: (props: INewTrade) => void;
  openShortTrade: (props: INewTrade) => void;
}

interface INewTrade {
  symbol: string;
  qty: string;
  orderType: 'Limit' | 'Market';
  price?: string;
  takeProfit?: string;
  stopLoss?: string;
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

  const getPositionMode = (type: OrderSideV5): LinearPositionIdx => {
    // return type === 'Buy' ? LinearPositionIdx.BuySide : LinearPositionIdx.SellSide;
    return LinearPositionIdx.OneWayMode;
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

  const openLongTrade = async (props: INewTrade) => {
    console.log({
      positionIdx: getPositionMode('Buy'),
      category: 'linear',
      timeInForce: 'GTC',
      side: 'Buy',
      ...props,
    })
    apiClient
      .submitOrder({
        positionIdx: getPositionMode('Sell'),
        category: 'linear',
        timeInForce: 'GTC',
        side: 'Buy',
        ...props,
      })
      .then((r) => {
        if (r.retCode !== 0) {
          toast.error(r.retMsg);
        } else {
          toast.success('Long open ' + props.symbol);
        }
      });
  };

  const openShortTrade = async (props: INewTrade) => {
    apiClient
      .submitOrder({
        positionIdx: getPositionMode('Sell'),
        category: 'linear',
        timeInForce: 'GTC',
        side: 'Sell',
        ...props,
      })
      .then((r) => {
        if (r.retCode !== 0) {
          toast.error(r.retMsg);
        } else {
          toast.success('Short open ' + props.symbol);
        }
      });
  };

  return {
    addStopLoss,
    addTakeProfit,
    closePosition,
    getDomNormalizedAggregatorValues,
    convertToNumber,
    formatCurrency,
    openLongTrade,
    openShortTrade,
  };
};
