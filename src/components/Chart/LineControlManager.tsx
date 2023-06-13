import { CustomPriceLineDraggedEventParams } from '@felipecsl/lightweight-charts';
import React, { useEffect, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  selectCurrentPosition,
  selectEntryPrice,
  selectLines,
  selectOrderType,
  selectPositionSize,
  selectStopLosses,
  selectTakeProfits,
  selectTicker,
  selectTickerInfo,
  updateEntryPrice,
  updateChartLine,
} from '../../slices';
import { calculateTargetPnL, formatCurrencyValue } from '../../utils/tradeUtils';

interface LineControlManagerProps {
  chartInstance: any;
  seriesInstance: any;
}

const TP = 'TP';
const SL = 'SL';
const ENTRY = 'Entry';
const SEPARATOR = ' > ';

export const LineControlManager: React.FC<LineControlManagerProps> = ({ chartInstance, seriesInstance }) => {
  const ticker = useSelector(selectTicker);
  const tickerInfo = useSelector(selectTickerInfo);
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
    if (isLoading) return;
    linesRef.current = [...lines];
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
    console.log('Remove chart lines');

    // Remove Lines
    [...entryPriceLineRefs.current, ...chartLineRefs.current].forEach((lineRef) => {
      seriesInstance.removePriceLine(lineRef);
    });

    entryPriceLineRefs.current = [];
    chartLineRefs.current = [];
    console.log('Remove chart lines - ok');
  };
  const setupChartLines = () => {
    console.log('Setup lines');

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

    console.log('Setup lines - ok');
    updateChartLines();
  };

  const updateChartLines = () => {
    console.log('update lines');

    let entry = entryPrice,
      isEntryDraggable = orderType === 'Limit' ? true : false,
      coinAmount = positionSize;

    // let tp = takeProfit ? takeProfit.price : undefined,
    //   sl = stopLoss ? stopLoss.price : undefined,
    //   entry = entryPrice,
    //   coinAmount = positionSize,
    //   isEntryDraggable = orderType === 'Limit' ? true : false;

    if (currentPosition) {
      entry = currentPosition.avgPrice;
      // currentPosition.takeProfit ? (tp = Number(currentPosition.takeProfit)) : 0;
      // currentPosition.stopLoss ? (sl = Number(currentPosition.stopLoss)) : 0;
      coinAmount = Number(currentPosition.size);
      isEntryDraggable = false;
    }

    const pnLCurrent = currentPosition
      ? formatCurrencyValue(calculateTargetPnL(Number(ticker?.lastPrice), Number(entry), coinAmount))
      : ENTRY;
    // const pnLTakeProfit = tp ? calculateTargetPnL(Number(tp), Number(entry), coinAmount) : undefined;
    // const pnLStopLoss = sl ? calculateTargetPnL(Number(sl), Number(entry), coinAmount) : undefined;

    lines.forEach((l, index) => {
      const lineRef = chartLineRefs.current[index];
      lineRef.applyOptions({
        title: formatChartLineTitle(l, ++index, formatCurrencyValue(calculateTargetPnL(Number(l.price), Number(entry), coinAmount))),
        lineWidth: 1,
        price: l.price,
      });
    });

    // takeProfitPriceLine.current?.applyOptions({
    //   title: TP + ' ' + pnLTakeProfit + 'USDT',
    //   lineWidth: currentPosition ? 2 : 1,
    //   price: tp,
    //   visible: false,
    // });

    // takeProfitPriceLine.current?.applyOptions({
    //   title: TP + ' ' + pnLTakeProfit + 'USDT',
    //   lineWidth: currentPosition ? 2 : 1,
    //   price: tp,
    //   visible: false,
    // });

    // stopLossPriceLine.current?.applyOptions({
    //   title: SL + ' ' + pnLStopLoss + 'USDT',
    //   lineWidth: currentPosition ? 2 : 1,
    //   price: sl,
    //   visible: false,
    // });

    entryPriceLineRefs.current.map((l) => {
      l.applyOptions({
        title: pnLCurrent,
        lineWidth: currentPosition ? 2 : 1,
        price: entry,
        draggable: isEntryDraggable,
      });
    });

    console.log('update lines - ok');
  };

  const priceLineHandler = (params: CustomPriceLineDraggedEventParams) => {
    // const { customPriceLine } = params;
    // const { title, price } = customPriceLine.options();
    // const formatedPrice: string = chartInstance.priceScale('right').formatPrice(price);
    // const extractedIndex = Number(title.match(/(?:TP|SL) (\d+)(?: > )/)?.[1]) - 1;
    // if (title.startsWith(TP) || title.startsWith(SL)) {
    //   dispatch(updateChartLine({ index: extractedIndex, line: { ...linesRef.current[extractedIndex], price: Number(formatedPrice) } }));
    // }
    // if (title.startsWith(ENTRY)) {
    //   dispatch(updateEntryPrice(formatedPrice));
    // }
  };

  return null; // Since this component doesn't render anything, we return null
};
