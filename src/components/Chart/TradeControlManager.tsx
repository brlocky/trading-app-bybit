import React, { useEffect, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  removeChartLine,
  selectCurrentPosition,
  selectEntryPrice,
  selectLines,
  selectPositionSize,
  selectTicker,
  selectTickerInfo,
  setChartLines,
} from '../../slices';
import { calculateTargetPnL, formatCurrencyValue } from '../../utils/tradeUtils';
import { TradingLineInfo, TradingLinedDragInfo } from './extend/plugins/trading-lines/state';
import { TradingLines } from './extend/plugins/trading-lines/trading-lines';

interface LineControlManagerProps {
  chartInstance: any;
  seriesInstance: any;
}

export const TradeControlManager: React.FC<LineControlManagerProps> = ({ chartInstance, seriesInstance }) => {
  const ticker = useSelector(selectTicker);
  const tickerInfo = useSelector(selectTickerInfo);
  const currentPosition = useSelector(selectCurrentPosition);
  const positionSize = useSelector(selectPositionSize);

  const lines = useSelector(selectLines);
  const entryPrice = useSelector(selectEntryPrice);

  const linePluginRef = useRef<TradingLines | undefined>(undefined);

  const [isLoading, setIsLoading] = useState<boolean>(true);

  const dispatch = useDispatch();

  useEffect(() => {
    setIsLoading(true);

    linePluginRef.current = new TradingLines();
    seriesInstance.attachPrimitive(linePluginRef.current);

    /* linePluginRef.current.lineAdded().subscribe((alertInfo: TradingLineInfo) => {
      console.log(`➕ Line added @ ${alertInfo.price} with the id: ${alertInfo.id}`);
    }); */

    linePluginRef.current.lineDragged().subscribe((lineDragInfo: TradingLinedDragInfo) => {
      console.log(lineDragInfo.from);
      console.log(lineDragInfo.to);

      const lineIndex = lines.findIndex((l) => l.price === lineDragInfo.from.price && l.qty === lineDragInfo.from.qty);
      if (lineIndex !== -1) {
        const changedLine = { ...lines[lineIndex] };
        const newLines = [...lines];
        changedLine.price === lineDragInfo.to.price;
        newLines[lineIndex] = changedLine;
        dispatch(setChartLines(newLines));
      }
    });

    linePluginRef.current.lineRemoved().subscribe((line: TradingLineInfo) => {
      const lineIndex = lines.findIndex((l) => l.price === line.price && l.qty === line.qty);
      if (lineIndex !== -1) {
        dispatch(removeChartLine({ index: lineIndex }));
      }
    });

    setupChartLines();
    setIsLoading(false);
    // chartInstance.subscribeCustomPriceLineDragged(priceLineHandler);
    // Other necessary setup logic goes here
    return () => {
      setIsLoading(true);
      // chartInstance.unsubscribeCustomPriceLineDragged(priceLineHandler);
    };
  }, []);

  useEffect(() => {
    if (isLoading) return;
    setupChartLines();
  }, [lines]);

  useEffect(() => {
    if (isLoading) return;
    updateChartLines();
  }, [ticker, positionSize, currentPosition]);

  const removeChartLines = () => {
    linePluginRef.current?.truncate();
  };

  const setupChartLines = () => {
    // Remove Lines
    removeChartLines();

    lines.forEach((line, index) => {
      linePluginRef.current?.addLine(line.price, line.qty, line.type, line.side);
    });

    updateChartLines();
  };

  const updateChartLines = () => {
    if (!ticker?.lastPrice) return;
    const coinAmount = currentPosition ? Number(currentPosition.size) : positionSize;
    const currentPnL = currentPosition ? formatCurrencyValue(calculateTargetPnL(ticker.lastPrice, entryPrice, coinAmount)) : '';

    lines.forEach((reduxLine, index) => {
      const line = linePluginRef.current?.lines().find((l) => {
        return reduxLine.price === l.price && reduxLine.qty === l.qty;
      });
      if (line) {
        // linePluginRef.current?.updateLine(line.id, line);
      }
    });
  };

  /* const priceLineHandler = (params: CustomPriceLineDraggedEventParams) => {
    const { customPriceLine } = params;
    const { title, price } = customPriceLine.options();
    const formatedPrice: string = chartInstance.priceScale('right').formatPrice(price);
    const extractedIndex = Number(title.match(/(?:TP|SL|ENTRY) (\d+)(?: > )/)?.[1]) - 1;

    if (title.startsWith(TP) || title.startsWith(SL) || title.startsWith(ENTRY)) {
      dispatch(updateChartLine({ index: extractedIndex, line: { ...linesRef.current[extractedIndex], price: formatedPrice } }));
    }
  }; */

  return null; // Since this component doesn't render anything, we return null
};
