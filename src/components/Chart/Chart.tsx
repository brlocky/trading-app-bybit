import { createChart, ColorType, CandlestickData } from 'lightweight-charts';
import React, { useEffect, useRef } from 'react';

interface Props {
  data: CandlestickData[];
  lastCandle: CandlestickData | undefined;
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
    data,
    lastCandle,
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

  useEffect(() => {
    const handleResize = () => {
      if (chartInstanceRef.current) {
        chartInstanceRef.current.applyOptions({
          width: chartContainerRef.current?.clientWidth || 0,
        });
      }
    };

    if (chartContainerRef.current) {
      chartInstanceRef.current = createChart(chartContainerRef.current, {
        layout: {
          background: { type: ColorType.Solid, color: backgroundColor },
          textColor,
        },
        width: chartContainerRef.current.clientWidth,
        height: 600,
      });

      newSeries.current = chartInstanceRef.current.addCandlestickSeries({
        lineColor,
        topColor: areaTopColor,
        bottomColor: areaBottomColor,
      });

      window.addEventListener('resize', handleResize);
    }

    return () => {
      window.removeEventListener('resize', handleResize);
      if (chartInstanceRef.current) {
        chartInstanceRef.current.remove();
      }
    };
  }, [backgroundColor, lineColor, textColor, areaTopColor, areaBottomColor]);

  useEffect(() => {
    if (newSeries.current && data) {
      newSeries.current.setData(JSON.parse(JSON.stringify(data)));
    }
  }, [data]);

  useEffect(() => {
    const items = newSeries.current._internal__series._private__data._private__items;
    const lastItem = items[items.length - 1];

    if (newSeries.current && lastCandle && lastCandle.time >= lastItem?._internal_originalTime) {
      newSeries.current.update(JSON.parse(JSON.stringify(lastCandle)));
    }
  }, [lastCandle]);

  return <div ref={chartContainerRef}></div>;
};
