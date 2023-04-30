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

const OrderRowContainer = tw.div`
grid
bg-green-50
col-span-5
grid-cols-5
`;

const OrderPropContainer = tw.div`
col-span-1
  p-2
  self-center
`;

export default function CardOrders({ orders, cancelOrder, toggleChase }: ICardOrdersProps) {
  const headers = ['Type', 'Side', 'Qty', 'Price', 'Actions'];

  const renderOrders = orders.map((o, index) => {
    return (
      <OrderRowContainer key={index}>
        <OrderPropContainer>
          {o.side} / {o.symbol}
        </OrderPropContainer>
        <OrderPropContainer>
          <i
            className={
              o.positionIdx === LinearPositionIdx.BuySide
                ? 'fas fa-arrow-up text-green-600'
                : 'fas fa-arrow-down text-red-600'
            }
          ></i>
        </OrderPropContainer>
        <OrderPropContainer>{o.qty}</OrderPropContainer>
        <OrderPropContainer>{o.price}</OrderPropContainer>
        <OrderPropContainer className='text-center space-x-2 space-y-1'>
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
        </OrderPropContainer>
      </OrderRowContainer>
    );
  });

  const renderHeader = headers.map((h, index) => (
    <OrderPropContainer key={index} className="bg-gray-100">
      {h}
    </OrderPropContainer>
  ));

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
