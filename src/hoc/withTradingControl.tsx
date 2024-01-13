import { AccountOrderV5 } from 'bybit-api';
import React, { ComponentType, useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { v4 as uuidv4 } from 'uuid';
import { TradingLineSide } from '../components/Chart/extend/plugins/trading-lines/state';
import { AppDispatch } from '../store';
import { selectChartLines, setChartLines } from '../store/slices';
import { selectCurrentOrders, selectCurrentPosition, selectIsAppStarted } from '../store/slices/uiSlice';
import { IChartLine } from '../types';
import { getOrderPrice, getOrderType, isEntry } from '../utils/tradeUtils';

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
    const chartLines = useSelector(selectChartLines);
    const isAppStarted = useSelector(selectIsAppStarted);

    const currentOrdersRef = useRef<AccountOrderV5[]>(currentOrders);
    const chartLinesRef = useRef<IChartLine[]>(chartLines);
    const dispatch = useDispatch<AppDispatch>();

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
    }, [chartLines]);
    // Resting Orders Update and Trigger
    /* useEffect(() => {
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
    }, [filledOrders, allPositions]); */

    /**
     * Sync Current Position and Orders with Chart Lines
     */
    useEffect(() => {
      console.log('curren po', currentPosition)
      if (currentPosition) {
        const parentId = uuidv4();

        // ChartLines from Orders
        const newChartLines: IChartLine[] = currentOrdersRef.current
          .filter((o) => !isEntry(o))
          .map((o) => {
            const orderType = getOrderType(o);
            const price = getOrderPrice(o);
            return {
              id: uuidv4(),
              type: orderType,
              side: currentPosition.side as TradingLineSide,
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
      if (currentOrders.length) {
        console.log('as')
      }
      const lines2Remove = chartLinesRef.current.filter(
        (c) => c.isLive && c.type !== 'ENTRY' && !currentOrders.find((o) => o.orderId === c.orderId),
      );
      if (lines2Remove.length) {
        const newChartLines = [...chartLinesRef.current.filter((l) => !lines2Remove.find((r) => r.id === l.id))];
        dispatch(setChartLines(newChartLines));
      }

      /*       const missingOrders = currentOrders.filter((o) => {
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
      } */
    }, [currentOrders]);
    return <WrappedComponent {...(props as P)} />;
  };

  return WithTradingControl;
}

export default withTradingControl;
