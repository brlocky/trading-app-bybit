import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { RootState } from '../store';
import { IChartLine } from '../types';
import { IOrderOptionsSettingsData, SettingsService } from '../services';
import { OrderSideV5, OrderTypeV5 } from 'bybit-api';

interface ITradeSetupState {
  orderSide: OrderSideV5;
  orderType: OrderTypeV5;
  positionSize: number;
  chartLines: IChartLine[];
  leverage: number; // 1.. 100
  orderSettings: IOrderOptionsSettingsData;
}

const initialState: ITradeSetupState = {
  orderSide: 'Buy',
  orderType: 'Limit',
  positionSize: 0,
  chartLines: [],
  leverage: 1,
  orderSettings: SettingsService.loadOrderOptionSettings(),
};

const tradeSetupSlice = createSlice({
  name: 'tradeSetup',
  initialState,
  reducers: {
    updateOrderSide(state, action: PayloadAction<OrderSideV5>) {
      state.orderSide = action.payload;
    },
    updateOrderType(state, action: PayloadAction<OrderTypeV5>) {
      state.orderType = action.payload;
    },
    updatePositionSize(state, action: PayloadAction<number>) {
      state.positionSize = action.payload;
    },
    addChartLine(state, action: PayloadAction<IChartLine>) {
      state.chartLines = [...state.chartLines, { ...action.payload }];
    },
    setChartLines(state, action: PayloadAction<IChartLine[]>) {
      state.chartLines = [...action.payload];
    },
    removeChartLine(state, action: PayloadAction<{ index: number }>) {
      state.chartLines.splice(action.payload.index, 1);
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
  },
});

export const {
  updateOrderSide,
  updateOrderType,
  updatePositionSize,
  resetChartLines,
  addChartLine,
  setChartLines,
  removeChartLine,
  updateLeverage,
  updateOrderSettings,
} = tradeSetupSlice.actions;

export const tradeSetupReducer = tradeSetupSlice.reducer;

// Other code such as selectors can use the imported `RootState` type
export const selectOrderSide = (state: RootState) => state.tradeSetup.orderSide;
export const selectOrderType = (state: RootState) => state.tradeSetup.orderType;
export const selectPositionSize = (state: RootState) => state.tradeSetup.positionSize;
export const selectTakeProfits = (state: RootState) => state.tradeSetup.chartLines.filter((l) => l.type === 'TP');
export const selectStopLosses = (state: RootState) => state.tradeSetup.chartLines.filter((l) => l.type === 'SL');
export const selectLines = (state: RootState) => state.tradeSetup.chartLines;
export const selectLeverage = (state: RootState) => state.tradeSetup.leverage;
export const selectEntryPrice = (state: RootState) =>
  state.tradeSetup.chartLines.find((l) => l.type === 'ENTRY' && l.draggable === false)?.price.toString() ||
  state.symbol.kline?.close ||
  '0';
export const selectOrderSettings = (state: RootState) => state.tradeSetup.orderSettings;
