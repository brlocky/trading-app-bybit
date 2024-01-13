import { AccountOrderV5, PositionV5 } from 'bybit-api';
import React, { ComponentType, useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { v4 as uuidv4 } from 'uuid';
import { TradingLineSide } from '../components/Chart/extend/plugins/trading-lines/state';
import { AppDispatch } from '../store';
import { IRestingOrder, removeRestingOrder, selectChartLines, selectRestingOrders, setChartLines } from '../store/slices';
import { selectCurrentOrders, selectCurrentPosition, selectFilledOrders, selectPositions } from '../store/slices/uiSlice';
import { IChartLine } from '../types';
import { getOrderPrice, getOrderType, isEntryLimitOrder } from '../utils/tradeUtils';
import { TradingService } from '../services';
import { useApi } from '../providers';

export interface WithTradingControlProps {
  isLoading: boolean;
  symbol?: string;
  interval?: string;
}

function withTradingControl<P extends WithTradingControlProps>(
  WrappedComponent: ComponentType<P>,
): React.FC<Omit<P, keyof WithTradingControlProps>> {
  const WithTradingControl: React.FC<Omit<P, keyof WithTradingControlProps>> = (props) => {
    const currentOrders = useSelector(selectCurrentOrders);
    const currentPosition = useSelector(selectCurrentPosition);
    const allPositions = useSelector(selectPositions);
    const filledOrders = useSelector(selectFilledOrders);
    const chartLines = useSelector(selectChartLines);
    const restingOrders = useSelector(selectRestingOrders);

    const currentOrdersRef = useRef<AccountOrderV5[]>(currentOrders);
    const allPositionsRef = useRef<PositionV5[]>(allPositions);
    const restingOrdersRef = useRef<IRestingOrder[]>(restingOrders);
    const chartLinesRef = useRef<IChartLine[]>(chartLines);
    const dispatch = useDispatch<AppDispatch>();
    const apiClient = useApi();
    const tradingService = TradingService(apiClient);

    interface IOrderDiff {
      count: number;
      diff: {
        added: AccountOrderV5[];
        removed: AccountOrderV5[];
        updated: AccountOrderV5[];
      };
    }

    const getOrdersDiff = (arr1: AccountOrderV5[], arr2: AccountOrderV5[]): IOrderDiff => {
      const result: IOrderDiff = {
        count: 0,
        diff: {
          added: [],
          removed: [],
          updated: [],
        },
      };

      for (const obj1 of arr1) {
        const obj2 = arr2.find((obj2) => obj1.orderId === obj2.orderId);

        if (!obj2) {
          result.count++;
          result.diff.removed.push(obj1);
        } else if (obj1.price !== obj2.price || obj1.qty !== obj2.qty) {
          result.count + result.diff.updated.push(obj1);
        }
      }

      for (const obj2 of arr2) {
        const obj1 = arr1.find((obj1) => obj1.orderId === obj2.orderId);

        if (!obj1) {
          result.count++;
          result.diff.added.push(obj2);
        }
      }

      return result;
    };

    useEffect(() => {
      chartLinesRef.current = [...chartLines];
      allPositionsRef.current = [...allPositions];
      restingOrdersRef.current = [...restingOrders];
    }, [chartLines, allPositions, restingOrders]);

    // Resting Orders Update and Trigger
    useEffect(() => {
      if (!restingOrdersRef.current.length) return;

      for (const o of filledOrders) {
        const index = restingOrdersRef.current.findIndex((r) => r.orderId === o.orderId);
        if (index === -1) continue;

        const restingOrder = restingOrdersRef.current[index];
        const position = allPositionsRef.current.find((p) => p.symbol === o.symbol && p.side === o.side);
        if (!position) {
          continue;
        }

        const stoplosses = restingOrder.chartLines
          .filter((l) => l.type === 'SL')
          .map((l) => {
            return tradingService.addStopLoss(position.symbol, l);
          });

        const takeProfits = restingOrder.chartLines
          .filter((l) => l.type === 'TP')
          .map((l) => {
            return tradingService.addTakeProfit(position.symbol, l);
          });

        Promise.all([...stoplosses, ...takeProfits]).then((allOrders) => {
          console.log('All Set', allOrders);
        });

        dispatch(removeRestingOrder(restingOrder.orderId));
      }
    }, [filledOrders, allPositions]);

    /**
     * Sync Current Position and Orders with Chart Lines
     */
    useEffect(() => {
      if (currentPosition) {
        const parentId = uuidv4();

        // ChartLines from Orders
        const newChartLines: IChartLine[] = currentOrdersRef.current
          .filter((o) => !isEntryLimitOrder(o))
          .map((o) => {
            const orderType = getOrderType(o);
            const price = getOrderPrice(o);
            return {
              id: uuidv4(),
              type: orderType,
              side: currentPosition.side === 'Buy' ? 'Sell' : 'Buy',
              price: price,
              qty: Number(o.qty),
              draggable: true,
              orderId: o.orderId,
              isServer: true,
              isLive: true,
              parentId: parentId,
            };
          });

        const newEntry: IChartLine = {
          id: parentId,
          type: 'ENTRY',
          side: currentPosition.side as TradingLineSide,
          price: Number(currentPosition.avgPrice),
          qty: Number(currentPosition.size),
          draggable: false,
          isServer: true,
          isLive: true,
          parentId: 'ENTRY',
        };
        newChartLines.push(newEntry);

        if (!checkLineDiffs(newChartLines, chartLinesRef.current)) {
          const chartLineEntry = chartLinesRef.current.find(
            (e) => e.type === 'ENTRY' && e.side === newEntry.side && e.price === newEntry.price && e.qty === newEntry.qty,
          );

          if (chartLineEntry) {
            // Replace chartlines with new Opened position lines
            const finalChartLines = [
              ...chartLinesRef.current.filter((c) => c.id !== chartLineEntry.id && c.parentId !== chartLineEntry.id),
              ...newChartLines,
            ];
            dispatch(setChartLines(finalChartLines));
          } else {
            const existentEntry = chartLinesRef.current.find((e) => e.type === 'ENTRY' && e.side === newEntry.side && e.isLive);
            if (existentEntry) {
              // Replace Existent Entry with new one
              const finalChartLines = [...chartLinesRef.current.filter((c) => c.id !== existentEntry.id), ...newChartLines];
              dispatch(setChartLines(finalChartLines));
            } else {
              // Add Order new entry
              dispatch(setChartLines([...newChartLines, ...chartLinesRef.current]));
            }
          }
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
      currentOrdersRef.current = currentOrders;

      const lines2Remove = chartLinesRef.current.filter(
        (c) => c.isLive && c.type !== 'ENTRY' && !currentOrders.find((o) => o.orderId === c.orderId),
      );

      const missingChartLines = currentOrders.filter((o) => {
        return !chartLinesRef.current.find((l) => l.orderId === o.orderId);
      });

      const newLines: IChartLine[] = [];
      missingChartLines.forEach((o) => {
        const restingOrder = restingOrders.find((r) => r.orderId === o.orderId);
        restingOrder?.chartLines.forEach((c) => {
          const l = { ...c, isServer: c.type === 'ENTRY' };
          newLines.push(l);
        });
      });

      if (!newLines.length && !lines2Remove.length) return;

      dispatch(setChartLines([...chartLinesRef.current.filter((l) => !lines2Remove.find((r) => r.id === l.id)), ...newLines]));
    }, [currentOrders]);

    return <WrappedComponent {...(props as P)} />;
  };

  return WithTradingControl;
}

export default withTradingControl;
