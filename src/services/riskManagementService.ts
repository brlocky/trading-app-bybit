import { IOrderOptionData, IOrderOptionsSettingsData } from './settingsService';
import { IChartLine, IChartLineType, ITicker } from '../types';
import { LinearInverseInstrumentInfoV5, OrderSideV5, OrderTypeV5 } from 'bybit-api';

interface PriceLine {
  number: number;
  price: number;
  percentage: number;
}

export interface IRiskManagementService {
  getChartLines: (
    orderSide: OrderSideV5,
    orderType: OrderTypeV5,
    settings: IOrderOptionsSettingsData,
    ticker: ITicker,
    tickerInfo: LinearInverseInstrumentInfoV5,
    riskAmount: number,
    positionSize: number,
  ) => IChartLine[];
}

export const RiskManagementService = (): IRiskManagementService => {
  const getChartLines = (
    orderSide: OrderSideV5,
    orderType: OrderTypeV5,
    settings: IOrderOptionsSettingsData,
    ticker: ITicker,
    tickerInfo: LinearInverseInstrumentInfoV5,
    riskAmount: number,
    positionSize: number,
  ): IChartLine[] => {
    const tickSize = Number(tickerInfo.priceFilter.tickSize);
    const entryPrice = orderSide === 'Buy' ? ticker.ask1Price : ticker.bid1Price;

    const { tp, sl } = settings;

    const tpPrices = _calculateLinePrices(entryPrice, tickSize, orderSide, tp.options);
    const slPrices = _calculateLinePrices(entryPrice, tickSize, orderSide, sl.options);

    const { minOrderQty, maxOrderQty, qtyStep } = tickerInfo.lotSizeFilter;
    const units =
      riskAmount === 0 ? positionSize : _calculatePositionSize(riskAmount, Number(entryPrice), slPrices, minOrderQty, maxOrderQty, qtyStep);

    const lines: IChartLine[] = [
      ..._convertLinePriceToChartLine(tpPrices, units, 'TP', orderSide, Number(qtyStep)),
      ..._convertLinePriceToChartLine(slPrices, units, 'SL', orderSide, Number(qtyStep)),
    ];

    lines.push({
      type: 'ENTRY',
      side: orderSide,
      price: Number(entryPrice),
      qty: units,
      draggable: orderType === 'Limit' ? true : false,
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
    const totalRiskPerShare = stopLosses.reduce((total, sl) => {
      const priceDifference = Math.abs(entryPrice - sl.price);
      const percentage = sl.percentage || 0; // Use the correct property based on your data structure
      return total + (priceDifference * percentage) / 100;
    }, 0);

    const positionSize = riskAmount / totalRiskPerShare;

    // Apply quantity constraints
    const minQty = Number(minOrderQty);
    const maxQty = Number(maxOrderQty);

    let finalPositionSize = Math.max(minQty, Math.min(maxQty, positionSize));
    finalPositionSize = Math.round(finalPositionSize / Number(qtyStep)) * Number(qtyStep);

    return finalPositionSize;
  };

  const _convertLinePriceToChartLine = (
    entryPrices: PriceLine[],
    units: number,
    chartLineType: IChartLineType,
    orderSide: OrderSideV5,
    qtyStep: number,
  ) => {
    const lines: IChartLine[] = [];

    for (let i = 0; i < entryPrices.length; i++) {
      const entry = entryPrices[i];
      const rawQty = (units * entry.percentage) / 100;
      const roundedQty = Math.round(rawQty / qtyStep) * qtyStep;

      // Calculate the remaining quantity for the last position
      const remainingQty = i === entryPrices.length - 1 ? units - lines.reduce((total, line) => total + line.qty, 0) : 0;

      lines.push({
        type: chartLineType,
        side: orderSide,
        price: entry.price,
        qty: i === entryPrices.length - 1 ? remainingQty : roundedQty,
        draggable: true,
        isServer: false,
      });
    }

    return lines;
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
      priceLines.push({
        number: number,
        price: Number(priceTarget.toFixed(precision)),
        percentage: percentage,
      });
    }

    return priceLines;
  };

  return {
    getChartLines,
  };
};
