import { createChart, ColorType, CrosshairMode, LineStyle } from 'lightweight-charts';
import React, { useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';
import {
  selectInterval,
  selectKlineData,
  selectLastKline,
  selectPositions,
  selectSymbol,
  selectTickerInfo,
} from '../../slices/symbolSlice';

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

  const symbol = useSelector(selectSymbol);
  const interval = useSelector(selectInterval);
  const positions = useSelector(selectPositions);
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
    if (newSeries.current && klineData.length) {
      newSeries.current.setData(JSON.parse(JSON.stringify(klineData)));
      const volumeData = klineData.map((d) => {
        return { time: d.time, value: d.volume, color: volumeColor };
      });
      newVolumeSeries.current.setData(volumeData);

      // positions.forEach((p) => {
      //   const myPriceLine = {
      //     price: Number(p.entryPrice),
      //     color: 'gray',
      //     lineWidth: 2,
      //     lineStyle: 3, // LineStyle.Dashed
      //     axisLabelVisible: true,
      //     title: 'Entry',
      //     draggable: true,
      //   };

      //   newSeries.current.createPriceLine(myPriceLine);
      // });
    }
  }, [klineData]);

  useEffect(() => {
    if (kline) {
      newSeries.current.update(JSON.parse(JSON.stringify(kline)));
      newVolumeSeries.current.update({ time: kline.time, value: kline.volume, color: volumeColor });
    }
  }, [kline]);

  return <div ref={chartContainerRef}></div>;
};
