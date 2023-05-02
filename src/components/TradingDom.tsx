import React, { useState } from 'react';
import { OrderBooksStore } from 'orderbooks';
import tw from 'twin.macro';
import styled from 'styled-components';
import { LinearPositionIdx } from 'bybit-api';
import Dropdown, { IDropdownOption } from './Forms/DropDown';
import { ITradingService } from '../services';

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

const LadderCurrentPriceRowComponent = tw.div`
  flex
  w-full 
  border-2
  border-blue-200
  bg-slate-200
`;

const LadderRowItemComponent = tw.div`
flex
grow
text-center
justify-around
hover:cursor-grab
items-center
`;

const LadderRowBidComponent = tw(LadderRowItemComponent)`
hover:bg-green-300
`;

const LadderRowPriceComponent = tw(LadderRowItemComponent)`
`;

const LadderRowAskComponent = tw(LadderRowItemComponent)`
hover:bg-red-300
`;

const symbol = 'BTCUSDT';

interface LadderRowProps {
  bellowPrice: boolean;
}

interface TradingDomProps {
  tradingService: ITradingService;
  orderbook: OrderBooksStore;
  openLong: (price: number) => void;
  closeLong: (price: number) => void;
  openShort: (price: number) => void;
  closeShort: (price: number) => void;
  // addStopLoss: (symbol: string, side: LinearPositionIdx, price: number) => void;
}

export const TradingDom = ({
  tradingService,
  orderbook,
  openLong,
  closeLong,
  openShort,
  closeShort,
}: // addStopLoss,
TradingDomProps) => {
  const [selectedFilterIndex, setSelectedFilterIndex] = useState<number>(0);
  const currentOrderBook = orderbook.getBook('BTCUSDT');

  const ask = currentOrderBook.getBestAsk() || 0;
  const bid = currentOrderBook.getBestBid() || 0;

  const updateTickValue = (option: IDropdownOption) => {
    const selectedValue = parseFloat(option.value);
    const index = domAggregatorFilterValues.findIndex((v) => v === selectedValue);
    setSelectedFilterIndex(index);
  };

  const domAggregatorFilterValues = tradingService.getDomNormalizedAggregatorValues();

  function generatePriceList(size: number, multiplier: number, price: number): string[] {
    const arr: string[] = [];
    const normalizedPrice = Math.round(price / multiplier) * multiplier; // normalize price
    let currPrice: number = normalizedPrice;

    const decimalPlaces = multiplier.toString().split('.')[1]?.length + 1 || 0; // get the number of decimal places in the multiplier
    arr.push(price.toString());

    for (let i = 1; i <= Math.floor(size / 2); i++) {
      currPrice += multiplier;
      arr.unshift(currPrice.toFixed(decimalPlaces)); // format the price with the same number of decimal places as the multiplier
    }

    currPrice = normalizedPrice;
    for (let i = 1; i < Math.ceil(size / 2); i++) {
      currPrice -= multiplier;
      arr.push(currPrice.toFixed(decimalPlaces)); // format the price with the same number of decimal places as the multiplier
    }

    return arr;
  }

  const selectedValueFilter = domAggregatorFilterValues[selectedFilterIndex];

  const mapFilterValueToDropDownOption = (value: number) => ({
    value: value.toString(),
    label: value.toString(),
  });

  const ladderSize = 30;
  const ladderMiddle = 15;

  const { addStopLoss } = tradingService;
  return (
    <BodyComponent>
      <LadderComponent>
        {/* {currentOrderBook.book.map((row) => { */}
        {generatePriceList(ladderSize, selectedValueFilter, ask).map((price, index) => {
          const priceAsNumber = parseFloat(price);

          if (ladderMiddle === index) {
            return (
              <LadderCurrentPriceRowComponent key={price}>
                <LadderRowPriceComponent>{price}</LadderRowPriceComponent>
                <Dropdown
                  options={domAggregatorFilterValues.map(mapFilterValueToDropDownOption)}
                  selectedOption={
                    selectedFilterIndex !== -1
                      ? mapFilterValueToDropDownOption(selectedValueFilter)
                      : null
                  }
                  onChange={updateTickValue}
                />
              </LadderCurrentPriceRowComponent>
            );
          }

          const bellowPrice = index > ladderMiddle;

          const renderLongIcon = () => <i className={'fas fa-arrow-up text-green-600 text-xs'}></i>;
          const renderShortIcon = () => <i className={'fas fa-arrow-down text-red-600 text-xs'}></i>;
          const renderCloseIcon = () => <i className={'fas fa-close text-xs'}></i>;
          const renderStopLossIcon = () => <i className={'fas fa-shield-alt text-blue-300 text-xs'}></i>;
          return (
            <LadderRowComponent key={price} bellowPrice={bellowPrice}>
              <LadderRowBidComponent
                onClick={() => (bellowPrice ? openLong(priceAsNumber) : closeLong(priceAsNumber))}
              >
                {bellowPrice ? renderLongIcon() : renderCloseIcon()}
              </LadderRowBidComponent>
              <LadderRowBidComponent
                onClick={() =>
                  bellowPrice ? addStopLoss(symbol, LinearPositionIdx.BuySide, price) : {}
                }
              >
                {bellowPrice ? renderStopLossIcon() : ''}
              </LadderRowBidComponent>
              <LadderRowPriceComponent>{price}</LadderRowPriceComponent>
              <LadderRowBidComponent
                onClick={() =>
                  bellowPrice ? {} : addStopLoss(symbol, LinearPositionIdx.SellSide, price)
                }
              >
                {bellowPrice ? '' : renderStopLossIcon()}
              </LadderRowBidComponent>
              <LadderRowAskComponent
                onClick={() => (bellowPrice ? closeShort(priceAsNumber) : openShort(priceAsNumber))}
              >
                {bellowPrice ? renderCloseIcon() : renderShortIcon()}
              </LadderRowAskComponent>
            </LadderRowComponent>
          );
        })}
      </LadderComponent>
    </BodyComponent>
  );
};
