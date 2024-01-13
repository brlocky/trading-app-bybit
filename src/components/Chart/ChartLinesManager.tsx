import { AccountOrderV5, OrderSideV5, PositionV5 } from 'bybit-api';
import { IChartApi, ISeriesApi, SeriesType } from 'lightweight-charts';
import React, { useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { toast } from 'react-toastify';
import { useApi } from '../../providers';
import { IOrderOptionsSettingsData, RiskManagementService, TradingService } from '../../services';
import { AppDispatch } from '../../store';
import { createLimitOrder } from '../../store/actions';
import {
  IRestingOrder,
  SubTicker,
  addChartLine,
  removeChartLine,
  removeRestingOrder,
  selectChartLines,
  selectCurrentOrders,
  selectCurrentPosition,
  selectOrderSettings,
  selectPositionSize,
  selectRestingOrders,
  selectSymbol,
  selectTicker,
  setChartLines,
  updateRestingOrder,
} from '../../store/slices';
import { IChartLine } from '../../types';
import { TradingLineInfo, TradingLinedDragInfo } from './extend/plugins/trading-lines/state';
import { TradingLines } from './extend/plugins/trading-lines/trading-lines';

interface Props {
  chartInstance: IChartApi;
  seriesInstance: ISeriesApi<SeriesType>;
}

export const ChartLinesManager: React.FC<Props> = ({ seriesInstance }) => {
  const chartLines = useSelector(selectChartLines);
  const currentPosition = useSelector(selectCurrentPosition);
  const currentOrders = useSelector(selectCurrentOrders);
  const symbol = useSelector(selectSymbol);
  const orderSettings = useSelector(selectOrderSettings);
  const ticker = useSelector(selectTicker);
  const positionSize = useSelector(selectPositionSize);
  const restingOrders = useSelector(selectRestingOrders);
  const linePluginRef = useRef<TradingLines>(new TradingLines());
  const chartLinesRef = useRef<IChartLine[]>(chartLines);
  const currentPositionRef = useRef<PositionV5 | undefined>(currentPosition);
  const currentOrdersRef = useRef<AccountOrderV5[]>(currentOrders);
  const orderSettingsRef = useRef<IOrderOptionsSettingsData>(orderSettings);
  const restingOrdersRef = useRef<IRestingOrder[]>(restingOrders);
  const tickerRef = useRef<SubTicker | undefined>(ticker);
  const dispatch = useDispatch<AppDispatch>();
  const apiClient = useApi();
  const riskManagementService = RiskManagementService();
  const tradingService = TradingService(apiClient);

  useEffect(() => {
    seriesInstance.attachPrimitive(linePluginRef.current);

    linePluginRef.current.lineDragged().subscribe(dispatchChartLineUpdate, this);
    linePluginRef.current.linesDragged().subscribe(dispatchChartLinesUpdate, this);
    linePluginRef.current.lineRemoved().subscribe(dispatchChartLineRemoved, this);
    linePluginRef.current.tpAdded().subscribe(dispatchAddTPSL, this);
    linePluginRef.current.slAdded().subscribe(dispatchAddTPSL, this);
    linePluginRef.current.beAdded().subscribe(dispatchAddBE, this);
    linePluginRef.current.splitAdded().subscribe(dispatchSplitOrder, this);
    linePluginRef.current.sendAdded().subscribe(dispatchAddSend, this);

    setupChartLines();
    return () => {
      linePluginRef.current?.lineDragged().unsubscribe(dispatchChartLineUpdate);
      linePluginRef.current?.linesDragged().unsubscribe(dispatchChartLinesUpdate);
      linePluginRef.current?.lineRemoved().unsubscribe(dispatchChartLineRemoved);
      linePluginRef.current?.tpAdded().unsubscribe(dispatchAddTPSL);
      linePluginRef.current?.slAdded().unsubscribe(dispatchAddTPSL);
      linePluginRef.current?.beAdded().unsubscribe(dispatchAddBE);
      linePluginRef.current?.splitAdded().unsubscribe(dispatchSplitOrder);
      linePluginRef.current?.sendAdded().unsubscribe(dispatchAddSend);
    };
  }, []);

  useEffect(() => {
    chartLinesRef.current = [...chartLines];
    setupChartLines();
  }, [chartLines]);

  useEffect(() => {
    currentPositionRef.current = currentPosition;
    currentOrdersRef.current = currentOrders;
    orderSettingsRef.current = orderSettings;
    restingOrdersRef.current = restingOrders;
    if (ticker && ticker.ticker && ticker !== tickerRef.current && ticker.ticker.lastPrice) {
      linePluginRef.current?.setMarketPrice(Number(ticker.ticker.lastPrice));
    }
    tickerRef.current = ticker;
  }, [currentPosition, currentOrders, orderSettings, ticker, restingOrders]);

  useEffect(() => {
    if (!ticker || !ticker.tickerInfo) return;
    const entries = chartLinesRef.current.filter((c) => c.type === 'ENTRY' && !c.isServer);
    if (entries.length === 1) {
      const entry = entries[0];
      const entryTPChildren = chartLinesRef.current.filter((c) => c.parentId === entry.id && c.type === 'TP');
      const entrySLChildren = chartLinesRef.current.filter((c) => c.parentId === entry.id && c.type === 'SL');
      const allOtherLines = chartLinesRef.current.filter((c) => c.parentId !== entry.id && c.id !== entry.id);

      const updatedChartlines = riskManagementService.convertToPositionSize(
        entry,
        entryTPChildren,
        entrySLChildren,
        positionSize,
        ticker.tickerInfo.lotSizeFilter.qtyStep,
      );

      dispatch(setChartLines([...allOtherLines, ...updatedChartlines]));
    }
  }, [positionSize]);

  interface IChartLineDiff {
    added: IChartLine[];
    removed: IChartLine[];
    updated: IChartLine[];
  }

  const getChartLinesDiff = (arr1: IChartLine[], arr2: IChartLine[]): IChartLineDiff => {
    const result: IChartLineDiff = {
      added: [],
      removed: [],
      updated: [],
    };

    for (const obj1 of arr1) {
      const obj2 = arr2.find((obj2) => obj1.id === obj2.id);

      if (!obj2) {
        result.removed.push(obj1);
      } else if (obj1.price !== obj2.price || obj1.qty !== obj2.qty) {
        result.updated.push(obj1);
      }
    }

    for (const obj2 of arr2) {
      const obj1 = arr1.find((obj1) => obj1.id === obj2.id);

      if (!obj1) {
        result.added.push(obj2);
      }
    }

    return result;
  };

  // Update ChartLine
  const dispatchChartLineUpdate = async (lineDragInfo: TradingLinedDragInfo) => {
    const lineToUpdate = chartLinesRef.current.find((l) => l.id === lineDragInfo.to.id);

    if (!lineToUpdate) {
      return;
    }

    const needToSync = lineToUpdate.isServer && lineToUpdate.orderId;
    const canUpdateLines = !needToSync
      ? true
      : await tradingService.amendOrder({
          symbol,
          type: lineToUpdate.type,
          orderId: lineToUpdate.orderId as string,
          qty: lineToUpdate.qty.toString(),
          price: lineDragInfo.to.price.toString(),
        });

    if (!canUpdateLines) {
      linePluginRef.current?.updateLine(lineDragInfo.from.id, lineDragInfo.from);
      return;
    }

    // Update TP and SL of Live Limit Orders
    const restingOrder = restingOrdersRef.current.find((o) => o.chartLines.find((l) => l.id === lineToUpdate.id));
    if (restingOrder) {
      dispatch(
        updateRestingOrder({
          ...restingOrder,
          chartLines: restingOrder.chartLines.map((l) => {
            if (l.id === lineToUpdate.id) return { ...l, price: lineDragInfo.to.price };
            return l;
          }),
        }),
      );
    }

    const updatedLines = chartLinesRef.current.map((l) => (l.id === lineDragInfo.to.id ? { ...l, price: lineDragInfo.to.price } : l));

    dispatch(setChartLines(updatedLines));
  };

  // Use for limit order when moving several lines at the same time
  const dispatchChartLinesUpdate = async (lineDragsInfo: TradingLinedDragInfo[]) => {
    const currentChartLines = [...chartLinesRef.current];
    const changedLines: IChartLine[] = [];
    lineDragsInfo.forEach((dragInfo) => {
      const lineIndex = chartLinesRef.current.findIndex((l) => l.id === dragInfo.to.id);
      if (lineIndex !== -1) {
        const changedLine = { ...chartLinesRef.current[lineIndex], price: dragInfo.to.price };
        currentChartLines[lineIndex] = changedLine;
        changedLines.push(changedLine);
      } else {
        console.error('could not find it');
      }
    });

    // Resting Orders Update
    if (changedLines.length) {
      const limitOrderEntry = changedLines.find((l) => l.type === 'ENTRY' && !l.isLive);
      if (limitOrderEntry) {
        const restingOrder = restingOrdersRef.current.find((o) => o.orderId === limitOrderEntry.orderId);
        if (restingOrder) {
          await tradingService.amendOrder({
            symbol,
            type: limitOrderEntry.type,
            orderId: limitOrderEntry.orderId as string,
            qty: limitOrderEntry.qty.toString(),
            price: limitOrderEntry.price.toString(),
          });

          dispatch(
            updateRestingOrder({
              ...restingOrder,
              chartLines: changedLines,
            }),
          );
        }
      }
    }

    dispatch(setChartLines(currentChartLines));
  };

  // Remove Chart Line
  const dispatchChartLineRemoved = async (line: TradingLineInfo) => {
    const chartLine = chartLinesRef.current.find((l) => l.id === line.id);
    if (!chartLine || !symbol) return;

    dispatch(removeChartLine(line.id));

    // Close Server Trades

    if (chartLine.type === 'ENTRY') {
      if (chartLine.isLive) {
        // Close Live Position
        await tradingService.closePosition({
          symbol,
          side: chartLine.side,
          qty: chartLine.qty.toString(),
        });
      }

      if (!chartLine.isLive && chartLine.isServer && chartLine.orderId) {
        await tradingService.closeOrder({
          symbol,
          orderId: chartLine.orderId,
        });
        // Remove resting order
        chartLine.orderId && dispatch(removeRestingOrder(chartLine.orderId));
      }
    }

    if (line.type !== 'ENTRY' && chartLine.orderId) {
      await tradingService.closeOrder({
        symbol,
        orderId: chartLine.orderId,
      });
    }

    // Remove childrens when type is Entry
    if (line.type === 'ENTRY') {
      const lines2Delete = chartLinesRef.current.filter((l) => l.parentId === line.id);
      lines2Delete.forEach((l) => {
        dispatch(removeChartLine(l.id));
      });
    }
  };

  // Add TP and SL to Chart Lines
  const dispatchAddTPSL = async (line: TradingLineInfo) => {
    if (!tickerRef.current || !tickerRef.current.ticker || !tickerRef.current.tickerInfo) return;

    const entry = chartLinesRef.current.find((c) => c.id === line.parentId && c.type === 'ENTRY');
    if (!entry) return;

    const chartLine = riskManagementService.getTPSLLine(entry, line, tickerRef.current);
    if (!chartLine) return;

    const position = currentPositionRef.current;
    const needToSync = entry.isLive && position;
    if (needToSync) {
      line.type === 'TP' ? await tradingService.addTakeProfit(symbol, line) : await tradingService.addStopLoss(symbol, line);
    } else {
      dispatch(addChartLine(chartLine));
    }
  };

  // TODO move to service or action
  const dispatchSplitOrder = async (line: TradingLineInfo) => {
    const orders = currentOrdersRef.current;
    if (!tickerRef.current || !tickerRef.current.ticker || !tickerRef.current.tickerInfo) return;
    const chartLine = chartLinesRef.current.find((c) => c.id === line.id);
    if (!chartLine) return;

    const newLines = riskManagementService.splitOrder(line, tickerRef.current);
    if (newLines.length !== 2) {
      toast.error('Cannot Split order probably already using lowest size');
      return;
    }

    if (chartLine.isLive && chartLine.orderId) {
      const order = orders.find((o) => o.orderId === chartLine.orderId);
      if (!order) return;

      const orderClosed = await tradingService.closeOrder(order);
      if (orderClosed) {
        const [order1, order2] = newLines;
        if (line.type === 'TP') {
          await tradingService.addTakeProfit(symbol, order1);
          await tradingService.addTakeProfit(symbol, order2);
        }

        if (line.type === 'SL') {
          await tradingService.addStopLoss(symbol, order1);
          await tradingService.addStopLoss(symbol, order2);
        }
      }
    } else {
      const newChartLines = chartLinesRef.current.filter((c) => c.id !== line.id).concat(newLines);
      dispatch(setChartLines(newChartLines));
    }
  };

  const dispatchAddSend = (line: TradingLineInfo) => {
    if (!chartLinesRef.current) return;

    const tradeChartLines = chartLinesRef.current.filter((c) => c.id === line.id || c.parentId === line.id);
    if (!tradeChartLines.length) return;
    dispatch(
      createLimitOrder(apiClient, {
        side: line.side as OrderSideV5,
        symbol: symbol,
        chartLines: tradeChartLines,
      }),
    );
    dispatch(setChartLines([...chartLinesRef.current.filter((l) => !tradeChartLines.find((c) => c.id === l.id))]));
  };

  const dispatchAddBE = () => {
    if (!symbol) return;
    console.log('add be');
  };

  const setupChartLines = () => {
    const currentPluginLines = linePluginRef.current.lines();

    const lines2Delete = currentPluginLines.filter((l) => {
      return !chartLinesRef.current.find((c) => c.id === l.id);
    });

    const lines2Add = chartLinesRef.current.filter((l) => {
      return !currentPluginLines.find((c) => c.id === l.id);
    });

    const lines2Update = chartLinesRef.current.filter((l) => {
      return !lines2Delete.find((c) => c.id === l.id) && !lines2Add.find((c) => c.id === l.id);
    });

    // Delete Lines
    lines2Delete.forEach((l) => linePluginRef.current?.removeLine(l.id));
    lines2Add.length && linePluginRef.current.setLines(lines2Add);
    lines2Update.length && lines2Update.forEach((l) => linePluginRef.current?.updateLine(l.id, l));

    linePluginRef.current.updateAllViews();
  };

  return null; // Since this component doesn't render anything, we return null
};
