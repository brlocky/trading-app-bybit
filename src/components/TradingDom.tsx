import React from 'react';
import { OrderBooksStore } from 'orderbooks';
import tw from 'twin.macro';
import styled from 'styled-components';

const BodyComponent = tw.div`
flex
flex-col
w-full
overflow-hidden
`;

const LadderComponent = tw.div`
flex
flex-col
grow
h-2
w-full
p-2
justify-center
overflow-scroll
`;

interface LadderRowProps {
  // Define the properties that the component expects
  price: boolean;
}

const LadderRowComponent = styled.div(({ price }: LadderRowProps) => [
  tw`
  w-full 
  border-2 
  columns-3 
  grid 
  grid-cols-3
  `,
  price ? tw`bg-orange-600` : tw`bg-green-300`,
]);

const LadderRowItemComponent = tw.div`
text-center
col-span-1
`;

const LadderRowBidComponent = tw(LadderRowItemComponent)`
text-green-700
hover:cursor-grab
hover:bg-amber-200
`;

const LadderRowPriceComponent = tw(LadderRowItemComponent)`
`;

const LadderRowAskComponent = tw(LadderRowItemComponent)`
hover:bg-amber-200
`;

interface TradingDomProps {
  orderbook: OrderBooksStore;
}

export const TradingDom = ({ orderbook }: TradingDomProps) => {
  const currentOrderBook = orderbook.getBook('BTCUSDT');

  const ask = currentOrderBook.getBestAsk() || 0;
  const bid = currentOrderBook.getBestBid() || 0;

  return (
    <BodyComponent>
      <LadderComponent>
        {currentOrderBook.book.map((row) => {
          const price = row[1];
          const qty = row[3];
          return (
            <LadderRowComponent key={price} price={price > ask}>
              <LadderRowBidComponent>x</LadderRowBidComponent>
              <LadderRowPriceComponent>{price}</LadderRowPriceComponent>
              <LadderRowAskComponent>x</LadderRowAskComponent>
            </LadderRowComponent>
          );
        })}
      </LadderComponent>
    </BodyComponent>
  );
};
