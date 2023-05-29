import { createChart, ColorType } from 'lightweight-charts';
import React, { useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';
import { selectInterval, selectKlineData, selectLastKline, selectSymbol, selectTickerInfo } from '../../slices/symbolSlice';

interface Props {
  colors?: {
    backgroundColor?: string;
    lineColor?: string;
    textColor?: string;
    areaTopColor?: string;
    areaBottomColor?: string;
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
    } = {},
  } = props;

  const newSeries = useRef<any>(null);
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartInstanceRef = useRef<any>(null);

  const symbol = useSelector(selectSymbol);
  const interval = useSelector(selectInterval);
  const klineData = useSelector(selectKlineData);
  const kline = useSelector(selectLastKline);
  const tickerInfo = useSelector(selectTickerInfo);

  useEffect(() => {
    if (!tickerInfo) {
      return;
    }

    const handleResize = () => {
      if (chartInstanceRef.current) {
        chartInstanceRef.current.applyOptions({
          width: chartContainerRef.current?.clientWidth || 0,
        });
      }
    };

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
            bottom: 0.1,
          },
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

      window.addEventListener('resize', handleResize);
    }

    return () => {
      window.removeEventListener('resize', handleResize);
      if (chartInstanceRef.current) {
        chartInstanceRef.current.remove();
      }
    };
  }, [tickerInfo, interval, symbol, backgroundColor, lineColor, textColor, areaTopColor, areaBottomColor]);

  useEffect(() => {
    if (newSeries.current && klineData) {
      newSeries.current.setData(JSON.parse(JSON.stringify(klineData)));
    }
  }, [klineData]);

  useEffect(() => {
    const items = newSeries.current._internal__series._private__data._private__items;
    const lastItem = items[items.length - 1];

    if (newSeries.current && kline && kline.time >= lastItem?._internal_originalTime) {
      newSeries.current.update(JSON.parse(JSON.stringify(kline)));
    }
  }, [kline]);

  return <div ref={chartContainerRef}></div>;
};
