import React from 'react';
import { useSelector } from 'react-redux';
import { selectCurrentPosition } from '../../slices/symbolSlice';
import Button from '../Button/Button';

interface Props {
  addTP: () => void;
  addSL: () => void;
}

export const ChartTools: React.FC<Props> = ({ addTP, addSL }) => {
  const currentPosition = useSelector(selectCurrentPosition);

  const tpDisabled = !!Number(currentPosition?.takeProfit);
  const slDisabled = !!Number(currentPosition?.stopLoss);
  return (
    <div className="absolute right-20 top-2 z-20 flex gap-x-2 rounded-lg bg-gray-700 p-2">
      <Button disabled={tpDisabled} onClick={addTP} className="bg-green-200">
        TP
      </Button>
      <Button disabled={slDisabled} onClick={addSL} className="bg-red-400">
        SL
      </Button>
    </div>
  );
};
