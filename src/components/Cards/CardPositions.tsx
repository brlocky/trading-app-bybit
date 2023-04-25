import React from 'react';
import { IPosition, ITicker } from '../../types';
import { Table } from '../Tables/Table';
import Button from '../Button/Button';

interface ICardPositionsProps {
  positions: IPosition[];
  price: ITicker;
  closeTrade: (o: IPosition, qty: string) => void;
}

export default function CardPositions({ positions, price, closeTrade }: ICardPositionsProps) {
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

  const tableData = positions
    .filter((p) => parseFloat(p.size) > 0)
    .sort((a, b) => parseFloat(a.createdTime) - parseFloat(b.createdTime))
    .map((p) => [
      [
        p.symbol,
        <>
          <i
            className={
              p.side === 'Buy' ? 'fas fa-arrow-up text-green-600' : 'fas fa-arrow-down text-red-600'
            }
          ></i>
        </>,
        p.size,
        parseFloat(calculatePL(p, price)) >= 0 ? (
          <span className="text-green-600">{formatCurrency(calculatePL(p, price))}</span>
        ) : (
          <span className="text-red-600">{formatCurrency(calculatePL(p, price))}</span>
        ),
      ],
      [
        '',
        '',
        '',
        <>
          <Button
            onClick={() => {
              closeTrade(p, calculateClosePositionSize(p, 25));
            }}
            key={25}
          >
            Close 25%
          </Button>
          <Button
            onClick={() => {
              closeTrade(p, calculateClosePositionSize(p, 50));
            }}
            key={50}
          >
            Close 50%
          </Button>
          <Button
            onClick={() => {
              closeTrade(p, calculateClosePositionSize(p, 75));
            }}
            key={75}
          >
            Close 75%
          </Button>
          <Button
            onClick={() => {
              closeTrade(p, calculateClosePositionSize(p, 100));
            }}
            key={100}
          >
            Close 100%
          </Button>
        </>,
      ],
    ]);

  return (
    <>
      <h3>Positions</h3>
      <Table headers={headers} data={tableData.flat()} />
      {/* <pre>{JSON.stringify(positions, null, 2)}</pre> */}
    </>
  );
}
