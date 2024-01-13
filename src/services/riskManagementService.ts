import { LinearInverseInstrumentInfoV5, OrderSideV5, PositionV5 } from 'bybit-api';
import { v4 as uuidv4 } from 'uuid';
import { TradingLineInfo, TradingLineType } from '../components/Chart/extend/plugins/trading-lines/state';
import { SubTicker } from '../store/slices';
import { IChartLine, ITicker } from '../types';
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
    positionSize: number,
  ) => IChartLine[];
  convertToPositionSize: (entry: IChartLine, tpLines: IChartLine[], slLines: IChartLine[], qty: number, qtyStep: string) => IChartLine[];
  getTPSLLine: (parentLine: IChartLine, line: TradingLineInfo, ticker: SubTicker) => IChartLine | null;
  splitOrder: (line: TradingLineInfo, ticker: SubTicker) => IChartLine[];
}

export const RiskManagementService = (): IRiskManagementService => {
  const getChartLines = (
    orderSide: OrderSideV5,
    settings: IOrderOptionsSettingsData,
    ticker: ITicker,
    tickerInfo: LinearInverseInstrumentInfoV5,
    positionSize: number,
  ): IChartLine[] => {
    const tickSize = Number(tickerInfo.priceFilter.tickSize);

    const entryPrice = settings.armed
      ? orderSide === 'Buy'
        ? ticker.ask1Price
        : ticker.bid1Price
      : orderSide === 'Buy'
      ? ticker.bid1Price
      : ticker.ask1Price;

    const { tp, sl } = settings;

    const tpPrices = _calculateLinePrices(entryPrice, tickSize, orderSide, tp.options);
    const slPrices = _calculateLinePrices(entryPrice, tickSize, orderSide, sl.options);

    const { qtyStep } = tickerInfo.lotSizeFilter;

    const parentId = uuidv4();
    const lines: IChartLine[] = [
      ..._convertLinePriceToChartLine(tpPrices, positionSize, 'TP', orderSide, Number(qtyStep), parentId),
      ..._convertLinePriceToChartLine(slPrices, positionSize, 'SL', orderSide, Number(qtyStep), parentId),
    ];

    const isDraggable = !settings.armed;
    lines.push({
      id: parentId,
      type: 'ENTRY',
      side: orderSide,
      price: Number(entryPrice),
      qty: positionSize,
      draggable: isDraggable,
      isServer: false,
      isLive: false,
      parentId: '',
    });

    return lines;
  };

  const convertToPositionSize = (
    entry: IChartLine,
    tpLines: IChartLine[],
    slLines: IChartLine[],
    qty: number,
    qtyStep: string,
  ): IChartLine[] => {
    const newEntry = { ...entry, qty };
    const ratio = entry.qty / qty;

    const newTPLines = tpLines
      .map((l) => {
        return {
          ...l,
          qty: roundQty(l.qty / ratio, Number(qtyStep)),
        };
      })
      .filter((l) => l.qty > 0);

    const newSLLines = slLines
      .map((l) => {
        return {
          ...l,
          qty: roundQty(l.qty / ratio, Number(qtyStep)),
        };
      })
      .filter((l) => l.qty > 0);

    return [newEntry, ...newTPLines, ...newSLLines];
  };

  const _calculatePositionSizeBasedOnRisk = (
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

  const getTPSLLine = (parentLine: IChartLine, line: TradingLineInfo, ticker: SubTicker): IChartLine | null => {
    if (!ticker.ticker || !ticker.tickerInfo) return null;

    const qtyStep = Number(ticker.tickerInfo.lotSizeFilter.qtyStep);

    return {
      id: uuidv4(),
      type: line.type,
      side: parentLine.side === 'Buy' ? 'Sell' : 'Buy',
      price: roundPrice(line.price, Number(parentLine.price)),
      qty: roundQty(line.qty, qtyStep),
      draggable: true,
      isServer: false,
      isLive: false,
      parentId: line.parentId,
    };
  };

  const splitOrder = (line: TradingLineInfo, ticker: SubTicker): IChartLine[] => {
    if (!ticker.ticker || !ticker.tickerInfo) return [];

    const qtyStep = Number(ticker.tickerInfo.lotSizeFilter.qtyStep);

    const units = Number(line.qty) / 2;
    const halfUnits = roundQty(units, qtyStep);
    const halfUnits2 = roundQty(Number(line.qty) - halfUnits, qtyStep);

    if (!halfUnits || !halfUnits2) return [];
    return [
      {
        id: uuidv4(),
        type: line.type,
        side: line.side,
        price: line.price,
        qty: halfUnits,
        draggable: true,
        isServer: false,
        isLive: false,
        parentId: line.parentId,
      },
      {
        id: uuidv4(),
        type: line.type,
        side: line.side,
        price: line.price,
        qty: halfUnits2,
        draggable: true,
        isServer: false,
        isLive: false,
        parentId: line.parentId,
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

  const _convertLinePriceToChartLine = (
    entryPrices: PriceLine[],
    units: number,
    chartLineType: TradingLineType,
    orderSide: OrderSideV5,
    qtyStep: number,
    parentId: string,
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
          side: orderSide === 'Buy' ? 'Sell' : 'Buy',
          price: entry.price,
          qty: roundedQty,
          draggable: true,
          isServer: false,
          isLive: false,
          parentId: parentId,
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
    convertToPositionSize,
    getTPSLLine,
    splitOrder,
  };
};
