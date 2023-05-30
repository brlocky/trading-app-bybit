import { persistStore, persistReducer } from 'redux-persist';
import storage from 'redux-persist/lib/storage';
import { configureStore } from '@reduxjs/toolkit';
import { symbolReducer } from '../slices/symbolSlice';
import { tradeSetupReducer } from '../slices/tradeSetupSlice';

// Create the persisted Symbol reducer
const persistedSymbolReducer = persistReducer(
  {
    key: 'root',
    storage,
    whitelist: ['symbol', 'interval'], // Specify the slices to persist
  },
  symbolReducer,
);

// Create the persisted TradeSetup reducer
const persistedTradeReducer = persistReducer(
  {
    key: 'tradeSetup',
    storage,
    whitelist: ['positionSize', 'takeProfits', 'stopLosses'], // Specify the slices to persist
  },
  tradeSetupReducer,
);

// Configure the store with the persisted reducer
export const store = configureStore({
  reducer: {
    symbol: persistedSymbolReducer,
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
