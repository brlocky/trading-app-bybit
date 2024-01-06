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

    linePluginRef.current.lineDragged().subscribe(dispatchChartLinesUpdate);
    linePluginRef.current.lineRemoved().subscribe(dispatchChartLineRemoved);

    setupChartLines();
    return () => {
      linePluginRef.current?.lineDragged().unsubscribe(dispatchChartLinesUpdate);
      linePluginRef.current?.lineRemoved().unsubscribe(dispatchChartLineRemoved);
    };
  }, []);

  const dispatchChartLinesUpdate = (lineDragInfo: TradingLinedDragInfo) => {
    const lineIndex = chartLinesRef.current.findIndex((l) => l.price === lineDragInfo.from.price && l.qty === lineDragInfo.from.qty);
    if (lineIndex !== -1) {
      const changedLine = { ...chartLinesRef.current[lineIndex] };
      const newLines = [...chartLinesRef.current];
      changedLine.price = lineDragInfo.to.price;
      newLines[lineIndex] = changedLine;
      dispatch(setChartLines(newLines));
    }
  };

  const dispatchChartLineRemoved = (line: TradingLineInfo) => {
    if (line.type === 'ENTRY' && line.isLive === false) {
      // Remove all chart lines when Limit entry is deleted
      dispatch(setChartLines([]));
    } else {
      const lineIndex = chartLinesRef.current.findIndex((l) => l.price === line.price && l.qty === line.qty);
      if (lineIndex !== -1) {
        dispatch(removeChartLine({ index: lineIndex }));
      }
    }
  };

  useEffect(() => {
    chartLinesRef.current = chartLines;
    setupChartLines();
  }, [chartLines]);

  const removeChartLines = () => {
    linePluginRef.current?.truncate();
  };

  const setupChartLines = () => {
    // Remove Lines
    removeChartLines();

    chartLinesRef.current.forEach((line) => {
      linePluginRef.current?.addLine(line.price, line.qty, line.type, line.side, line.draggable, line.isServer);
    });
  };

  return null; // Since this component doesn't render anything, we return null
};
