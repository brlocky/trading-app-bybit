import { KlineIntervalV3, LinearInverseInstrumentInfoV5, RestClientV5 } from 'bybit-api';
import { toast } from 'react-toastify';
import { AppThunk } from '..';
import { mapKlineToCandleStickData } from '../../mappers';
import {
  addChartLines,
  addRestingOrder,
  setAppStarted,
  setChartLines,
  setRestingOrders,
  setSymbol,
  updateExecutions,
  updateInterval,
  updateKlines,
  updateLoading,
  updateOrders,
  updatePositions,
  updateTickerInfo,
  updateWallet,
} from '../slices';
import { ChartLinesService, ICreateOrder, TradingService } from '../../services';
import { Params } from 'react-router-dom';
import { isOrderTPorSL } from '../../utils/tradeUtils';

export interface IAppParams {
  symbol: string;
  interval: string;
}

export const initApp = (apiClient: RestClientV5, params: Readonly<Params<string>>): AppThunk => {
  return async (dispatch, getState) => {
    try {
      const [resultWallet, resultOrders, resultPositions, resultExecutions] = await Promise.all([
        apiClient.getWalletBalance({
          accountType: 'CONTRACT',
          coin: 'USDT',
        }),
        apiClient.getActiveOrders({
          category: 'linear',
          settleCoin: 'USDT',
        }),
        apiClient.getPositionInfo({
          category: 'linear',
          settleCoin: 'USDT',
        }),
        apiClient.getExecutionList({
          category: 'linear',
        }),
      ]);

      const usdtWallet = resultWallet.result?.list?.[0] ?? null;
      if (!usdtWallet) {
        throw Error('Could not find USDT wallet');
      }
      dispatch(updateWallet(usdtWallet));

      const positions = resultPositions.retCode === 0 ? resultPositions.result.list : [];
      if (positions.length) {
        dispatch(updatePositions(positions));
      }

      const orders = resultOrders.retCode === 0 ? resultOrders.result.list : [];
      if (orders.length) {
        dispatch(updateOrders(resultOrders.result.list));
      }

      if (resultExecutions.retCode === 0) {
        dispatch(updateExecutions(resultExecutions.result.list.sort((a, b) => Number(b.execTime) - Number(a.execTime))));
      } else {
        throw Error('Error loading executions');
      }

      // Resting Orders - Before symbol to ensure that chart lines are generated when all data is loaded
      const restingOrders = getState().tradeSetup.restingOrders.filter((r) => orders.find((o) => o.orderId === r.orderId));
      dispatch(setRestingOrders([...restingOrders]));

      // Load Symbol After loading orders, so we can access new data
      const { symbol, interval } = params;
      if (symbol) {
        await dispatch(loadSymbol(apiClient, symbol, interval));
      }

      if (interval) {
        dispatch(updateInterval(interval));
      }

      dispatch(setAppStarted(true));
      return true;
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : 'Wrong API Credentials';
      toast.error(errorMessage);
    }

    return false;
  };
};

export const loadSymbol = (apiClient: RestClientV5, symbol: string, interval = ''): AppThunk => {
  return async (dispatch, getState) => {
    dispatch(updateLoading(true));
    try {
      const stateInterval = getState().ui.interval;
      const isIntervalChanged = interval !== '' && stateInterval !== interval;
      const isSymbolChanged = getState().ui.symbol !== symbol ? true : false;

      if (!isIntervalChanged && !isSymbolChanged) return;

      if (isIntervalChanged) {
        dispatch(updateInterval(interval));
      }
      const newInterval = isIntervalChanged ? interval : stateInterval;

      dispatch(setSymbol(symbol));

      // Get cancle sticks
      const kLine = await apiClient.getKline({
        category: 'linear',
        symbol: symbol,
        interval: newInterval as KlineIntervalV3,
      });

      const candleStickData = kLine.result.list.map(mapKlineToCandleStickData).sort((a, b) => (a.time as number) - (b.time as number));
      dispatch(updateKlines(candleStickData));

      // Force Cross Mode
      apiClient.switchIsolatedMargin({
        category: 'linear',
        symbol: symbol,
        tradeMode: 0,
        buyLeverage: '1',
        sellLeverage: '1',
      });

      // Force One Way Mode
      await apiClient.switchPositionMode({
        category: 'linear',
        symbol: symbol,
        mode: 0,
      });

      const instrumentsResult = await apiClient.getInstrumentsInfo({
        category: 'linear',
        symbol: symbol,
      });
      const tickerInfo = instrumentsResult.result.list[0] as LinearInverseInstrumentInfoV5;
      dispatch(updateTickerInfo(tickerInfo));

      // Load Initial ChartLines
      await dispatch(loadAllChartLines(symbol));
    } catch (e) {
      console.error('Something went wrong', e);
    }
    dispatch(updateLoading(false));
  };
};

export const loadAllChartLines = (symbol: string): AppThunk => {
  return async (dispatch, getState) => {
    try {
      const position = getState().ui.positions.find((p) => p.symbol === symbol);
      const orders = getState().ui.orders.filter((o) => o.symbol === symbol);
      const restingChartLines = getState()
        .tradeSetup.restingOrders.filter((r) => orders.find((o) => o.orderId === r.orderId))
        .map((r) => r.chartLines)
        .flat();

      const chartLinesService = ChartLinesService();

      const positionOrders = position ? orders.filter((o) => o.symbol === position.symbol && isOrderTPorSL(o)) : [];
      const currentPositionLines = position ? chartLinesService.generateInitialChartLines(position, positionOrders) : [];

      const allNewLines = [...currentPositionLines, ...restingChartLines];
      if (!allNewLines.length) return;

      dispatch(setChartLines(allNewLines));
    } catch (e) {
      console.error('Something went wrong', e);
    }
  };
};

export const createMartketOrder = (apiClient: RestClientV5, order: ICreateOrder): AppThunk => {
  return async (dispatch, getState) => {
    const entry = order.chartLines.find((c) => c.type === 'ENTRY');
    if (!entry) {
      return null;
    }
    const tradingService = TradingService(apiClient);
    try {
      const orderId = await tradingService.openPosition({
        symbol: order.symbol,
        qty: entry.qty.toString(),
        side: order.side,
        type: 'Market',
      });

      if (orderId) {
        const takeProfits = order.chartLines
          .filter((l) => l.type === 'TP')
          .map((l) => {
            return tradingService.addTakeProfit(order.symbol, l);
          });

        const stoplosses = order.chartLines
          .filter((l) => l.type === 'SL')
          .map((l) => {
            return tradingService.addStopLoss(order.symbol, l);
          });

        const sucessMessage = () => {
          toast.success('Market Order Open');
        };
        const orders = [...takeProfits, ...stoplosses];
        orders.length
          ? Promise.all(orders).then(() => {
              sucessMessage();
            })
          : sucessMessage();
      } else {
        toast.error('Fail to Open Market Order');
      }
    } catch (e) {
      console.log('Error', e);
    }
  };
};

export const createLimitOrder = (apiClient: RestClientV5, order: ICreateOrder): AppThunk => {
  return async (dispatch, getState) => {
    const entry = order.chartLines.find((c) => c.type === 'ENTRY');
    if (!entry) {
      return null;
    }

    const tradingService = TradingService(apiClient);
    try {
      const orderId = await tradingService.openPosition({
        symbol: order.symbol,
        qty: entry.qty.toString(),
        side: order.side,
        type: 'Limit',
        price: entry.price.toString(),
      });

      if (orderId) {
        toast.success('Limit Order Open');

        const updatedChartLines = order.chartLines.map((c) => {
          if (c.type !== 'ENTRY') return c;
          return {
            ...c,
            orderId: orderId,
            isServer: true,
          };
        });

        dispatch(
          addRestingOrder({
            orderId: orderId,
            symbol: order.symbol,
            price: entry.price.toString(),
            qty: entry.qty.toString(),
            chartLines: updatedChartLines,
          }),
        );

        dispatch(addChartLines(updatedChartLines));
      } else {
        toast.error('Fail to Create Limit Order');
      }
    } catch (e) {
      console.log('Error', e);
    }
  };
};
