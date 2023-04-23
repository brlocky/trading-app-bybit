import React from "react";
import { Card } from "./Card";
import { IOrder } from "../../types";
import Button from "../Button/Button";
import { LinearPositionIdx } from "bybit-api";
import { Table } from "../Tables/Table";

interface ICardOrdersProps {
  orders: IOrder[];
  cancelOrder: (o: IOrder) => void;
  toggleChase: (o: IOrder) => void;
}

export default function CardOrders({
  orders,
  cancelOrder,
  toggleChase,
}: ICardOrdersProps) {
  const headers = ["Trade Side", "Trade Type", "Qty", "Price", "Actions"];

  const tableData = orders
    .filter((o) => o.cancelType !== null)
    .sort((a: IOrder, b: IOrder) => parseFloat(b.price) - parseFloat(a.price))
    .map((order: IOrder) => [
      order.positionIdx === LinearPositionIdx.BuySide ? "Long" : "Short",
      order.side,
      order.qty,
      order.price,
      <>
        <Button onClick={() => cancelOrder(order)}>Cancel</Button>
        <Button onClick={() => toggleChase(order)}>
          {order.chase ? "Stop" : "Chase"}
        </Button>
      </>,
    ]);

  return (
    <>
      <Table headers={headers} data={tableData} />
      {/* <pre>{JSON.stringify(orders, null, 2)}</pre> */}
    </>
  );
}
