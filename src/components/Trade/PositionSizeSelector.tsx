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
import { WalletBalanceV5, WalletBalanceV5Coin } from 'bybit-api';

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

  if (!tickerInfo || !wallet || !ticker) {
    return <></>;
  }

  const longTrade = () => {
    tradingService.openLongTrade({
      symbol: tickerInfo.symbol,
      qty: positionSize.toString(),
      orderType: orderType,
      price: orderType === 'Limit' ? entryPrice : undefined,
      takeProfit: formatPriceWithTickerInfo(takeProfit.price, tickerInfo),
      stopLoss: formatPriceWithTickerInfo(stopLoss.price, tickerInfo),
    });
  };
  const shortTrade = () => {
    tradingService.openShortTrade({
      symbol: tickerInfo.symbol,
      qty: positionSize.toString(),
      orderType: orderType,
      price: orderType === 'Limit' ? entryPrice : undefined,
      takeProfit: formatPriceWithTickerInfo(takeProfit.price, tickerInfo),
      stopLoss: formatPriceWithTickerInfo(stopLoss.price, tickerInfo),
    });
  };

  const {
    lotSizeFilter: { minOrderQty, qtyStep },
  } = tickerInfo;

  return (
    <>
      <div>
        <div className="flex flex-col justify-between xl:flex-row">
          <span>
            {positionSize} {tickerInfo.baseCoin}
          </span>
          <span>{(positionSize * Number(ticker.lastPrice)).toFixed(2)} €</span>
          <span>Fee: -{((positionSize * Number(ticker.lastPrice) * 0.06) / 100).toFixed(2)} €</span>
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
    </>
  );
};
