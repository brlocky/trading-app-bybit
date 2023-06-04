import React from 'react';
import { LeverageSelector, MarginModeSelector, OrderTypeSelector, PositionModeSelector, PositionSizeSelector } from '../Trade';

export const CardSymbol: React.FC = () => {
  return (
    <div className="justify-top flex flex-col gap-y-1">
      <PositionSizeSelector />
      <LeverageSelector />
      <OrderTypeSelector />
      <PositionModeSelector />
      <MarginModeSelector />

      {/* <pre>{JSON.stringify(wallet, null, 2)}</pre> */}
      {/* <pre>{JSON.stringify(symbolProps, null, 2)}</pre> */}
      {/* <pre>{JSON.stringify(symbolInfo, null, 2)}</pre> */}
    </div>
  );
};
