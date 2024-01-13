import { persistStore, persistReducer } from 'redux-persist';
import storage from 'redux-persist/lib/storage';
import { Action, ThunkAction, configureStore } from '@reduxjs/toolkit';
import { uiReducer } from './slices/uiSlice';
import { tradeSetupReducer } from './slices/tradeSetupSlice';

// Create the persisted Symbol reducer
const persistedUIReducer = persistReducer(
  {
    key: 'root',
    storage,
    whitelist: [], // Specify the slices to persist
  },
  uiReducer,
);

// Create the persisted TradeSetup reducer
const persistedTradeReducer = persistReducer(
  {
    key: 'tradeSetup',
    storage,
    whitelist: [], // Specify the slices to persist
  },
  tradeSetupReducer,
);

// Configure the store with the persisted reducer
export const store = configureStore({
  reducer: {
    ui: persistedUIReducer,
    tradeSetup: persistedTradeReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false, // Disable serializable check for non-serializable values
    }),
});

// Create the persistor
export const persistor = persistStore(store);

// Infer the `RootState` and `AppDispatch` types from the store itself
export type RootState = ReturnType<typeof store.getState>;
// Inferred type: { symbol: ISymbolState }
export type AppDispatch = typeof store.dispatch;

export type AppThunk<ReturnType = Promise<unknown>> = ThunkAction<ReturnType, RootState, unknown, Action<string>>;
