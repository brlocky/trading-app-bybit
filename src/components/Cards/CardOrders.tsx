import React from 'react';
import { LinearPositionIdx, PositionV5 } from 'bybit-api';
import Button from '../Button/Button';
import tw from 'twin.macro';
import {
  calculateOrderPnL,
  formatCurrency,
  getOrderEntryFromPositions,
  isOrderStopLossOrTakeProfit,
} from '../../utils/tradeUtils';
import { IOrder } from '../../types';

interface ICardOrdersProps {
  orders: IOrder[];
  positions: PositionV5[];
  cancelOrder: (o: IOrder) => void;
}

const OrdersContainer = tw.div`
  grid
  grid-cols-6
  auto-rows-max
`;

const OrderRowContainer = tw.div`
grid
bg-green-50
col-span-full
grid-cols-6
p-1
`;

const OrderPropContainer = tw.div`
col-span-1
self-center
text-left
`;

export default function CardOrders({
  orders,
  positions,
  cancelOrder,
}: ICardOrdersProps) {
  const headers = ['Ticker', 'Type', 'Qty', 'Price', 'Profit', 'Actions'];
  const renderOrders = orders.map((o, index) => {
    const isTrigger = isOrderStopLossOrTakeProfit(o);

    const orderEntry = getOrderEntryFromPositions(positions, o);
    const pnl = calculateOrderPnL(orderEntry, o);
    return (
      <OrderRowContainer key={index}>
        <OrderPropContainer>
          <i
            className={
              o.positionIdx === LinearPositionIdx.BuySide
                ? 'fas fa-arrow-up text-green-600'
                : 'fas fa-arrow-down text-red-600'
            }
          ></i>{' '}
          {o.symbol}
        </OrderPropContainer>
        <OrderPropContainer>{isTrigger ? o.stopOrderType : o.side}</OrderPropContainer>
        <OrderPropContainer>{o.qty}</OrderPropContainer>

        <OrderPropContainer>{isTrigger ? o.triggerPrice : o.price}</OrderPropContainer>
        <OrderPropContainer>
          {pnl ? (
            parseFloat(pnl) >= 0 ? (
              <span className="text-green-600">{formatCurrency(pnl)}</span>
            ) : (
              <span className="text-red-600">{formatCurrency(pnl)}</span>
            )
          ) : (
            '-'
          )}
        </OrderPropContainer>
        <OrderPropContainer className="space-x-2 space-y-1 text-center">
          <Button
            onClick={() => {
              cancelOrder(o);
            }}
          >
            <i className={'fas fa-close'}></i>
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
