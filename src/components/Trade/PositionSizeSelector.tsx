import { OrderSideV5 } from 'bybit-api';
import React, { useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RiskManagementService } from '../../services';
import {
  addChartLines,
  selectChartLines,
  selectLeverage,
  selectOrderSettings,
  selectOrderSide,
  selectPositionSize,
  selectTicker,
  selectWallet,
  setChartLines,
  setCreateMarketOrder,
  updateOrderSettings,
  updateOrderSide,
  updatePositionSize,
} from '../../slices';
import Button from '../Button/Button';
import { SlidePicker, ToggleInput } from '../Forms';
import { RedText, SmallText } from '../Text';
import { toast } from 'react-toastify';

export const PositionSizeSelector: React.FC = () => {
  const dispatch = useDispatch();
  const ticker = useSelector(selectTicker)?.ticker;
  const tickerInfo = useSelector(selectTicker)?.tickerInfo;
  const leverage = useSelector(selectLeverage);
  const positionSize = useSelector(selectPositionSize);
  const wallet = useSelector(selectWallet);
  const orderSide = useSelector(selectOrderSide);
  const chartLines = useSelector(selectChartLines);
  const orderSettings = useSelector(selectOrderSettings);
  const riskManagementService = RiskManagementService();
  const riskPercentageRef = useRef<number>(orderSettings.percentageRisk);

  useEffect(() => {
    if (riskPercentageRef.current !== orderSettings.percentageRisk) {
      riskPercentageRef.current = orderSettings.percentageRisk;
    }
  }, [orderSettings.percentageRisk]);

  const getMaxOrderQty = (): number => {
    if (!wallet || !tickerInfo || !ticker) {
      return 0;
    }
    const coin = wallet.coin[0];
    const maxWalletOrderAmmount = (Number(coin.availableToWithdraw) / Number(ticker.lastPrice)) * leverage;
    return Math.min(Number(tickerInfo.lotSizeFilter.maxOrderQty), maxWalletOrderAmmount || 0);
  };

  const getRiskValue = (riskPercentage: number): number => {
    if (!wallet) {
      return 0;
    }
    const coin = wallet.coin[0];
    const value = Number(Number(coin.availableToWithdraw) * (riskPercentage / 100));
    return Number(value.toFixed(2));
  };

  const orderQtyChanged = (value: number) => {
    dispatch(updatePositionSize(value));
  };

  const riskPercentageChanged = (percentage: number) => {
    dispatch(updateOrderSettings({ ...orderSettings, percentageRisk: percentage }));
  };

  const positionTypeChanged = (positionType: string) => {
    if (positionType === 'risk') {
      dispatch(updateOrderSettings({ ...orderSettings, percentageRisk: 1 }));
    } else {
      dispatch(updateOrderSettings({ ...orderSettings, percentageRisk: 0 }));
    }
  };

  const setOrderSide = (side: OrderSideV5) => {
    dispatch(updateOrderSide(side));
  };

  const toggleArmed = () => {
    dispatch(updateOrderSettings({ ...orderSettings, armed: !orderSettings.armed }));
  };

  const openPosition = () => {
    if (!ticker || !tickerInfo || !wallet) return;
    const riskValue = riskPercentageRef.current;

    const coin = wallet.coin[0];

    const newChartLines = riskManagementService.getChartLines(
      orderSide,
      orderSettings,
      ticker,
      tickerInfo,
      getRiskValue(riskValue),
      positionSize,
      Number(coin.availableToWithdraw),
    );

    if (!orderSettings.armed) {
      const limitOrders = chartLines.filter((l) => l.type === 'ENTRY' && !l.isLive);
      if (limitOrders.length) {
        toast.error('Cannot have multiple Limit Orders per Symbol');
      } else {
        // Limit Order
        dispatch(addChartLines(newChartLines));
      }
    } else {
      // Market Order
      dispatch(
        setCreateMarketOrder({
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
  const riskValue = riskPercentageRef.current;
  return (
    <div className="w-full rounded-md bg-gray-200 p-3">
      <ToggleInput
        toggles={[
          { name: 'Risk', value: 'risk' },
          { name: 'Coins', value: 'coins' },
        ]}
        defaultToggle={riskValue === 0 ? 'coins' : 'risk'}
        onChange={positionTypeChanged}
      />
      <div className="p-2">
        {riskValue > 0 ? (
          <div className="flex items-end gap-x-10">
            <div className="flex w-full flex-col">
              <div className="flex w-full justify-between">
                <SmallText>{riskValue} %</SmallText>
                <SmallText>{getRiskValue(riskValue)} USDT</SmallText>
              </div>
              <SlidePicker min={1} value={riskValue} max={10} step={0.5} onValueChanged={riskPercentageChanged} />
            </div>
          </div>
        ) : (
          <div className="flex items-end gap-x-10">
            <div className="flex w-full flex-col">
              <div className="flex w-full justify-between">
                <SmallText>
                  Size {positionSize} {tickerInfo.baseCoin}
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
          </div>
        )}
      </div>
      <div className="inline-flex h-12 w-full content-center gap-x-4 p-2">
        <Button onClick={() => setOrderSide('Buy')} className={orderSide === 'Buy' ? 'bg-green-400' : ''}>
          Long
        </Button>
        <Button onClick={() => setOrderSide('Sell')} className={orderSide === 'Sell' ? 'bg-green-400' : ''}>
          Short
        </Button>

        <Button className="bg-blue-200" onClick={openPosition}>
          Open
        </Button>

        <Button className={orderSettings.armed === true ? 'ml-auto bg-green-400' : 'ml-auto bg-red-400'} onClick={toggleArmed}>
          Armed
        </Button>
      </div>
      <SmallText className="self-end text-right">
        <RedText>-{((positionSize * Number(ticker.lastPrice) * 0.06) / 100).toFixed(2)} USDT</RedText>
      </SmallText>
    </div>
  );
};
