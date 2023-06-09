import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { RootState } from '../store';
import { IChartLine } from '../types';

interface ITradeSetupState {
  positionSize: number;
  chartLines: IChartLine[];
  leverage: number; // 1.. 100
}

const initialState: ITradeSetupState = {
  positionSize: 0,
  leverage: 1,
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
  },
});

export const {
  updatePositionSize,
  resetChartLines,
  addChartLine,
  removeChartLine,
  updateChartLine,
  updateLeverage,
} = tradeSetupSlice.actions;

export const tradeSetupReducer = tradeSetupSlice.reducer;

// Other code such as selectors can use the imported `RootState` type
export const selectPositionSize = (state: RootState) => state.tradeSetup.positionSize;
export const selectTakeProfits = (state: RootState) => state.tradeSetup.chartLines.filter((l) => l.type === 'TP');
export const selectStopLosses = (state: RootState) => state.tradeSetup.chartLines.filter((l) => l.type === 'SL');
export const selectLines = (state: RootState) => state.tradeSetup.chartLines;
export const selectLeverage = (state: RootState) => state.tradeSetup.leverage;
export const selectEntryPrice = (state: RootState) =>
  state.tradeSetup.chartLines.find((l) => l.type === 'ENTRY' && l.draggable === false)?.price.toString() ||
  state.symbol.kline?.close ||
  '0';
