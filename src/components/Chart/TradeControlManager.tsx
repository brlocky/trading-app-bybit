import { IChartApi, ISeriesApi, SeriesType } from 'lightweight-charts';
import React, { useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { removeChartLine, selectLines, setChartLines } from '../../slices';
import { IChartLine } from '../../types';
import { TradingLineInfo, TradingLinedDragInfo } from './extend/plugins/trading-lines/state';
import { TradingLines } from './extend/plugins/trading-lines/trading-lines';

interface LineControlManagerProps {
  chartInstance: IChartApi;
  seriesInstance: ISeriesApi<SeriesType>;
}

export const TradeControlManager: React.FC<LineControlManagerProps> = ({ seriesInstance }) => {
  const chartLines = useSelector(selectLines);

  const linePluginRef = useRef<TradingLines | undefined>(undefined);
  const chartLinesRef = useRef<IChartLine[]>(chartLines);

  const dispatch = useDispatch();

  useEffect(() => {
    linePluginRef.current = new TradingLines();
    seriesInstance.attachPrimitive(linePluginRef.current);

    linePluginRef.current.lineDragged().subscribe(dispatchChartLineUpdate);
    linePluginRef.current.linesDragged().subscribe(dispatchChartLinesUpdate);
    linePluginRef.current.lineRemoved().subscribe(dispatchChartLineRemoved);
    linePluginRef.current.orderSent().subscribe(dispatchChartLinesOrder);

    setupChartLines();
    return () => {
      linePluginRef.current?.lineDragged().unsubscribe(dispatchChartLineUpdate);
      linePluginRef.current?.linesDragged().unsubscribe(dispatchChartLinesUpdate);
      linePluginRef.current?.lineRemoved().unsubscribe(dispatchChartLineRemoved);
      linePluginRef.current?.orderSent().unsubscribe(dispatchChartLinesOrder);
    };
  }, []);

  const dispatchChartLineUpdate = (lineDragInfo: TradingLinedDragInfo) => {
    const lineIndex = chartLinesRef.current.findIndex((l) => l.id === lineDragInfo.to.id);
    if (lineIndex !== -1) {
      const changedLine = { ...chartLinesRef.current[lineIndex] };
      const newLines = [...chartLinesRef.current];
      changedLine.price = lineDragInfo.to.price;
      newLines[lineIndex] = changedLine;
      dispatch(setChartLines(newLines));
    }
  };

  const dispatchChartLinesUpdate = (lineDragsInfo: TradingLinedDragInfo[]) => {
    const currentChartLines = [...chartLinesRef.current];
    lineDragsInfo.forEach((dragInfo) => {
      const lineIndex = chartLinesRef.current.findIndex((l) => l.id === dragInfo.to.id);
      if (lineIndex !== -1) {
        const changedLine = { ...chartLinesRef.current[lineIndex] };
        changedLine.price = dragInfo.to.price;
        currentChartLines[lineIndex] = changedLine;
      } else {
        console.error('could not find it');
      }
    });
    dispatch(setChartLines(currentChartLines));
  };

  const dispatchChartLinesOrder = () => {
    console.log('create order with ', chartLinesRef.current);
  };

  const dispatchChartLineRemoved = (line: TradingLineInfo) => {
    if (line.type === 'ENTRY' && line.isLive === false) {
      // Remove all chart lines when Limit entry is deleted
      dispatch(setChartLines([]));
    } else {
      const lineIndex = chartLinesRef.current.findIndex((l) => l.id === line.id);
      if (lineIndex !== -1) {
        dispatch(removeChartLine({ index: lineIndex }));
      }
    }
  };

  useEffect(() => {
    chartLinesRef.current = [...chartLines];
    setupChartLines();
  }, [chartLines]);

  const removeChartLines = () => {
    linePluginRef.current?.truncate();
  };

  const setupChartLines = () => {
    // Remove Lines
    removeChartLines();

    chartLinesRef.current.forEach((line) => {
      const newLine: TradingLineInfo = {
        id: line.id,
        price: line.price,
        qty: line.qty,
        type: line.type,
        side: line.side,
        draggable: line.draggable,
        isLive: line.isServer,
      };
      linePluginRef.current?.addLine(newLine);
    });
  };

  return null; // Since this component doesn't render anything, we return null
};
