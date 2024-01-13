import React from 'react';
import { LeverageSelector, PositionSizeSelector } from '../Trade';
import { useSelector } from 'react-redux';
import { selectCurrentPosition, selectSymbol } from '../../store/slices';
import { CardLastTrades } from './CardLastTrades';
import { Tabs } from '../Tabs';
import CardOrderSettings from './CardOrderSettings';

export const CardSymbol: React.FC = () => {
  const currentPosition = useSelector(selectCurrentPosition);
  const currentSymbol = useSelector(selectSymbol);
  return (
    <div className="justify-top flex flex-col gap-y-3">
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
      {/* <pre>{JSON.stringify(wallet, null, 2)}</pre> */}
      {/* <pre>{JSON.stringify(symbolProps, null, 2)}</pre> */}
      {/* <pre>{JSON.stringify(symbolInfo, null, 2)}</pre> */}
    </div>
  );
};
