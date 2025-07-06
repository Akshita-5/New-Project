import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import taskReducer from './slices/taskSlice';
import sessionReducer from './slices/sessionSlice';
import uiReducer from './slices/uiSlice';
import gamificationReducer from './slices/gamificationSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    tasks: taskReducer,
    sessions: sessionReducer,
    ui: uiReducer,
    gamification: gamificationReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['persist/PERSIST'],
      },
    }),
  devTools: process.env.NODE_ENV !== 'production',
});

// TypeScript types - can be used if converting to TypeScript later
// export type RootState = ReturnType<typeof store.getState>;
// export type AppDispatch = typeof store.dispatch;