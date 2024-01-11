import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { OrderSideV5 } from 'bybit-api';
import { ICreateOrder, IOrderOptionsSettingsData, SettingsService } from '../services';
import { RootState } from '../store';
import { IChartLine } from '../types';

interface IRestingOrder {
  orderId: string;
  symbol: string;
  price: string;
  qty: string;
  chartLines: IChartLine[];
}

interface ITradeSetupState {
  positionSize: number;
  chartLines: IChartLine[];
  leverage: number; // 1.. 100
  orderSettings: IOrderOptionsSettingsData;
  createMarketOrder: ICreateOrder | null;
  createLimitOrder: ICreateOrder | null;
  restingOrders: IRestingOrder[];
}

const initialState: ITradeSetupState = {
  positionSize: 0,
  chartLines: [],
  leverage: 1,
  orderSettings: SettingsService.loadOrderOptionSettings(),
  createMarketOrder: null,
  createLimitOrder: null,
  restingOrders: [],
};

const tradeSetupSlice = createSlice({
  name: 'tradeSetup',
  initialState,
  reducers: {
    updatePositionSize(state, action: PayloadAction<number>) {
      state.positionSize = action.payload;
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
    // reset only when filled, to avoid rerender issues
    resetChartLines(state) {
      state.chartLines = [];
    },
    updateLeverage(state, action: PayloadAction<number>) {
      state.leverage = action.payload;
    },
    updateOrderSettings(state, action: PayloadAction<IOrderOptionsSettingsData>) {
      state.orderSettings = { ...state.orderSettings, ...action.payload };

      // Persist in settings
      SettingsService.saveOrderOptionSettings(state.orderSettings);
    },
    setCreateMarketOrder(state, action: PayloadAction<ICreateOrder | null>) {
      state.createMarketOrder = action.payload;
    },
    setCreateLimitOrder(state, action: PayloadAction<ICreateOrder | null>) {
      state.createLimitOrder = action.payload;
    },
    addRestingOrder(state, action: PayloadAction<IRestingOrder>) {
      state.restingOrders = [...state.restingOrders, action.payload];
    },
    removeRestingOrder(state, action: PayloadAction<string>) {
      state.restingOrders = state.restingOrders.filter((o) => o.orderId !== action.payload);
    },
    updateRestingOrder(state, action: PayloadAction<IRestingOrder>) {
      state.restingOrders = state.restingOrders.map((o) => {
        if (o.orderId === action.payload.orderId) {
          return action.payload;
        }
        return o;
      });
    },
  },
});

export const {
  updatePositionSize,
  resetChartLines,
  addChartLine,
  addChartLines,
  setChartLines,
  removeChartLine,
  updateLeverage,
  updateOrderSettings,
  setCreateMarketOrder,
  setCreateLimitOrder,
  addRestingOrder,
  removeRestingOrder,
  updateRestingOrder,
} = tradeSetupSlice.actions;

export const tradeSetupReducer = tradeSetupSlice.reducer;

// Other code such as selectors can use the imported `RootState` type
export const selectPositionSize = (state: RootState) => state.tradeSetup.positionSize;
export const selectTakeProfits = (state: RootState) => state.tradeSetup.chartLines.filter((l) => l.type === 'TP');
export const selectStopLosses = (state: RootState) => state.tradeSetup.chartLines.filter((l) => l.type === 'SL');
export const selectChartLines = (state: RootState) => state.tradeSetup.chartLines;
export const selectLeverage = (state: RootState) => state.tradeSetup.leverage;
export const selectEntryPrice = (state: RootState) =>
  state.tradeSetup.chartLines.find((l) => l.type === 'ENTRY' && l.draggable === false)?.price.toString() ||
  state.symbol.kline?.close ||
  '0';
export const selectOrderSettings = (state: RootState) => state.tradeSetup.orderSettings;
export const selectCreateMarketOrder = (state: RootState) => state.tradeSetup.createMarketOrder;
export const selectCreateLimitOrder = (state: RootState) => state.tradeSetup.createLimitOrder;
export const selectRestingOrders = (state: RootState) => state.tradeSetup.restingOrders;
