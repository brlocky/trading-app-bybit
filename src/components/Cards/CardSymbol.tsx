import React from 'react';
import { useSelector } from 'react-redux';
import { ITradingService } from '../../services';
import { selectLeverage, selectTicker, selectTickerInfo, selectWallet } from '../../slices';
import { LeverageSelector, MarginModeSelector, PositionModeSelector, PositionSizeSelector } from '../Trade';

interface ICardSymbolProps {
  tradingService: ITradingService;
}

const CardSymbol: React.FC<ICardSymbolProps> = ({ tradingService }: ICardSymbolProps) => {
  const tickerInfo = useSelector(selectTickerInfo);
  const wallet = useSelector(selectWallet);
  const leverage = useSelector(selectLeverage);
  const ticker = useSelector(selectTicker);
  if (!wallet || !tickerInfo || !ticker) {
    return <></>;
  }

  const coin = wallet.coin[0];



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
      <PositionSizeSelector />      
      {/* <pre>{JSON.stringify(wallet, null, 2)}</pre> */}
      {/* <pre>{JSON.stringify(symbolProps, null, 2)}</pre> */}
      {/* <pre>{JSON.stringify(symbolInfo, null, 2)}</pre> */}
    </div>
  );
};

export default CardSymbol;
