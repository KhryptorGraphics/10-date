# 10-Date Mobile App: Production Readiness Steps

This document outlines the necessary steps to prepare the 10-Date mobile application for production deployment. It covers the technical aspects required to finalize the application, from setting up the development environment to integrating with backend services.

## 1. Development Environment Setup

### Dependencies Installation

Create a comprehensive package.json with all required dependencies:

```bash
# Navigate to the project directory
cd 10-date-mobile

# Install core dependencies
npm install --save react-native@0.70.5 react@18.2.0 react-native-reanimated@2.14.0 
npm install --save react-navigation@latest @react-navigation/native @react-navigation/stack @react-navigation/bottom-tabs

# Redux and state management
npm install --save @reduxjs/toolkit react-redux redux-persist

# Form management
npm install --save formik yup

# Animations and gestures
npm install --save react-native-gesture-handler react-native-screens react-native-safe-area-context

# Push notifications
npm install --save react-native-push-notification @react-native-firebase/messaging

# Image handling
npm install --save react-native-fast-image react-native-image-picker 

# In-app purchases
npm install --save react-native-iap

# Real-time communication
npm install --save socket.io-client

# UI components
npm install --save react-native-vector-icons
npm install --save react-native-svg react-native-linear-gradient
npm install --save react-native-keyboard-aware-scroll-view

# Storage
npm install --save @react-native-async-storage/async-storage
npm install --save @nozbe/watermelondb

# Dev dependencies
npm install --save-dev typescript @types/react @types/react-native
npm install --save-dev babel-plugin-module-resolver
npm install --save-dev jest @testing-library/react-native @testing-library/jest-native
npm install --save-dev detox jest-circus
```

### Project Configuration

Update the necessary configuration files for proper development workflow:

#### babel.config.js

```javascript
module.exports = {
  presets: ['module:metro-react-native-babel-preset'],
  plugins: [
    [
      'module-resolver',
      {
        root: ['./src'],
        extensions: ['.ios.js', '.android.js', '.js', '.ts', '.tsx', '.json'],
        alias: {
          '@components': './src/components',
          '@screens': './src/screens',
          '@navigation': './src/navigation',
          '@store': './src/store',
          '@services': './src/services',
          '@hooks': './src/hooks',
          '@utils': './src/utils',
          '@assets': './src/assets',
          '@theme': './src/theme',
        },
      },
    ],
    'react-native-reanimated/plugin',
  ],
};
```

#### metro.config.js

```javascript
const { getDefaultConfig } = require('metro-config');

module.exports = (async () => {
  const {
    resolver: { sourceExts, assetExts },
  } = await getDefaultConfig();
  
  return {
    transformer: {
      babelTransformerPath: require.resolve('react-native-svg-transformer'),
      getTransformOptions: async () => ({
        transform: {
          experimentalImportSupport: false,
          inlineRequires: true,
        },
      }),
    },
    resolver: {
      assetExts: assetExts.filter(ext => ext !== 'svg'),
      sourceExts: [...sourceExts, 'svg'],
    },
  };
})();
```

#### tsconfig.json (update)

```json
{
  "compilerOptions": {
    "allowJs": true,
    "allowSyntheticDefaultImports": true,
    "esModuleInterop": true,
    "isolatedModules": true,
    "jsx": "react-native",
    "lib": ["es2017"],
    "moduleResolution": "node",
    "noEmit": true,
    "strict": true,
    "target": "esnext",
    "baseUrl": "./src",
    "paths": {
      "@components/*": ["components/*"],
      "@screens/*": ["screens/*"],
      "@navigation/*": ["navigation/*"],
      "@store/*": ["store/*"],
      "@services/*": ["services/*"],
      "@hooks/*": ["hooks/*"],
      "@utils/*": ["utils/*"],
      "@assets/*": ["assets/*"],
      "@theme/*": ["theme/*"]
    }
  },
  "exclude": [
    "node_modules",
    "babel.config.js",
    "metro.config.js",
    "jest.config.js"
  ]
}
```

## 2. Testing Infrastructure Setup

### Unit Testing Setup

Configure Jest for unit testing:

#### jest.config.js

```javascript
module.exports = {
  preset: 'react-native',
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  setupFilesAfterEnv: ['@testing-library/jest-native/extend-expect'],
  transformIgnorePatterns: [
    'node_modules/(?!(react-native|@react-native|react-native-vector-icons|@react-navigation)/)',
  ],
  moduleNameMapper: {
    '^@components/(.*)$': '<rootDir>/src/components/$1',
    '^@screens/(.*)$': '<rootDir>/src/screens/$1',
    '^@navigation/(.*)$': '<rootDir>/src/navigation/$1',
    '^@store/(.*)$': '<rootDir>/src/store/$1',
    '^@services/(.*)$': '<rootDir>/src/services/$1',
    '^@hooks/(.*)$': '<rootDir>/src/hooks/$1',
    '^@utils/(.*)$': '<rootDir>/src/utils/$1',
    '^@theme/(.*)$': '<rootDir>/src/theme/$1',
    '^@assets/(.*)$': [
      '<rootDir>/src/assets/$1',
      '<rootDir>/src/__mocks__/fileMock.js',
    ],
    '\\.svg': '<rootDir>/src/__mocks__/svgMock.js',
  },
  testPathIgnorePatterns: ['/node_modules/', '/e2e/'],
  collectCoverage: true,
  coverageReporters: ['html', 'text', 'text-summary', 'lcov'],
  collectCoverageFrom: [
    'src/**/*.{js,jsx,ts,tsx}',
    '!src/**/*.d.ts',
    '!src/types/**/*.ts',
    '!src/assets/**/*',
  ],
};
```

### Create Mock Files

#### src/__mocks__/fileMock.js

```javascript
module.exports = 'test-file-stub';
```

#### src/__mocks__/svgMock.js

```javascript
module.exports = 'SvgMock';
module.exports.ReactComponent = 'SvgMock';
export default 'SvgMock';
```

### Sample Unit Tests

#### src/components/__tests__/PremiumFeatureWrapper.test.tsx

```typescript
import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { Provider } from 'react-redux';
import configureStore from 'redux-mock-store';
import PremiumFeatureWrapper from '../../components/PremiumFeatureWrapper';
import { Text } from 'react-native';

const mockStore = configureStore([]);

describe('PremiumFeatureWrapper', () => {
  it('renders children when user has premium subscription', () => {
    const store = mockStore({
      auth: {
        user: {
          subscription: {
            planId: 'premium-monthly',
            isActive: true,
          },
        },
      },
    });

    const { getByText } = render(
      <Provider store={store}>
        <PremiumFeatureWrapper>
          <Text>Premium Content</Text>
        </PremiumFeatureWrapper>
      </Provider>
    );

    expect(getByText('Premium Content')).toBeTruthy();
  });

  it('renders upgrade prompt when user does not have premium subscription', () => {
    const store = mockStore({
      auth: {
        user: {
          subscription: null,
        },
      },
    });

    const { getByText, queryByText } = render(
      <Provider store={store}>
        <PremiumFeatureWrapper>
          <Text>Premium Content</Text>
        </PremiumFeatureWrapper>
      </Provider>
    );

    expect(queryByText('Premium Content')).toBeNull();
    expect(getByText('Upgrade to Premium')).toBeTruthy();
  });
});
```

### End-to-End Testing with Detox

#### Setup Detox for E2E Testing

##### e2e/config.json

```json
{
  "testRunner": "jest",
  "runnerConfig": "e2e/jest.config.js",
  "skipLegacyWorkersInjection": true,
  "apps": {
    "ios": {
      "type": "ios.app",
      "binaryPath": "ios/build/Build/Products/Debug-iphonesimulator/TenDate.app",
      "build": "xcodebuild -workspace ios/TenDate.xcworkspace -scheme TenDate -configuration Debug -sdk iphonesimulator -derivedDataPath ios/build"
    },
    "android": {
      "type": "android.apk",
      "binaryPath": "android/app/build/outputs/apk/debug/app-debug.apk",
      "build": "cd android && ./gradlew assembleDebug assembleAndroidTest -DtestBuildType=debug && cd .."
    }
  },
  "devices": {
    "simulator": {
      "type": "ios.simulator",
      "device": {
        "type": "iPhone 14"
      }
    },
    "emulator": {
      "type": "android.emulator",
      "device": {
        "avdName": "Pixel_4_API_30"
      }
    }
  },
  "configurations": {
    "ios": {
      "device": "simulator",
      "app": "ios"
    },
    "android": {
      "device": "emulator",
      "app": "android"
    }
  }
}
```

##### e2e/jest.config.js

```javascript
module.exports = {
  rootDir: '..',
  testMatch: ['<rootDir>/e2e/**/*.test.js'],
  testTimeout: 120000,
  maxWorkers: 1,
  globalSetup: 'detox/runners/jest/globalSetup',
  globalTeardown: 'detox/runners/jest/globalTeardown',
  reporters: ['detox/runners/jest/reporter'],
  testEnvironment: 'detox/runners/jest/testEnvironment',
  verbose: true,
};
```

##### Sample E2E Test: e2e/authentication.test.js

```javascript
describe('Authentication Flow', () => {
  beforeAll(async () => {
    await device.launchApp();
  });

  beforeEach(async () => {
    await device.reloadReactNative();
  });

  it('should show login screen', async () => {
    await expect(element(by.text('Log In'))).toBeVisible();
    await expect(element(by.text('Email'))).toBeVisible();
    await expect(element(by.text('Password'))).toBeVisible();
  });

  it('should navigate to registration screen', async () => {
    await element(by.text('Sign Up')).tap();
    await expect(element(by.text('Create Your Account'))).toBeVisible();
  });

  it('should register a new user', async () => {
    await element(by.text('Sign Up')).tap();
    
    // Step 1: Account Info
    await element(by.id('email-input')).typeText('test@example.com');
    await element(by.id('password-input')).typeText('Password123!');
    await element(by.id('confirm-password-input')).typeText('Password123!');
    await element(by.text('Next')).tap();
    
    // Step 2: Personal Info
    await expect(element(by.text('Tell Us About Yourself'))).toBeVisible();
    await element(by.id('name-input')).typeText('Test User');
    await element(by.id('dob-input')).typeText('01/01/1990');
    await element(by.text('Male')).tap();
    await element(by.text('Next')).tap();
    
    // Step 3: Photos
    await expect(element(by.text('Add Your Photos'))).toBeVisible();
    await element(by.text('Next')).tap();
    
    // Step 4: Interests
    await expect(element(by.text('Select Your Interests'))).toBeVisible();
    await element(by.text('Travel')).tap();
    await element(by.text('Music')).tap();
    await element(by.text('Technology')).tap();
    await element(by.text('Create Account')).tap();
    
    // Should redirect to main app after successful registration
    await expect(element(by.text('Discover'))).toBeVisible();
  });
});
```

## 3. Animation Implementation with React Native Reanimated

### Swipe Animation for Matching Screen

Update the DiscoverScreen component to use React Native Reanimated for fluid card animations:

#### src/screens/matching/DiscoverScreen.tsx (animation updates)

```typescript
import React, { useState, useRef } from 'react';
import { View, Text, Image, StyleSheet, Dimensions } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  useAnimatedGestureHandler,
  withSpring,
  withTiming,
  runOnJS,
  interpolate,
  Extrapolate,
} from 'react-native-reanimated';
import { PanGestureHandler } from 'react-native-gesture-handler';
import { primaryColors, neutralColors } from '../../theme';

// Screen dimensions
const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Card swipe thresholds
const SWIPE_THRESHOLD = SCREEN_WIDTH * 0.25;

const SwipeableCard = ({ profile, onSwipe }) => {
  // Animation values
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const rotation = useSharedValue(0);
  const scale = useSharedValue(1);
  
  // Handle card gesture
  const gestureHandler = useAnimatedGestureHandler({
    onStart: (_, context) => {
      context.startX = translateX.value;
      context.startY = translateY.value;
    },
    onActive: (event, context) => {
      translateX.value = context.startX + event.translationX;
      translateY.value = context.startY + event.translationY;
      rotation.value = interpolate(
        translateX.value,
        [-SCREEN_WIDTH / 2, 0, SCREEN_WIDTH / 2],
        [-10, 0, 10],
        Extrapolate.CLAMP
      );
    },
    onEnd: (event) => {
      if (event.translationX > SWIPE_THRESHOLD) {
        // Swipe right
        translateX.value = withTiming(SCREEN_WIDTH + 100, { duration: 250 }, () => {
          runOnJS(onSwipe)('right');
        });
      } else if (event.translationX < -SWIPE_THRESHOLD) {
        // Swipe left
        translateX.value = withTiming(-SCREEN_WIDTH - 100, { duration: 250 }, () => {
          runOnJS(onSwipe)('left');
        });
      } else if (event.translationY < -SWIPE_THRESHOLD) {
        // Swipe up (super like)
        translateY.value = withTiming(-SCREEN_HEIGHT - 100, { duration: 250 }, () => {
          runOnJS(onSwipe)('up', true);
        });
      } else {
        // Reset position
        translateX.value = withSpring(0, {
          damping: 15,
          stiffness: 100,
        });
        translateY.value = withSpring(0, {
          damping: 15,
          stiffness: 100,
        });
        rotation.value = withTiming(0);
      }
    },
  });
  
  // Animated styles for card
  const cardStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { translateX: translateX.value },
        { translateY: translateY.value },
        { rotate: `${rotation.value}deg` },
        { scale: scale.value },
      ],
    };
  });
  
  // Animated styles for like/pass overlays
  const likeStyle = useAnimatedStyle(() => {
    const opacity = interpolate(
      translateX.value,
      [0, SWIPE_THRESHOLD],
      [0, 1],
      Extrapolate.CLAMP
    );
    return { opacity };
  });
  
  const passStyle = useAnimatedStyle(() => {
    const opacity = interpolate(
      translateX.value,
      [-SWIPE_THRESHOLD, 0],
      [1, 0],
      Extrapolate.CLAMP
    );
    return { opacity };
  });
  
  const superlikeStyle = useAnimatedStyle(() => {
    const opacity = interpolate(
      translateY.value,
      [-SWIPE_THRESHOLD, 0],
      [1, 0],
      Extrapolate.CLAMP
    );
    return { opacity };
  });
  
  return (
    <PanGestureHandler onGestureEvent={gestureHandler}>
      <Animated.View style={[styles.card, cardStyle]}>
        <Image
          source={{ uri: profile.photos[0] }}
          style={styles.cardImage}
        />
        
        <View style={styles.cardContent}>
          <Text style={styles.nameText}>{profile.name}, {profile.age}</Text>
          <Text style={styles.bioText}>{profile.bio}</Text>
        </View>
        
        <Animated.View style={[styles.overlayContainer, styles.likeOverlay, likeStyle]}>
          <Text style={styles.overlayText}>LIKE</Text>
        </Animated.View>
        
        <Animated.View style={[styles.overlayContainer, styles.passOverlay, passStyle]}>
          <Text style={styles.overlayText}>PASS</Text>
        </Animated.View>
        
        <Animated.View style={[styles.overlayContainer, styles.superlikeOverlay, superlikeStyle]}>
          <Text style={styles.overlayText}>SUPER LIKE</Text>
        </Animated.View>
      </Animated.View>
    </PanGestureHandler>
  );
};
```

### Match Animation Implementation

```typescript
import { MotiView } from 'moti';

const MatchAnimation = ({ visible, onClose, matchedUser }) => {
  if (!visible) return null;
  
  return (
    <View style={styles.matchAnimationContainer}>
      <MotiView
        from={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: 'timing', duration: 500 }}
        style={styles.matchContent}
      >
        <MotiView
          from={{ translateY: -20, opacity: 0 }}
          animate={{ translateY: 0, opacity: 1 }}
          transition={{ type: 'timing', delay: 300 }}
        >
          <Text style={styles.matchText}>It's a Match!</Text>
        </MotiView>
        
        <MotiView
          from={{ translateY: 20, opacity: 0 }}
          animate={{ translateY: 0, opacity: 1 }}
          transition={{ type: 'timing', delay: 600 }}
        >
          <Text style={styles.matchSubtext}>
            You and {matchedUser.name} have liked each other.
          </Text>
        </MotiView>
        
        <View style={styles.matchPhotosContainer}>
          <MotiView
            from={{ translateX: -50, opacity: 0 }}
            animate={{ translateX: 0, opacity: 1 }}
            transition={{ type: 'spring', delay: 900 }}
          >
            <Image
              source={{ uri: "https://example.com/your-photo.jpg" }}
              style={styles.matchPhoto}
            />
          </MotiView>
          
          <MotiView
            from={{ translateX: 50, opacity: 0 }}
            animate={{ translateX: 0, opacity: 1 }}
            transition={{ type: 'spring', delay: 900 }}
          >
            <Image
              source={{ uri: matchedUser.photos[0] }}
              style={styles.matchPhoto}
            />
          </MotiView>
        </View>
        
        <MotiView
          from={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ type: 'timing', delay: 1200 }}
        >
          <TouchableOpacity
            style={styles.messageButton}
            onPress={() => {
              onClose();
              navigation.navigate('ChatDetail', {
                matchId: matchedUser.id,
                userName: matchedUser.name,
              });
            }}
          >
            <Text style={styles.messageButtonText}>Send Message</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.keepSwipingButton}
            onPress={onClose}
          >
            <Text style={styles.keepSwipingText}>Keep Swiping</Text>
          </TouchableOpacity>
        </MotiView>
      </MotiView>
    </View>
  );
};
```

## 4. Backend API Integration

### API Service Configuration

Create a centralized API configuration:

#### src/services/api.config.ts

```typescript
// API URLs
export const API_BASE_URL = __DEV__ 
  ? 'http://localhost:3000/api' 
  : 'https://api.10-date.com/api';

export const SOCKET_URL = __DEV__
  ? 'http://localhost:3001'
  : 'https://socket.10-date.com';

// API Endpoints
export const API_ENDPOINTS = {
  // Auth
  LOGIN: '/auth/login',
  REGISTER: '/auth/register',
  REFRESH_TOKEN: '/auth/refresh-token',
  RESET_PASSWORD: '/auth/reset-password',
  
  // User
  USER_PROFILE: '/user/profile',
  USER_PHOTOS: '/user/photos',
  USER_PREFERENCES: '/user/preferences',
  
  // Matching
  POTENTIAL_MATCHES: '/matching/potential',
  SWIPE: '/matching/swipe',
  MATCHES: '/matching/matches',
  
  // Messaging
  CONVERSATIONS: '/messaging/conversations',
  MESSAGES: '/messaging/messages',
  
  // Subscription
  SUBSCRIPTION_PLANS: '/payments/plans',
  PURCHASE_SUBSCRIPTION: '/payments/purchase',
  VERIFY_RECEIPT: '/payments/verify-receipt',
};

// Request timeout
export const REQUEST_TIMEOUT = 15000; // 15 seconds
```

### API Client Implementation

#### src/services/api.client.ts

```typescript
import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL, REQUEST_TIMEOUT } from './api.config';

class ApiClient {
  private client: AxiosInstance;
  private accessToken: string | null = null;

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      timeout: REQUEST_TIMEOUT,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    });

    this.setupInterceptors();
  }

  private setupInterceptors() {
    // Request interceptor to add auth header
    this.client.interceptors.request.use(
      async (config) => {
        if (!this.accessToken) {
          this.accessToken = await AsyncStorage.getItem('accessToken');
        }
        
        if (this.accessToken) {
          config.headers.Authorization = `Bearer ${this.accessToken}`;
        }
        
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor to handle token refresh
    this.client.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config;
        
        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;
          
          try {
            const refreshToken = await AsyncStorage.getItem('refreshToken');
            
            if (!refreshToken) {
              // No refresh token available, user needs to login again
              await this.clearTokens();
              return Promise.reject(error);
            }
            
            // Call the refresh token endpoint
            const response = await axios.post(
              `${API_BASE_URL}/auth/refresh-token`,
              { refreshToken }
            );
            
            const { accessToken, refreshToken: newRefreshToken } = response.data;
            
            // Update tokens in storage
            await AsyncStorage.setItem('accessToken', accessToken);
            await AsyncStorage.setItem('refreshToken', newRefreshToken);
            
            // Update token in memory
            this.accessToken = accessToken;
            
            // Update the authorization header and retry the request
            originalRequest.headers.Authorization = `Bearer ${accessToken}`;
            return this.client(originalRequest);
          } catch (refreshError) {
            // Failed to refresh token, user needs to login again
            await this.clearTokens();
            return Promise.reject(refreshError);
          }
        }
        
        return Promise.reject(error);
      }
    );
  }

  private async clearTokens() {
    await AsyncStorage.removeItem('accessToken');
    await AsyncStorage.removeItem('refreshToken');
    this.accessToken = null;
  }

  public async get<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response: AxiosResponse<T> = await this.client.get(url, config);
    return response.data;
  }

  public async post<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response: AxiosResponse<T> = await this.client.post(url, data, config);
    return response.data;
  }

  public async put<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response: AxiosResponse<T> = await this.client.put(url, data, config);
    return response.data;
  }

  public async delete<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response: AxiosResponse<T> = await this.client.delete(url, config);
    return response.data;
  }

  public async upload<T>(
    url: string,
    formData: FormData,
    onProgress?: (percentage: number) => void
  ): Promise<T> {
    const response: AxiosResponse<T> = await this.client.post(url, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: (progressEvent) => {
        if (onProgress && progressEvent.total) {
          const percentage = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total
          );
          onProgress(percentage);
        }
      },
    });
    
    return response.data;
  }
}

export const apiClient = new ApiClient();
```

### RTK Query API Service Implementation

#### src/store/api.ts (updated)

```typescript
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { API_BASE_URL, API_ENDPOINTS } from '../services/api.config';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const api = createApi({
  reducerPath: 'api',
  baseQuery: fetchBaseQuery({
    baseUrl: API_BASE_URL,
    prepareHeaders: async (headers) => {
      const token = await AsyncStorage.getItem('accessToken');
      if (token) {
        headers.set('Authorization', `Bearer ${token}`);
      }
      return headers;
    },
  }),
  tagTypes: [
    'Profile', 
    'Matches', 
    'Conversations', 
    'Messages', 
    'Subscriptions'
  ],
  endpoints: (builder) => ({
    // Auth endpoints
    login: builder.mutation({
      query: (credentials) => ({
        url: API_ENDPOINTS.LOGIN,
        method: 'POST',
        body: credentials,
      }),
    }),
    
    register: builder.mutation({
      query: (userData) => ({
        url: API_ENDPOINTS.REGISTER,
        method: 'POST',
        body: userData,
      }),
    }),
    
    // User profile endpoints
    getUserProfile: builder.query({
      query: () => API_ENDPOINTS.USER_PROFILE,
      providesTags: ['Profile'],
    }),
    
    updateUserProfile: builder.mutation({
      query: (profileData) => ({
        url: API_ENDPOINTS.USER_PROFILE,
        method: 'PUT',
        body: profileData,
      }),
      invalidatesTags: ['Profile'],
    }),
    
    uploadUserPhoto: builder.mutation({
      query: (formData) => ({
        url: API_ENDPOINTS.USER_PHOTOS,
        method: 'POST',
        body: formData,
        formData: true,
      }),
      invalidatesTags: ['Profile'],
    }),
    
    deleteUserPhoto: builder.mutation({
      query: (photoId) => ({
        url: `${API_ENDPOINTS.USER_PHOTOS}/${photoId}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Profile'],
    }),
    
    // Matching endpoints
    getPotentialMatches: builder.query({
      query: (params) => ({
        url: API_ENDPOINTS.POTENTIAL_MATCHES,
        params,
      }),
    }),
    
    swipeProfile: builder.mutation({
      query: ({ userId, direction, isSuperLike }) => ({
        url: API_ENDPOINTS.SWIPE,
        method: 'POST',
        body: { userId, direction, isSuperLike },
      }),
    }),
    
    getMatches: builder.query({
      query: () => API_ENDPOINTS.MATCHES,
      providesTags: ['Matches'],
    }),
    
    // Messaging endpoints
    getConversations: builder.query({
      query: () => API_ENDPOINTS.CONVERSATIONS,
      providesTags: ['Conversations'],
    }),
    
    getMessages: builder.query({
      query: (matchId) => `${API_ENDPOINTS.MESSAGES}/${matchI
