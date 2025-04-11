/**
 * Authentication service for 10-Date mobile app
 * Handles login, registration, token management, and biometric authentication
 */

import axios from 'axios';
import * as Keychain from 'react-native-keychain';
import TouchID from 'react-native-touch-id';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import jwtDecode from 'jwt-decode';

import { API_URL } from '../config';

// Types
export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface UserCredentials {
  email: string;
  password: string;
}

export interface RegisterData extends UserCredentials {
  name: string;
  birthDate: string;
  gender: string;
}

export interface JwtPayload {
  sub: string;
  email: string;
  roles: string[];
  iat: number;
  exp: number;
}

// Authentication API client
const authApi = axios.create({
  baseURL: `${API_URL}/auth`,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token refresh interceptor
authApi.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    // If error is 401 and we haven't tried to refresh yet
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      try {
        // Get refresh token from secure storage
        const refreshToken = await getRefreshToken();
        if (!refreshToken) throw new Error('No refresh token available');
        
        // Attempt to refresh tokens
        const response = await authApi.post('/refresh', { refreshToken });
        const { accessToken, refreshToken: newRefreshToken } = response.data;
        
        // Save new tokens
        await saveTokens({ 
          accessToken, 
          refreshToken: newRefreshToken,
          expiresIn: getTokenExpiry(accessToken)
        });
        
        // Update original request with new token and retry
        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        return axios(originalRequest);
      } catch (refreshError) {
        // If refresh fails, clear tokens and redirect to login
        await clearTokens();
        // Will need to integrate with navigation and state management
        return Promise.reject(refreshError);
      }
    }
    
    return Promise.reject(error);
  }
);

/**
 * Extract expiration time from JWT token
 */
export const getTokenExpiry = (token: string): number => {
  try {
    const decoded = jwtDecode<JwtPayload>(token);
    return decoded.exp * 1000; // Convert to milliseconds
  } catch (error) {
    console.error('Failed to decode token:', error);
    return 0;
  }
};

/**
 * Check if token is expired
 */
export const isTokenExpired = (token: string): boolean => {
  try {
    const expiry = getTokenExpiry(token);
    return Date.now() >= expiry;
  } catch (error) {
    return true;
  }
};

/**
 * Save authentication tokens securely
 */
export const saveTokens = async (tokens: AuthTokens): Promise<void> => {
  try {
    // Save refresh token in secure storage
    await Keychain.setGenericPassword(
      'refreshToken', 
      tokens.refreshToken,
      { service: '10date.refresh' }
    );
    
    // Save access token in secure storage
    await Keychain.setGenericPassword(
      'accessToken', 
      tokens.accessToken,
      { service: '10date.access' }
    );
    
    // Save token expiry time
    await AsyncStorage.setItem('tokenExpiry', tokens.expiresIn.toString());
    
    // Set the Authorization header for future requests
    authApi.defaults.headers.common.Authorization = `Bearer ${tokens.accessToken}`;
  } catch (error) {
    console.error('Failed to save tokens:', error);
    throw error;
  }
};

/**
 * Get access token from secure storage
 */
export const getAccessToken = async (): Promise<string | null> => {
  try {
    const credentials = await Keychain.getGenericPassword({ service: '10date.access' });
    return credentials ? credentials.password : null;
  } catch (error) {
    console.error('Failed to get access token:', error);
    return null;
  }
};

/**
 * Get refresh token from secure storage
 */
export const getRefreshToken = async (): Promise<string | null> => {
  try {
    const credentials = await Keychain.getGenericPassword({ service: '10date.refresh' });
    return credentials ? credentials.password : null;
  } catch (error) {
    console.error('Failed to get refresh token:', error);
    return null;
  }
};

/**
 * Clear all authentication tokens
 */
export const clearTokens = async (): Promise<void> => {
  try {
    await Keychain.resetGenericPassword({ service: '10date.access' });
    await Keychain.resetGenericPassword({ service: '10date.refresh' });
    await AsyncStorage.removeItem('tokenExpiry');
    await AsyncStorage.removeItem('biometricsEnabled');
    
    // Clear the Authorization header
    delete authApi.defaults.headers.common.Authorization;
  } catch (error) {
    console.error('Failed to clear tokens:', error);
    throw error;
  }
};

/**
 * Login with email and password
 */
export const login = async (credentials: UserCredentials): Promise<AuthTokens> => {
  try {
    const response = await authApi.post('/login', credentials);
    const tokens = response.data;
    
    // Save tokens for future requests
    await saveTokens({
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      expiresIn: getTokenExpiry(tokens.accessToken)
    });
    
    return tokens;
  } catch (error) {
    console.error('Login failed:', error);
    throw error;
  }
};

/**
 * Register a new user
 */
export const register = async (data: RegisterData): Promise<AuthTokens> => {
  try {
    const response = await authApi.post('/register', data);
    const tokens = response.data;
    
    // Save tokens for future requests
    await saveTokens({
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      expiresIn: getTokenExpiry(tokens.accessToken)
    });
    
    return tokens;
  } catch (error) {
    console.error('Registration failed:', error);
    throw error;
  }
};

/**
 * Logout user
 */
export const logout = async (): Promise<void> => {
  try {
    const refreshToken = await getRefreshToken();
    
    // Only call logout endpoint if we have a refresh token
    if (refreshToken) {
      await authApi.post('/logout', { refreshToken });
    }
    
    // Clear local tokens
    await clearTokens();
  } catch (error) {
    console.error('Logout failed:', error);
    // Still clear tokens even if API call fails
    await clearTokens();
    throw error;
  }
};

/**
 * Request password reset
 */
export const requestPasswordReset = async (email: string): Promise<boolean> => {
  try {
    await authApi.post('/password-recovery', { email });
    return true;
  } catch (error) {
    console.error('Password reset request failed:', error);
    throw error;
  }
};

/**
 * Reset password with token
 */
export const resetPassword = async (token: string, newPassword: string): Promise<boolean> => {
  try {
    await authApi.post('/reset-password', { token, newPassword });
    return true;
  } catch (error) {
    console.error('Password reset failed:', error);
    throw error;
  }
};

/**
 * Check if biometric authentication is available
 */
export const isBiometricsAvailable = async (): Promise<boolean> => {
  try {
    // Check if device supports biometrics
    const biometryType = await TouchID.isSupported();
    return !!biometryType;
  } catch (error) {
    console.log('Biometrics not available:', error);
    return false;
  }
};

/**
 * Enable biometric authentication
 */
export const enableBiometrics = async (): Promise<boolean> => {
  try {
    // Verify device supports biometrics
    if (!(await isBiometricsAvailable())) {
      return false;
    }
    
    // Get current refresh token
    const refreshToken = await getRefreshToken();
    if (!refreshToken) {
      return false;
    }
    
    // Store refresh token in secure storage with biometric protection
    await Keychain.setGenericPassword(
      'biometricToken',
      refreshToken,
      {
        service: '10date.biometric',
        accessControl: Keychain.ACCESS_CONTROL.BIOMETRY_ANY,
        accessible: Keychain.ACCESSIBLE.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
      }
    );
    
    // Flag that biometrics is enabled
    await AsyncStorage.setItem('biometricsEnabled', 'true');
    
    return true;
  } catch (error) {
    console.error('Failed to enable biometrics:', error);
    return false;
  }
};

/**
 * Authenticate with biometrics
 */
export const authenticateWithBiometrics = async (): Promise<AuthTokens | null> => {
  try {
    // Check if biometrics is enabled
    const biometricsEnabled = await AsyncStorage.getItem('biometricsEnabled');
    if (biometricsEnabled !== 'true') {
      return null;
    }
    
    // Configure authentication prompt
    const authConfig = {
      title: 'Authenticate to 10Date', 
      color: '#FF006E',
      sensorErrorDescription: 'Failed to authenticate'
    };
    
    // Trigger biometric authentication
    await TouchID.authenticate('Login to your dating profile', authConfig);
    
    // Retrieve stored token after successful biometric auth
    const credentials = await Keychain.getGenericPassword({ 
      service: '10date.biometric',
      accessControl: Keychain.ACCESS_CONTROL.BIOMETRY_ANY,
      accessible: Keychain.ACCESSIBLE.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
    });
    
    if (credentials && credentials.password) {
      // Use retrieved refresh token to get new tokens
      const response = await authApi.post('/refresh', { 
        refreshToken: credentials.password 
      });
      
      const tokens = response.data;
      
      // Save new tokens
      await saveTokens({
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        expiresIn: getTokenExpiry(tokens.accessToken)
      });
      
      // Update biometric token
      await Keychain.setGenericPassword(
        'biometricToken',
        tokens.refreshToken,
        {
          service: '10date.biometric',
          accessControl: Keychain.ACCESS_CONTROL.BIOMETRY_ANY,
          accessible: Keychain.ACCESSIBLE.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
        }
      );
      
      return tokens;
    }
    
    return null;
  } catch (error) {
    console.error('Biometric authentication failed:', error);
    return null;
  }
};

/**
 * Disable biometric authentication
 */
export const disableBiometrics = async (): Promise<boolean> => {
  try {
    await Keychain.resetGenericPassword({ service: '10date.biometric' });
    await AsyncStorage.removeItem('biometricsEnabled');
    return true;
  } catch (error) {
    console.error('Failed to disable biometrics:', error);
    return false;
  }
};

export default {
  login,
  register,
  logout,
  requestPasswordReset,
  resetPassword,
  getAccessToken,
  getRefreshToken,
  saveTokens,
  clearTokens,
  isTokenExpired,
  isBiometricsAvailable,
  enableBiometrics,
  authenticateWithBiometrics,
  disableBiometrics,
};
