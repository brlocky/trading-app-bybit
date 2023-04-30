import { LinearPositionIdx } from 'bybit-api';
import { IOrder, IPosition, ITicker } from '../types';

export const calculateOrderPnL = (entryPrice: string, order: IOrder): string | null => {
  const startPrice = parseFloat(entryPrice);
  const orderClosePrice = isOrderStopLossOrTakeProfit(order)
    ? parseFloat(order.triggerPrice || '0')
    : parseFloat(order.price);
  const orderCloseQty = parseFloat(order.qty);

  if (orderClosePrice === 0) {
    return null;
  }

  if (
    (order.positionIdx === LinearPositionIdx.BuySide && order.side === 'Buy') ||
    (order.positionIdx === LinearPositionIdx.SellSide && order.side === 'Sell')
  ) {
    return null;
  }

  let pnl = 0;
  if (order.positionIdx === LinearPositionIdx.BuySide) {
    pnl = (orderClosePrice - startPrice) * orderCloseQty;
  } else {
    pnl = (startPrice - orderClosePrice) * orderCloseQty;
  }

  return pnl.toFixed(2);
};

// Order types
export const isOpenLong = (order: IOrder): boolean =>
  order.positionIdx === LinearPositionIdx.BuySide && order.side === 'Buy';
export const isCloseLong = (order: IOrder): boolean =>
  order.positionIdx === LinearPositionIdx.BuySide && order.side === 'Sell';
export const isOpenShort = (order: IOrder): boolean =>
  order.positionIdx === LinearPositionIdx.SellSide && order.side === 'Sell';
export const isCloseShort = (order: IOrder): boolean =>
  order.positionIdx === LinearPositionIdx.SellSide && order.side === 'Buy';
export const isOrderStopLossOrTakeProfit = (o: IOrder): boolean =>
  ['TakeProfit', 'StopLoss'].includes(o.stopOrderType || '');

export const calculatePositionPnL = (position: IPosition, price: ITicker): string => {
  let diff = 0;
  if (position.side === 'Sell') {
    diff = parseFloat(position.entryPrice) - parseFloat(price.lastPrice);
  }
  if (position.side === 'Buy') {
    diff = parseFloat(price.lastPrice) - parseFloat(position.entryPrice);
  }

  const pl = diff * parseFloat(position.size);

  return pl.toFixed(4);
};

export const formatCurrency = (value: string) => {
  return parseFloat(value).toFixed(2) + ' USDT';
};

export const calculateClosePositionSize = (order: IPosition, percentage: number): string => {
  return ((parseFloat(order.size) * percentage) / 100).toFixed(3);
};

export const getOrderEntryFromPositions = (positions: IPosition[], order: IOrder): string => {
  const p = positions.find((p) => p.symbol === order.symbol && p.positionIdx === order.positionIdx);

  return p ? p.entryPrice : '0';
};
