import { PositionV5 } from 'bybit-api';
import React, { ComponentType, useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useApi } from '../providers';
import { TradingService } from '../services';
import { AppDispatch } from '../store';
import { loadAllChartLines } from '../store/actions';
import { IRestingOrder, removeRestingOrder, selectChartLines, selectRestingOrders, setChartLines } from '../store/slices';
import { selectCurrentPositionAndOrders, selectFilledOrders, selectIsAppStarted, selectPositions } from '../store/slices/uiSlice';
import { IChartLine } from '../types';

export interface WithTradingControlProps {
  isLoading: boolean;
  symbol?: string;
  interval?: string;
}

function withTradingControl<P extends WithTradingControlProps>(
  WrappedComponent: ComponentType<P>,
): React.FC<Omit<P, keyof WithTradingControlProps>> {
  const WithTradingControl: React.FC<Omit<P, keyof WithTradingControlProps>> = (props) => {
    const { currentPosition, currentOrders } = useSelector(selectCurrentPositionAndOrders);

    const allPositions = useSelector(selectPositions);
    const filledOrders = useSelector(selectFilledOrders);
    const chartLines = useSelector(selectChartLines);
    const allRestingOrders = useSelector(selectRestingOrders);
    const isAppStarted = useSelector(selectIsAppStarted);

    const allPositionsRef = useRef<PositionV5[]>(allPositions);
    const restingOrdersRef = useRef<IRestingOrder[]>(allRestingOrders);
    const chartLinesRef = useRef<IChartLine[]>(chartLines);
    const dispatch = useDispatch<AppDispatch>();
    const apiClient = useApi();
    const tradingService = TradingService(apiClient);

    useEffect(() => {
      chartLinesRef.current = [...chartLines];
      allPositionsRef.current = [...allPositions];
      restingOrdersRef.current = [...allRestingOrders];
    }, [chartLines, allPositions, allRestingOrders]);

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
          console.log('Load ok', allOrders);
        });

        dispatch(removeRestingOrder(restingOrder.orderId));
      }
    }, [filledOrders, allPositions]);

    /**
     * Sync Current Position and Orders with Chart Lines
     */
    useEffect(() => {
      if (!isAppStarted) return;
      if (currentPosition) {
        dispatch(loadAllChartLines(currentPosition.symbol));
      } else {
        const notLiveChartLines = chartLinesRef.current.filter((l) => !l.isLive);
        dispatch(setChartLines([...notLiveChartLines]));
      }
    }, [currentPosition]);

    // Remove chart lines from removed orders
    useEffect(() => {
      if (!isAppStarted) return;
      const lines2Remove = chartLinesRef.current.filter(
        (c) => c.isLive && c.type !== 'ENTRY' && !currentOrders.find((o) => o.orderId === c.orderId),
      );

      if (!lines2Remove.length) return;
      dispatch(setChartLines([...chartLinesRef.current.filter((l) => !lines2Remove.find((r) => r.id === l.id))]));
    }, [currentOrders]);

    return <WrappedComponent {...(props as P)} />;
  };

  return WithTradingControl;
}

export default withTradingControl;
