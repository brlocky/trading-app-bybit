import { AccountOrderV5, OrderSideV5, PositionV5 } from 'bybit-api';
import { IChartApi, ISeriesApi, SeriesType } from 'lightweight-charts';
import React, { useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useApi } from '../../providers';
import { IOrderOptionsSettingsData, RiskManagementService, TradingService } from '../../services';
import {
  SubTicker,
  addChartLines,
  removeChartLine,
  selectCurrentOrders,
  selectCurrentPosition,
  selectChartLines,
  selectOrderSettings,
  selectSymbol,
  selectTicker,
  setChartLines,
  setCreateLimitOrder,
} from '../../slices';
import { IChartLine } from '../../types';
import { TradingLineInfo, TradingLinedDragInfo } from './extend/plugins/trading-lines/state';
import { TradingLines } from './extend/plugins/trading-lines/trading-lines';

interface LineControlManagerProps {
  chartInstance: IChartApi;
  seriesInstance: ISeriesApi<SeriesType>;
}

export const TradeControlManager: React.FC<LineControlManagerProps> = ({ seriesInstance }) => {
  const chartLines = useSelector(selectChartLines);
  const currentPosition = useSelector(selectCurrentPosition);
  const currentOrders = useSelector(selectCurrentOrders);
  const symbol = useSelector(selectSymbol);
  const orderSettings = useSelector(selectOrderSettings);
  const ticker = useSelector(selectTicker);

  const linePluginRef = useRef<TradingLines | undefined>(undefined);
  const chartLinesRef = useRef<IChartLine[]>(chartLines);
  const currentPositionRef = useRef<PositionV5 | undefined>(currentPosition);
  const currentOrdersRef = useRef<AccountOrderV5[]>(currentOrders);
  const orderSettingsRef = useRef<IOrderOptionsSettingsData>(orderSettings);
  const tickerRef = useRef<SubTicker | undefined>(ticker);
  const riskManagementService = RiskManagementService();
  const dispatch = useDispatch();
  const apiClient = useApi();
  const tradingService = TradingService(apiClient);

  useEffect(() => {
    linePluginRef.current = new TradingLines();
    seriesInstance.attachPrimitive(linePluginRef.current);

    linePluginRef.current.lineDragged().subscribe(dispatchChartLineUpdate, this);
    linePluginRef.current.linesDragged().subscribe(dispatchChartLinesUpdate, this);
    linePluginRef.current.lineRemoved().subscribe(dispatchChartLineRemoved, this);
    linePluginRef.current.tpAdded().subscribe(dispatchAddTP, this);
    linePluginRef.current.slAdded().subscribe(dispatchAddSL, this);
    linePluginRef.current.beAdded().subscribe(dispatchAddBE, this);
    linePluginRef.current.splitAdded().subscribe(dispatchSplitOrder, this);
    linePluginRef.current.sendAdded().subscribe(dispatchAddSend, this);

    setupChartLines();
    return () => {
      linePluginRef.current?.lineDragged().unsubscribe(dispatchChartLineUpdate);
      linePluginRef.current?.linesDragged().unsubscribe(dispatchChartLinesUpdate);
      linePluginRef.current?.lineRemoved().unsubscribe(dispatchChartLineRemoved);
      linePluginRef.current?.tpAdded().unsubscribe(dispatchAddTP);
      linePluginRef.current?.slAdded().unsubscribe(dispatchAddSL);
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
    if (ticker && ticker.ticker && ticker !== tickerRef.current && ticker.ticker.lastPrice) {
      linePluginRef.current?.setMarketPrice(Number(ticker.ticker.lastPrice));
    }
    tickerRef.current = ticker;
  }, [currentPosition, currentOrders, orderSettings, ticker]);

  const dispatchChartLineUpdate = (lineDragInfo: TradingLinedDragInfo) => {
    const lineIndex = chartLinesRef.current.findIndex((l) => l.id === lineDragInfo.to.id);
    if (lineIndex !== -1) {
      const changedLine = { ...chartLinesRef.current[lineIndex] };
      const newLines = [...chartLinesRef.current];
      changedLine.price = lineDragInfo.to.price;
      newLines[lineIndex] = changedLine;
      dispatch(setChartLines(newLines));
    }
  };

  const dispatchChartLinesUpdate = (lineDragsInfo: TradingLinedDragInfo[]) => {
    const currentChartLines = [...chartLinesRef.current];
    lineDragsInfo.forEach((dragInfo) => {
      const lineIndex = chartLinesRef.current.findIndex((l) => l.id === dragInfo.to.id);
      if (lineIndex !== -1) {
        const changedLine = { ...chartLinesRef.current[lineIndex] };
        changedLine.price = dragInfo.to.price;
        currentChartLines[lineIndex] = changedLine;
      } else {
        console.error('could not find it');
      }
    });
    dispatch(setChartLines(currentChartLines));
  };

  const dispatchChartLineRemoved = (line: TradingLineInfo) => {
    dispatch(removeChartLine(line.id));
    if (line.type === 'ENTRY') {
      const lines2Delete = chartLinesRef.current.filter((l) => l.parentId === line.id);
      lines2Delete.forEach((l) => {
        dispatch(removeChartLine(l.id));
      });
    }
  };

  const dispatchAddTP = () => {
    if (!symbol) return;
    const position = currentPositionRef.current;
    const orders = currentOrdersRef.current;
    if (!position || !tickerRef.current || !tickerRef.current.ticker || !tickerRef.current.tickerInfo) return;
    const chartLine = riskManagementService.getTPLine(position, orders, tickerRef.current);
    if (!chartLine) {
      return;
    }

    tradingService.addTakeProfit(position, chartLine.price.toString(), chartLine.qty.toString());
  };

  const dispatchAddSL = () => {
    if (!symbol) return;
    const position = currentPositionRef.current;
    const orders = currentOrdersRef.current;
    if (!position || !tickerRef.current || !tickerRef.current.ticker || !tickerRef.current.tickerInfo) return;
    const chartLine = riskManagementService.getSLLine(position, orders, tickerRef.current);
    if (!chartLine) {
      return;
    }

    tradingService.addStopLoss(position, chartLine.price.toString(), chartLine.qty.toString());
  };

  const dispatchSplitOrder = (line: TradingLineInfo) => {
    if (!symbol) return;
    const orders = currentOrdersRef.current;
    if (!tickerRef.current || !tickerRef.current.ticker || !tickerRef.current.tickerInfo) return;
    const chartLine = chartLinesRef.current.find((c) => c.id === line.id);
    if (!chartLine) return;

    const newLines = riskManagementService.splitOrder(line, tickerRef.current);

    if (line.isLive) {
      const position = currentPositionRef.current;
      const order = orders.find((o) => o.orderId === chartLine.orderId);

      if (!position || !order) return;

      tradingService.closeOrder(order).then(() => {
        newLines.forEach((l) => {
          if (line.type === 'TP') {
            tradingService.addTakeProfit(position, l.price.toString(), l.qty.toString());
          }

          if (line.type === 'SL') {
            tradingService.addStopLoss(position, l.price.toString(), l.qty.toString());
          }
        });
      });
    } else {
      dispatch(removeChartLine(line.id));
      dispatch(addChartLines(newLines));
    }
  };
  const dispatchAddSend = (line: TradingLineInfo) => {
    if (!symbol || !chartLinesRef.current) return;

    dispatch(
      setCreateLimitOrder({
        side: line.side as OrderSideV5,
        symbol: symbol,
        chartLines: chartLinesRef.current.filter((c) => !c.isServer),
      }),
    );
  };

  const dispatchAddBE = () => {
    if (!symbol) return;
    console.log('add be');
  };

  const removeChartLines = () => {
    linePluginRef.current?.truncate();
  };

  const setupChartLines = () => {
    // Remove Lines
    removeChartLines();

    chartLinesRef.current.forEach((line) => {
      const newLine: TradingLineInfo = {
        id: line.id,
        price: line.price,
        qty: line.qty,
        type: line.type,
        side: line.side,
        draggable: line.draggable,
        isLive: line.isLive,
        isServer: line.isServer,
        parentId: line.parentId,
      };
      linePluginRef.current?.addLine(newLine);
    });

    linePluginRef.current?.updateAllViews();
  };

  return null; // Since this component doesn't render anything, we return null
};
