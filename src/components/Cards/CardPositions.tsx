import React from "react";
import { Card } from "./Card";
import { IPosition, ITicker } from "../../types";
import { Table } from "../Tables/Table";
import Button from "../Button/Button";

interface ICardPositionsProps {
  positions: IPosition[];
  price: ITicker;
  closeTrade: (o:IPosition, qty: number) => void
}

export default function CardPositions({
  positions,
  price,
  closeTrade,
}: ICardPositionsProps) {
  const formatCurrency = (value: string) => {
    return parseFloat(value).toFixed(2) + " USDT";
  };

  const calculatePL = (position: IPosition, price: ITicker) => {
    let diff = 0;
    if (position.side === "Sell") {
      diff = parseFloat(position.entryPrice) - parseFloat(price.lastPrice);
    }
    if (position.side === "Buy") {
      diff = parseFloat(price.lastPrice) - parseFloat(position.entryPrice);
    }

    const pl = diff * parseFloat(position.size);

    return pl.toFixed(4);
  };

  const calculatePositionSize = (order: IPosition, percentage: number): number => {
    return parseFloat(order.size) * percentage / 100;
  }

  const headers = [
    "Ticker",
    "Side",
    "Qty",
    "Value",
    "Entry Price",
    "Mark Price",
    "P&L",
    "Actions"
  ];

  const tableData = positions
    .filter((p) => parseFloat(p.size) > 0)
    .sort((a,b) => parseFloat(a.createdTime) - parseFloat(b.createdTime))
    .map((p) => [
      p.symbol,
      p.side,
      p.size,
      formatCurrency((parseFloat(p.size)* parseFloat(p.entryPrice)).toString()),
      formatCurrency(p.entryPrice),
      formatCurrency(price.lastPrice),
      formatCurrency(calculatePL(p, price)),
      (<>
        <Button onClick={() => {closeTrade(p, calculatePositionSize(p, 25))}}>Close 25%</Button>
        <Button onClick={() => {closeTrade(p, calculatePositionSize(p, 50))}}>Close 50%</Button>
        <Button onClick={() => {closeTrade(p, calculatePositionSize(p, 75))}}>Close 75%</Button>
        <Button onClick={() => {closeTrade(p, calculatePositionSize(p, 100))}}>Close All</Button>
      </>)
    ]);

  return (
    <>
      <Card header={"Positions"}>
        <Table
          headers={headers}
          data={tableData}
        />
        {/* <pre>{JSON.stringify(positions, null, 2)}</pre> */}
      </Card>
    </>
  );
}
