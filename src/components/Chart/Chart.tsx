import { ColorType, CrosshairMode, CustomPriceLineDraggedEventParams, createChart } from '@felipecsl/lightweight-charts';
import { KlineIntervalV3 } from 'bybit-api';
import React, { useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useApi } from '../../providers';
import { DataService, TradingService } from '../../services';
import {
  selectEntryPrice,
  selectOrderType,
  selectPositionSize,
  selectStopLoss,
  selectTakeProfit,
  updateEntryPrice,
  updateStopLoss,
  updateTakeProfit,
} from '../../slices';
import { selectCurrentPosition, selectInterval, selectLastKline, selectTicker, selectTickerInfo } from '../../slices/symbolSlice';
import { calculateSLPrice, calculateTPPrice, calculateTargetPnL, formatPriceWithTickerInfo } from '../../utils/tradeUtils';
import { ChartTools } from './ChartTools';

const TP = 'TP';
const SL = 'SL';
const ENTRY = 'Entry';

interface Props {
  colors?: {
    backgroundColor?: string;
    lineColor?: string;
    textColor?: string;
    areaTopColor?: string;
    areaBottomColor?: string;
    volumeColor?: string;
  };
}

export const Chart: React.FC<Props> = (props) => {
  const {
    colors: {
      backgroundColor = 'white',
      lineColor = '#2962FF',
      textColor = 'black',
      areaTopColor = 'rgba(0, 0, 0, 0)',
      areaBottomColor = 'rgba(0, 0, 0, 0)',
      volumeColor = '#525151a0',
    } = {},
  } = props;

  const tradingService = TradingService(useApi());
  const dataService = DataService(useApi());
  const newSeries = useRef<any>(null);
  const newVolumeSeries = useRef<any>(null);
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartInstanceRef = useRef<any>(null);

  const entryPriceLine = useRef<any>(null);
  const stopLossPriceLine = useRef<any>(null);
  const takeProfPriceLine = useRef<any>(null);
  const currentPositionRef = useRef<any>(null);

  const interval = useSelector(selectInterval);
  const kline = useSelector(selectLastKline);
  const ticker = useSelector(selectTicker);
  const tickerInfo = useSelector(selectTickerInfo);
  const currentPosition = useSelector(selectCurrentPosition);
  const positionSize = useSelector(selectPositionSize);

  const takeProfit = useSelector(selectTakeProfit);
  const stopLoss = useSelector(selectStopLoss);
  const entryPrice = useSelector(selectEntryPrice);
  const orderType = useSelector(selectOrderType);
  const dispatch = useDispatch();

  const handleResize = () => {
    if (chartInstanceRef.current) {
      chartInstanceRef.current.applyOptions({
        width: chartContainerRef.current?.clientWidth || 0,
      });
    }
  };

  // Build Chart
  useEffect(() => {
    if (!chartContainerRef.current) {
      return;
    }

    chartInstanceRef.current = createChart(chartContainerRef.current, {
      timeScale: {
        timeVisible: true,
        ticksVisible: true,
      },
      layout: {
        background: { type: ColorType.Solid, color: backgroundColor },
        textColor,
      },
      rightPriceScale: {
        ticksVisible: true,
        scaleMargins: {
          top: 0.1,
          bottom: 0.3,
        },
      },
      crosshair: {
        mode: CrosshairMode.Normal,
      },
      width: chartContainerRef.current.clientWidth,
      height: 500,
    });

    newVolumeSeries.current = chartInstanceRef.current.addHistogramSeries({
      priceFormat: {
        type: 'volume',
      },
      priceScaleId: '', // set as an overlay by setting a blank priceScaleId
    });
    newVolumeSeries.current.priceScale().applyOptions({
      // set the positioning of the volume series
      scaleMargins: {
        top: 0.9, // highest point of the series will be 70% away from the top
        bottom: 0,
      },
    });

    newSeries.current = chartInstanceRef.current.addCandlestickSeries({
      lineColor,
      topColor: areaTopColor,
      bottomColor: areaBottomColor,
      priceFormat: {
        type: 'price',
        precision: 2,
        minMove: 0.1,
      },
    });

    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);

      newSeries.current = null;
      newVolumeSeries.current = null;
      chartInstanceRef.current.remove();
    };
  }, []);

  // Update Chart with Ticker info
  useEffect(() => {
    if (!chartContainerRef.current) {
      return;
    }

    if (!tickerInfo) {
      return;
    }

    // Reset series data
    newSeries.current.setData([]);
    newVolumeSeries.current.setData([]);
    dispatch(updateTakeProfit([]));
    dispatch(updateStopLoss([]));

    // Apply price formt to series
    newSeries.current.applyOptions({
      priceFormat: {
        type: 'price',
        precision: tickerInfo.priceScale,
        minMove: tickerInfo.priceFilter.tickSize,
      },
    });

    // Load Kline data and apply it
    dataService
      .getKline({
        symbol: tickerInfo.symbol,
        interval: interval as KlineIntervalV3,
        category: 'linear',
      })
      .then((r) => {
        newSeries.current.setData(r);
        const volumeData = r.map((d) => {
          return { time: d.time, value: d.volume, color: volumeColor };
        });
        newVolumeSeries.current.setData(volumeData);
        setupChartLines();

        chartInstanceRef.current.timeScale().fitContent();
      });
  }, [tickerInfo?.symbol, interval]);

  // Update Chart with Ticker info
  useEffect(() => {
    if (!tickerInfo?.symbol) {
      return;
    }

    chartInstanceRef.current.subscribeCustomPriceLineDragged(priceLineHandler);

    return () => {
      chartInstanceRef.current.unsubscribeCustomPriceLineDragged(priceLineHandler);
    };
  }, [tickerInfo?.symbol]);

  // Update Kline
  useEffect(() => {
    if (kline) {
      newSeries.current.update(JSON.parse(JSON.stringify(kline)));
      newVolumeSeries.current.update({ time: kline.time, value: kline.volume, color: volumeColor });
      if (orderType === 'Market') {
        dispatch(updateEntryPrice(kline.close.toFixed(6)));
      }
      updateChartLines();
    }
  }, [kline]);

  useEffect(() => {
    updateChartLines();
  }, [ticker, positionSize]);

  useEffect(() => {
    if (orderType === 'Market' && ticker) {
      dispatch(updateEntryPrice(ticker.lastPrice));
    }
    updateChartLines();
  }, [orderType]);

  useEffect(() => {
    setupChartLines();
  }, [takeProfit, stopLoss, currentPosition]);

  useEffect(() => {
    currentPositionRef.current = currentPosition;
  }, [currentPosition]);

  const addTp = () => {
    if (!tickerInfo || !ticker) {
      return;
    }
    const tpPrice = calculateTPPrice(currentPosition ? ticker.lastPrice : entryPrice, currentPosition);
    if (currentPosition) {
      tradingService.addTakeProfit(currentPosition, formatPriceWithTickerInfo(tpPrice, tickerInfo));
    } else {
      dispatch(updateTakeProfit([{ ...takeProfit, price: tpPrice }]));
    }
  };

  const addSL = () => {
    if (!tickerInfo || !ticker) {
      return;
    }
    const slPrice = calculateSLPrice(currentPosition ? ticker.lastPrice : entryPrice, currentPosition);
    if (currentPosition) {
      tradingService.addStopLoss(currentPosition, formatPriceWithTickerInfo(slPrice, tickerInfo));
    } else {
      dispatch(updateStopLoss([{ ...takeProfit, price: slPrice }]));
    }
  };

  const priceLineHandler = (params: CustomPriceLineDraggedEventParams) => {
    if (!tickerInfo) return;
    const { customPriceLine } = params;
    const { title, price } = customPriceLine.options();
    const formatedPrice: string = chartInstanceRef.current.priceScale('right').formatPrice(price);

    const p = currentPositionRef.current;

    if (title.startsWith(TP)) {
      if (p) {
        tradingService.addTakeProfit(p, formatPriceWithTickerInfo(formatedPrice, tickerInfo));
        dispatch(updateTakeProfit([{ ...takeProfit, price: Number(formatedPrice) }]));
      } else {
        dispatch(updateTakeProfit([{ ...takeProfit, price: Number(formatedPrice) }]));
      }
    }

    if (title.startsWith(SL)) {
      if (p) {
        tradingService.addStopLoss(p, formatPriceWithTickerInfo(formatedPrice, tickerInfo));
      } else {
        dispatch(updateStopLoss([{ ...stopLoss, price: Number(formatedPrice) }]));
      }
    }

    if (title.startsWith(ENTRY)) {
      if (Number(formatedPrice) >= 0) {
        dispatch(updateEntryPrice(formatedPrice));
      }
    }
  };

  const setupChartLines = () => {
    // Remove Lines
    takeProfPriceLine.current && newSeries.current.removePriceLine(takeProfPriceLine.current);
    stopLossPriceLine.current && newSeries.current.removePriceLine(stopLossPriceLine.current);
    entryPriceLine.current && newSeries.current.removePriceLine(entryPriceLine.current);

    const tpLinePrice =
      currentPosition?.takeProfit && Number(currentPosition.takeProfit) > 0
        ? Number(currentPosition.takeProfit)
        : takeProfit && takeProfit.price
        ? takeProfit.price
        : undefined;
    const slLinePrice =
      currentPosition?.stopLoss && Number(currentPosition.stopLoss) > 0
        ? Number(currentPosition.stopLoss)
        : stopLoss && stopLoss.price
        ? stopLoss.price
        : undefined;

    entryPriceLine.current = newSeries.current.createPriceLine({
      title: ENTRY + ' @',
      color: 'blue',
      lineWidth: 1,
      lineStyle: null,
      axisLabelVisible: true,
      lineVisible: true,
      draggable: false,
    });

    // create take profit
    if (tpLinePrice) {
      takeProfPriceLine.current = newSeries.current.createPriceLine({
        title: TP + ' @',
        color: 'green',
        lineWidth: 1,
        lineStyle: null,
        axisLabelVisible: true,
        lineVisible: true,
        draggable: true,
      });
    }

    // create stop loss price
    if (slLinePrice) {
      stopLossPriceLine.current = newSeries.current.createPriceLine({
        title: SL + ' @',
        color: 'red',
        lineWidth: 1,
        lineStyle: null,
        axisLabelVisible: true,
        lineVisible: true,
        draggable: true,
        price: slLinePrice,
      });
    }
    updateChartLines();
  };

  const updateChartLines = () => {
    if (!tickerInfo || !ticker) {
      return;
    }

    let tp = takeProfit ? takeProfit.price : undefined,
      sl = stopLoss ? stopLoss.price : undefined,
      entry = orderType === 'Limit' ? entryPrice : kline?.close,
      coinAmount = positionSize,
      isEntryDraggable = orderType === 'Limit' ? true : false;

    if (currentPosition) {
      entry = currentPosition.avgPrice;
      currentPosition.takeProfit ? (tp = Number(currentPosition.takeProfit)) : 0;
      currentPosition.stopLoss ? (sl = Number(currentPosition.stopLoss)) : 0;
      coinAmount = Number(currentPosition.size);
      isEntryDraggable = false;
    }

    const pnLCurrent = calculateTargetPnL(Number(ticker.lastPrice), Number(entry), coinAmount);
    const pnLTakeProfit = tp ? calculateTargetPnL(Number(tp), Number(entry), coinAmount) : undefined;
    const pnLStopLoss = sl ? calculateTargetPnL(Number(sl), Number(entry), coinAmount) : undefined;

    takeProfPriceLine.current?.applyOptions({
      title: TP + ' ' + pnLTakeProfit + 'USDT',
      lineWidth: currentPosition ? 2 : 1,
      price: tp,
      visible: false,
    });

    stopLossPriceLine.current?.applyOptions({
      title: SL + ' ' + pnLStopLoss + 'USDT',
      lineWidth: currentPosition ? 2 : 1,
      price: sl,
      visible: false,
    });

    entryPriceLine.current?.applyOptions({
      title: currentPosition ? pnLCurrent + 'USDT' : ENTRY + '@',
      lineWidth: currentPosition ? 2 : 1,
      price: entry,
      draggable: isEntryDraggable,
    });
  };

  return (
    <div ref={chartContainerRef} className="relative">
      <ChartTools addTP={addTp} addSL={addSL} />
    </div>
  );
};
