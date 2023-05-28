import { persistStore, persistReducer } from 'redux-persist';
import storage from 'redux-persist/lib/storage';
import { configureStore } from '@reduxjs/toolkit';
import { symbolReducer } from '../slices/symbolSlice';

// Persist configuration
const persistConfig = {
  key: 'root',
  storage,
  whitelist: ['symbol', 'interval'], // Specify the slices to persist
};

// Create the persisted reducer
const persistedReducer = persistReducer(persistConfig, symbolReducer);

// Configure the store with the persisted reducer
export const store = configureStore({
  reducer: {
    symbol: persistedReducer,
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
