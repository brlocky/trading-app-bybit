import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { AccountOrderV5, ExecutionV5, LinearInverseInstrumentInfoV5, PositionV5, PublicTradeV5, WalletBalanceV5 } from 'bybit-api';
import { RootState } from '../store';
import { CandlestickDataWithVolume, ITicker } from '../types';

export interface SubTicker {
  ticker: ITicker | undefined;
  tickerInfo: LinearInverseInstrumentInfoV5 | undefined;
}

interface ArrayTicker {
  [name: string]: SubTicker;
}

interface ISymbolState {
  symbol: string | undefined;
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
}

const initialState: ISymbolState = {
  symbol: undefined,
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
};

const symbolSlice = createSlice({
  name: 'symbol',
  initialState,
  reducers: {
    updateSymbol(state, action: PayloadAction<string>) {
      state.symbol = action.payload;
      state.lastTrades = [];
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
  updateSymbol,
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
} = symbolSlice.actions;

export const symbolReducer = symbolSlice.reducer;

// Other code such as selectors can use the imported `RootState` type
export const selectIsLoading = (state: RootState) => state.symbol.symbol && !state.symbol.klines.length;
export const selectSymbol = (state: RootState) => state.symbol.symbol;
export const selectInterval = (state: RootState) => state.symbol.interval;
export const selectOrders = (state: RootState) => state.symbol.orders;
export const selectCurrentOrders = (state: RootState) => state.symbol.orders.filter((o) => o.symbol === state.symbol.symbol);
export const selectLastKline = (state: RootState) => state.symbol.kline;
export const selectKlines = (state: RootState) => state.symbol.klines;
export const selectTickers = (state: RootState) => state.symbol.tickers;
export const selectTicker = (state: RootState) => (state.symbol.symbol ? state.symbol.tickers[state.symbol.symbol] : undefined);
export const selectPositions = (state: RootState) => state.symbol.positions;
export const selectCurrentPosition = (state: RootState) => state.symbol.positions.find((p) => p.symbol === state.symbol.symbol);
export const selectWallet = (state: RootState) => state.symbol.wallet;
export const selectExecutions = (state: RootState) => state.symbol.executions;
export const selectLastTrades = (state: RootState) => state.symbol.lastTrades;
export const selectFilledOrders = (state: RootState) => state.symbol.filledOrders;
