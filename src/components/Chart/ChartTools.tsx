import React from 'react';
import { useSelector } from 'react-redux';
import { selectCurrentPosition, selectTickerInfo } from '../../slices/symbolSlice';
import Button from '../Button/Button';
import { selectStopLoss, selectTakeProfit } from '../../slices';

interface Props {
  addTP: () => void;
  addSL: () => void;
}

export const ChartTools: React.FC<Props> = ({ addTP, addSL }) => {
  const currentPosition = useSelector(selectCurrentPosition);
  const takeProfit = useSelector(selectTakeProfit);
  const stopLoss = useSelector(selectStopLoss);
  const tickerInfo = useSelector(selectTickerInfo);

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
    <div className="absolute right-20 top-2 z-10 flex gap-x-2 rounded-lg bg-gray-700 p-2">
      <Button disabled={tpDisabled} onClick={addTP} className="bg-green-200">
        TP
      </Button>
      <Button disabled={slDisabled} onClick={addSL} className="bg-red-400">
        SL
      </Button>
    </div>
  );
};
