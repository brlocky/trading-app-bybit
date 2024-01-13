import { KlineIntervalV3, LinearInverseInstrumentInfoV5, RestClientV5 } from 'bybit-api';
import { toast } from 'react-toastify';
import { AppThunk } from '..';
import { mapKlineToCandleStickData } from '../../mappers';
import {
  setAppStarted,
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
import { ICreateOrder, TradingService } from '../../services';
import { NavigateFunction, Params } from 'react-router-dom';

export interface IAppParams {
  symbol: string;
  interval: string;
}

export const initApp = (apiClient: RestClientV5, navigate: NavigateFunction, params: Readonly<Params<string>>): AppThunk => {
  return async (dispatch, getState) => {
    try {
      const { symbol, interval } = params;
      if (symbol) {
        dispatch(setSymbol(symbol));
        dispatch(loadSymbol(apiClient, navigate, symbol, interval));
      }

      if (interval) {
        dispatch(updateInterval(interval));
      }

      const [walletBalance, activeOrders, positionInfo, executionList] = await Promise.all([
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

      const usdtWallet = walletBalance.result?.list?.[0] ?? null;
      if (!usdtWallet) {
        throw Error('Could not find USDT wallet');
      }
      dispatch(updateWallet(usdtWallet));

      if (positionInfo.retCode === 0) {
        dispatch(updatePositions(positionInfo.result.list));
      } else {
        throw Error('Error loading positions');
      }

      if (activeOrders.retCode === 0) {
        dispatch(updateOrders(activeOrders.result.list));
      } else {
        throw Error('Error loading orders');
      }

      if (executionList.retCode === 0) {
        dispatch(updateExecutions(executionList.result.list.sort((a, b) => Number(b.execTime) - Number(a.execTime))));
      } else {
        throw Error('Error loading executions');
      }

      dispatch(setAppStarted(true));
      return true;
    } catch (e: any) {
      const errorMessage = e instanceof Error ? e.message : 'Wrong API Credentials';
      toast.error(errorMessage);
    }

    return false;
  };
};

export const loadSymbol = (apiClient: RestClientV5, navigate: NavigateFunction, symbol: string, interval = ''): AppThunk => {
  return async (dispatch, getState) => {
    try {
      dispatch(updateLoading(true));

      const stateInterval = getState().ui.interval;
      const isIntervalChanged = interval !== '' && stateInterval !== interval;
      if (isIntervalChanged) {
        dispatch(updateInterval(interval));
      }
      const newInterval = isIntervalChanged ? interval : stateInterval;

      // Update URL
      navigate(`/${symbol}/${newInterval}`);

      // Get cancle sticks
      const kLine = await apiClient.getKline({
        category: 'linear',
        symbol: symbol,
        interval: newInterval as KlineIntervalV3,
      });

      const candleStickData = kLine.result.list.map(mapKlineToCandleStickData).sort((a, b) => (a.time as number) - (b.time as number));
      dispatch(updateKlines(candleStickData));

      // Force One Way Mode
      await apiClient.switchPositionMode({
        category: 'linear',
        symbol: symbol,
        mode: 0,
      });

      // Force Cross Mode
      await apiClient.switchIsolatedMargin({
        category: 'linear',
        symbol: symbol,
        tradeMode: 0,
        buyLeverage: '1',
        sellLeverage: '1',
      });

      // Force Leverage
      await apiClient.setLeverage({
        category: 'linear',
        symbol: symbol,
        buyLeverage: '1',
        sellLeverage: '1',
      });

      const instrumentsResult = await apiClient.getInstrumentsInfo({
        category: 'linear',
        symbol: symbol,
      });
      const tickerInfo = instrumentsResult.result.list[0] as LinearInverseInstrumentInfoV5;
      dispatch(updateTickerInfo(tickerInfo));

      dispatch(setSymbol(symbol));
    } catch (e) {
      console.error('Something went wrong', e);
    }

    dispatch(updateLoading(false));
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
      const position = await tradingService.openPosition({
        symbol: order.symbol,
        qty: entry.qty.toString(),
        side: order.side,
        type: 'Market',
      });

      if (position) {
        const stoplosses = order.chartLines
          .filter((l) => l.type === 'SL')
          .map((l) => {
            return tradingService.addStopLoss(position, l.price.toString(), l.qty.toString());
          });

        const takeProfits = order.chartLines
          .filter((l) => l.type === 'TP')
          .map((l) => {
            return tradingService.addTakeProfit(position, l.price.toString(), l.qty.toString());
          });

        Promise.all([...stoplosses, ...takeProfits]).then((allOrders) => {
          toast.success('Market Order Open');
        });
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
      const position = await tradingService.openPosition({
        symbol: order.symbol,
        qty: entry.qty.toString(),
        side: order.side,
        type: 'Limit',
        price: entry.price.toString(),
      });

      if (position) {
        toast.success('Limit Order Open');
        // Find created position
        /* const order = currentOrdersRef.current.find(
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

        const newEntry = { ...entry, orderId: order.orderId, isServer: true, isLive: false };
        const updatedChartLines = order.chartLines.map((l) => (l.type === 'ENTRY' ? newEntry : l));

        const newChartLines = [...chartLinesRef.current.filter((c) => c.id !== entry.id && c.parentId !== entry.id), ...updatedChartLines];

        dispatch(setChartLines(newChartLines)); */
        /* dispatch(
          addRestingOrder({
            orderId: newEntry.orderId,
            symbol: createLimitOrder.symbol,
            price: entry.price.toString(),
            qty: entry.qty.toString(),
            chartLines: updatedChartLines,
          }),
        ); */
      } else {
        toast.error('Fail to Create Limit Order');
      }
    } catch (e) {
      console.log('Error', e);
    }
  };
};
