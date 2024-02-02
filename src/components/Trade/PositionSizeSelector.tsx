import { OrderSideV5 } from 'bybit-api';
import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { toast } from 'react-toastify';
import { useApi } from '../../providers';
import { ChartLinesService } from '../../services';
import { AppDispatch } from '../../store';
import { createMartketOrder } from '../../store/actions';
import {
  addChartLines,
  selectChartLines,
  selectLeverage,
  selectOrderSettings,
  selectPositionSize,
  selectTicker,
  selectWallet,
  updateOrderSettings,
  updatePositionSize,
} from '../../store/slices';
import { formatCurrencyValue } from '../../utils/tradeUtils';
import Button from '../Button/Button';
import { SlidePicker } from '../Forms';
import { SmallText } from '../Text';

export const PositionSizeSelector: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const apiClient = useApi();
  const ticker = useSelector(selectTicker)?.ticker;
  const tickerInfo = useSelector(selectTicker)?.tickerInfo;
  const leverage = useSelector(selectLeverage);
  const positionSize = useSelector(selectPositionSize);
  const wallet = useSelector(selectWallet);
  const chartLines = useSelector(selectChartLines);
  const orderSettings = useSelector(selectOrderSettings);
  const riskManagementService = ChartLinesService();

  useEffect(() => {
    if (!tickerInfo || !tickerInfo?.lotSizeFilter?.minOrderQty) return;
    const minSminOrderQtyize = Number(tickerInfo.lotSizeFilter.minOrderQty);
    if (positionSize !== minSminOrderQtyize) {
      dispatch(updatePositionSize(minSminOrderQtyize));
    }
  }, [tickerInfo]);

  const getMaxOrderQty = (): number => {
    if (!wallet || !tickerInfo || !ticker) {
      return 0;
    }
    const coin = wallet.coin.find((c) => c.coin === 'USDT');
    if (!coin) return 0;
    const maxWalletOrderAmmount = (Number(coin.availableToWithdraw) / Number(ticker.lastPrice)) * leverage;
    return Math.min(Number(tickerInfo.lotSizeFilter.maxOrderQty), maxWalletOrderAmmount || 0);
  };

  const orderQtyChanged = (value: number) => {
    dispatch(updatePositionSize(value));
  };

  const toggleArmed = () => {
    dispatch(updateOrderSettings({ ...orderSettings, armed: !orderSettings.armed }));
  };

  const openPosition = (orderSide: OrderSideV5) => {
    if (!ticker || !tickerInfo) return;

    const newChartLines = riskManagementService.getChartLines(orderSide, orderSettings, ticker, tickerInfo, positionSize);

    if (!orderSettings.armed) {
      if (chartLines.find((c) => c.type === 'ENTRY' && !c.isServer)) {
        toast.warn('Submit the current Limit order before add new ones');
      } else {
        // Limit Order
        dispatch(addChartLines(newChartLines));
      }
    } else {
      // Market Order
      dispatch(
        createMartketOrder(apiClient, {
          symbol: tickerInfo.symbol,
          side: orderSide,
          chartLines: newChartLines,
        }),
      );
    }
  };

  if (!tickerInfo || !ticker) return <div className="rounded-md bg-gray-200 p-3">Select Symbol</div>;

  const {
    lotSizeFilter: { minOrderQty, qtyStep },
  } = tickerInfo;

  const feeValue = orderSettings.armed ? 0.06 : 0.01;
  const orderFeeValue = ((positionSize * Number(ticker.lastPrice) * feeValue) / 100).toFixed(2);

  return (
    <div className="w-full rounded-md bg-gray-200 p-3">
      <div className="inline-flex h-12 w-full content-center gap-x-4 p-2">
        <Button onClick={() => openPosition('Buy')} className="bg-green-400">
          Long
        </Button>
        <Button onClick={() => openPosition('Sell')} className="bg-red-400">
          Short
        </Button>

        <Button className={orderSettings.armed ? 'ml-auto bg-green-400' : 'ml-auto bg-red-400'} onClick={toggleArmed}>
          Armed
        </Button>
      </div>
      <div className="p-2">
        <div className="flex w-full flex-col">
          <div className="flex w-full justify-between">
            <SmallText>
              Size {positionSize} {tickerInfo.baseCoin}
            </SmallText>
            <SmallText>
              {formatCurrencyValue(positionSize * Number(ticker.lastPrice))} | fee: {formatCurrencyValue(orderFeeValue)}
            </SmallText>
          </div>
          <SlidePicker
            min={Number(minOrderQty)}
            value={positionSize}
            max={getMaxOrderQty()}
            step={Number(qtyStep)}
            onValueChanged={orderQtyChanged}
          />
        </div>
      </div>

      {/*  <div className="inline-flex h-12 w-full content-center gap-x-4 p-2">
        <p>Live - {chartLines.filter((c) => c.isLive && c.isServer).length}</p>
        <p>Limit - {chartLines.filter((c) => !c.isLive && c.isServer).length}</p>
        <p>Chart - {chartLines.filter((c) => !c.isLive && !c.isServer).length}</p>
        <p>restingOrders - {restingOrders.length}</p>
      </div> */}
    </div>
  );
};
