import { CustomPriceLineDraggedEventParams } from '@felipecsl/lightweight-charts';
import React, { useEffect, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  selectCurrentPosition,
  selectEntryPrice,
  selectLines,
  selectOrderType,
  selectPositionSize,
  selectTicker,
  updateChartLine,
  updateEntryPrice,
} from '../../slices';
import { calculateTargetPnL, formatCurrencyValue } from '../../utils/tradeUtils';

interface LineControlManagerProps {
  chartInstance: any;
  seriesInstance: any;
}

const TP = 'TP';
const SL = 'SL';
const ENTRY = 'ENTRY';
const SEPARATOR = ' > ';

export const LineControlManager: React.FC<LineControlManagerProps> = ({ chartInstance, seriesInstance }) => {
  const ticker = useSelector(selectTicker);
  const currentPosition = useSelector(selectCurrentPosition);
  const positionSize = useSelector(selectPositionSize);

  const lines = useSelector(selectLines);
  const entryPrice = useSelector(selectEntryPrice);
  const orderType = useSelector(selectOrderType);

  const entryPriceLineRefs = useRef<any[]>([]);
  const chartLineRefs = useRef<any[]>([]);
  const linesRef = useRef<any>(undefined);

  const currentPositionRef = useRef<any>(null);

  const dispatch = useDispatch();

  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    setIsLoading(true);
    setupChartLines();
    setIsLoading(false);
    chartInstance.subscribeCustomPriceLineDragged(priceLineHandler);
    // Other necessary setup logic goes here
    return () => {
      setIsLoading(true);
      chartInstance.unsubscribeCustomPriceLineDragged(priceLineHandler);
    };
  }, []);

  useEffect(() => {
    linesRef.current = [...lines];
    if (isLoading) return;
    setupChartLines();
  }, [lines]);

  useEffect(() => {
    if (isLoading) return;
    updateChartLines();
  }, [ticker, positionSize, orderType, currentPosition]);

  useEffect(() => {
    if (isLoading) return;
    currentPositionRef.current = currentPosition;
  }, [currentPosition]);

  const formatChartLineTitle = (l: any, index: number, v?: string) => {
    return v ? `${l.type} ${index}${SEPARATOR}${v}` : `${l.type} ${index}${SEPARATOR}`;
  };

  const removeChartLines = () => {
    // Remove Lines
    [...entryPriceLineRefs.current, ...chartLineRefs.current].forEach((lineRef) => {
      seriesInstance.removePriceLine(lineRef);
    });

    entryPriceLineRefs.current = [];
    chartLineRefs.current = [];
  };
  const setupChartLines = () => {
    // Remove Lines
    removeChartLines();

    entryPriceLineRefs.current.push(
      seriesInstance.createPriceLine({
        title: ENTRY + ' @',
        color: 'blue',
        lineWidth: 1,
        lineStyle: null,
        axisLabelVisible: true,
        draggable: false,
        price: entryPrice,
      }),
    );

    // create Lines
    lines.forEach((line, index) => {
      console.log('create line', line)
      chartLineRefs.current.push(
        seriesInstance.createPriceLine({
          title: formatChartLineTitle(line, ++index),
          color: line.type === 'TP' ? 'green' : 'red',
          lineWidth: 1,
          lineStyle: null,
          axisLabelVisible: true,
          draggable: true,
          price: line.price,
        }),
      );
    });

    updateChartLines();
  };

  const updateChartLines = () => {

    let entry = entryPrice,
      isEntryDraggable = orderType === 'Limit' ? true : false,
      coinAmount = positionSize;

    if (currentPosition) {
      entry = currentPosition.avgPrice;
      coinAmount = Number(currentPosition.size);
      isEntryDraggable = false;
    }

    const pnLCurrent = currentPosition
      ? formatCurrencyValue(calculateTargetPnL(Number(ticker?.lastPrice), Number(entry), coinAmount))
      : ENTRY;

    entryPriceLineRefs.current.map((l) => {
      l.applyOptions({
        title: pnLCurrent,
        lineWidth: currentPosition ? 2 : 1,
        price: entry,
        draggable: isEntryDraggable,
      });
    });

    lines.forEach((l, index) => {
      const lineRef = chartLineRefs.current[index];
      lineRef.applyOptions({
        title: formatChartLineTitle(l, ++index, formatCurrencyValue(calculateTargetPnL(Number(l.price), Number(entry), l.qty || coinAmount))),
        lineWidth: 1,
        price: l.price,
      });
    });

  };

  const priceLineHandler = (params: CustomPriceLineDraggedEventParams) => {
    const { customPriceLine } = params;
    const { title, price } = customPriceLine.options();
    const formatedPrice: string = chartInstance.priceScale('right').formatPrice(price);
    const extractedIndex = Number(title.match(/(?:TP|SL|ENTRY) (\d+)(?: > )/)?.[1]) - 1;

    if (title.startsWith(TP) || title.startsWith(SL) || title.startsWith(ENTRY)) {
      dispatch(updateChartLine({ index: extractedIndex, line: { ...linesRef.current[extractedIndex], price: Number(formatedPrice) } }));
    }
    // if (title.startsWith(ENTRY)) {
    //   dispatch(updateEntryPrice(formatedPrice));
    // }
  };

  return null; // Since this component doesn't render anything, we return null
};
