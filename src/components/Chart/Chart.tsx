import { ColorType, CrosshairMode, createChart } from '@felipecsl/lightweight-charts';
import React, { useEffect, useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import { selectKlines, selectLastKline, selectTickerInfo } from '../../slices/symbolSlice';
import { ChartTools } from './ChartTools';
import { LineControlManager } from './LineControlManager';
import { CandlestickDataWithVolume } from '../../types';

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

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [lastCandle, setLastCandle] = useState<CandlestickDataWithVolume | undefined>();

  const newSeries = useRef<any>(null);
  const newVolumeSeries = useRef<any>(null);
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartInstanceRef = useRef<any>(null);

  const kline = useSelector(selectLastKline);
  const klines = useSelector(selectKlines);
  const tickerInfo = useSelector(selectTickerInfo);

  const handleResize = () => {
    if (chartInstanceRef.current) {
      chartInstanceRef.current.applyOptions({
        width: chartContainerRef.current?.clientWidth || 0,
      });
    }
  };

  const initChart = () => {
    if (!chartContainerRef.current) {
      console.error('Chart Container not defined');
      return;
    }

    console.log('initChart chart');

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

    newSeries.current = chartInstanceRef.current.addCandlestickSeries({
      lineColor,
      topColor: areaTopColor,
      bottomColor: areaBottomColor,
      priceFormat: {
        type: 'price',
        precision: tickerInfo?.priceScale,
        minMove: tickerInfo?.priceFilter.tickSize,
      },
    });

    const allKlines = JSON.parse(JSON.stringify(klines));

    newSeries.current.setData(allKlines);
    setLastCandle(allKlines.length ? allKlines[allKlines.length - 1] : undefined);

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

    const volumeData = klines.map((d) => {
      return { time: d.time, value: d.volume, color: volumeColor };
    });
    newVolumeSeries.current.setData(volumeData);

    chartInstanceRef.current.timeScale().fitContent();

    console.log('initChart chart - ok');
  };

  const destroyChart = () => {
    console.log('Destroy chart');
    if (!chartInstanceRef.current) {
      console.log('Destroy chart - fail');
      return;
    }

    newSeries.current = null;
    newVolumeSeries.current = null;
    chartInstanceRef.current.remove();
    chartInstanceRef.current = null;
    console.log('Destroy chart - ok');
  };

  // Handle Resize
  useEffect(() => {
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  // Build Chart
  useEffect(() => {
    setIsLoading(true);
    if (!klines.length) return;
    initChart();

    setIsLoading(false);

    return () => {
      setIsLoading(true);
      destroyChart();
    };
  }, [klines]);

  // Update Kline
  useEffect(() => {
    if (isLoading || !kline || !lastCandle) {
      console.log('skipkline', isLoading, !!kline, !!lastCandle);
      return;
    }
    const parsedKline = JSON.parse(JSON.stringify(kline)) as CandlestickDataWithVolume;
    if (parsedKline.time < lastCandle.time) {
      console.log('skip candle update');
      return;
    }
    newSeries.current.update(parsedKline);
    newVolumeSeries.current.update({ time: kline.time, value: kline.volume, color: 'pink' });
  }, [kline]);

  return (
    <div ref={chartContainerRef} className="relative">
      {!isLoading ? (
        <>
          <ChartTools />
          <LineControlManager chartInstance={chartInstanceRef.current} seriesInstance={newSeries.current} />
        </>
      ) : null}
    </div>
  );
};
