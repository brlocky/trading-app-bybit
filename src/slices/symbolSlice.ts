import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { ExecutionV5, LinearInverseInstrumentInfoV5, WalletBalanceV5 } from 'bybit-api';
import { RootState } from '../store';
import { CandlestickDataWithVolume, IOrder, IPosition, ITicker } from '../types';

interface ISymbolState {
  symbol: string | undefined;
  interval: string;
  ticker: ITicker | undefined;
  tickerInfo: LinearInverseInstrumentInfoV5 | undefined;
  orders: IOrder[];
  wallet: WalletBalanceV5 | undefined;
  positions: IPosition[];
  executions: ExecutionV5[];
  kline: CandlestickDataWithVolume | undefined;
}

const initialState: ISymbolState = {
  symbol: undefined,
  interval: '1',
  ticker: undefined,
  tickerInfo: undefined,
  orders: [],
  wallet: undefined,
  positions: [],
  executions: [],
  kline: undefined,
};

const symbolSlice = createSlice({
  name: 'symbol',
  initialState,
  reducers: {
    updateSymbol(state, action: PayloadAction<string>) {
      return {
        ...initialState,
        symbol: action.payload,
        interval: state.interval,
      };
    },
    updateInterval(state, action: PayloadAction<string>) {
      return {
        ...state,
        kline: undefined,
        interval: action.payload,
      };
    },
    updateTicker(state, action: PayloadAction<ITicker>) {
      state.ticker = { ...state.ticker, ...action.payload };
    },
    updateTickerInfo(state, action: PayloadAction<LinearInverseInstrumentInfoV5>) {
      state.tickerInfo = { ...action.payload };
    },
    updateLastKline(state, action: PayloadAction<CandlestickDataWithVolume>) {
      state.kline = { ...action.payload };
    },
    updateWallet(state, action: PayloadAction<WalletBalanceV5>) {
      state.wallet = action.payload;
    },
    updateOrders(state, action: PayloadAction<IOrder[]>) {
      const currentOrders = [...state.orders];
      const newOrders = action.payload;

      if (newOrders.length === 0) {
        return;
      }

      newOrders.forEach((newOrder) => {
        const index = currentOrders.findIndex((o) => o.orderId === newOrder.orderId);

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
    },
    updateOrder(state, action: PayloadAction<IOrder>) {
      const updateOrder = action.payload;
      const currentOrders = [...state.orders];
      const indexOrderToUpdate = currentOrders.findIndex((o) => o.orderId === updateOrder.orderId);

      if (indexOrderToUpdate !== -1) {
        currentOrders[indexOrderToUpdate] = updateOrder;
        state.orders = currentOrders;
      }
    },
    updateExecutions(state, action: PayloadAction<ExecutionV5[]>) {
      const currentOrders = [...state.orders];
      const executions = action.payload;

      executions.forEach((execution) => {
        const index = currentOrders.findIndex((o) => o.orderId === execution.orderId);

        // Remove Order
        if (index !== -1) {
          currentOrders.splice(index, 1);
        }
      });

      state.orders = currentOrders;
    },
    updatePositions(state, action: PayloadAction<IPosition[]>) {
      state.positions = [...action.payload];
    },
  },
});

export const {
  updateSymbol,
  updateInterval,
  updateTicker,
  updateTickerInfo,
  updateLastKline,
  updateWallet,
  updateOrders,
  updateOrder,
  updateExecutions,
  updatePositions,
} = symbolSlice.actions;

export const symbolReducer = symbolSlice.reducer;

// Other code such as selectors can use the imported `RootState` type
export const selectSymbol = (state: RootState) => state.symbol.symbol;
export const selectInterval = (state: RootState) => state.symbol.interval;
export const selectOrders = (state: RootState) => state.symbol.orders;
export const selectLastKline = (state: RootState) => state.symbol.kline;
export const selectTicker = (state: RootState) => state.symbol.ticker;
export const selectTickerInfo = (state: RootState) => state.symbol.tickerInfo;
export const selectPositions = (state: RootState) => state.symbol.positions;
export const selectWallet = (state: RootState) => state.symbol.wallet;
export const selectExecutions = (state: RootState) => state.symbol.executions;
