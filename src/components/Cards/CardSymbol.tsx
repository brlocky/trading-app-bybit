import React, { useEffect, useState } from 'react';
import { LinearInverseInstrumentInfoV5, WalletBalanceV5, WalletBalanceV5Coin } from 'bybit-api';
import SlidePicker from '../Forms/SlidePicker';
import { ITicker } from '../../types';
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
    return convertToNumber(value).toFixed(2);
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
    lotSizeFilter: { minOrderQty, qtyStep },
  } = symbolInfo;

  if (!wallet || !symbolInfo || !coin) {
    return <></>;
  }

  return (
    <div className="flex flex-col">
      <h1>{symbolTick}</h1>
      <div className="inline-flex w-full justify-between pb-3">
        <div className="flex flex-col md:flex-row">
          <span>Equity:</span>
          <span className="w-full justify-end">
            <b>{formatCurrency(coin?.equity || '0')}</b> USDT
          </span>
        </div>
        <div className="flex flex-col md:flex-row">
          <span>Available Balance:</span>
          <span>
            <b>{formatCurrency(coin?.availableToWithdraw || '0')}</b> USDT
          </span>
        </div>
      </div>
      <SlidePicker
        showValue
        min={convertToNumber(minOrderQty)}
        value={positionSize}
        max={getMaxOrderQty()}
        step={convertToNumber(qtyStep)}
        onValueChange={orderQtyChanged}
      />

      <div className="inline-flex w-full justify-center space-x-4 pt-3">
        <Button onClick={longTrade} className="bg-green-300">
          Long
        </Button>
        <Button onClick={shortTrade} className="bg-red-400">
          Short
        </Button>
        <Button onClick={closeAll}>Close All Orders</Button>
      </div>
      {/* <pre>{JSON.stringify(wallet, null, 2)}</pre> */}
      {/* <pre>{JSON.stringify(symbolProps, null, 2)}</pre> */}
      {/* <pre>{JSON.stringify(symbolInfo, null, 2)}</pre> */}
    </div>
  );
};

export default CardSymbol;
