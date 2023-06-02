import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import tw from 'twin.macro';
import { ITradingService } from '../../services';
import { selectLeverage, selectPositionSize, selectTicker, selectTickerInfo, selectWallet, updatePositionSize } from '../../slices';
import Button from '../Button/Button';
import SlidePicker from '../Forms/SlidePicker';
import { LeverageSelector, MarginModeSelector, PositionModeSelector } from '../Trade';

interface ICardSymbolProps {
  tradingService: ITradingService;
  longTrade: () => void;
  shortTrade: () => void;
  closeAll: () => void;
}

const CardSymbol: React.FC<ICardSymbolProps> = ({ tradingService, longTrade, shortTrade, closeAll }: ICardSymbolProps) => {
  const dispatch = useDispatch();
  const tickerInfo = useSelector(selectTickerInfo);
  const wallet = useSelector(selectWallet);
  const leverage = useSelector(selectLeverage);
  const ticker = useSelector(selectTicker);
  const positionSize = useSelector(selectPositionSize);
  if (!wallet || !tickerInfo || !ticker) {
    return <></>;
  }

  const coin = wallet.coin[0];

  const orderQtyChanged = (value: number) => {
    dispatch(updatePositionSize(value));
  };

  const {
    lotSizeFilter: { minOrderQty, qtyStep },
  } = tickerInfo;

  return (
    <div className="flex h-full flex-col justify-around">
      <div className="flex justify-between pb-5">
        <div className="flex flex-col">
          <span>Equity</span>
          <span className="w-full justify-end">
            <b>{tradingService.formatCurrency((Number(coin.equity) * leverage).toString())}</b> USDT
          </span>
        </div>
        <div className="flex flex-col text-right">
          <span>Balance</span>
          <span>
            <b>{tradingService.formatCurrency(coin.availableToWithdraw)}</b> USDT
          </span>
        </div>
      </div>

      <LeverageSelector />
      <PositionModeSelector />
      <MarginModeSelector />

      <div>
        <div className="flex justify-between flex-col xl:flex-row">
          <span>
            {positionSize} {tickerInfo.baseCoin}
          </span>
          <span>{(positionSize * Number(ticker.lastPrice)).toFixed(2)} €</span>
          <span>Fee: -{((positionSize * Number(ticker.lastPrice) * 0.06) / 100).toFixed(2)} €</span>
        </div>
        <SlidePicker
          min={Number(minOrderQty)}
          value={positionSize}
          max={Number(tickerInfo.lotSizeFilter.maxOrderQty)}
          step={Number(qtyStep)}
          onValueChanged={orderQtyChanged}
        />
      </div>
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
