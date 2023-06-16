import { KlineIntervalV3, LinearInverseInstrumentInfoV5 } from 'bybit-api';
import React, { ComponentType, useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { toast } from 'react-toastify';
import { mapKlineToCandleStickData } from '../mappers';
import { useApi } from '../providers';
import { addChartLine, resetChartLines, selectLines } from '../slices';
import {
  resetKlines,
  selectCurrentOrders,
  selectCurrentPosition,
  selectInterval,
  selectSymbol,
  selectTicker,
  updateExecutions,
  updateKlines,
  updateOrders,
  updatePositions,
  updateTickerInfo,
  updateWallet,
} from '../slices/symbolSlice';
import { AppDispatch } from '../store';

const accountType = 'CONTRACT';

export interface WithTradingControlProps {
  isLoading: boolean;
}

function withTradingControl<P extends WithTradingControlProps>(
  WrappedComponent: ComponentType<P>,
): React.FC<Omit<P, keyof WithTradingControlProps>> {
  const WithTradingControl: React.FC<Omit<P, keyof WithTradingControlProps>> = (props) => {
    const [isLoading, setIsLoading] = useState(true);
    const symbol = useSelector(selectSymbol);
    const interval = useSelector(selectInterval);
    const ticker = useSelector(selectTicker);
    const currentOrders = useSelector(selectCurrentOrders);
    const currentPosition = useSelector(selectCurrentPosition);
    const chartLines = useSelector(selectLines);

    const apiClient = useApi(); // Use the useApi hook to access the API context
    const dispatch = useDispatch<AppDispatch>();

    // Initial Load
    useEffect(() => {
      const activeOrdersPromise = apiClient.getActiveOrders({
        category: 'linear',
        settleCoin: 'USDT',
      });

      const positionInfoPromise = apiClient.getPositionInfo({
        category: 'linear',
        settleCoin: 'USDT',
      });

      const excutionListPromise = apiClient.getExecutionList({
        category: 'linear',
      });

      const walletInfoPromise = apiClient.getWalletBalance({
        accountType: accountType,
        coin: 'USDT',
      });

      Promise.all([activeOrdersPromise, positionInfoPromise, walletInfoPromise, excutionListPromise]).then(
        ([orderInfo, positionInfo, walletInfo, excutionList]) => {
          orderInfo.retCode === 0 ? dispatch(updateOrders(orderInfo.result.list)) : toast.error('Error loading orders');
          excutionList.retCode === 0
            ? dispatch(updateExecutions(excutionList.result.list.sort((a, b) => Number(b.execTime) - Number(a.execTime))))
            : toast.error('Error loading executions');
          positionInfo.retCode === 0 ? dispatch(updatePositions(positionInfo.result.list)) : toast.error('Error loading positions');

          const usdtWallet = walletInfo.result.list[0];
          if (usdtWallet) {
            dispatch(updateWallet(usdtWallet));
          }

          setIsLoading(false);
        },
      );
    }, []);

    // TODO replace by 1 initial call to load all tickerInfos
    useEffect(() => {
      if (!symbol) return;

      // Force One Way Mode
      apiClient.switchPositionMode({
        category: 'linear',
        symbol: symbol,
        mode: 0,
      });

      // Force Cross Mode
      apiClient.switchIsolatedMargin({
        category: 'linear',
        symbol: symbol,
        tradeMode: 0,
        buyLeverage: currentPosition?.leverage || '1',
        sellLeverage: currentPosition?.leverage || '1',
      });

      apiClient
        .getInstrumentsInfo({
          category: 'linear',
          symbol: symbol,
        })
        .then((res) => {
          dispatch(updateTickerInfo(res.result.list[0] as LinearInverseInstrumentInfoV5));
        });

      dispatch(resetChartLines());

      currentOrders.forEach((o) => {
        if (o.stopOrderType === 'StopLoss' || o.stopOrderType === 'TakeProfit') {
          dispatch(
            addChartLine({
              type: o.stopOrderType === 'StopLoss' ? 'SL' : 'TP',
              price: Number(o.triggerPrice),
              qty: Number(o.qty),
              draggable: true,
            }),
          );
        }
      });

      if (currentPosition) {
        dispatch(
          addChartLine({
            type: 'ENTRY',
            price: Number(currentPosition.avgPrice),
            qty: Number(currentPosition.size),
            draggable: false,
          }),
        );
      }
    }, [symbol]);

    // Load Chart Data
    useEffect(() => {
      if (!symbol) return;

      setIsLoading(true);
      dispatch(resetKlines());

      let intervalMinutes = 0;
      let loop = 0;

      switch (interval) {
        case '3':
        case '5':
          intervalMinutes = 200 * parseInt(interval);
          loop = 24;
          break;

        case '15':
        case '30':
          intervalMinutes = 200 * parseInt(interval);
          loop = 5 * 24;
          break;

        case '60':
        case '120':
        case '240':
        case '360':
        case '720':
          intervalMinutes = 200 * 60 * (parseInt(interval) / 60);
          loop = 24 * 31;
          break;

        case 'D':
          intervalMinutes = 200 * 60 * 24;
          loop = 24 * 100;
          break;

        case 'W':
          intervalMinutes = 200 * 60 * 24 * 7;
          loop = 24 * 360;
          break;

        case 'M':
          intervalMinutes = 200 * 60 * 24 * 31;
          loop = 24 * 1440;
          break;

        default:
          intervalMinutes = 200 * parseInt(interval);
          loop = 8;
      }

      const startDate = new Date();
      startDate.setHours(startDate.getHours() - loop);

      let startTime = startDate.getTime();
      const promises = [];

      while (startTime <= Date.now()) {
        const endTime = new Date(startTime);
        endTime.setMinutes(endTime.getMinutes() + intervalMinutes);

        const promise = apiClient.getKline({
          category: 'linear',
          symbol: symbol,
          interval: interval as KlineIntervalV3,
          start: Math.floor(startTime),
          end: Math.floor(endTime.getTime()),
        });

        promises.push(promise);
        startTime = endTime.getTime();
      }

      Promise.all(promises).then((r) => {
        const data = r.map((r) => r.result.list).flat();
        const candleStickData = data.map(mapKlineToCandleStickData).sort((a, b) => (a.time as number) - (b.time as number));
        dispatch(updateKlines(candleStickData));
        setIsLoading(false);
      });
    }, [symbol, interval]);

    useEffect(() => {
      console.log('lines changed', chartLines);
    }, [chartLines]);

    return <WrappedComponent {...(props as P)} isLoading={isLoading} />;
  };

  return WithTradingControl;
}

export default withTradingControl;
