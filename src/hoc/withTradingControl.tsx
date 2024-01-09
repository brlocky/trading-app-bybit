import { AccountOrderV5, KlineIntervalV3, LinearInverseInstrumentInfoV5 } from 'bybit-api';
import React, { ComponentType, useEffect, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router';
import { toast } from 'react-toastify';
import { mapKlineToCandleStickData } from '../mappers';
import { useApi } from '../providers';
import {
  addRestingOrder,
  resetChartLines,
  selectCreateLimitOrder,
  selectCreateMarketOrder,
  selectChartLines,
  selectRestingOrders,
  setChartLines,
  setCreateLimitOrder,
  setCreateMarketOrder,
  updateLeverage,
  updatePositionSize,
  updateRestingOrder,
  removeRestingOrder,
} from '../slices';
import {
  selectCurrentOrders,
  selectCurrentPosition,
  selectFilledOrders,
  selectInterval,
  selectPositions,
  selectSymbol,
  updateExecutions,
  updateKlines,
  updateOrders,
  updatePositions,
  updateTickerInfo,
  updateWallet,
} from '../slices/symbolSlice';
import { AppDispatch } from '../store';
import { IChartLine } from '../types';
import { v4 as uuidv4 } from 'uuid';
import { TradingService } from '../services';
import { TradingLineType } from '../components/Chart/extend/plugins/trading-lines/state';

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
    const allPositions = useSelector(selectPositions);
    const currentPosition = useSelector(selectCurrentPosition);
    const chartLines = useSelector(selectChartLines);
    const createMarketOrder = useSelector(selectCreateMarketOrder);
    const createLimitOrder = useSelector(selectCreateLimitOrder);
    const restingOrders = useSelector(selectRestingOrders);
    const filledOrders = useSelector(selectFilledOrders);

    const currentOrdersRef = useRef<AccountOrderV5[]>(currentOrders);
    const currentSymbolRef = useRef<string>(symbol || '');
    const chartLinesRef = useRef<IChartLine[]>(chartLines);
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
      dispatch(resetChartLines());
    }, [symbol]);

    useEffect(() => {
      currentOrdersRef.current = currentOrders;

      const missingOrders = currentOrders.filter((o) => {
        return !chartLinesRef.current.find((l) => l.orderId === o.orderId);
      });

      const newLines: IChartLine[] = [];
      missingOrders.forEach((o) => {
        const restingOrder = restingOrders.find((r) => r.orderId === o.orderId);
        restingOrder?.chartLines.forEach((c) => {
          newLines.push(c);
        });
      });
      if (newLines.length) {
        const newChartLines = [...chartLinesRef.current.filter((l) => l.isServer), ...newLines];
        dispatch(setChartLines(newChartLines));
      }
    }, [currentOrders]);

    useEffect(() => {
      console.log('New filled orders', filledOrders);

      const newRestingOrders = [...restingOrders];
      filledOrders.filter((o) => {
        const index = newRestingOrders.findIndex((r) => r.orderId === o.orderId);
        if (index !== -1) {
          const restingOrder = newRestingOrders[index];
          newRestingOrders.splice(index, 1);

          const position = allPositions.find((p) => p.symbol === restingOrder.symbol && p.size === restingOrder.qty);
          if (position) {
            const stoplosses = restingOrder.chartLines
              .filter((l) => {
                return l.type === 'SL' && !l.isLive;
              })
              .map((l) => {
                return tradingService.addStopLoss(position, l.price.toString(), l.qty.toString());
              });

            const takeProfits = restingOrder.chartLines
              .filter((l) => {
                return l.type === 'TP' && !l.isLive;
              })
              .map((l) => {
                return tradingService.addTakeProfit(position, l.price.toString(), l.qty.toString());
              });

            Promise.all([...stoplosses, ...takeProfits]).then((allOrders) => {
              console.log('All Set', allOrders);
            });

            dispatch(removeRestingOrder(restingOrder.orderId));
          }
        }
      });
    }, [filledOrders, allPositions]);

    /**
     * Sync Position with chart line changes
     */
    useEffect(() => {
      chartLinesRef.current = chartLines;
      if (!symbol) return;

      // Update RestingOrder ChartLines
      const liveLimitOrder = chartLines.find((l) => l.type === 'ENTRY' && l.isServer && !l.isLive);
      const restingOrder = restingOrders.find((o) => o.orderId === liveLimitOrder?.orderId);
      if (restingOrder) {
        const newRestingOrders = { ...restingOrder, chartLines: [...chartLinesRef.current] };
        dispatch(updateRestingOrder(newRestingOrders));
      }

      // Close position
      if (currentPosition && !chartLines.find((l) => l.type === 'ENTRY' && l.isLive)) {
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
          if (o.orderId !== l.orderId) {
            return false;
          }
          const orderPrice = l.type == 'SL' ? o.triggerPrice : o.price;
          return o.orderId === l.orderId && (Number(orderPrice) !== l.price || Number(o.qty) !== l.qty);
        });
        return index !== -1 ? currentOrdersRef.current[index] : false;
      });

      // Update Orders
      const ammendOrders = changedLines.map((l) => {
        if (l.type !== 'SL') {
          return apiClient.amendOrder({
            category: 'linear',
            symbol: symbol,
            orderId: l.orderId,
            qty: l.qty.toString(),
            price: l.price.toString(),
          });
        }
        return apiClient.amendOrder({
          category: 'linear',
          symbol: symbol,
          orderId: l.orderId,
          qty: l.qty.toString(),
          triggerPrice: l.price.toString(),
        });
      });
      ammendOrders.length && Promise.all(ammendOrders);

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
      removeOrders.length &&
        Promise.all(removeOrders).then((r) => {
          console.log('All orders removed', removeOrders, r);
        });
    }, [chartLines]);

    /**
     * Sync Chart Lines with Current Position and Orders
     */
    useEffect(() => {
      if (currentPosition) {
        const newChartLines: IChartLine[] = [];
        const parentId = uuidv4();
        newChartLines.push({
          id: parentId,
          type: 'ENTRY',
          side: currentPosition.side,
          price: Number(currentPosition.avgPrice),
          qty: Number(currentPosition.size),
          draggable: false,
          isServer: true,
          isLive: true,
          parentId: '',
        });

        const isLong = currentPosition.side === 'Buy';

        // Create ChartLines from Orders
        currentOrdersRef.current.forEach((o) => {
          let orderType: TradingLineType = 'TP';
          if (isLong) {
            orderType = o.triggerDirection === 0 ? 'TP' : 'SL';
          } else {
            orderType = o.triggerDirection === 0 ? 'TP' : 'SL';
          }
          const price = orderType === 'SL' ? Number(o.triggerPrice) : Number(o.price);

          const order: IChartLine = {
            id: uuidv4(),
            type: orderType,
            side: currentPosition.side,
            price: price,
            qty: Number(o.qty),
            draggable: true,
            orderId: o.orderId,
            isServer: true,
            isLive: true,
            parentId: parentId,
          };

          newChartLines.push(order);
        });

        if (!checkLineDiffs(newChartLines, chartLinesRef.current)) {
          const keepNotArmedLines = chartLinesRef.current.filter((l) => !l.isServer);
          dispatch(setChartLines([...newChartLines, ...keepNotArmedLines]));
        }
      } else {
        const notLiveChartLines = chartLinesRef.current.filter((l) => !l.isLive);
        dispatch(setChartLines([...notLiveChartLines]));
      }
    }, [currentPosition]);

    const checkLineDiffs = (arr1: IChartLine[], arr2: IChartLine[]): boolean => {
      for (const obj1 of arr1) {
        const obj2 = arr2.find((obj2) => obj1.orderId === obj2.orderId);

        if (!obj2) {
          return false;
        }

        if (obj1.price !== obj2.price || obj1.qty !== obj2.qty || obj1.isServer !== obj2.isServer || obj1.isLive !== obj2.isLive) {
          return false;
        }
      }

      return true;
    };

    useEffect(() => {
      if (!createMarketOrder) {
        return;
      }

      const entry = createMarketOrder.chartLines.find((c) => c.type === 'ENTRY' && !c.isServer);
      if (!entry) {
        return;
      }

      tradingService
        .openPosition({
          symbol: createMarketOrder.symbol,
          qty: entry.qty.toString(),
          side: createMarketOrder.side,
          type: 'Market',
        })
        .then((position) => {
          if (position) {
            const stoplosses = createMarketOrder.chartLines
              .filter((l) => {
                return l.type === 'SL' && !l.isServer;
              })
              .map((l) => {
                return tradingService.addStopLoss(position, l.price.toString(), l.qty.toString());
              });

            const takeProfits = createMarketOrder.chartLines
              .filter((l) => {
                return l.type === 'TP' && !l.isServer;
              })
              .map((l) => {
                return tradingService.addTakeProfit(position, l.price.toString(), l.qty.toString());
              });

            Promise.all([...stoplosses, ...takeProfits]).then((allOrders) => {
              console.log('All Set', allOrders);
            });
          } else {
            console.log('Fail to create oreder', position);
          }
        })
        .catch((e) => {
          console.log('Error', e);
        });
      dispatch(setCreateMarketOrder(null));
    }, [createMarketOrder]);

    useEffect(() => {
      if (!createLimitOrder) {
        return;
      }

      const entry = createLimitOrder.chartLines.find((c) => c.type === 'ENTRY' && !c.isLive);
      if (!entry) {
        console.error('could not find limit order');
        return;
      }

      tradingService
        .openPosition({
          symbol: createLimitOrder.symbol,
          qty: entry.qty.toString(),
          side: createLimitOrder.side,
          type: 'Limit',
          price: entry.price.toString(),
        })
        .then((position) => {
          if (position) {
            // Find created position
            const order = currentOrdersRef.current.find(
              (o) =>
                o.symbol === createLimitOrder.symbol &&
                o.orderStatus === 'New' &&
                o.orderType === 'Limit' &&
                o.side === createLimitOrder.side &&
                o.qty === entry.qty.toString(),
            );

            if (!order) {
              console.error('Could not find Order');
              return;
            }
            const newEntry = { ...entry, orderId: order.orderId, isServer: true };
            const updatedChartLines = createLimitOrder.chartLines.map((l) => (l.type === 'ENTRY' ? newEntry : l));
            dispatch(
              addRestingOrder({
                orderId: newEntry.orderId,
                symbol: createLimitOrder.symbol,
                price: entry.price.toString(),
                qty: entry.qty.toString(),
                chartLines: updatedChartLines,
              }),
            );
          } else {
            console.log('Fail to create order', position);
          }
        })
        .catch((e) => {
          console.log('Error', e);
        });
      dispatch(setCreateLimitOrder(null));
    }, [createLimitOrder]);

    return <WrappedComponent {...(props as P)} isLoading={isLoading} />;
  };

  return WithTradingControl;
}

export default withTradingControl;
