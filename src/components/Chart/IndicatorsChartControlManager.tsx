import React, { useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';
import { selectLastKline, selectKlines } from '../../slices';
import { CandlestickDataWithVolume, ChartLine } from '../../types';

interface LineControlManagerProps {
  chartInstance: any;
  seriesInstance: any;
}

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

export const IndicatorsChartControlManager: React.FC<LineControlManagerProps> = ({ chartInstance }) => {
  const klines = useSelector(selectKlines);
  const kline = useSelector(selectLastKline);

  const smaLineRef = useRef<any>(undefined);
  const emaLineRef = useRef<any>(undefined);

  const updateChartLines = (klines: CandlestickDataWithVolume[]) => {
    // Update SMA
    const smaData = calculateEMA(klines, 21);
    smaLineRef.current.setData(smaData);

    // Update EMA
    const emaData = calculateEMA(klines, 9);
    emaLineRef.current.setData(emaData);
  };

  useEffect(() => {
    console.log('Klines detected', klines.length);
    setupChartLines(klines);
  }, [klines]);

  useEffect(() => {
    if (!kline || !smaLineRef.current) return;
    const parsedKline = JSON.parse(JSON.stringify(kline)) as CandlestickDataWithVolume;
    const lastbar = klines[klines.length - 1];
    if (lastbar.time >= parsedKline.time) {
      return;
    }
    const all = [...klines, parsedKline];
    updateChartLines(all);
  }, [kline]);

  const setupChartLines = (klines: CandlestickDataWithVolume[]) => {
    smaLineRef.current = chartInstance.addLineSeries({
      title: 'SMA',
      lineWidth: 1,
      color: 'red',
      lineType: 2,
    });

    emaLineRef.current = chartInstance.addLineSeries({
      title: 'Ema',
      lineWidth: 1,
      color: 'black',
      lineType: 2,
    });
    updateChartLines(klines);
  };

  return null; // Since this component doesn't render anything, we return null
};
