import React from 'react';
import { LinearPositionIdx } from 'bybit-api';
import { type IOrder } from '../../types';
import Button from '../Button/Button';
import tw from 'twin.macro';

interface ICardOrdersProps {
  orders: IOrder[];
  cancelOrder: (o: IOrder) => void;
  toggleChase: (o: IOrder) => void;
}

const OrdersContainer = tw.div`
  grid
  grid-cols-5
  auto-rows-max
  text-center
`;

const OrderPropContainer = tw.div`
  grid-cols-1
  p-2
  self-center
`;

export default function CardOrders({ orders, cancelOrder, toggleChase }: ICardOrdersProps) {
  const headers = ['Trade Side', 'Trade Type', 'Qty', 'Price', 'Actions'];

  const renderOrders = orders.map((o) => {
    return (
      <>
        <OrderPropContainer>
          <i
            className={
              o.positionIdx === LinearPositionIdx.BuySide
                ? 'fas fa-arrow-up text-green-600'
                : 'fas fa-arrow-down text-red-600'
            }
          ></i>
        </OrderPropContainer>
        <OrderPropContainer>{o.side}</OrderPropContainer>
        <OrderPropContainer>{o.qty}</OrderPropContainer>
        <OrderPropContainer>{o.price}</OrderPropContainer>
        <OrderPropContainer>
          <>
            <Button
              onClick={() => {
                cancelOrder(o);
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={() => {
                toggleChase(o);
              }}
            >
              {o.chase ? 'Stop' : 'Chase'}
            </Button>
          </>
        </OrderPropContainer>
      </>
    );
  });

  const renderHeader = headers.map((h, index) => (
    <OrderPropContainer key={index} className="bg-gray-100">
      {h}
    </OrderPropContainer>
  ));

  // const tableData = orders
  //   .filter((o) => o.cancelType !== null)
  //   .sort((a: IOrder, b: IOrder) => parseFloat(b.price) - parseFloat(a.price))
  //   .map((order: IOrder) => [
  //     order.positionIdx === LinearPositionIdx.BuySide ? 'Long' : 'Short',
  //     order.side,
  //     order.qty,
  //     order.price,
  //     <>
  //       <Button
  //         onClick={() => {
  //           cancelOrder(order);
  //         }}
  //       >
  //         Cancel
  //       </Button>
  //       <Button
  //         onClick={() => {
  //           toggleChase(order);
  //         }}
  //       >
  //         {order.chase ? 'Stop' : 'Chase'}
  //       </Button>
  //     </>,
  //   ]);

  return (
    <>
      <h3>Orders</h3>
      <OrdersContainer>
        {renderHeader}
        {renderOrders}
      </OrdersContainer>
      {/* <pre>{JSON.stringify(orders, null, 2)}</pre> */}
    </>
  );
}
