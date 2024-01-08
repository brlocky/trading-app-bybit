import { AccountOrderV5, LinearInverseInstrumentInfoV5, OrderSideV5, PositionV5 } from 'bybit-api';
import { v4 as uuidv4 } from 'uuid';
import { TradingLineType } from '../components/Chart/extend/plugins/trading-lines/state';
import { SubTicker } from '../slices';
import { IChartLine, ITicker } from '../types';
import { isOrderSL, isOrderTP } from '../utils/tradeUtils';
import { IOrderOptionData, IOrderOptionsSettingsData } from './settingsService';

interface PriceLine {
  number: number;
  price: number;
  percentage: number;
}

export interface IRiskManagementService {
  getChartLines: (
    orderSide: OrderSideV5,
    settings: IOrderOptionsSettingsData,
    ticker: ITicker,
    tickerInfo: LinearInverseInstrumentInfoV5,
    riskAmount: number,
    positionSize: number,
    accountBalance: number,
  ) => IChartLine[];

  getTPLine: (position: PositionV5, orders: AccountOrderV5[], ticker: SubTicker) => IChartLine | null;
  getSLLine: (position: PositionV5, orders: AccountOrderV5[], ticker: SubTicker) => IChartLine | null;
  splitOrder: (position: PositionV5, orders: AccountOrderV5, ticker: SubTicker) => IChartLine[];
}

export const RiskManagementService = (): IRiskManagementService => {
  const getTPLine = (position: PositionV5, orders: AccountOrderV5[], ticker: SubTicker): IChartLine | null => {
    if (!ticker.ticker || !ticker.tickerInfo) return null;

    const qtyStep = Number(ticker.tickerInfo.lotSizeFilter.qtyStep);
    const tickSize = Number(ticker.tickerInfo.priceFilter.tickSize);
    const entryPrice = position.side === 'Buy' ? Number(ticker.ticker.ask1Price) : Number(ticker.ticker.bid1Price);
    const tpPrice = position.side === 'Buy' ? entryPrice + tickSize * 50 : entryPrice - tickSize * 50;

    const coveredByOrders: number = orders.reduce((total: number, o: AccountOrderV5) => {
      if (!isOrderTP(o)) {
        return total;
      }
      return total + Number(o.qty);
    }, 0);

    const units = Number(position.size) - coveredByOrders;

    if (!units) return null;
    return {
      id: uuidv4(),
      type: 'TP',
      side: position.side === 'Buy' ? 'Sell' : 'Buy',
      price: roundPrice(tpPrice, entryPrice),
      qty: roundQty(units, qtyStep),
      draggable: true,
      isServer: false,
    };
  };

  const getSLLine = (position: PositionV5, orders: AccountOrderV5[], ticker: SubTicker): IChartLine | null => {
    if (!ticker.ticker || !ticker.tickerInfo) return null;

    const qtyStep = Number(ticker.tickerInfo.lotSizeFilter.qtyStep);
    const tickSize = Number(ticker.tickerInfo.priceFilter.tickSize);
    const entryPrice = position.side === 'Sell' ? Number(ticker.ticker.ask1Price) : Number(ticker.ticker.bid1Price);

    const slPrice = position.side === 'Buy' ? entryPrice - tickSize * 50 : entryPrice + tickSize * 50;

    const coveredByOrders: number = orders.reduce((total: number, o: AccountOrderV5) => {
      if (!isOrderSL(o)) {
        return total;
      }
      return total + Number(o.qty);
    }, 0);

    const units = Number(position.size) - coveredByOrders;

    if (!units) return null;
    return {
      id: uuidv4(),
      type: 'SL',
      side: position.side === 'Buy' ? 'Sell' : 'Buy',
      price: roundPrice(slPrice, entryPrice),
      qty: roundQty(units, qtyStep),
      draggable: true,
      isServer: false,
    };
  };

  const splitOrder = (position: PositionV5, order: AccountOrderV5, ticker: SubTicker): IChartLine[] => {
    if (!ticker.ticker || !ticker.tickerInfo) return [];

    const qtyStep = Number(ticker.tickerInfo.lotSizeFilter.qtyStep);
    const entryPrice = Number(order.price) || Number(order.triggerPrice);

    const units = Number(order.qty) / 2;
    const halfUnits = roundQty(units, qtyStep);
    const halfUnits2 = roundQty(Number(order.qty) - halfUnits, qtyStep);

    if (!units) return [];
    return [
      {
        id: uuidv4(),
        type: isOrderTP(order) ? 'TP' : 'SL',
        side: position.side === 'Buy' ? 'Sell' : 'Buy',
        price: entryPrice,
        qty: halfUnits,
        draggable: true,
        isServer: false,
      },
      {
        id: uuidv4(),
        type: isOrderTP(order) ? 'TP' : 'SL',
        side: position.side === 'Buy' ? 'Sell' : 'Buy',
        price: entryPrice,
        qty: halfUnits2,
        draggable: true,
        isServer: false,
      },
    ];
  };

  const roundQty = (qty: number, qtyStep: number): number => {
    return Number((Math.round(qty / qtyStep) * qtyStep).toFixed(qtyStep.toString().split('.')[1]?.length || 0));
  };

  const roundPrice = (price: number, roundedPrice: number): number => {
    const precision = getDecimalPrecision(roundedPrice);
    return Number(price.toFixed(precision));
  };

  const getChartLines = (
    orderSide: OrderSideV5,
    settings: IOrderOptionsSettingsData,
    ticker: ITicker,
    tickerInfo: LinearInverseInstrumentInfoV5,
    riskAmount: number,
    positionSize: number,
    accountBalance: number,
  ): IChartLine[] => {
    const tickSize = Number(tickerInfo.priceFilter.tickSize);
    const entryPrice = orderSide === 'Buy' ? ticker.ask1Price : ticker.bid1Price;

    const { tp, sl } = settings;

    const tpPrices = _calculateLinePrices(entryPrice, tickSize, orderSide, tp.options);
    const slPrices = _calculateLinePrices(entryPrice, tickSize, orderSide, sl.options);

    const { minOrderQty, maxOrderQty, qtyStep } = tickerInfo.lotSizeFilter;
    const units =
      riskAmount === 0 ? positionSize : _calculatePositionSize(riskAmount, Number(entryPrice), slPrices, minOrderQty, maxOrderQty, qtyStep);
    const maxUnits = (accountBalance - accountBalance * 0.1) / Number(entryPrice);

    const qty = roundQty(Math.min(maxUnits, units), Number(qtyStep));

    const lines: IChartLine[] = [
      ..._convertLinePriceToChartLine(tpPrices, qty, 'TP', orderSide, Number(qtyStep)),
      ..._convertLinePriceToChartLine(slPrices, qty, 'SL', orderSide, Number(qtyStep)),
    ];

    lines.push({
      id: uuidv4(),
      type: 'ENTRY',
      side: orderSide,
      price: Number(entryPrice),
      qty: qty,
      draggable: false,
      isServer: false,
    });

    return lines;
  };

  const _calculatePositionSize = (
    riskAmount: number,
    entryPrice: number,
    stopLosses: PriceLine[],
    minOrderQty: string,
    maxOrderQty: string,
    qtyStep: string,
  ): number => {
    const totalPercentage = stopLosses.reduce((total, sl) => total + (sl.percentage || 0), 0);

    const normalizedStopLosses = stopLosses.map((sl) => ({
      ...sl,
      percentage: (sl.percentage / totalPercentage) * 100,
    }));

    const totalRiskPerShare = normalizedStopLosses.reduce((total, sl) => {
      const priceDifference = Math.abs(entryPrice - sl.price);
      return total + (priceDifference * sl.percentage) / 100;
    }, 0);

    const positionSize = riskAmount / totalRiskPerShare;

    // Apply quantity constraints
    const minQty = Number(minOrderQty);
    const maxQty = Number(maxOrderQty);

    let finalPositionSize = Math.max(minQty, Math.min(maxQty, positionSize));
    finalPositionSize = Number(
      (Math.round(finalPositionSize / Number(qtyStep)) * Number(qtyStep)).toFixed(qtyStep.toString().split('.')[1]?.length || 0),
    );
    return finalPositionSize;
  };

  const _convertLinePriceToChartLine = (
    entryPrices: PriceLine[],
    units: number,
    chartLineType: TradingLineType,
    orderSide: OrderSideV5,
    qtyStep: number,
  ) => {
    const lines: IChartLine[] = [];
    const totalPercentage = entryPrices.reduce((total, entry) => total + (entry.percentage || 0), 0);
    let remainingQty = units;

    for (let i = entryPrices.length - 1; i >= 0; i--) {
      const entry = entryPrices[i];
      const rawQty = (units * entry.percentage) / totalPercentage;
      let roundedQty = Number((Math.round(rawQty / qtyStep) * qtyStep).toFixed(qtyStep.toString().split('.')[1]?.length || 0));

      // Update remaining quantity
      remainingQty -= roundedQty;

      // Add remaining quantity to the first position
      if (i === 0) {
        roundedQty += remainingQty;
        roundedQty = Number((Math.round(roundedQty / qtyStep) * qtyStep).toFixed(qtyStep.toString().split('.')[1]?.length || 0));
      }

      if (roundedQty > 0) {
        lines.push({
          id: uuidv4(),
          type: chartLineType,
          side: orderSide,
          price: entry.price,
          qty: roundedQty,
          draggable: true,
          isServer: false,
        });
      }
    }

    return lines.reverse();
  };

  const getDecimalPrecision = (value: number): number => {
    const match = value.toString().match(/(?:\.(\d+))?(?:[eE]([+-]?\d+))?$/);
    if (!match) return 0;
    return Math.max(0, (match[1] ? match[1].length : 0) - (match[2] ? +match[2] : 0));
  };

  const _calculateLinePrices = (entryPrice: string, tickSize: number, orderSide: OrderSideV5, options: IOrderOptionData[]): PriceLine[] => {
    const priceLines = [];
    const precision = getDecimalPrecision(Number(entryPrice));
    for (let i = 0; i < options.length; i++) {
      const option = options[i];
      const { number, ticks, percentage } = option;

      const priceGap = ticks * tickSize * 10;

      const priceTarget = orderSide === 'Buy' ? Number(entryPrice) + priceGap : Number(entryPrice) - priceGap;
      const validatedPriceTarget = priceTarget > 0 ? priceTarget : 0;
      priceLines.push({
        number: number,
        price: Number(validatedPriceTarget.toFixed(precision)),
        percentage: percentage,
      });
    }

    return priceLines;
  };

  return {
    getChartLines,
    getTPLine,
    getSLLine,
    splitOrder,
  };
};
