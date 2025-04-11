/**
 * Authentication Redux Slice
 * 
 * Manages authentication state including user token, login status,
 * and user authentication data.
 */

import { createSlice, PayloadAction } from '@reduxjs/toolkit';

// Define user interface
export interface User {
  id: string;
  email: string;
  name: string;
  isVerified: boolean;
  createdAt: string;
  updatedAt: string;
}

// Define auth state interface
export interface AuthState {
  user: User | null;
  token: string | null;
  loading: boolean;
  error: string | null;
  isAuthenticated: boolean;
  biometricsEnabled: boolean;
}

// Initial state
const initialState: AuthState = {
  user: null,
  token: null,
  loading: false,
  error: null,
  isAuthenticated: false,
  biometricsEnabled: false
};

// Create the auth slice
const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    // Start authentication process (login, register, etc.)
    authStart(state) {
      state.loading = true;
      state.error = null;
    },
    
    // Set user credentials after successful authentication
    setCredentials(state, action: PayloadAction<{ user: User | null; token: string }>) {
      const { user, token } = action.payload;
      state.user = user;
      state.token = token;
      state.isAuthenticated = true;
      state.loading = false;
      state.error = null;
    },
    
    // Authentication failed
    authFailed(state, action: PayloadAction<string>) {
      state.loading = false;
      state.error = action.payload;
      state.isAuthenticated = false;
    },
    
    // Logout user
    logout(state) {
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
      state.error = null;
    },
    
    // Update user data
    updateUser(state, action: PayloadAction<Partial<User>>) {
      if (state.user) {
        state.user = { ...state.user, ...action.payload };
      }
    },
    
    // Set biometrics enabled status
    setBiometricsEnabled(state, action: PayloadAction<boolean>) {
      state.biometricsEnabled = action.payload;
    },
    
    // Clear error
    clearError(state) {
      state.error = null;
    }
  }
});

// Export actions and reducer
export const { 
  authStart, 
  setCredentials, 
  authFailed, 
  logout, 
  updateUser, 
  setBiometricsEnabled,
  clearError 
} = authSlice.actions;

export default authSlice.reducer;
