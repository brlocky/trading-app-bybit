import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { RootState } from '../store';
import { ITarget } from '../types';

interface ITradeSetupState {
  positionSize: number;
  takeProfits: ITarget[];
  stopLosses: ITarget[];
}

const initialState: ITradeSetupState = {
  positionSize: 0,
  takeProfits: [{
    ticks: 100,
    price:0,
    qty: 0,
  }],
  stopLosses: [{
    ticks: 50,
    price:0,
    qty: 0,
  }],
};

const tradeSetupSlice = createSlice({
  name: 'tradeSetup',
  initialState,
  reducers: {
    updatePositionSize(state, action: PayloadAction<number>) {
      state.positionSize = action.payload;
    },
    updateTakeProfit(state, action: PayloadAction<ITarget[]>) {
      state.takeProfits = [...action.payload];
    },
    updateStopLoss(state, action: PayloadAction<ITarget[]>) {
      state.stopLosses = [...action.payload];
    },
  },
});

export const { updatePositionSize, updateTakeProfit, updateStopLoss } = tradeSetupSlice.actions;

export const tradeSetupReducer = tradeSetupSlice.reducer;

// Other code such as selectors can use the imported `RootState` type
export const selectPositionSize = (state: RootState) => state.tradeSetup.positionSize;
export const selectTakeProfits = (state: RootState) => state.tradeSetup.takeProfits;
export const selectStopLosses = (state: RootState) => state.tradeSetup.stopLosses;
