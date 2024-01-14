import {
  CategoryV5,
  LinearPositionIdx,
  OrderParamsV5,
  OrderSideV5,
  OrderTypeV5,
  PositionV5,
  RestClientV5,
  SetTradingStopParamsV5,
} from 'bybit-api';
import { toast } from 'react-toastify';
import { TradingLineType } from '../components/Chart/extend/plugins/trading-lines/state';
import { IChartLine } from '../types';

export interface ITradingService {
  openPosition: (props: INewPosition) => Promise<string | null>;
  addTakeProfit: (symbol: string, line: IChartLine) => Promise<string | null>;
  addStopLoss: (symbol: string, line: IChartLine) => Promise<boolean>;
  closePosition: (position: IClosePosition) => Promise<void>;
  closeOrder: (o: ICloseOrder) => Promise<boolean>;
  amendOrder: (props: IAmendOrder) => Promise<boolean>;
}

export interface IAmendOrder {
  type: TradingLineType;
  symbol: string;
  orderId: string;
  qty: string;
  price: string;
}

export interface ICloseOrder {
  orderId: string;
  symbol: string;
}

export type IPositionSide = 'Buy' | 'Sell';

export interface IClosePosition {
  symbol: string;
  qty: string;
  side: IPositionSide;
  price?: string;
}

interface INewPosition {
  symbol: string;
  qty: string;
  side: OrderSideV5;
  type: OrderTypeV5;
  price?: string;
}

export const TradingService = (apiClient: RestClientV5): ITradingService => {
  const addTakeProfit = async (symbol: string, line: IChartLine): Promise<string | null> => {
    const order: OrderParamsV5 = {
      positionIdx: LinearPositionIdx.OneWayMode,
      category: 'linear',
      symbol: symbol,
      isLeverage: 1,
      side: line.side,
      orderType: 'Limit',
      qty: line.qty.toString(),
      price: line.price.toString(),
      triggerDirection: line.side === 'Buy' ? 1 : 2,
      orderFilter: 'tpslOrder',
      reduceOnly: true,
    };

    return apiClient.submitOrder(order).then((r) => {
      if (r.retCode === 0) {
        return r.result.orderId;
      }
      toast.error(r.retMsg);
      return null;
    });
  };

  const addStopLoss = async (symbol: string, line: IChartLine): Promise<boolean> => {
    const order: SetTradingStopParamsV5 = {
      positionIdx: LinearPositionIdx.OneWayMode,
      category: 'linear',
      symbol: symbol,
      stopLoss: line.price.toString(),
      slTriggerBy: 'MarkPrice',
      slOrderType: 'Market',
    };
    if (line.qty > 0) {
      order.tpslMode = 'Partial';
      order.slSize = line.qty.toString();
    }
    return apiClient.setTradingStop(order).then((r) => {
      if (r.retCode === 0) {
        return true;
      }
      toast.error(r.retMsg);
      return false;
    });
  };

  const closePosition = async (position: IClosePosition) => {
    apiClient
      .submitOrder({
        positionIdx: LinearPositionIdx.OneWayMode,
        category: 'linear',
        symbol: position.symbol,
        side: position.side === 'Buy' ? 'Sell' : 'Buy',
        orderType: position.price ? 'Limit' : 'Market',
        qty: position.qty,
        price: position.price || undefined,
        timeInForce: position.price ? 'PostOnly' : undefined,
        reduceOnly: position.price ? true : undefined,
      })
      .then((r) => {
        if (r.retCode !== 0) {
          toast.error(r.retMsg);
        }
      });
  };

  const closeOrder = async (order: ICloseOrder): Promise<boolean> => {
    return apiClient
      .cancelOrder({
        category: 'linear',
        symbol: order.symbol,
        orderId: order.orderId,
      })
      .then((r) => {
        if (r.retCode === 0) {
          return true;
        }
        toast.error(r.retMsg);
        return false;
      });
  };

  const loadPositionBySymbol = async (symbol: string): Promise<PositionV5 | null> => {
    return apiClient
      .getPositionInfo({
        category: 'linear',
        symbol,
      })
      .then((r) => {
        if (r.retCode === 0 && r.result.list.length === 1) {
          return r.result.list[0];
        }

        return null;
      });
  };

  const openPosition = async (props: INewPosition): Promise<string | null> => {
    const response = await apiClient.submitOrder({
      positionIdx: LinearPositionIdx.OneWayMode,
      category: 'linear',
      timeInForce: 'GTC',
      side: props.side,
      symbol: props.symbol,
      qty: props.qty,
      orderType: props.type,
      price: props.price,
      isLeverage: 1,
    });

    if (response.retCode !== 0) {
      toast.error(response.retMsg);
      return null;
    }

    return response.result.orderId;
  };

  const amendOrder = async (order: IAmendOrder): Promise<boolean> => {
    const params = {
      category: 'linear' as CategoryV5,
      symbol: order.symbol,
      orderId: order.orderId,
      qty: order.qty,
      price: order.type !== 'SL' ? order.price : undefined,
      triggerPrice: order.type === 'SL' ? order.price : undefined,
    };

    return apiClient.amendOrder(params).then((r) => {
      if (r.retCode !== 0) {
        toast.error(r.retMsg);
      } else {
        return true;
      }
      return false;
    });
  };

  return {
    openPosition,
    addTakeProfit,
    addStopLoss,
    closePosition,
    closeOrder,
    amendOrder,
  };
};
