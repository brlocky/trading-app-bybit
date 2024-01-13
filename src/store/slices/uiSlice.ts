import { createSelector, createSlice, PayloadAction } from '@reduxjs/toolkit';
import { AccountOrderV5, ExecutionV5, LinearInverseInstrumentInfoV5, PositionV5, PublicTradeV5, WalletBalanceV5 } from 'bybit-api';
import { RootState } from '..';
import { CandlestickDataWithVolume, IChartLine, ITicker } from '../../types';

export interface SubTicker {
  ticker: ITicker | undefined;
  tickerInfo: LinearInverseInstrumentInfoV5 | undefined;
}

interface ArrayTicker {
  [name: string]: SubTicker;
}

interface IUIState {
  appStarted: boolean;
  loading: number;
  symbol: string;
  interval: string;
  tickers: ArrayTicker;
  orders: AccountOrderV5[];
  wallet: WalletBalanceV5 | undefined;
  positions: PositionV5[];
  executions: ExecutionV5[];
  kline: CandlestickDataWithVolume | undefined;
  klines: CandlestickDataWithVolume[];
  lastTrades: PublicTradeV5[];
  filledOrders: AccountOrderV5[];
  chartLines: IChartLine[];
}

const initialState: IUIState = {
  appStarted: false,
  loading: 0,
  symbol: '',
  interval: '15',
  tickers: {},
  orders: [],
  wallet: undefined,
  positions: [],
  executions: [],
  kline: undefined,
  klines: [],
  lastTrades: [],
  filledOrders: [],
  chartLines: [],
};

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    setAppStarted(state, action: PayloadAction<boolean>) {
      state.appStarted = action.payload;
    },
    updateLoading(state, action: PayloadAction<boolean>) {
      state.loading = action.payload ? state.loading + 1 : state.loading - 1;
    },
    setSymbol(state, action: PayloadAction<string>) {
      state.symbol = action.payload;
      state.lastTrades = [];
      state.chartLines = [];
    },
    updateInterval(state, action: PayloadAction<string>) {
      state.interval = action.payload;
    },
    updateTicker(state, action: PayloadAction<ITicker>) {
      state.tickers[action.payload.symbol] = {
        ...state.tickers[action.payload.symbol],
        ticker: { ...state.tickers[action.payload.symbol]?.ticker, ...action.payload },
      };
    },
    updateTickerInfo(state, action: PayloadAction<LinearInverseInstrumentInfoV5>) {
      state.tickers[action.payload.symbol] = {
        ...state.tickers[action.payload.symbol],
        tickerInfo: { ...action.payload },
      };
    },
    updateLastKline(state, action: PayloadAction<CandlestickDataWithVolume>) {
      state.kline = { ...action.payload };
    },
    updateKlines(state, action: PayloadAction<CandlestickDataWithVolume[]>) {
      state.klines = [...action.payload];
    },
    updateWallet(state, action: PayloadAction<WalletBalanceV5>) {
      state.wallet = action.payload;
    },
    addChartLine(state, action: PayloadAction<IChartLine>) {
      state.chartLines = [...state.chartLines, { ...action.payload }];
    },
    addChartLines(state, action: PayloadAction<IChartLine[]>) {
      state.chartLines = [...state.chartLines, ...action.payload];
    },
    setChartLines(state, action: PayloadAction<IChartLine[]>) {
      state.chartLines = [...action.payload];
    },
    removeChartLine(state, action: PayloadAction<string>) {
      state.chartLines = state.chartLines.filter((l) => l.id !== action.payload);
    },
    removeChartLines(state, action: PayloadAction<string[]>) {
      state.chartLines = state.chartLines.filter((l) => !action.payload.find((id) => id === l.id));
    },
    // reset only when filled, to avoid rerender issues
    resetChartLines(state) {
      state.chartLines = [];
    },
    updateOrders(state, action: PayloadAction<AccountOrderV5[]>) {
      const currentOrders = [...state.orders];
      const newOrders = action.payload;

      if (newOrders.length === 0) {
        return;
      }

      const newFilledOrders: AccountOrderV5[] = [];
      newOrders.forEach((newOrder) => {
        const index = currentOrders.findIndex((o) => o.orderId === newOrder.orderId);

        if (newOrder.orderStatus === 'Filled') {
          newFilledOrders.push(newOrder);
        }

        if (['Rejected', 'Filled', 'Cancelled', 'Triggered', 'Deactivated'].includes(newOrder.orderStatus)) {
          // Remove Order
          if (index !== -1) {
            currentOrders.splice(index, 1);
          }
        } else {
          if (index !== -1) {
            const currentOrder = { ...currentOrders[index] };
            currentOrders[index] = { ...currentOrder, ...newOrder };
          } else {
            currentOrders.push(newOrder);
          }
        }
      });

      state.orders = currentOrders;
      if (newFilledOrders.length) {
        state.filledOrders = [...newFilledOrders, ...state.filledOrders];
      }
    },
    updateExecutions(state, action: PayloadAction<ExecutionV5[]>) {
      const newExecutions = action.payload.filter((e) => !state.executions.find((s) => s.execId === e.execId));
      state.executions = [...newExecutions, ...state.executions].slice(0, 100);
    },
    updatePositions(state, action: PayloadAction<PositionV5[]>) {
      const currentPositions = [...state.positions];

      action.payload.forEach((p) => {
        const index = currentPositions.findIndex((c) => {
          return c.symbol == p.symbol && c.positionIdx == p.positionIdx;
        });

        // add
        if (index === -1) {
          if (Number(p.size) > 0) {
            currentPositions.push(p);
          }
        } else {
          // remove
          if (Number(p.size) === 0) {
            currentPositions.splice(index, 1);
          } else {
            // update
            currentPositions[index] = { ...currentPositions[index], ...p };
          }
        }
      });

      state.positions = currentPositions;
    },
    updateLastTrades(state, action: PayloadAction<PublicTradeV5[]>) {
      const newLastTrades = [...action.payload, ...state.lastTrades];
      state.lastTrades = newLastTrades.slice(0, 500);
    },
  },
});

export const {
  setAppStarted,
  updateLoading,
  setSymbol,
  updateInterval,
  updateTicker,
  updateTickerInfo,
  updateLastKline,
  updateKlines,
  updateWallet,
  updateOrders,
  updateExecutions,
  updatePositions,
  updateLastTrades,
  resetChartLines,
  addChartLine,
  addChartLines,
  setChartLines,
  removeChartLine,
  removeChartLines,
} = uiSlice.actions;

export const uiReducer = uiSlice.reducer;

// Other code such as selectors can use the imported `RootState` type
export const selectIsAppStarted = (state: RootState) => state.ui.appStarted;
export const selectIsLoading = (state: RootState) => state.ui.loading !== 0;
export const selectSymbol = (state: RootState) => state.ui.symbol;
export const selectInterval = (state: RootState) => state.ui.interval;
export const selectOrders = (state: RootState) => state.ui.orders;
export const selectLastKline = (state: RootState) => state.ui.kline;
export const selectKlines = (state: RootState) => state.ui.klines;
export const selectTickers = (state: RootState) => state.ui.tickers;
export const selectTicker = (state: RootState) => (state.ui.symbol ? state.ui.tickers[state.ui.symbol] : undefined);
export const selectPositions = (state: RootState) => state.ui.positions;
export const selectWallet = (state: RootState) => state.ui.wallet;
export const selectExecutions = (state: RootState) => state.ui.executions;
export const selectLastTrades = (state: RootState) => state.ui.lastTrades;
export const selectFilledOrders = (state: RootState) => state.ui.filledOrders;
export const selectTakeProfits = (state: RootState) => state.ui.chartLines.filter((l) => l.type === 'TP');
export const selectStopLosses = (state: RootState) => state.ui.chartLines.filter((l) => l.type === 'SL');
export const selectChartLines = (state: RootState) => state.ui.chartLines;

export const selectCurrentPosition = createSelector(
  [selectPositions, selectSymbol],
  (positions: PositionV5[], symbol: string | undefined) => {
    return positions.find((o) => o.symbol === symbol);
  },
);

export const selectCurrentOrders = createSelector([selectOrders, selectSymbol], (orders: AccountOrderV5[], symbol: string | undefined) => {
  return orders.filter((o) => o.symbol === symbol);
});
