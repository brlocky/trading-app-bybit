import { AccountOrderV5, LinearPositionIdx, PositionV5 } from 'bybit-api';
import { ITicker } from '../types';

export const calculateOrderPnL = (entryPrice: string, order: AccountOrderV5): string | null => {
  const startPrice = parseFloat(entryPrice);
  const orderClosePrice = isOrderStopLossOrTakeProfit(order) ? parseFloat(order.triggerPrice || '0') : parseFloat(order.price);
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
export const isOpenLong = (order: AccountOrderV5): boolean => order.positionIdx === LinearPositionIdx.BuySide && order.side === 'Buy';
export const isCloseLong = (order: AccountOrderV5): boolean => order.positionIdx === LinearPositionIdx.BuySide && order.side === 'Sell';
export const isOpenShort = (order: AccountOrderV5): boolean => order.positionIdx === LinearPositionIdx.SellSide && order.side === 'Sell';
export const isCloseShort = (order: AccountOrderV5): boolean => order.positionIdx === LinearPositionIdx.SellSide && order.side === 'Buy';
export const isOrderStopLossOrTakeProfit = (o: AccountOrderV5): boolean => ['TakeProfit', 'StopLoss'].includes(o.stopOrderType || '');

export const calculatePositionPnL = (position: PositionV5, price: ITicker): string => {
  let diff = 0;
  if (position.side === 'Sell') {
    diff = parseFloat(position.avgPrice) - parseFloat(price.lastPrice);
  }
  if (position.side === 'Buy') {
    diff = parseFloat(price.lastPrice) - parseFloat(position.avgPrice);
  }

  const pl = diff * parseFloat(position.size);

  return pl.toFixed(2);
};

export const formatCurrency = (value: string, precision?: string) => {
  return parseFloat(value).toFixed(Number(precision) || 2) + ' USDT';
};

export const calculateClosePositionSize = (order: PositionV5, percentage: number): string => {
  return ((parseFloat(order.size) * percentage) / 100).toFixed(3);
};

export const getOrderEntryFromPositions = (positions: PositionV5[], order: AccountOrderV5): string => {
  const p = positions.find((p) => p.symbol === order.symbol && p.positionIdx === order.positionIdx);

  return p ? p.avgPrice : '0';
};

export const calculateTargetPnL = (target: number, price: number, positionSize: number): string => {
  return ((target - price) * positionSize).toFixed(2);
};
