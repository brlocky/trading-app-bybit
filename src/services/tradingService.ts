import {
  AccountOrderV5,
  LinearPositionIdx,
  OrderParamsV5,
  OrderSideV5,
  OrderTypeV5,
  PositionV5,
  RestClientV5,
  SetTradingStopParamsV5,
} from 'bybit-api';
import { toast } from 'react-toastify';

export interface ITradingService {
  addStopLoss: (position: PositionV5, price: string, size?: string) => Promise<boolean>;
  addTakeProfit: (position: PositionV5, price: string, size: string) => Promise<boolean>;
  closePosition: (position: PositionV5, qty?: string, price?: string) => Promise<void>;
  closeOrder: (o: AccountOrderV5) => Promise<void>;
  openPosition: (props: INewPosition) => Promise<PositionV5 | null>;
}

interface INewPosition {
  symbol: string;
  qty: string;
  side: OrderSideV5;
  type: OrderTypeV5;
  price?: string;
}

export const TradingService = (apiClient: RestClientV5): ITradingService => {
  const addStopLoss = async (p: PositionV5, price: string, size?: string) => {
    const order: SetTradingStopParamsV5 = {
      positionIdx: p.positionIdx,
      category: 'linear',
      symbol: p.symbol,
      stopLoss: price,
      slTriggerBy: 'MarkPrice',
      slOrderType: 'Market',
    };
    if (size) {
      order.tpslMode = 'Partial';
      order.slSize = size;
    }
    return apiClient
      .setTradingStop(order)
      .then((r) => {
        if (r.retCode !== 0) {
          toast.error(r.retMsg);
        } else {
          toast.success('SL added');
          return true;
        }
        return false;
      })
      .catch((e) => {
        console.error(e);
        return false;
      });
  };

  const addTakeProfit = async (p: PositionV5, price: string, size: string) => {
    const order: OrderParamsV5 = {
      positionIdx: p.positionIdx,
      category: 'linear',
      symbol: p.symbol,
      isLeverage: 1,
      side: p.side === 'Buy' ? 'Sell' : 'Buy',
      orderType: 'Limit',
      qty: size,
      price,
      triggerDirection: p.side === 'Buy' ? 2 : 1,
      orderFilter: 'tpslOrder',
      reduceOnly: true,
    };

    return apiClient
      .submitOrder(order)
      .then((r) => {
        if (r.retCode !== 0) {
          toast.error(r.retMsg);
        } else {
          toast.success('TP added');
          return true;
        }
        return false;
      })
      .catch((e) => {
        console.error(e);
        return false;
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

  const loadPositionBySymbol = async (symbol: string) => {
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
      })
      .catch((e) => {
        console.error(e);
        return null;
      });
  };

  const openPosition = async (props: INewPosition) => {
    const order = await apiClient.submitOrder({
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

    if (order.retCode !== 0) {
      toast.error(order.retMsg);
      return null;
    }

    return loadPositionBySymbol(props.symbol);
  };

  return {
    openPosition,
    addStopLoss,
    addTakeProfit,
    closePosition,
    closeOrder,
  };
};
