import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useApi } from '../../providers';
import { TradingService } from '../../services';
import {
  selectLeverage,
  selectLines,
  selectPositionSize,
  selectTicker,
  selectTickerInfo,
  selectWallet,
  updatePositionSize,
} from '../../slices';
import Button from '../Button/Button';
import { SlidePicker } from '../Forms';
import { RedText, SmallText } from '../Text';

export const PositionSizeSelector: React.FC = () => {
  const dispatch = useDispatch();
  const tickerInfo = useSelector(selectTickerInfo);
  const ticker = useSelector(selectTicker);
  const leverage = useSelector(selectLeverage);
  const positionSize = useSelector(selectPositionSize);
  const wallet = useSelector(selectWallet);
  const lines = useSelector(selectLines);

  const tradingService = TradingService(useApi());

  const getMaxOrderQty = (): number => {
    if (!wallet || !tickerInfo || !ticker) {
      return 0;
    }
    const coin = wallet.coin[0];
    const maxWalletOrderAmmount = (parseFloat(coin.availableToWithdraw) / parseFloat(ticker.lastPrice)) * leverage;
    return Math.min(Number(tickerInfo.lotSizeFilter.maxOrderQty), maxWalletOrderAmmount || 0);
  };

  const orderQtyChanged = (value: number) => {
    dispatch(updatePositionSize(value));
  };

  const longTrade = () => {
    if (!tickerInfo) return;

    const tps = lines.filter((l) => l.type === 'TP').map((l) => l.price.toString());
    const sls = lines.filter((l) => l.type === 'SL').map((l) => l.price.toString());

    tradingService.openLongTrade({
      symbol: tickerInfo.symbol,
      qty: positionSize.toString(),
      takeProfit: tps.length ? tps[0] : undefined,
      stopLoss: sls.length ? sls[0] : undefined,
    });
  };
  const shortTrade = () => {
    if (!tickerInfo) return;

    const tps = lines.filter((l) => l.type === 'TP').map((l) => l.price.toString());
    const sls = lines.filter((l) => l.type === 'SL').map((l) => l.price.toString());

    tradingService.openShortTrade({
      symbol: tickerInfo.symbol,
      qty: positionSize.toString(),
      takeProfit: tps.length ? tps[0] : undefined,
      stopLoss: sls.length ? sls[0] : undefined,
    });
  };

  if (!tickerInfo || !ticker) return <div className="rounded-md bg-gray-200 p-3">Select Symbol</div>;

  const {
    lotSizeFilter: { minOrderQty, qtyStep },
  } = tickerInfo;

  return (
    <div className="w-full rounded-md bg-gray-200 p-3">
      <div>
        <div className="flex justify-between">
          <SmallText>
            {positionSize} {tickerInfo.baseCoin}
          </SmallText>
          <SmallText>{(positionSize * Number(ticker.lastPrice)).toFixed(2)} USDT</SmallText>
        </div>
        <SlidePicker
          min={Number(minOrderQty)}
          value={positionSize}
          max={getMaxOrderQty()}
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
      </div>
      <div className="inline-flex w-full justify-center space-x-4 pt-3">
        <Button className="bg-red-400">Limit</Button>
        <Button className="bg-red-400">Market</Button>
        <Button className="bg-red-400">Armed</Button>
      </div>
      <SmallText className="self-end text-right">
        <RedText>-{((positionSize * Number(ticker.lastPrice) * 0.06) / 100).toFixed(2)} USDT</RedText>
      </SmallText>
    </div>
  );
};
