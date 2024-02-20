import React from 'react';
import { LeverageSelector, PositionSizeSelector } from '../Trade';
import { useSelector } from 'react-redux';
import { selectSymbol } from '../../store/slices';
import { CardLastTrades } from './CardLastTrades';
import { Tabs } from '../Tabs';
import CardOrderSettings from './CardOrderSettings';

export const CardSymbol: React.FC = () => {
  const currentSymbol = useSelector(selectSymbol);
  return (
    <div className="justify-top flex h-full flex-col gap-y-3">
      {/* {!currentPosition ? <PositionSizeSelector /> : null} */}
      {currentSymbol ? (
        <Tabs
          tabs={[
            {
              title: 'Order',
              content: <PositionSizeSelector />,
            },
            // {
            //   title: `Orders (${orders.length})`,
            //   content: <CardOrders />,
            // },
            {
              title: 'Settings',
              content: <CardOrderSettings />,
            },
          ]}
        />
      ) : null}
      <LeverageSelector />
      <CardLastTrades />
    </div>
  );
};
