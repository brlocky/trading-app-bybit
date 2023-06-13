import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { OrderTypeV5 } from 'bybit-api';
import { RootState } from '../store';
import { IChartLine } from '../types';

interface ITradeSetupState {
  positionSize: number;
  chartLines: IChartLine[];
  entryPrice: string;
  marginMode: 0 | 1; // Cross, Isolated
  leverage: number; // 1.. 100
  positionMode: 0 | 3; // OneWay Hedge
  orderType: OrderTypeV5;
}

const initialState: ITradeSetupState = {
  positionSize: 0,
  marginMode: 0,
  leverage: 1,
  positionMode: 0,
  orderType: 'Market',
  entryPrice: '0',
  chartLines: [],
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
    updateChartLine(state, action: PayloadAction<{ index: number; line: IChartLine }>) {
      state.chartLines[action.payload.index] = { ...action.payload.line };
    },
    removeChartLine(state, action: PayloadAction<{ index: number }>) {
      state.chartLines.splice(action.payload.index, 1);
    },
    // reset only when filled, to avoid rerender issues
    resetChartLines(state) {
      if (state.chartLines.length) {
        state.chartLines = [];
      }
    },
    updateLeverage(state, action: PayloadAction<number>) {
      state.leverage = action.payload;
    },
    updatePositionMode(state, action: PayloadAction<0 | 3>) {
      state.positionMode = action.payload;
    },
    updateMarginMode(state, action: PayloadAction<0 | 1>) {
      state.marginMode = action.payload;
    },
    updateOrderType(state, action: PayloadAction<OrderTypeV5>) {
      state.orderType = action.payload;
    },
    updateEntryPrice(state, action: PayloadAction<string>) {
      state.entryPrice = action.payload;
    },
  },
});

export const {
  updatePositionSize,
  resetChartLines,
  addChartLine,
  removeChartLine,
  updateChartLine,
  updateLeverage,
  updatePositionMode,
  updateMarginMode,
  updateOrderType,
  updateEntryPrice,
} = tradeSetupSlice.actions;

export const tradeSetupReducer = tradeSetupSlice.reducer;

// Other code such as selectors can use the imported `RootState` type
export const selectPositionSize = (state: RootState) => state.tradeSetup.positionSize;
export const selectTakeProfits = (state: RootState) => state.tradeSetup.chartLines.filter((l) => l.type === 'TP');
export const selectStopLosses = (state: RootState) => state.tradeSetup.chartLines.filter((l) => l.type === 'SL');
export const selectLines = (state: RootState) => state.tradeSetup.chartLines;
export const selectPositionMode = (state: RootState) => state.tradeSetup.positionMode;
export const selectMarginMode = (state: RootState) => state.tradeSetup.marginMode;
export const selectLeverage = (state: RootState) => state.tradeSetup.leverage;
export const selectOrderType = (state: RootState) => state.tradeSetup.orderType;
export const selectEntryPrice = (state: RootState) => state.tradeSetup.entryPrice;
