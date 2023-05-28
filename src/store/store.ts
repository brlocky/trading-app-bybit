import { configureStore } from '@reduxjs/toolkit';
import symbolReducer from '../slices/symbolSlice';

export const store = configureStore({
  reducer: {
    symbol: symbolReducer,
  },
});

// Infer the `RootState` and `AppDispatch` types from the store itself
export type RootState = ReturnType<typeof store.getState>;
// Inferred type: {posts: PostsState, comments: CommentsState, users: UsersState}
export type AppDispatch = typeof store.dispatch;
