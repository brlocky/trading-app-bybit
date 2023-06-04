import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { RootState } from '../store';
import { ITarget } from '../types';
import { OrderTypeV5 } from 'bybit-api';

interface ITradeSetupState {
  positionSize: number;
  takeProfits: ITarget[];
  stopLosses: ITarget[];
  marginMode: 0 | 1; // Cross, Isolated
  leverage: number; // 1.. 100
  positionMode: 0 | 3; // OneWay Hedge
  orderType: OrderTypeV5;
  entryPrice: string;
}

const initialState: ITradeSetupState = {
  positionSize: 0,
  marginMode: 0,
  leverage: 1,
  positionMode: 0,
  takeProfits: [],
  stopLosses: [],
  orderType: 'Market',
  entryPrice: '0',
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

export const { updatePositionSize, updateTakeProfit, updateStopLoss, updateLeverage, updatePositionMode, updateMarginMode, updateOrderType, updateEntryPrice } =
  tradeSetupSlice.actions;

export const tradeSetupReducer = tradeSetupSlice.reducer;

// Other code such as selectors can use the imported `RootState` type
export const selectPositionSize = (state: RootState) => state.tradeSetup.positionSize;
export const selectTakeProfits = (state: RootState) => state.tradeSetup.takeProfits;
export const selectTakeProfit = (state: RootState) => state.tradeSetup.takeProfits[0];
export const selectStopLosses = (state: RootState) => state.tradeSetup.stopLosses;
export const selectStopLoss = (state: RootState) => state.tradeSetup.stopLosses[0];
export const selectPositionMode = (state: RootState) => state.tradeSetup.positionMode;
export const selectMarginMode = (state: RootState) => state.tradeSetup.marginMode;
export const selectLeverage = (state: RootState) => state.tradeSetup.leverage;
export const selectOrderType = (state: RootState) => state.tradeSetup.orderType;
export const selectEntryPrice = (state: RootState) => state.tradeSetup.entryPrice;
