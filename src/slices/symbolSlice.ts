import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { LinearInverseInstrumentInfoV5, WalletBalanceV5, ExecutionV5 } from 'bybit-api';
import { CandlestickData } from 'lightweight-charts';
import { OrderBooksStore } from 'orderbooks';
import { ITicker, IOrder, IPosition } from '../types';
import { RootState } from '../store';

interface ISymbolState {
  symbol: string;
  interval: string;
  ticker: ITicker | undefined;
  tickerInfo: LinearInverseInstrumentInfoV5 | undefined;
  orders: IOrder[];
  wallet: WalletBalanceV5 | undefined;
  positions: IPosition[];
  executions: ExecutionV5[];
  orderbook: OrderBooksStore | undefined;
  kline: CandlestickData | undefined;
  klineData: CandlestickData[];
}

const initialState: ISymbolState = {
  symbol: 'BTCUSDT',
  interval: '1',
  ticker: undefined,
  tickerInfo: undefined,
  orders: [],
  wallet: undefined,
  positions: [],
  executions: [],
  orderbook: undefined,
  kline: undefined,
  klineData: [],
};

const symbolSlice = createSlice({
  name: 'symbol',
  initialState,
  reducers: {
    updateTicker(state, action: PayloadAction<ITicker>) {
      state.ticker = { ...state.ticker, ...action.payload };
    },
    updateTickerInfo(state, action: PayloadAction<LinearInverseInstrumentInfoV5>) {
      state.tickerInfo = { ...action.payload };
    },
    updateKline(state, action: PayloadAction<CandlestickData[]>) {
      state.klineData = [...action.payload];
    },
    updateLastKline(state, action: PayloadAction<CandlestickData>) {
      state.kline = action.payload;
    },
    closeLastKline(state, action: PayloadAction<CandlestickData>) {
      if (!state.klineData.length) {
        state.klineData = [action.payload];
      } else if (state.klineData[state.klineData.length - 1].time === action.payload.time) {
        state.klineData = [...state.klineData.slice(0, -1), action.payload];
      } else {
        state.klineData = [...state.klineData, action.payload];
      }
    },
    updateWallet(state, action: PayloadAction<WalletBalanceV5>) {
      state.wallet = action.payload;
    },
    updateOrderbook(state, action: PayloadAction<OrderBooksStore>) {
      state.orderbook = action.payload;
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
  updateTicker,
  updateTickerInfo,
  updateKline,
  updateLastKline,
  closeLastKline,
  updateWallet,
  updateOrderbook,
  updateOrders,
  updateOrder,
  updateExecutions,
  updatePositions,
} = symbolSlice.actions;

export default symbolSlice.reducer;

// Other code such as selectors can use the imported `RootState` type
export const selectSymbol = (state: RootState) => state.symbol.symbol;
export const selectInterval = (state: RootState) => state.symbol.interval;
export const selectOrders = (state: RootState) => state.symbol.orders;
export const selectLastKline = (state: RootState) => state.symbol.kline;
export const selectKlineData = (state: RootState) => state.symbol.klineData;
export const selectTicker = (state: RootState) => state.symbol.ticker;
export const selectTickerInfo = (state: RootState) => state.symbol.tickerInfo;
export const selectPositions = (state: RootState) => state.symbol.positions;
export const selectWallet = (state: RootState) => state.symbol.wallet;
export const selectOrderbook = (state: RootState) => state.symbol.orderbook;
export const selectExecutions = (state: RootState) => state.symbol.executions;
