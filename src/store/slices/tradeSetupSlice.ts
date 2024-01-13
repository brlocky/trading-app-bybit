import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { RootState } from '..';
import { IOrderOptionsSettingsData, SettingsService } from '../../services';
import { IChartLine } from '../../types';

interface ITradeSetupState {
  positionSize: number;
  leverage: number; // 1.. 100
  orderSettings: IOrderOptionsSettingsData;
  restingOrders: IRestingOrder[];
}

const initialState: ITradeSetupState = {
  positionSize: 0,
  leverage: 1,
  orderSettings: SettingsService.loadOrderOptionSettings(),
  restingOrders: [],
};

export interface IRestingOrder {
  orderId: string;
  symbol: string;
  price: string;
  qty: string;
  chartLines: IChartLine[];
}

const tradeSetupSlice = createSlice({
  name: 'tradeSetup',
  initialState,
  reducers: {
    updatePositionSize(state, action: PayloadAction<number>) {
      state.positionSize = action.payload;
    },
    updateLeverage(state, action: PayloadAction<number>) {
      state.leverage = action.payload;
    },
    updateOrderSettings(state, action: PayloadAction<IOrderOptionsSettingsData>) {
      state.orderSettings = { ...state.orderSettings, ...action.payload };

      // Persist in settings
      SettingsService.saveOrderOptionSettings(state.orderSettings);
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
    setRestingOrders(state, action: PayloadAction<IRestingOrder[]>) {
      state.restingOrders = [...action.payload];
    },
  },
});

export const {
  updatePositionSize,
  updateLeverage,
  updateOrderSettings,
  addRestingOrder,
  removeRestingOrder,
  updateRestingOrder,
  setRestingOrders,
} = tradeSetupSlice.actions;

export const tradeSetupReducer = tradeSetupSlice.reducer;

// Other code such as selectors can use the imported `RootState` type
export const selectPositionSize = (state: RootState) => state.tradeSetup.positionSize;
export const selectLeverage = (state: RootState) => state.tradeSetup.leverage;
export const selectOrderSettings = (state: RootState) => state.tradeSetup.orderSettings;
export const selectRestingOrders = (state: RootState) => state.tradeSetup.restingOrders;
