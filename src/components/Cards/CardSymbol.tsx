import React from 'react';
import { LeverageSelector, PositionSizeSelector } from '../Trade';
import { useSelector } from 'react-redux';
import { selectCurrentPosition } from '../../slices';

export const CardSymbol: React.FC = () => {
  const currentPosition = useSelector(selectCurrentPosition);
  return (
    <div className="justify-top flex flex-col gap-y-3">
      {!currentPosition ? <PositionSizeSelector /> : null}
      <LeverageSelector />

      {/* <pre>{JSON.stringify(wallet, null, 2)}</pre> */}
      {/* <pre>{JSON.stringify(symbolProps, null, 2)}</pre> */}
      {/* <pre>{JSON.stringify(symbolInfo, null, 2)}</pre> */}
    </div>
  );
};
