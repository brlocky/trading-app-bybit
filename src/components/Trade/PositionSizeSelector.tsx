import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useApi } from '../../providers';
import { TradingService } from '../../services';
import {
  selectEntryPrice,
  selectLeverage,
  selectOrderType,
  selectPositionSize,
  selectStopLoss,
  selectTakeProfit,
  selectTicker,
  selectTickerInfo,
  selectWallet,
  updatePositionSize,
} from '../../slices';
import { formatPriceWithTickerInfo } from '../../utils/tradeUtils';
import Button from '../Button/Button';
import SlidePicker from '../Forms/SlidePicker';
import { RedText, SmallText } from '../Text';

export const PositionSizeSelector: React.FC = () => {
  const dispatch = useDispatch();
  const tickerInfo = useSelector(selectTickerInfo);
  const ticker = useSelector(selectTicker);
  const leverage = useSelector(selectLeverage);
  const positionSize = useSelector(selectPositionSize);
  const wallet = useSelector(selectWallet);
  const takeProfit = useSelector(selectTakeProfit);
  const stopLoss = useSelector(selectStopLoss);
  const orderType = useSelector(selectOrderType);
  const entryPrice = useSelector(selectEntryPrice);

  const tradingService = TradingService(useApi());

  useEffect(() => {
    if (tickerInfo?.symbol) {
      orderQtyChanged(Number(tickerInfo.lotSizeFilter.minOrderQty));
    }
  }, [tickerInfo?.symbol]);

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
    tradingService.openLongTrade({
      symbol: tickerInfo.symbol,
      qty: positionSize.toString(),
      orderType: orderType,
      price: orderType === 'Limit' ? entryPrice : undefined,
      takeProfit: takeProfit ? formatPriceWithTickerInfo(takeProfit.price, tickerInfo) : undefined,
      stopLoss: stopLoss ? formatPriceWithTickerInfo(stopLoss.price, tickerInfo) : undefined,
    });
  };
  const shortTrade = () => {
    if (!tickerInfo) return;

    tradingService.openShortTrade({
      symbol: tickerInfo.symbol,
      qty: positionSize.toString(),
      orderType: orderType,
      price: orderType === 'Limit' ? entryPrice : undefined,
      takeProfit: takeProfit ? formatPriceWithTickerInfo(takeProfit.price, tickerInfo) : undefined,
      stopLoss: stopLoss ? formatPriceWithTickerInfo(stopLoss.price, tickerInfo) : undefined,
    });
  };

  if (!tickerInfo || !ticker) return <>...loading...</>;

  const {
    lotSizeFilter: { minOrderQty, qtyStep },
  } = tickerInfo;

  return (
    <div className="rounded-md bg-gray-200 p-3">
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
      <SmallText className='self-end text-right'>
        <RedText>-{((positionSize * Number(ticker.lastPrice) * (orderType === 'Market' ? 0.06 : 0.01)) / 100).toFixed(2)} USDT</RedText>
      </SmallText>
    </div>
  );
};
