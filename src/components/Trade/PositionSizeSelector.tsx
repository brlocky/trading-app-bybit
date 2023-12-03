import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useApi } from '../../providers';
import { RiskManagementService, TradingService } from '../../services';
import {
  addChartLine,
  addChartLines,
  selectLeverage,
  selectLines,
  selectOrderSettings,
  selectOrderSide,
  selectOrderType,
  selectPositionSize,
  selectRiskValue,
  selectTicker,
  selectTickerInfo,
  selectWallet,
  updateOrderSettings,
  updateOrderSide,
  updateOrderType,
  updatePositionSize,
  updateRiskValue,
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
  const riskValue = useSelector(selectRiskValue);
  const wallet = useSelector(selectWallet);
  const lines = useSelector(selectLines);
  const orderSide = useSelector(selectOrderSide);
  const orderType = useSelector(selectOrderType);
  const orderSettings = useSelector(selectOrderSettings);
  const tradingService = TradingService(useApi());
  const riskManagementService = RiskManagementService();

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

  const getRiskPercentage = (riskValue: number): number => {
    if (!wallet) {
      return 0;
    }

    const coin = wallet.coin[0];
    const availableToWithdraw = Number(coin.availableToWithdraw);

    if (availableToWithdraw === 0) {
      return 0;
    }

    const riskPercentage = (riskValue / availableToWithdraw) * 100;
    return Number(riskPercentage.toFixed(2));
  };

  const orderQtyChanged = (value: number) => {
    dispatch(updatePositionSize(value));
  };

  const riskPercentageChanged = (percentage: number) => {
    const riskValue = getRiskValue(percentage);
    dispatch(updateRiskValue(riskValue));
  };

  const positionTypeChanged = (positionType: string) => {
    if (positionType === 'risk') {
      dispatch(updateRiskValue(getRiskValue(1)));
    } else {
      dispatch(updatePositionSize(1));
    }
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

  const toggleArmed = () => {
    dispatch(updateOrderSettings({ ...orderSettings, armed: !orderSettings.armed }));
  };

  const toggleOrderSide = () => {
    dispatch(updateOrderSide(orderSide === 'Buy' ? 'Sell' : 'Buy'));
  };
  const toggleOrderType = () => {
    dispatch(updateOrderType(orderType === 'Market' ? 'Limit' : 'Market'));
  };

  const openTrade = () => {
    if (!ticker || !tickerInfo) return;

    const chartLines = riskManagementService.getChartLines(orderSide, orderType, orderSettings, ticker, tickerInfo, riskValue, positionSize);
    console.log('lines', chartLines);

    dispatch(addChartLines(chartLines));
    /* if (!orderSettings.armed) {
    } else {
      console.log('create live order');
    }
    const tps = lines.filter((l) => l.type === 'TP').map((l) => l.price.toString());
    const sls = lines.filter((l) => l.type === 'SL').map((l) => l.price.toString()); */

    // orderSettings

    /* tradingService.openShortTrade({
      symbol: tickerInfo.symbol,
      qty: positionSize.toString(),
      takeProfit: tps.length ? tps[0] : undefined,
      stopLoss: sls.length ? sls[0] : undefined,
    }); */
  };

  if (!tickerInfo || !ticker) return <div className="rounded-md bg-gray-200 p-3">Select Symbol</div>;

  const {
    lotSizeFilter: { minOrderQty, qtyStep },
  } = tickerInfo;

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
        {riskValue != 0 ? (
          <div className="flex items-end gap-x-10">
            <div className="flex w-full flex-col">
              <div className="flex w-full justify-between">
                <SmallText>{getRiskPercentage(riskValue)} %</SmallText>
                <SmallText>{riskValue} USDT</SmallText>
              </div>
              <SlidePicker min={0} value={getRiskPercentage(riskValue)} max={100} step={0.5} onValueChanged={riskPercentageChanged} />
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
      <div className="inline-flex w-full justify-center space-x-4 pt-3">
        <Button onClick={toggleOrderSide} className={orderSide === 'Buy' ? 'bg-green-400' : 'bg-red-400'}>
          Long
        </Button>
        <Button onClick={toggleOrderSide} className={orderSide === 'Sell' ? 'bg-green-400' : 'bg-red-400'}>
          Short
        </Button>
      </div>
      <div className="inline-flex w-full justify-center space-x-4 pt-3">
        <Button className={orderType === 'Limit' ? 'bg-green-400' : 'bg-red-400'} onClick={toggleOrderType}>
          Limit
        </Button>
        <Button className={orderType === 'Market' ? 'bg-green-400' : 'bg-red-400'} onClick={toggleOrderType}>
          Market
        </Button>
        <Button className={orderSettings.armed === true ? 'bg-green-400' : 'bg-red-400'} onClick={toggleArmed}>
          Armed
        </Button>
      </div>
      <div className="inline-flex w-full justify-center space-x-4 pt-3">
        <Button className="bg-blue-200" onClick={openTrade}>
          Open
        </Button>
        <Button className="bg-blue-200">Close</Button>
      </div>
      <SmallText className="self-end text-right">
        <RedText>-{((positionSize * Number(ticker.lastPrice) * 0.06) / 100).toFixed(2)} USDT</RedText>
      </SmallText>
    </div>
  );
};
