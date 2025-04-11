/**
 * Redux Store Configuration for 10-Date Mobile App
 * 
 * This file sets up the Redux store with Redux Toolkit,
 * configures middleware, and exports typed hooks.
 */

import { configureStore, combineReducers } from '@reduxjs/toolkit';
import { setupListeners } from '@reduxjs/toolkit/query';
import { TypedUseSelectorHook, useDispatch, useSelector } from 'react-redux';

// Import API service
import { api } from './api';

// Import slices
import authReducer from './slices/authSlice';
import userReducer from './slices/userSlice';
import matchesReducer from './slices/matchesSlice';
import subscriptionReducer from './slices/subscriptionSlice';
import preferencesReducer from './slices/preferencesSlice';

// Create root reducer
const rootReducer = combineReducers({
  auth: authReducer,
  user: userReducer,
  matches: matchesReducer,
  subscription: subscriptionReducer,
  preferences: preferencesReducer,
  [api.reducerPath]: api.reducer,
});

// Create store
export const store = configureStore({
  reducer: rootReducer,
  middleware: (getDefaultMiddleware) => 
    getDefaultMiddleware({
      serializableCheck: false,
    }).concat(api.middleware),
});

// Optional: Setup listeners for refetchOnFocus/refetchOnReconnect behaviors
setupListeners(store.dispatch);

// Export types and typed hooks
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;

export default store;
