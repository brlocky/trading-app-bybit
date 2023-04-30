import React from 'react';
import { IPosition, ITicker } from '../../types';
import Button from '../Button/Button';
import tw from 'twin.macro';

interface ICardPositionsProps {
  positions: IPosition[];
  price: ITicker;
  closePosition: (o: IPosition, qty: string) => void;
}

const PositionsContainer = tw.div`
  grid
  grid-cols-4
  auto-rows-max
  text-center
`;

const PositionPropContainer = tw.div`
  grid-cols-1
  p-2
`;

const PositionRowContainer = tw.div`
grid
bg-green-50
col-span-4
grid-cols-5
`;

const PositionActionsContainer = tw.div`
col-span-full
flex
justify-around
space-x-4
w-full
pt-2
pb-2
border-b-gray-400
border-b-2
border-t-2
`;

export default function CardPositions({ positions, price, closePosition }: ICardPositionsProps) {
  const formatCurrency = (value: string) => {
    return parseFloat(value).toFixed(2) + ' USDT';
  };

  const calculatePL = (position: IPosition, price: ITicker): string => {
    let diff = 0;
    if (position.side === 'Sell') {
      diff = parseFloat(position.entryPrice) - parseFloat(price.lastPrice);
    }
    if (position.side === 'Buy') {
      diff = parseFloat(price.lastPrice) - parseFloat(position.entryPrice);
    }

    const pl = diff * parseFloat(position.size);

    return pl.toFixed(4);
  };

  const calculateClosePositionSize = (order: IPosition, percentage: number): string => {
    return ((parseFloat(order.size) * percentage) / 100).toFixed(3);
  };

  const headers = ['Ticker', 'Side', 'Qty', 'P&L'];

  const renderPositionActions = (p: IPosition) => {
    return (
      <PositionActionsContainer>
        <Button
          onClick={() => {
            closePosition(p, calculateClosePositionSize(p, 25));
          }}
          key={25}
        >
          Close 25%
        </Button>
        <Button
          onClick={() => {
            closePosition(p, calculateClosePositionSize(p, 50));
          }}
          key={50}
        >
          Close 50%
        </Button>
        <Button
          onClick={() => {
            closePosition(p, calculateClosePositionSize(p, 75));
          }}
          key={75}
        >
          Close 75%
        </Button>
        <Button
          onClick={() => {
            closePosition(p, calculateClosePositionSize(p, 100));
          }}
          key={100}
        >
          Close 100%
        </Button>
      </PositionActionsContainer>
    );
  };

  const renderPositions = positions
    .filter((p) => parseFloat(p.size) > 0)
    .map((p, index) => {
      return (
        <PositionRowContainer key={index}>
          <PositionPropContainer>{p.symbol}</PositionPropContainer>
          <PositionPropContainer>
            <i
              className={
                p.side === 'Buy'
                  ? 'fas fa-arrow-up text-green-600'
                  : 'fas fa-arrow-down text-red-600'
              }
            ></i>
          </PositionPropContainer>
          <PositionPropContainer>{p.size}</PositionPropContainer>
          <PositionPropContainer>
            {parseFloat(calculatePL(p, price)) >= 0 ? (
              <span className="text-green-600">{formatCurrency(calculatePL(p, price))}</span>
            ) : (
              <span className="text-red-600">{formatCurrency(calculatePL(p, price))}</span>
            )}
          </PositionPropContainer>
          {renderPositionActions(p)}
        </PositionRowContainer>
      );
    });

  const renderHeader = headers.map((h, index) => (
    <PositionPropContainer key={index} className="bg-gray-100">
      {h}
    </PositionPropContainer>
  ));

  return (
    <>
      <h3>Positions</h3>

      <PositionsContainer>
        {renderHeader}
        {renderPositions}
      </PositionsContainer>

      {/* <Table headers={headers} data={tableData.flat()} /> */}
      {/* <pre>{JSON.stringify(positions, null, 2)}</pre> */}
    </>
  );
}
