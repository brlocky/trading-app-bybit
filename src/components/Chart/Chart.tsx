import { createChart, ColorType, CrosshairMode } from '@felipecsl/lightweight-charts';
import React, { useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';
import {
  selectKlineData,
  selectLastKline,
  selectSymbol,
  selectTicker,
  selectTickerInfo,
} from '../../slices/symbolSlice';
import { selectPositionSize, selectStopLosses, selectTakeProfits } from '../../slices';
import { calculateTargetPnL } from '../../utils/tradeUtils';

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

  const newSeries = useRef<any>(null);
  const newVolumeSeries = useRef<any>(null);
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartInstanceRef = useRef<any>(null);

  const entryPriceLine = useRef<any>(null);
  const stopLossPriceLine = useRef<any>(null);
  const takeProfPriceLine = useRef<any>(null);

  const symbol = useSelector(selectSymbol);
  const klineData = useSelector(selectKlineData);
  const kline = useSelector(selectLastKline);
  const ticker = useSelector(selectTicker);
  const tickerInfo = useSelector(selectTickerInfo);
  const positionSize = useSelector(selectPositionSize);

  const takeProfits = useSelector(selectTakeProfits);
  const stopLosses = useSelector(selectStopLosses);

  const takeProfit1 = takeProfits[0];
  const stopLoss1 = stopLosses[0];

  function handler(params: any) {
    const line = params.customPriceLine;
    console.log(
      `${line.options().title} dragged from ${params.fromPriceString} to ${chartInstanceRef.current
        .priceScale('right')
        .formatPrice(line.options().price)}`,
    );
  }

  const handleResize = () => {
    if (chartInstanceRef.current) {
      chartInstanceRef.current.applyOptions({
        width: chartContainerRef.current?.clientWidth || 0,
      });
    }
  };

  useEffect(() => {
    if (!tickerInfo) {
      return;
    }

    if (chartContainerRef.current) {
      chartInstanceRef.current = createChart(chartContainerRef.current, {
        timeScale: {
          timeVisible: true,
          ticksVisible: true,
        },
        localization: {
          priceFormatter: (p: number) => `${p.toFixed(parseInt(tickerInfo.priceScale))}`,
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
        height: 600,
      });

      newSeries.current = chartInstanceRef.current.addCandlestickSeries({
        lineColor,
        topColor: areaTopColor,
        bottomColor: areaBottomColor,
        priceFormat: {
          type: 'price',
          precision: tickerInfo.priceScale,
          minMove: tickerInfo.priceFilter.tickSize,
        },
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

      chartInstanceRef.current.subscribeCustomPriceLineDragged(handler);

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
    if (chartInstanceRef.current !== null) {
      window.removeEventListener('resize', handleResize);
      if (chartInstanceRef.current) {
        chartInstanceRef.current.remove();
      }
    }
  }, [symbol]);

  useEffect(() => {
    if (chartInstanceRef.current) {
      newSeries.current.setData(JSON.parse(JSON.stringify(klineData)));
      const volumeData = klineData.map((d) => {
        return { time: d.time, value: d.volume, color: volumeColor };
      });
      newVolumeSeries.current.setData(volumeData);
      // chartInstanceRef.current.timeScale().fitContent();
    }
  }, [klineData]);

  useEffect(() => {
    if (!chartInstanceRef.current || !newSeries.current || !newVolumeSeries.current) {
      return;
    }

    if (kline) {
      newSeries.current.update(JSON.parse(JSON.stringify(kline)));
      newVolumeSeries.current.update({ time: kline.time, value: kline.volume, color: volumeColor });

      updatePriceChart(kline.close);
    }
  }, [kline]);

  useEffect(() => {
    if (!chartInstanceRef.current) {
      return;
    }
    if (ticker) {
      updatePriceChart(Number(ticker.lastPrice));
    }
  }, [takeProfits, stopLosses, ticker, positionSize]);

  const updatePriceChart = (priceLocal: number) => {
    if (!newSeries.current) {
      return;
    }

    const priceLines = entryPriceLine.current === null || stopLossPriceLine.current === null || takeProfPriceLine.current === null;

    // if price line exists
    if (priceLines) {
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
        title: 'StopLoss @',
        color: 'red',
        lineWidth: 2,
        lineStyle: null,
        axisLabelVisible: true,
        lineVisible: true,
        draggable: true,
      });

      // create take profit
      takeProfPriceLine.current = newSeries.current.createPriceLine({
        title: 'TakeProfit @',
        color: 'green',
        lineWidth: 2,
        lineStyle: null,
        axisLabelVisible: true,
        lineVisible: true,
        draggable: true,
      });
    }

    if (tickerInfo && ticker) {
      const tickSize = Number(tickerInfo.priceFilter.tickSize);

      const takeProfitUsd = priceLocal + tickSize * takeProfit1.ticks;
      const stopLossUsd = priceLocal - tickSize * stopLoss1.ticks;

      const pnLTakeProfit = calculateTargetPnL(takeProfit1, ticker, tickerInfo, positionSize);
      const pnLStopLoss = calculateTargetPnL(stopLoss1, ticker, tickerInfo, positionSize);

      entryPriceLine.current.applyOptions({
        price: priceLocal,
      });

      takeProfPriceLine.current.applyOptions({
        price: takeProfitUsd,
        title: 'TakeProfit @' + pnLTakeProfit + '€',
      });

      stopLossPriceLine.current.applyOptions({
        price: stopLossUsd,
        title: 'StopLoss @' + pnLStopLoss + '€',
      });
    }

    // dispatch to calculator tab
    // dispatch(
    //   setExtraInfo({
    //     price: parseFloat(priceLocal).toFixed(2),
    //     stopLoss: stopLossUsd.toFixed(2),
    //     takeProfit: takeProfitUsd.toFixed(2),
    //   }),
    // );
  };

  return <div ref={chartContainerRef}></div>;
};
