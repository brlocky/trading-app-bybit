import React, { useEffect, useState } from 'react';
import { Card } from './Card';
import { LinearInverseInstrumentInfoV5, WalletBalanceV5, WalletBalanceV5Coin } from 'bybit-api';
import SlidePicker from '../Forms/SlidePicker';
import { ITicker } from '../../types';
import { Input } from '../Forms';
import Button from '../Button/Button';

interface ICardSymbolProps {
  symbolInfo: LinearInverseInstrumentInfoV5;
  wallet: WalletBalanceV5;
  price: ITicker;
  positionSizeUpdated: (size: number) => void;
  longTrade: () => void;
  shortTrade: () => void;
  closeAll: () => void;
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
  const [coin, setCoin] = useState<WalletBalanceV5Coin | undefined>();

  useEffect(() => {
    setCoin(wallet.coin[0]);
    const minOrderQty = convertToNumber(symbolInfo.lotSizeFilter.minOrderQty);
    setPositionSize(minOrderQty);
  }, [symbolInfo]);

  const convertToNumber = (value: string): number => {
    return parseFloat(value);
  };

  const formatCurrency = (value: string) => {
    return convertToNumber(value).toFixed(4);
  };

  const orderQtyChanged = (value: number) => {
    setPositionSize(value);
    positionSizeUpdated(value);
  };

  const getMaxOrderQty = (): number => {
    const maxWalletOrderAmmount =
      parseFloat(coin?.availableToWithdraw || '0') / parseFloat(price?.lastPrice || '0');
    return maxWalletOrderAmmount || 0;
  };

  const {
    priceFilter: { tickSize },
    lotSizeFilter: { minOrderQty, qtyStep },
  } = symbolInfo;

  if (!wallet || !symbolInfo) {
    return <></>;
  }

  return (
    <div className="inline-flex">
      <Card header={'Wallets'}>
        <h1>
          {wallet?.accountType} / {coin?.coin}
        </h1>
        <h2>Equity {formatCurrency(coin?.equity || '0')} USDT </h2>
        <h2>Available Balance {formatCurrency(coin?.availableToWithdraw || '0')} USDT</h2>
        {/* <pre>{JSON.stringify(wallet, null, 2)}</pre> */}
      </Card>

      <Card header={'Symbol'}>
        <div className="flex w-full flex-col">
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
            min={convertToNumber(minOrderQty)}
            value={positionSize}
            max={getMaxOrderQty()}
            step={convertToNumber(qtyStep)}
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
