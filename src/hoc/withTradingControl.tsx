import { KlineIntervalV3, LinearInverseInstrumentInfoV5 } from 'bybit-api';
import React, { ComponentType, useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router';
import { toast } from 'react-toastify';
import { mapKlineToCandleStickData } from '../mappers';
import { useApi } from '../providers';
import { TradingService } from '../services';
import { addChartLine, resetChartLines, selectLines, updateLeverage, updatePositionSize } from '../slices';
import {
  selectCurrentOrders,
  selectCurrentPosition,
  selectInterval,
  selectSymbol,
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
    const currentOrders = useSelector(selectCurrentOrders);
    const currentPosition = useSelector(selectCurrentPosition);
    const chartLines = useSelector(selectLines);

    const apiClient = useApi(); // Use the useApi hook to access the API context
    const dispatch = useDispatch<AppDispatch>();
    const navigate = useNavigate();

    const tradingService = TradingService(apiClient);
    // Initial Load
    useEffect(() => {
      apiClient
        .getWalletBalance({
          accountType: accountType,
          coin: 'USDT',
        })
        .then((r) => {
          const usdtWallet = r.result.list[0];
          if (!usdtWallet) {
            throw Error('Could not find USDT wallet');
          }
          dispatch(updateWallet(usdtWallet));

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

          Promise.all([activeOrdersPromise, positionInfoPromise, excutionListPromise]).then(([orderInfo, positionInfo, excutionList]) => {
            orderInfo.retCode === 0 ? dispatch(updateOrders(orderInfo.result.list)) : toast.error('Error loading orders');
            excutionList.retCode === 0
              ? dispatch(updateExecutions(excutionList.result.list.sort((a, b) => Number(b.execTime) - Number(a.execTime))))
              : toast.error('Error loading executions');
            positionInfo.retCode === 0 ? dispatch(updatePositions(positionInfo.result.list)) : toast.error('Error loading positions');

            setIsLoading(false);
          });
        })
        .catch(() => {
          navigate('/settings');
          toast.error('Wrong API Credentials');
        });
    }, []);

    // Load Chart Data
    useEffect(() => {
      if (!symbol) return;

      setIsLoading(true);
      apiClient
        .getKline({
          category: 'linear',
          symbol: symbol,
          interval: interval as KlineIntervalV3,
        })
        .then((r) => {
          const candleStickData = r.result.list.map(mapKlineToCandleStickData).sort((a, b) => (a.time as number) - (b.time as number));
          dispatch(updateKlines(candleStickData));
        })
        .finally(() => {
          setIsLoading(false);
        });
    }, [symbol, interval]);

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

      if (currentPosition) {
        dispatch(updateLeverage(Number(currentPosition.leverage)));
      } else {
        // Force Leverage
        apiClient.setLeverage({
          category: 'linear',
          symbol: symbol,
          buyLeverage: '1',
          sellLeverage: '1',
        });
        dispatch(updateLeverage(1));
      }

      apiClient
        .getInstrumentsInfo({
          category: 'linear',
          symbol: symbol,
        })
        .then((res) => {
          const linearInformation = res.result.list[0] as LinearInverseInstrumentInfoV5;
          dispatch(updateTickerInfo(linearInformation));
          if (!currentPosition) {
            dispatch(updatePositionSize(Number(linearInformation.lotSizeFilter.minOrderQty)));
          }
        });
    }, [symbol]);

    // Sync Position with line changes
    useEffect(() => {
      if (!symbol || !currentPosition) return;

      // Update Orders
      const changedLines = chartLines.filter((l) => {
        const index = currentOrders.findIndex(
          (o) =>
            o.orderId === l.orderId &&
            ((o.triggerPrice !== l.price.toString() && o.price !== l.price.toString()) || o.qty !== l.qty?.toString()),
        );
        return index !== -1 ? currentOrders[index] : false;
      });

      let promises = changedLines.map((l) => {
        if (l.type === 'TP') {
          return apiClient.amendOrder({
            category: 'linear',
            symbol: symbol,
            orderId: l.orderId,
            qty: l.qty?.toString(),
            price: l.price.toString(),
          });
        }
        if (l.type === 'SL') {
          return apiClient.amendOrder({
            category: 'linear',
            symbol: symbol,
            orderId: l.orderId,
            qty: l.qty?.toString(),
            triggerPrice: l.price.toString(),
          });
        }
      });
      Promise.all(promises);

      // Remove Orders
      const removedOrder = currentOrders.filter((o) => {
        const index = chartLines.findIndex((l) => l.orderId === o.orderId);
        return index === -1 ? o : false;
      });

      promises = removedOrder.map((l) => {
        return apiClient.cancelOrder({
          category: 'linear',
          symbol: symbol,
          orderId: l.orderId,
        });
      });
      Promise.all(promises);

      // Create Orders
      /*       chartLines
        .filter((l) => !l.orderId && l.type !== 'ENTRY')
        .map((l) => {
          if (l.type === 'TP') {
            tradingService.addTakeProfit(currentPosition, l.price.toString());
          }
          if (l.type === 'SL') {
            tradingService.addStopLoss(currentPosition, l.price.toString());
          }
        }); */
    }, [chartLines]);

    useEffect(() => {
      dispatch(resetChartLines());

      if (currentPosition) {
        dispatch(
          addChartLine({
            type: 'ENTRY',
            side: currentPosition.side,
            price: Number(currentPosition.avgPrice),
            qty: Number(currentPosition.size),
            draggable: false,
          }),
        );

        // Create ChartLines from Orders
        currentOrders.forEach((o) => {
          if (o.orderType === 'Market') {
            if (!o.triggerPrice) {
              return;
            }
            dispatch(
              addChartLine({
                type: 'SL',
                side: currentPosition.side,
                price: Number(o.triggerPrice),
                qty: Number(o.qty),
                draggable: true,
                orderId: o.orderId,
              }),
            );
          }

          if (o.orderType === 'Limit') {
            dispatch(
              addChartLine({
                type: 'TP',
                side: currentPosition.side,
                price: Number(o.price),
                qty: Number(o.qty),
                draggable: true,
                orderId: o.orderId,
              }),
            );
          }
        });
      }
    }, [currentPosition]);

    return <WrappedComponent {...(props as P)} isLoading={isLoading} />;
  };

  return WithTradingControl;
}

export default withTradingControl;
