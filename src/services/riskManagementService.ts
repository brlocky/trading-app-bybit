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
    chartLineType: IChartLineType,
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

      lines.push({
        type: chartLineType,
        side: orderSide,
        price: entry.price,
        qty: roundedQty,
        draggable: true,
        isServer: false,
      });
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
