import { ColorType, CrosshairMode, createChart } from '@felipecsl/lightweight-charts';
import { KlineIntervalV3 } from 'bybit-api';
import { debounce } from 'lodash';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import { mapKlineToCandleStickData } from '../../mappers';
import { useApi } from '../../providers';
import { selectInterval, selectKlines, selectLastKline, selectSymbol, selectTicker, selectTickerInfo } from '../../slices/symbolSlice';
import { CandlestickDataWithVolume, ChartLine } from '../../types';
import { ChartTools } from './ChartTools';
import { LineControlManager } from './LineControlManager';
import { ChartTimer } from './ChartTimer';

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
  const [loadedCandles, setLoadedCandles] = useState<CandlestickDataWithVolume[]>([]);
  const [liveCandles, setLiveCandles] = useState<CandlestickDataWithVolume[]>([]);

  const newSeries = useRef<any>(null);
  const newVolumeSeries = useRef<any>(null);
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartInstanceRef = useRef<any>(null);
  const timeScaleRef = useRef<any>(null);
  const loadedCandlesRef = useRef<any>(null);
  const liveCandlesRef = useRef<any>(null);
  const marketLineRef = useRef<any>(null);
  const smaLineRef = useRef<any>(null);
  const emaLineRef = useRef<any>(null);

  const kline = useSelector(selectLastKline);
  const klines = useSelector(selectKlines);
  const ticker = useSelector(selectTicker);
  const tickerInfo = useSelector(selectTickerInfo);
  const symbol = useSelector(selectSymbol);
  const interval = useSelector(selectInterval);

  const apiClient = useApi();

  const handleResize = () => {
    if (chartInstanceRef.current) {
      chartInstanceRef.current.applyOptions({
        width: chartContainerRef.current?.clientWidth || 0,
      });
    }
  };

  const calculateSMA = (data: CandlestickDataWithVolume[], count: number): ChartLine[] => {
    const avg = (data: CandlestickDataWithVolume[]): number => data.reduce((sum, item) => sum + item.close, 0) / data.length;

    const result = [];

    for (let i = count - 1, len = data.length; i < len; i++) {
      const val = avg(data.slice(i - count + 1, i));
      result.push({ time: data[i].time, value: val });
    }

    return result;
  };

  const calculateEMA = (data: CandlestickDataWithVolume[], period: number): ChartLine[] => {
    const calculateMultiplier = (period: number) => 2 / (period + 1);

    const result: ChartLine[] = [];

    // Calculate the initial SMA
    let sma = 0;
    for (let i = 0; i < period; i++) {
      sma += data[i].close;
    }
    sma /= period;
    result.push({ time: data[period - 1].time, value: sma });

    // Calculate EMA for the remaining data points
    for (let i = period, len = data.length; i < len; i++) {
      const close = data[i].close;
      sma = (close - sma) * calculateMultiplier(period) + sma;
      result.push({ time: data[i].time, value: sma });
    }

    return result;
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
          bottom: 0.2,
        },
      },
      crosshair: {
        mode: CrosshairMode.Normal,
      },
      width: chartContainerRef.current.clientWidth,
      height: 500,
    });

    smaLineRef.current = chartInstanceRef.current.addLineSeries({
      title: 'SMA',
    });
    emaLineRef.current = chartInstanceRef.current.addLineSeries({
      title: 'Ema',
    });

    // Update SMA
    const smaData = calculateSMA(klines, 10);
    smaLineRef.current.setData(smaData);

    // Update EMA
    const emaData = calculateEMA(klines, 9);
    emaLineRef.current.setData(emaData);

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

    const marketPriceLine = {
      price: 0,
      color: '#d9e710',
      lineWidth: 2,
      lineStyle: 2, // LineStyle.Dashed
      axisLabelVisible: true,
    };

    marketLineRef.current = newSeries.current.createPriceLine(marketPriceLine);

    const allKlines = JSON.parse(JSON.stringify(klines));
    setLoadedCandles(allKlines);
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

    const volumeData = allKlines.map((d: CandlestickDataWithVolume) => {
      return { time: d.time, value: d.volume, color: volumeColor };
    });
    newVolumeSeries.current.setData(volumeData);

    timeScaleRef.current = chartInstanceRef.current.timeScale();
    timeScaleRef.current.subscribeVisibleLogicalRangeChange(listenChartTimeScale);
    timeScaleRef.current.fitContent();

    console.log('initChart chart - ok');
  };

  const destroyChart = () => {
    console.log('Destroy chart');
    if (!chartInstanceRef.current) {
      console.log('Destroy chart - fail');
      return;
    }

    timeScaleRef.current.unsubscribeVisibleLogicalRangeChange(listenChartTimeScale);
    newSeries.current = null;
    newVolumeSeries.current = null;
    chartInstanceRef.current.remove();
    chartInstanceRef.current = null;
    timeScaleRef.current = null;
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

    // Update Live Candles data and ref
    setLiveCandles([...liveCandles, parsedKline]);
    liveCandlesRef.current = liveCandles;

    // Update SMA
    const smaData = calculateSMA(klines, 10);
    smaLineRef.current.setData(smaData);

    // Update EMA
    const emaData = calculateEMA(klines, 9);
    emaLineRef.current.setData(emaData);
  }, [kline]);

  useEffect(() => {
    if (!ticker) return;

    if (marketLineRef.current) {
      marketLineRef.current.applyOptions({
        price: ticker.markPrice,
      });
    }
  }, [ticker]);

  // Update loaded candles
  useEffect(() => {
    if (isLoading) {
      return;
    }

    newSeries.current.setData(loadedCandles);
    const volumeData = loadedCandles.map((d: CandlestickDataWithVolume) => {
      return { time: d.time, value: d.volume, color: volumeColor };
    });
    newVolumeSeries.current.setData(volumeData);

    loadedCandlesRef.current = loadedCandles;

    // Update Series with live data
    if (liveCandlesRef.current)
      liveCandlesRef.current.forEach((c: CandlestickDataWithVolume) => {
        newSeries.current.update(c);
        newVolumeSeries.current.update({ time: c.time, value: c.volume, color: 'pink' });
      });
  }, [loadedCandles]);

  const listenChartTimeScale = useCallback(
    debounce(() => {
      const logicalRange = timeScaleRef.current.getVisibleLogicalRange();
      if (logicalRange !== null) {
        const barsInfo = newSeries.current.barsInLogicalRange(logicalRange);
        if (barsInfo !== null && barsInfo.barsBefore < 10) {
          apiClient
            .getKline({
              category: 'linear',
              symbol: symbol as string,
              interval: interval as KlineIntervalV3,
              end: Number(barsInfo.from) * 1000,
            })
            .then((r) => {
              const candleStickData = r.result.list.map(mapKlineToCandleStickData).sort((a, b) => (a.time as number) - (b.time as number));
              const allData = [...candleStickData, ...loadedCandlesRef.current].sort((a, b) => (a.time as number) - (b.time as number));
              const uniqueArr = allData.filter((item, index) => {
                return (
                  index ===
                  allData.findIndex((t) => {
                    return t.time === item.time;
                  })
                );
              });

              setLoadedCandles(uniqueArr);
            });
        }
      }
    }, 100),
    [],
  );

  return (
    <div ref={chartContainerRef} className="relative">
      {!isLoading ? (
        <>
          <ChartTools />
          <ChartTimer />
          <LineControlManager chartInstance={chartInstanceRef.current} seriesInstance={newSeries.current} />
        </>
      ) : null}
    </div>
  );
};
