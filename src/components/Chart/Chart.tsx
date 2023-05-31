import { createChart, ColorType, CrosshairMode, CustomPriceLineDraggedEventParams } from '@felipecsl/lightweight-charts';
import React, { useEffect, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { selectInterval, selectLastKline, selectTicker, selectTickerInfo } from '../../slices/symbolSlice';
import { selectPositionSize, selectStopLosses, selectTakeProfits, updateStopLoss, updateTakeProfit } from '../../slices';
import { calculateTargetPnL } from '../../utils/tradeUtils';
import { IDataService } from '../../services';
import { KlineIntervalV3 } from 'bybit-api';
import { CandlestickDataWithVolume } from '../../types';

const TP = 'TP';
const SL = 'SL';
interface Props {
  dataService: IDataService;
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
  const positionSize = useSelector(selectPositionSize);

  const takeProfits = useSelector(selectTakeProfits);
  const stopLosses = useSelector(selectStopLosses);

  const takeProfit1 = takeProfits[0];
  const stopLoss1 = stopLosses[0];

  const dispatch = useDispatch();

  const handleResize = () => {
    if (chartInstanceRef.current) {
      chartInstanceRef.current.applyOptions({
        width: chartContainerRef.current?.clientWidth || 0,
      });
    }
  };

  function priceLineHandler(params: CustomPriceLineDraggedEventParams) {
    const { customPriceLine } = params;
    const { title, price } = customPriceLine.options();
    const formatedPrice = chartInstanceRef.current.priceScale('right').formatPrice(price);

    if (title.startsWith(TP)) {
      dispatch(updateTakeProfit([{ ...takeProfit1, price: formatedPrice }]));
    }

    if (title.startsWith(SL)) {
      dispatch(updateStopLoss([{ ...stopLoss1, price: formatedPrice }]));
    }
  }

  useEffect(() => {
    if (chartContainerRef.current) {
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
        height: 600,
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
        title: 'entry @',
        color: '#b0c4de',
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
        lineWidth: 2,
        lineStyle: null,
        axisLabelVisible: true,
        lineVisible: true,
        draggable: true,
      });

      // create take profit
      takeProfPriceLine.current = newSeries.current.createPriceLine({
        title: TP + ' @',
        color: 'green',
        lineWidth: 2,
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
    }

    return () => {
      window.removeEventListener('resize', handleResize);
      if (chartInstanceRef.current) {
        chartInstanceRef.current.remove();
      }
    };
  }, [tickerInfo, backgroundColor, lineColor, textColor, areaTopColor, areaBottomColor]);

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

          if (r.length) {
            const price = r[r.length-1].close;
            console.log('set prices', price)
            dispatch(updateTakeProfit([{ ...takeProfit1, price: price + price * 0.01 }]));
            dispatch(updateStopLoss([{ ...stopLoss1, price: price - price * 0.005 }]));
          }
        });
    }
  }, [tickerInfo]);

  useEffect(() => {
    newSeries.current.setData(chartData);
    const volumeData = chartData.map((d) => {
      return { time: d.time, value: d.volume, color: volumeColor };
    });
    newVolumeSeries.current.setData(volumeData);
  }, [chartData]);

  useEffect(() => {
    if (kline) {
      newSeries.current.update(JSON.parse(JSON.stringify(kline)));
      newVolumeSeries.current.update({ time: kline.time, value: kline.volume, color: volumeColor });
      updateTPnSLLabels(Number(kline.close));
    }
  }, [kline]);

  useEffect(() => {
    if (kline) {
      updateTPnSLPrices(Number(kline.close));
    }
  }, [takeProfits, stopLosses]);

  useEffect(() => {
    if (kline) {
      updateTPnSLLabels(Number(kline.close));
    }
  }, [positionSize]);

  const updateTPnSLPrices = (localPrice: number) => {
    takeProfPriceLine.current.applyOptions({
      price: takeProfit1.price,
    });

    stopLossPriceLine.current.applyOptions({
      price: stopLoss1.price,
    });

    entryPriceLine.current.applyOptions({
      price: localPrice,
    });

    updateTPnSLLabels(localPrice);
  };

  const updateTPnSLLabels = (localPrice: number) => {
    if (tickerInfo) {
      const pnLTakeProfit = calculateTargetPnL(takeProfit1.price, localPrice, positionSize);
      const pnLStopLoss = calculateTargetPnL(stopLoss1.price, localPrice, positionSize);
      takeProfPriceLine.current.applyOptions({
        title: TP + ' ' + pnLTakeProfit + '€',
      });
      stopLossPriceLine.current.applyOptions({
        title: SL + ' ' + pnLStopLoss + '€',
      });

      console.log(pnLTakeProfit, pnLStopLoss, localPrice);
    }
  };

  return <div ref={chartContainerRef}></div>;
};
