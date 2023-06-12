import React, { useEffect, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  selectTicker,
  selectTickerInfo,
  selectCurrentPosition,
  selectPositionSize,
  selectTakeProfit,
  selectStopLoss,
  selectEntryPrice,
  selectOrderType,
  updateTakeProfit,
  updateStopLoss,
  updateEntryPrice,
} from '../../slices';
import { calculateTargetPnL } from '../../utils/tradeUtils';
import { CustomPriceLineDraggedEventParams } from '@felipecsl/lightweight-charts';

interface LineControlManagerProps {
  chartInstance: any;
  seriesInstance: any;
}

const TP = 'TP';
const SL = 'SL';
const ENTRY = 'Entry';

export const LineControlManager: React.FC<LineControlManagerProps> = ({ chartInstance, seriesInstance }) => {
  const ticker = useSelector(selectTicker);
  const tickerInfo = useSelector(selectTickerInfo);
  const currentPosition = useSelector(selectCurrentPosition);
  const positionSize = useSelector(selectPositionSize);

  const takeProfit = useSelector(selectTakeProfit);
  const stopLoss = useSelector(selectStopLoss);
  const entryPrice = useSelector(selectEntryPrice);
  const orderType = useSelector(selectOrderType);

  const entryPriceLine = useRef<any>(null);
  const stopLossPriceLine = useRef<any>(null);
  const takeProfitPriceLine = useRef<any>(null);
  const currentPositionRef = useRef<any>(null);

  const dispatch = useDispatch();

  const [isLoading, setIsLoading] = useState<boolean>(true);

  const setupChartLines = () => {
    console.log('Setup lines');

    // Remove Lines
    takeProfitPriceLine.current && seriesInstance.removePriceLine(takeProfitPriceLine.current);
    stopLossPriceLine.current && seriesInstance.removePriceLine(stopLossPriceLine.current);
    entryPriceLine.current && seriesInstance.removePriceLine(entryPriceLine.current);

    const tpLinePrice =
      currentPosition?.takeProfit && Number(currentPosition.takeProfit) > 0
        ? Number(currentPosition.takeProfit)
        : takeProfit && takeProfit.price
        ? takeProfit.price
        : undefined;
    const slLinePrice =
      currentPosition?.stopLoss && Number(currentPosition.stopLoss) > 0
        ? Number(currentPosition.stopLoss)
        : stopLoss && stopLoss.price
        ? stopLoss.price
        : undefined;

    entryPriceLine.current = seriesInstance.createPriceLine({
      title: ENTRY + ' @',
      color: 'blue',
      lineWidth: 1,
      lineStyle: null,
      axisLabelVisible: true,
      lineVisible: true,
      draggable: false,
    });

    // create take profit
    if (tpLinePrice) {
      takeProfitPriceLine.current = seriesInstance.createPriceLine({
        title: TP + ' @',
        color: 'green',
        lineWidth: 1,
        lineStyle: null,
        axisLabelVisible: true,
        lineVisible: true,
        draggable: true,
      });
    }

    // create stop loss price
    if (slLinePrice) {
      stopLossPriceLine.current = seriesInstance.createPriceLine({
        title: SL + ' @',
        color: 'red',
        lineWidth: 1,
        lineStyle: null,
        axisLabelVisible: true,
        lineVisible: true,
        draggable: true,
        price: slLinePrice,
      });
    }
    updateChartLines();
  };

  const updateChartLines = () => {
    if (!tickerInfo || !ticker) {
      return;
    }

    console.log('update lines');

    let tp = takeProfit ? takeProfit.price : undefined,
      sl = stopLoss ? stopLoss.price : undefined,
      entry = entryPrice,
      coinAmount = positionSize,
      isEntryDraggable = orderType === 'Limit' ? true : false;

    if (currentPosition) {
      entry = currentPosition.avgPrice;
      currentPosition.takeProfit ? (tp = Number(currentPosition.takeProfit)) : 0;
      currentPosition.stopLoss ? (sl = Number(currentPosition.stopLoss)) : 0;
      coinAmount = Number(currentPosition.size);
      isEntryDraggable = false;
    }

    const pnLCurrent = calculateTargetPnL(Number(ticker.lastPrice), Number(entry), coinAmount);
    const pnLTakeProfit = tp ? calculateTargetPnL(Number(tp), Number(entry), coinAmount) : undefined;
    const pnLStopLoss = sl ? calculateTargetPnL(Number(sl), Number(entry), coinAmount) : undefined;

    takeProfitPriceLine.current?.applyOptions({
      title: TP + ' ' + pnLTakeProfit + 'USDT',
      lineWidth: currentPosition ? 2 : 1,
      price: tp,
      visible: false,
    });

    stopLossPriceLine.current?.applyOptions({
      title: SL + ' ' + pnLStopLoss + 'USDT',
      lineWidth: currentPosition ? 2 : 1,
      price: sl,
      visible: false,
    });

    entryPriceLine.current?.applyOptions({
      title: currentPosition ? pnLCurrent + 'USDT' : ENTRY + '@',
      lineWidth: currentPosition ? 2 : 1,
      price: entry,
      draggable: isEntryDraggable,
    });
  };

  const priceLineHandler = (params: CustomPriceLineDraggedEventParams) => {
    console.log('price line moved', params.customPriceLine);
    if (!tickerInfo) return;
    const { customPriceLine } = params;
    const { title, price } = customPriceLine.options();
    const formatedPrice: string = chartInstance.priceScale('right').formatPrice(price);
    if (title.startsWith(TP)) {
      dispatch(updateTakeProfit([{ ...takeProfit, price: Number(formatedPrice) }]));
    }
    if (title.startsWith(SL)) {
      dispatch(updateStopLoss([{ ...stopLoss, price: Number(formatedPrice) }]));
    }
    if (title.startsWith(ENTRY)) {
      dispatch(updateEntryPrice(formatedPrice));
    }
  };

  useEffect(() => {
    console.log('ping',)
    setIsLoading(true);
    if (!chartInstance || !seriesInstance) return;
    setupChartLines();
    setIsLoading(false);
    chartInstance.subscribeCustomPriceLineDragged(priceLineHandler);
    // Other necessary setup logic goes here
    return () => {
      console.log('unount lines');
      chartInstance.unsubscribeCustomPriceLineDragged(priceLineHandler);
    };
  }, [chartInstance, seriesInstance]);

  useEffect(() => {
    if (isLoading) return;
    setupChartLines();
  }, [takeProfit, stopLoss, currentPosition]);

  useEffect(() => {
    if (isLoading) return;
    updateChartLines();
  }, [ticker, positionSize, orderType]);

  // useEffect(() => {
  //   currentPositionRef.current = currentPosition;
  // }, [currentPosition]);

  return null; // Since this component doesn't render anything, we return null
};
