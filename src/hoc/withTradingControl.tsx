import { AccountOrderV5, KlineIntervalV3, LinearInverseInstrumentInfoV5 } from 'bybit-api';
import React, { ComponentType, useEffect, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router';
import { toast } from 'react-toastify';
import { mapKlineToCandleStickData } from '../mappers';
import { useApi } from '../providers';
import { resetChartLines, selectLines, setChartLines, updateLeverage, updatePositionSize } from '../slices';
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
import { IChartLine, IChartLineType } from '../types';
import { v4 as uuidv4 } from 'uuid';

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

    const currentOrdersRef = useRef<AccountOrderV5[]>(currentOrders);
    const currentSymbolRef = useRef<string>(symbol || '');
    const apiClient = useApi(); // Use the useApi hook to access the API context
    const dispatch = useDispatch<AppDispatch>();
    const navigate = useNavigate();

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

      if (currentSymbolRef.current !== symbol) {
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
      }

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
      currentSymbolRef.current = symbol;
    }, [symbol, interval]);

    useEffect(() => {
      currentOrdersRef.current = currentOrders;
    }, [currentOrders]);

    /**
     * Sync Position with chart line changes
     */
    useEffect(() => {
      if (!symbol || !currentPosition) return;

      // Close position
      if (currentPosition && !chartLines.find((l) => l.type === 'ENTRY')) {
        const promise = apiClient.submitOrder({
          category: 'linear',
          symbol: currentPosition.symbol,
          side: currentPosition.side === 'Buy' ? 'Sell' : 'Buy',
          orderType: 'Market',
          qty: currentPosition.size,
        });
        Promise.all([promise]);
        return;
      }

      // Find changed orders
      const changedLines = chartLines.filter((l) => {
        const index = currentOrdersRef.current.findIndex((o) => {
          return o.orderId === l.orderId && (Number(o.triggerPrice) !== l.price || Number(o.qty) !== l.qty);
        });
        return index !== -1 ? currentOrdersRef.current[index] : false;
      });

      // Update Orders
      const ammendOrders = changedLines.map((l) => {
        return apiClient.amendOrder({
          category: 'linear',
          symbol: symbol,
          orderId: l.orderId,
          qty: l.qty.toString(),
          triggerPrice: l.price.toString(),
        });
      });
      Promise.all(ammendOrders);

      // Remove Orders
      const removedOrder = currentOrdersRef.current.filter((o) => {
        const index = chartLines.findIndex((l) => l.orderId === o.orderId);
        return index === -1 ? o : false;
      });

      const removeOrders = removedOrder.map((l) => {
        return apiClient.cancelOrder({
          category: 'linear',
          symbol: symbol,
          orderId: l.orderId,
        });
      });
      Promise.all(removeOrders);
    }, [chartLines]);

    /**
     * Sync Chart Lines with Current Position and Orders
     */
    useEffect(() => {
      dispatch(resetChartLines());

      if (currentPosition) {
        const newChartLines: IChartLine[] = [];
        newChartLines.push({
          id: uuidv4(),
          type: 'ENTRY',
          side: currentPosition.side,
          price: Number(currentPosition.avgPrice),
          qty: Number(currentPosition.size),
          draggable: false,
          isServer: true,
        });

        const isLong = currentPosition.side === 'Buy';

        // Create ChartLines from Orders
        currentOrdersRef.current.forEach((o) => {
          let orderType: IChartLineType = 'TP';
          if (isLong) {
            orderType = o.triggerDirection === 1 ? 'TP' : 'SL';
          } else {
            orderType = o.triggerDirection === 2 ? 'TP' : 'SL';
          }

          const order: IChartLine = {
            id: uuidv4(),
            type: orderType,
            side: currentPosition.side,
            price: Number(o.triggerPrice),
            qty: Number(o.qty),
            draggable: true,
            orderId: o.orderId,
            isServer: true,
          };

          newChartLines.push(order);
        });

        dispatch(setChartLines(newChartLines));
      }
    }, [currentPosition]);

    return <WrappedComponent {...(props as P)} isLoading={isLoading} />;
  };

  return WithTradingControl;
}

export default withTradingControl;
