import React, { useEffect, useState } from 'react';
import { Card } from './Card';
import {
  LinearInverseInstrumentInfoV5,
  WalletBalanceV5,
  WalletBalanceV5Coin,
} from 'bybit-api';
import SlidePicker from '../Forms/SlidePicker';
import CardWallets from './CardWallets';
import { ITicker } from '../../types';
import { Input } from '../Forms';
import Button from '../Button/Button';

interface ICardSymbolProps {
  symbolInfo?: LinearInverseInstrumentInfoV5;
  wallet?: WalletBalanceV5;
  price?: ITicker;
  positionSizeUpdated: (size: number) => void;
  longTrade: () => void;
  shortTrade: () => void;
  closeAll: () => void;
}

interface ISymbolProps {
  priceFilter: {
    minPrice: number;
    maxPrice: number;
    tickSize: number;
  };
  lotSizeFilter: {
    maxOrderQty: number;
    minOrderQty: number;
    qtyStep: number;
  };
}

const symbolTick = 'BTCUSDT';

const CardSymbol: React.FC<ICardSymbolProps> = ({
  symbolInfo,
  wallet,
  price,
  positionSizeUpdated,
  longTrade,
  shortTrade,
  closeAll,
}: ICardSymbolProps) => {
  const [positionSize, setPositionSize] = useState<number>(0);
  const [coin, setCoin] = useState<WalletBalanceV5Coin | null>(null);
  const [symbolProps, setSymbolProps] = useState<ISymbolProps>({
    priceFilter: {
      minPrice: 0,
      maxPrice: 0,
      tickSize: 0,
    },
    lotSizeFilter: {
      maxOrderQty: 0,
      minOrderQty: 0,
      qtyStep: 0,
    },
  });

  useEffect(() => {
    // Optional: Cleanup the websocket connection on component unmount

    loadSymbolProps(symbolInfo);
    setCoin(wallet?.coin[0] || null);
    setPositionSize(symbolProps.lotSizeFilter.minOrderQty);
    return () => {
      // Remove the event listener
      // wsClient.closeAll();
    };
  }, [symbolInfo]);

  const convertToNumber = (value: string): number => {
    return parseFloat(value);
  };

  const loadSymbolProps = (
    symbol: LinearInverseInstrumentInfoV5 | undefined
  ) => {
    if (!symbol) {
      return;
    }

    const props = { ...symbolProps };
    if ('minPrice' in symbol.priceFilter) {
      props.priceFilter.minPrice = convertToNumber(
        symbol.priceFilter['minPrice']
      );
    }
    if ('maxPrice' in symbol.priceFilter) {
      props.priceFilter.maxPrice = convertToNumber(
        symbol.priceFilter['maxPrice']
      );
    }
    props.priceFilter.tickSize = convertToNumber(symbol.priceFilter.tickSize);

    if ('maxOrderQty' in symbol.lotSizeFilter) {
      props.lotSizeFilter.maxOrderQty = convertToNumber(
        symbol.lotSizeFilter['maxOrderQty']
      );
    }
    if ('minOrderQty' in symbol.lotSizeFilter) {
      props.lotSizeFilter.minOrderQty = convertToNumber(
        symbol.lotSizeFilter['minOrderQty']
      );
    }
    if ('qtyStep' in symbol.lotSizeFilter) {
      props.lotSizeFilter.qtyStep = convertToNumber(
        symbol.lotSizeFilter.qtyStep
      );
    }

    setSymbolProps(props);
  };

  const orderQtyChanged = (value: number) => {
    setPositionSize(value);
    positionSizeUpdated(value);
  };

  const getMaxOrderQty = (): number => {
    const maxWalletOrderAmmount =
      parseFloat(coin?.availableToWithdraw || '0') /
      parseFloat(price?.lastPrice || '0');
    return maxWalletOrderAmmount || 0;
  };

  const {
    priceFilter: { tickSize },
    lotSizeFilter: { minOrderQty, qtyStep },
  } = symbolProps;
  return (
    <div className="inline-flex">
      <CardWallets wallet={wallet} />
      <Card header={'Symbol'}>
        <div className="flex flex-col w-full">
          <div className="-my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
            <div className="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
              <div className="overflow-hidden border-b border-gray-200 shadow sm:rounded-lg">
                <h1>{symbolTick}</h1>
                <h2>Price Tick - {tickSize} </h2>
                <h2>Contract Size - {qtyStep} </h2>
              </div>
            </div>
          </div>

          <Input
            type="text"
            value={positionSize}
            label="Position Size"
            onChange={(e) => orderQtyChanged(parseFloat(e.target.value))}
          />
          <SlidePicker
            min={minOrderQty}
            value={positionSize}
            max={getMaxOrderQty()}
            step={qtyStep}
            onValueChange={orderQtyChanged}
          />

          <Button onClick={longTrade}>Long</Button>
          <Button onClick={shortTrade}>Short</Button>
          <Button onClick={closeAll}>Close All Orders</Button>
          {/* <pre>{JSON.stringify(wallet, null, 2)}</pre> */}
          {/* <pre>{JSON.stringify(symbolProps, null, 2)}</pre> */}
          {/* <pre>{JSON.stringify(symbolInfo, null, 2)}</pre> */}
        </div>
      </Card>
    </div>
  );
};

export default CardSymbol;
