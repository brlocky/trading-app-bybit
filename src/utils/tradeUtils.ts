import { AccountOrderV5, LinearInverseInstrumentInfoV5, LinearPositionIdx, PositionV5 } from 'bybit-api';
import { ITicker } from '../types';
import { isNumber } from 'lodash';

// Order types
export const isOpenLong = (order: AccountOrderV5): boolean => order.positionIdx === LinearPositionIdx.BuySide && order.side === 'Buy';
export const isCloseLong = (order: AccountOrderV5): boolean => order.positionIdx === LinearPositionIdx.BuySide && order.side === 'Sell';
export const isOpenShort = (order: AccountOrderV5): boolean => order.positionIdx === LinearPositionIdx.SellSide && order.side === 'Sell';
export const isCloseShort = (order: AccountOrderV5): boolean => order.positionIdx === LinearPositionIdx.SellSide && order.side === 'Buy';
export const isOrderTPorSL = (o: AccountOrderV5): boolean => isOrderTP(o) || isOrderSL(o);
export const isOrderTP = (o: AccountOrderV5): boolean => o.stopOrderType === 'TakeProfit';
export const isOrderSL = (o: AccountOrderV5): boolean => o.stopOrderType === 'StopLoss';

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

export const calculateOrderPnL = (entryPrice: string, order: AccountOrderV5): string => {
  const startPrice = Number(entryPrice);
  const isTPorSL = isOrderTPorSL(order);
  const orderClosePrice = isTPorSL ? Number(order.triggerPrice) : Number(order.price);
  const orderCloseQty = Number(order.qty);

  let pnl = 0;
  if (order.side === 'Sell') {
    pnl = (orderClosePrice - startPrice) * orderCloseQty;
  } else {
    pnl = (startPrice - orderClosePrice) * orderCloseQty;
  }

  return pnl.toFixed(2);
};

export const formatCurrency = (value: string | number, precision?: string) => {
  const newValue = isNumber(value) ? value.toString() : value;
  return parseFloat(newValue).toFixed(Number(precision) || 2);
};

export const calculateClosePositionSize = (order: PositionV5, percentage: number): string => {
  return ((parseFloat(order.size) * percentage) / 100).toFixed(3);
};

export const getPositionFromOrder = (positions: PositionV5[], order: AccountOrderV5): PositionV5 | undefined => {
  return positions.find((p) => p.symbol === order.symbol && p.positionIdx === order.positionIdx);
};

export const calculateTargetPnL = (target: number | string, price: number | string, positionSize: number): string => {
  const typedTarget = isNumber(target) ? target : Number(target);
  const typedPrice = isNumber(price) ? price : Number(price);

  return Math.abs((typedTarget - typedPrice) * positionSize).toString();
};

export const formatPriceWithTickerInfo = (value: string | number, tickerInfo: LinearInverseInstrumentInfoV5): string => {
  const numericPrice = isNumber(value) ? value : Number(value);
  return numericPrice.toFixed(Number(tickerInfo.priceScale));
};


export const formatCurrencyValue = (amount: number | string, currency = 'USD') => {
  const typedAmount = isNumber(amount) ? amount : Number(amount);

  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
  }).format(typedAmount);
};
