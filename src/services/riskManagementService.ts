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
    riskValue: number,
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
    riskValue: number,
    positionSize: number,
  ): IChartLine[] => {
    const tickSize = Number(tickerInfo.priceFilter.tickSize);
    const entryPrice = orderSide === 'Buy' ? ticker.ask1Price : ticker.bid1Price;

    const { tp, sl } = settings;

    const tpPrices = _calculateLinePrices(entryPrice, tickSize, orderSide, tp.options);
    const slPrices = _calculateLinePrices(entryPrice, tickSize, orderSide, sl.options);

    const units = positionSize != 0 ? positionSize : _calculatePositionSize(riskValue, Number(entryPrice), slPrices);

    const lines: IChartLine[] = [
      ..._convertLinePriceToChartLine(tpPrices, units, 'TP', orderSide),
      ..._convertLinePriceToChartLine(slPrices, units, 'SL', orderSide),
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

  const _calculatePositionSize = (riskAmount: number, entryPrice: number, stopLosses: PriceLine[]): number => {
    // Calculate total risk per share based on all stop losses
    const totalRiskPerShare = stopLosses.reduce((total, sl) => total + (entryPrice - sl.price), 0);

    // Calculate effective risk percentage based on all stop losses
    const effectiveRiskPercentage = (totalRiskPerShare / entryPrice) * 100;

    // Calculate position size based on the effective risk percentage
    const positionSize = (riskAmount / effectiveRiskPercentage) * 100;

    return positionSize;
  };

  const _convertLinePriceToChartLine = (entryPrices: PriceLine[], units: number, chartLineType: IChartLineType, orderSide: OrderSideV5) => {
    const lines: IChartLine[] = [];
    for (let i = 0; i < entryPrices.length; i++) {
      const entry = entryPrices[i];
      const roundedQty = (units * entry.percentage) / 100;
      lines.push({
        type: chartLineType,
        side: orderSide,
        price: entry.price,
        qty: roundedQty,
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
