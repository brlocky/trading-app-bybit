import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { selectCurrentPosition, selectTicker, selectTickerInfo } from '../../slices/symbolSlice';
import Button from '../Button/Button';
import { selectEntryPrice, selectStopLoss, selectTakeProfit, updateStopLoss, updateTakeProfit } from '../../slices';
import { calculateSLPrice, calculateTPPrice, formatPriceWithTickerInfo } from '../../utils/tradeUtils';
import { TradingService } from '../../services';
import { useApi } from '../../providers';

export const ChartTools: React.FC = () => {
  const currentPosition = useSelector(selectCurrentPosition);
  const takeProfit = useSelector(selectTakeProfit);
  const stopLoss = useSelector(selectStopLoss);
  const entryPrice = useSelector(selectEntryPrice);

  const tickerInfo = useSelector(selectTickerInfo);
  const ticker = useSelector(selectTicker);

  const dispatch = useDispatch();
  const tradingService = TradingService(useApi());

  const addTP = () => {
    if (!ticker || !tickerInfo) {
      return;
    }
    const tpPrice = calculateTPPrice(currentPosition ? ticker.lastPrice : entryPrice, currentPosition);
    dispatch(updateTakeProfit([{ ...takeProfit, price: tpPrice }]));
    // if (currentPosition) {
    //   tradingService.addTakeProfit(currentPosition, formatPriceWithTickerInfo(tpPrice, tickerInfo));
    // } else {
    //   dispatch(updateTakeProfit([{ ...takeProfit, price: tpPrice }]));
    // }
  };

  const addSL = () => {
    if (!ticker || !tickerInfo) {
      return;
    }
    const slPrice = calculateSLPrice(currentPosition ? ticker.lastPrice : entryPrice, currentPosition);
    dispatch(updateStopLoss([{ ...stopLoss, price: slPrice }]));
    // if (currentPosition) {
    //   tradingService.addStopLoss(currentPosition, formatPriceWithTickerInfo(slPrice, tickerInfo));
    // } else {
    //   dispatch(updateStopLoss([{ ...stopLoss, price: slPrice }]));
    // }
  };

  let tpDisabled = false;
  let slDisabled = false;
  if (!tickerInfo) {
    tpDisabled = true;
    slDisabled = true;
  }

  if (Number(currentPosition?.takeProfit) > 0) {
    tpDisabled = true;
  }

  if (Number(currentPosition?.stopLoss) > 0) {
    slDisabled = true;
  }

  if (takeProfit?.price) {
    tpDisabled = true;
  }

  if (stopLoss?.price) {
    slDisabled = true;
  }
  return (
    <div className="absolute right-2 top-2 z-10 flex gap-x-2 rounded-lg bg-gray-700 p-2">
      <Button disabled={tpDisabled} onClick={addTP} className="bg-green-200">
        TP
      </Button>
      <Button disabled={slDisabled} onClick={addSL} className="bg-red-400">
        SL
      </Button>
    </div>
  );
};
