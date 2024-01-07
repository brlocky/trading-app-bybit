import { OrderSideV5, OrderTypeV5 } from 'bybit-api';
import React, { useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useApi } from '../../providers';
import { RiskManagementService, TradingService } from '../../services';
import {
  selectLeverage,
  selectOrderSettings,
  selectOrderSide,
  selectOrderType,
  selectPositionSize,
  selectTicker,
  selectTickerInfo,
  selectWallet,
  setChartLines,
  setCreateOrder,
  updateOrderSettings,
  updateOrderSide,
  updateOrderType,
  updatePositionSize,
} from '../../slices';
import Button from '../Button/Button';
import { SlidePicker, ToggleInput } from '../Forms';
import { RedText, SmallText } from '../Text';

export const PositionSizeSelector: React.FC = () => {
  const dispatch = useDispatch();
  const tickerInfo = useSelector(selectTickerInfo);
  const ticker = useSelector(selectTicker);
  const leverage = useSelector(selectLeverage);
  const positionSize = useSelector(selectPositionSize);
  const wallet = useSelector(selectWallet);
  const orderSide = useSelector(selectOrderSide);
  const orderType = useSelector(selectOrderType);
  const orderSettings = useSelector(selectOrderSettings);
  const tradingService = TradingService(useApi());
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

  const toggleArmed = () => {
    dispatch(updateOrderSettings({ ...orderSettings, armed: !orderSettings.armed }));
  };

  const setOrderSide = (side: OrderSideV5) => {
    dispatch(updateOrderSide(side));
  };
  const setOrderType = (orderType: OrderTypeV5) => {
    dispatch(updateOrderType(orderType));
  };

  const openPosition = () => {
    if (!ticker || !tickerInfo) return;
    const riskValue = riskPercentageRef.current;

    const chartLines = riskManagementService.getChartLines(
      orderSide,
      orderType,
      orderSettings,
      ticker,
      tickerInfo,
      getRiskValue(riskValue),
      positionSize,
    );

    if (orderType === 'Limit') {
      dispatch(setChartLines(chartLines));
      return;
    }

    dispatch(
      setCreateOrder({
        symbol: tickerInfo.symbol,
        side: orderSide,
        type: orderType,
        chartLines: chartLines
      }),
    );
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
      <div className="inline-flex w-full justify-start space-x-4 pt-3">
        <Button onClick={() => setOrderSide('Buy')} className={orderSide === 'Buy' ? 'bg-green-400' : 'bg-red-400'}>
          Long
        </Button>
        <Button onClick={() => setOrderSide('Sell')} className={orderSide === 'Sell' ? 'bg-green-400' : 'bg-red-400'}>
          Short
        </Button>
      </div>
      <div className="inline-flex w-full justify-start space-x-4 pt-3">
        <Button className={orderType === 'Limit' ? 'bg-green-400' : 'bg-red-400'} onClick={() => setOrderType('Limit')}>
          Limit
        </Button>
        <Button className={orderType === 'Market' ? 'bg-green-400' : 'bg-red-400'} onClick={() => setOrderType('Market')}>
          Market
        </Button>
        <Button className={orderSettings.armed === true ? 'bg-green-400' : 'bg-red-400'} onClick={toggleArmed}>
          Armed
        </Button>
      </div>
      <div className="inline-flex w-full justify-start space-x-4 pt-3">
        <Button className="bg-blue-200" onClick={openPosition}>
          Open
        </Button>
      </div>
      <SmallText className="self-end text-right">
        <RedText>-{((positionSize * Number(ticker.lastPrice) * 0.06) / 100).toFixed(2)} USDT</RedText>
      </SmallText>
    </div>
  );
};
