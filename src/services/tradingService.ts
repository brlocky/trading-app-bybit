import { AccountOrderV5, LinearInverseInstrumentInfoV5, LinearPositionIdx, PositionV5, RestClientV5 } from 'bybit-api';
import { toast } from 'react-toastify';

export interface ITradingService {
  addStopLoss: (position: PositionV5, price: string) => Promise<void>;
  addTakeProfit: (position: PositionV5, price: string) => Promise<void>;
  closePosition: (position: PositionV5, qty?: string, price?: string) => Promise<void>;
  closeOrder: (o: AccountOrderV5) => Promise<void>;
  getDomNormalizedAggregatorValues: (tickInfo: LinearInverseInstrumentInfoV5) => string[];
  convertToNumber: (value: string) => number;
  formatCurrency: (value: string) => string;
  openLongTrade: (props: INewTrade) => void;
  openShortTrade: (props: INewTrade) => void;
}

interface INewTrade {
  symbol: string;
  qty: string;
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
        } else {
          toast.success('SL added');
        }
      });
  };

  const addTakeProfit = async (p: PositionV5, price: string) => {
    apiClient
      .submitOrder({
        positionIdx: LinearPositionIdx.OneWayMode,
        category: 'linear',
        timeInForce: 'GTC',
        side: p.side === 'Buy' ? 'Sell' : 'Buy',
        symbol: p.symbol,
        qty: p.size,
        orderType: 'Limit',
        price: price,
        reduceOnly: true,
      })
      .then((r) => {
        if (r.retCode !== 0) {
          toast.error(r.retMsg);
        } else {
          toast.success('TP added');
        }
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
  const closeOrder = async (order: AccountOrderV5) => {
    apiClient
      .cancelOrder({
        category: 'linear',
        symbol: order.symbol,
        orderId: order.orderId,
      })
      .then((r) => {
        if (r.retCode !== 0) {
          toast.error(r.retMsg);
        } else {
          toast.success('Order Cancelled ' + order.symbol);
        }
      })
      .catch((e) => {
        console.log(e);
      });
  };

  const openLongTrade = async (props: INewTrade) => {
    // symbol: string;
    // qty: string;
    // orderType: OrderTypeV5;
    // price?: string;
    // takeProfit?: string;
    // stopLoss?: string;

    return apiClient
      .submitOrder({
        positionIdx: LinearPositionIdx.OneWayMode,
        category: 'linear',
        timeInForce: 'GTC',
        side: 'Buy',
        symbol: props.symbol,
        qty: props.qty,
        orderType: 'Market',
        price: props.price,
        stopLoss: props.stopLoss,
        isLeverage: 1,
      })
      .then((r) => {
        if (r.retCode !== 0) {
          toast.error(r.retMsg);
        } else if (props.takeProfit) {
          apiClient
            .submitOrder({
              positionIdx: LinearPositionIdx.OneWayMode,
              category: 'linear',
              timeInForce: 'GTC',
              side: 'Sell',
              symbol: props.symbol,
              qty: props.qty,
              orderType: 'Limit',
              price: props.takeProfit,
              reduceOnly: true,
            })
            .then((r) => {
              if (r.retCode !== 0) {
                toast.error(r.retMsg);
              } else {
                toast.success(`Long open - ${props.symbol}`);
              }
            });
        }
      });
  };

  const openShortTrade = async (props: INewTrade) => {
    apiClient
      .submitOrder({
        positionIdx: LinearPositionIdx.OneWayMode,
        category: 'linear',
        timeInForce: 'GTC',
        side: 'Sell',
        symbol: props.symbol,
        qty: props.qty,
        orderType: 'Market',
        price: props.price,
        stopLoss: props.stopLoss,
        isLeverage: 1,
      })
      .then((r) => {
        if (r.retCode !== 0) {
          toast.error(r.retMsg);
        } else if (props.takeProfit) {
          apiClient
            .submitOrder({
              positionIdx: LinearPositionIdx.OneWayMode,
              category: 'linear',
              timeInForce: 'GTC',
              side: 'Buy',
              symbol: props.symbol,
              qty: props.qty,
              orderType: 'Limit',
              price: props.takeProfit,
              reduceOnly: true,
            })
            .then((r) => {
              if (r.retCode !== 0) {
                toast.error(r.retMsg);
              } else {
                toast.success(`Short open - ${props.symbol}`);
              }
            });
        }
      });
  };

  return {
    addStopLoss,
    addTakeProfit,
    closePosition,
    closeOrder,
    getDomNormalizedAggregatorValues,
    convertToNumber,
    formatCurrency,
    openLongTrade,
    openShortTrade,
  };
};
