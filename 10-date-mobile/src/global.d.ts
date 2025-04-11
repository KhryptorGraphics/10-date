/**
 * Global type definitions for React Native environment
 */

// React Native global variable for development detection
declare const __DEV__: boolean;

// Additional global type declarations for the 10-Date app
declare namespace NodeJS {
  interface ProcessEnv {
    NODE_ENV: 'development' | 'production' | 'test';
    API_URL?: string;
    STRIPE_PUBLISHABLE_KEY?: string;
    GOOGLE_MAPS_API_KEY?: string;
  }
}
