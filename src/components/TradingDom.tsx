import React, { useState } from 'react';
import { OrderBooksStore } from 'orderbooks';
import tw from 'twin.macro';
import styled from 'styled-components';
import SlidePicker from './Forms/SlidePicker';
import { LinearInverseInstrumentInfoV5 } from 'bybit-api';

const BodyComponent = tw.div`
flex
flex-col
w-full
`;

const LadderComponent = tw.div`
flex
flex-col
`;

const LadderRowComponent = styled.div(({ bellowPrice }: LadderRowProps) => [
  tw`
  flex
  w-full 
  border-2 
  `,
  bellowPrice ? tw`bg-orange-100` : tw`bg-green-100`,
]);

const LadderRowItemComponent = tw.div`
flex
grow
text-center
justify-around
hover:cursor-grab
`;

const LadderRowBidComponent = tw(LadderRowItemComponent)`
hover:bg-green-300
`;

const LadderRowPriceComponent = tw(LadderRowItemComponent)`
`;

const LadderRowAskComponent = tw(LadderRowItemComponent)`
hover:bg-red-300
`;

const SelectedValue = tw.div`
text-green-500
text-center
p-2
font-bold
`;

const normalizedValueFilter = [1, 5, 10, 25, 50, 100];

interface LadderRowProps {
  bellowPrice: boolean;
}

interface TradingDomProps {
  orderbook: OrderBooksStore;
  tickerInfo: LinearInverseInstrumentInfoV5;
  openLong: (price: number) => void;
  closeLong: (price: number) => void;
  openShort: (price: number) => void;
  closeShort: (price: number) => void;
}

export const TradingDom = ({
  orderbook,
  tickerInfo,
  openLong,
  closeLong,
  openShort,
  closeShort,
}: TradingDomProps) => {
  const [selectedFilterIndex, setSelectedFilterIndex] = useState<number>(0);
  const currentOrderBook = orderbook.getBook('BTCUSDT');

  const ask = currentOrderBook.getBestAsk() || 0;
  const bid = currentOrderBook.getBestBid() || 0;

  const updateTickValue = (value: number) => {
    setSelectedFilterIndex(value);
  };

  function generatePriceList(size: number, multiplier: number, price: number): number[] {
    const arr: number[] = [];
    let currPrice: number = price;
    arr.push(currPrice);

    for (let i = 1; i <= Math.floor(size / 2); i++) {
      currPrice += multiplier;
      arr.unshift(currPrice);
    }

    currPrice = price;
    for (let i = 1; i < Math.ceil(size / 2); i++) {
      currPrice -= multiplier;
      arr.push(currPrice);
    }

    return arr;
  }

  const selectedValueFilter = normalizedValueFilter[selectedFilterIndex];
  return (
    <BodyComponent>
      <SlidePicker
        min={0}
        max={normalizedValueFilter.length - 1}
        step={1}
        value={selectedFilterIndex}
        onValueChange={updateTickValue}
        className={'p-4 bg-slate-300'}
      />
      <SelectedValue>{selectedValueFilter}</SelectedValue>
      <LadderComponent>
        {/* {currentOrderBook.book.map((row) => { */}
        {generatePriceList(30, selectedValueFilter, ask).map((price) => {
          // const price = row[1];
          // const qty = row[3];
          const bellowPrice = price < bid && price < ask;

          return (
            <LadderRowComponent key={price} bellowPrice={bellowPrice}>
              <LadderRowBidComponent
                onClick={() => (bellowPrice ? openLong(price) : closeLong(price))}
              >
                {bellowPrice ? '+' : '-'}
              </LadderRowBidComponent>
              <LadderRowPriceComponent>{price}</LadderRowPriceComponent>
              <LadderRowAskComponent
                onClick={() => (bellowPrice ? closeShort(price) : openShort(price))}
              >
                {bellowPrice ? '-' : '+'}
              </LadderRowAskComponent>
            </LadderRowComponent>
          );
        })}
      </LadderComponent>
    </BodyComponent>
  );
};
