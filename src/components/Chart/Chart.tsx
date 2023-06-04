import { ColorType, CrosshairMode, CustomPriceLineDraggedEventParams, createChart } from '@felipecsl/lightweight-charts';
import { KlineIntervalV3 } from 'bybit-api';
import React, { useEffect, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { IDataService, ITradingService } from '../../services';
import {
  selectEntryPrice,
  selectPositionSize,
  selectStopLoss,
  selectTakeProfit,
  updateEntryPrice,
  updateStopLoss,
  updateTakeProfit,
} from '../../slices';
import { selectCurrentPosition, selectInterval, selectLastKline, selectTicker, selectTickerInfo } from '../../slices/symbolSlice';
import { CandlestickDataWithVolume } from '../../types';
import { calculateSLPrice, calculateTPPrice, calculateTargetPnL, formatPriceWithTickerInfo } from '../../utils/tradeUtils';
import { ChartTools } from './ChartTools';

const TP = 'TP';
const SL = 'SL';
const ENTRY = 'Entry';
interface Props {
  dataService: IDataService;
  tradingService: ITradingService;
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
    dataService,
    tradingService,
    colors: {
      backgroundColor = 'white',
      lineColor = '#2962FF',
      textColor = 'black',
      areaTopColor = 'rgba(0, 0, 0, 0)',
      areaBottomColor = 'rgba(0, 0, 0, 0)',
      volumeColor = '#525151a0',
    } = {},
  } = props;

  const [chartData, setChartData] = useState<CandlestickDataWithVolume[]>([]);
  const newSeries = useRef<any>(null);
  const newVolumeSeries = useRef<any>(null);
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartInstanceRef = useRef<any>(null);

  const entryPriceLine = useRef<any>(null);
  const stopLossPriceLine = useRef<any>(null);
  const takeProfPriceLine = useRef<any>(null);

  const interval = useSelector(selectInterval);
  const kline = useSelector(selectLastKline);
  const ticker = useSelector(selectTicker);
  const tickerInfo = useSelector(selectTickerInfo);
  const currentPosition = useSelector(selectCurrentPosition);
  const positionSize = useSelector(selectPositionSize);

  const takeProfit = useSelector(selectTakeProfit);
  const stopLoss = useSelector(selectStopLoss);
  const entryPrice = useSelector(selectEntryPrice);

  const dispatch = useDispatch();

  const handleResize = () => {
    if (chartInstanceRef.current) {
      chartInstanceRef.current.applyOptions({
        width: chartContainerRef.current?.clientWidth || 0,
      });
    }
  };

  // Build Chart with Ticker info
  useEffect(() => {
    if (!chartContainerRef.current) {
      console.error('chartContainerRef is not ready');
      return;
    }

    chartInstanceRef.current = createChart(chartContainerRef.current, {
      timeScale: {
        timeVisible: true,
        ticksVisible: true,
      },
      // localization: {
      //   priceFormatter: (p: number) => `${p.toFixed(parseInt(tickerInfo.priceScale))}`,
      // },
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

    newSeries.current = chartInstanceRef.current.addCandlestickSeries({
      lineColor,
      topColor: areaTopColor,
      bottomColor: areaBottomColor,
      priceFormat: {
        type: 'price',
        precision: tickerInfo?.priceScale || 2,
        minMove: tickerInfo?.priceFilter.tickSize || 1,
      },
    });

    // create price lines (current price) - subject to change
    entryPriceLine.current = newSeries.current.createPriceLine({
      title: ENTRY + ' @',
      color: 'blue',
      lineWidth: 1,
      lineStyle: null,
      axisLabelVisible: true,
      lineVisible: true,
      draggable: true,
    });

    // create stop loss price
    stopLossPriceLine.current = newSeries.current.createPriceLine({
      title: SL + ' @',
      color: 'red',
      lineWidth: 1,
      lineStyle: null,
      axisLabelVisible: true,
      lineVisible: true,
      draggable: true,
    });

    // create take profit
    takeProfPriceLine.current = newSeries.current.createPriceLine({
      title: TP + ' @',
      color: 'green',
      lineWidth: 1,
      lineStyle: null,
      axisLabelVisible: true,
      lineVisible: true,
      draggable: true,
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

    chartInstanceRef.current.timeScale().fitContent();
    chartInstanceRef.current.subscribeCustomPriceLineDragged(priceLineHandler);

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (chartInstanceRef.current) {
        chartInstanceRef.current.remove();
      }
    };
  }, [tickerInfo]);

  // Fetch Chart Data
  useEffect(() => {
    if (tickerInfo) {
      setChartData([]);
      dataService
        .getKline({
          symbol: tickerInfo.symbol,
          interval: interval as KlineIntervalV3,
          category: 'linear',
        })
        .then((r) => {
          setChartData(r);
        });
    }
  }, [tickerInfo, interval]);

  // Apply Chart Data to Chart Series
  useEffect(() => {
    newSeries.current.setData(chartData);
    const volumeData = chartData.map((d) => {
      return { time: d.time, value: d.volume, color: volumeColor };
    });
    newVolumeSeries.current.setData(volumeData);
  }, [chartData]);

  // Update Kline
  useEffect(() => {
    if (kline) {
      newSeries.current.update(JSON.parse(JSON.stringify(kline)));
      newVolumeSeries.current.update({ time: kline.time, value: kline.volume, color: volumeColor });
      // updateChartLines();
    }
  }, [kline]);

  // Sync TPnSL lines with current position
  useEffect(() => {
    if (currentPosition) {
      dispatch(updateTakeProfit([{ ...takeProfit, price: Number(currentPosition.takeProfit) }]));
      dispatch(updateStopLoss([{ ...stopLoss, price: Number(currentPosition.stopLoss) }]));
    } else {
      dispatch(updateTakeProfit([]));
      dispatch(updateStopLoss([]));
    }
  }, [currentPosition]);

  // Sync TPnSL redux values with currentPosition
  useEffect(() => {
    if (!tickerInfo || !ticker) {
      return;
    }
    if (currentPosition) {
      if (Number(currentPosition.takeProfit)) {
        dispatch(updateTakeProfit([{ ...takeProfit, price: Number(currentPosition.takeProfit) }]));
      } else {
        dispatch(updateTakeProfit([]));
      }

      if (Number(currentPosition.stopLoss)) {
        dispatch(updateStopLoss([{ ...stopLoss, price: Number(currentPosition.stopLoss) }]));
      } else {
        dispatch(updateStopLoss([]));
      }

      dispatch(updateEntryPrice(currentPosition.avgPrice));
    } else {
      dispatch(updateTakeProfit([]));
      dispatch(updateStopLoss([]));
      dispatch(updateEntryPrice(ticker.lastPrice));
    }

    setTimeout(() => {
      updateLineLabels();
    }, 1000);
  }, [currentPosition]);

  //
  useEffect(() => {
    updateLineLabels();
  }, [entryPrice, takeProfit, stopLoss, positionSize]);

  const addTp = () => {
    if (!ticker || !tickerInfo) {
      return;
    }
    const tpPrice = calculateTPPrice(ticker.lastPrice, currentPosition);
    if (!currentPosition) {
      dispatch(updateTakeProfit([{ ...takeProfit, price: tpPrice }]));
    }
    if (currentPosition) {
      tradingService.addTakeProfit(currentPosition, formatPriceWithTickerInfo(tpPrice, tickerInfo));
    }
  };

  const addSL = () => {
    if (!ticker || !tickerInfo) {
      return;
    }
    const slPrice = calculateSLPrice(ticker.lastPrice, currentPosition);
    if (!currentPosition) {
      dispatch(updateStopLoss([{ ...takeProfit, price: slPrice }]));
    }
    if (currentPosition) {
      tradingService.addStopLoss(currentPosition, formatPriceWithTickerInfo(slPrice, tickerInfo));
    }
  };

  const priceLineHandler = (params: CustomPriceLineDraggedEventParams) => {
    if (!tickerInfo) return;
    const { customPriceLine } = params;
    const { title, price } = customPriceLine.options();
    const formatedPrice: string = chartInstanceRef.current.priceScale('right').formatPrice(price);

    if (title.startsWith(TP)) {
      if (currentPosition) {
        tradingService.addTakeProfit(currentPosition, formatPriceWithTickerInfo(formatedPrice, tickerInfo));
      } else {
        dispatch(updateTakeProfit([{ ...takeProfit, price: Number(formatedPrice) }]));
      }
    }

    if (title.startsWith(SL)) {
      if (currentPosition) {
        tradingService.addStopLoss(currentPosition, formatPriceWithTickerInfo(formatedPrice, tickerInfo));
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

  const updateLineLabels = () => {
    if (!tickerInfo || !ticker) return;
    let tp = takeProfit ? takeProfit.price : undefined,
      sl = stopLoss ? stopLoss.price : undefined, 
      entry = ticker.lastPrice,
      coinAmount = positionSize;

    // if (currentPosition) {
    //   takeProfPriceLine.current.applyOptions({
    //     price: currentPosition.takeProfit,
    //   });

    //   stopLossPriceLine.current.applyOptions({
    //     price: currentPosition.stopLoss,
    //   });

    //   entryPriceLine.current.applyOptions({
    //     price: currentPosition.avgPrice,
    //     draggable: false,
    //   });
    // } else {
    //   entryPriceLine.current.applyOptions({
    //     price: ticker?.lastPrice,
    //     draggable: true,
    //   });
    //   takeProfPriceLine.current.applyOptions({
    //     price: takeProfit ? takeProfit.price : undefined,
    //   });

    //   stopLossPriceLine.current.applyOptions({
    //     price: stopLoss ? stopLoss.price : undefined,
    //   });
    // }

    if (currentPosition) {
      entry = currentPosition.avgPrice;
      currentPosition.takeProfit ? (tp = Number(currentPosition.takeProfit)) : 0;
      currentPosition.stopLoss ? (sl = Number(currentPosition.stopLoss)) : 0;
      coinAmount = Number(currentPosition.size);
    }

    const pnLCurrent = calculateTargetPnL(Number(kline?.close), Number(entry), coinAmount);
    const pnLTakeProfit = calculateTargetPnL(Number(tp), Number(entry), coinAmount);
    const pnLStopLoss = calculateTargetPnL(Number(sl), Number(entry), coinAmount);
    takeProfPriceLine.current.applyOptions({
      title: TP + ' ' + pnLTakeProfit + 'USDT',
      lineWidth: currentPosition ? 2 : 1,
      price: tp,
    });

    stopLossPriceLine.current.applyOptions({
      title: SL + ' ' + pnLStopLoss + 'USDT',
      lineWidth: currentPosition ? 2 : 1,
      price: sl,
    });

    entryPriceLine.current.applyOptions({
      title: currentPosition ? pnLCurrent + 'USDT' : ENTRY + '@',
      lineWidth: currentPosition ? 2 : 1,
      price: entry,
    });
  };

  return (
    <div ref={chartContainerRef} className="relative">
      <ChartTools addTP={addTp} addSL={addSL} />
    </div>
  );
};
