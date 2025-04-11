/**
 * Configuration settings for the 10-Date mobile app
 */

// API configuration
export const API_URL = 'https://api.10-date.com/v1'; // This will be overridden by environment variables

// App configuration
export const APP_CONFIG = {
  appName: '10Date',
  version: '1.0.0',
  buildNumber: '1',
  defaultLanguage: 'en',
  supportedLanguages: ['en', 'es', 'fr', 'de', 'ja'],
  defaultTheme: 'light',
  minPasswordLength: 8,
  maxPasswordLength: 100,
  minUserAge: 18,
  maxUserAge: 100,
  maxProfilePhotos: 6,
  maxBioLength: 500,
  defaultSearchRadius: 50, // km
  maxSearchRadius: 100, // km
};

// Feature flags
export const FEATURES = {
  biometricAuth: true,
  socialLogin: true,
  videoProfiles: true,
  videoChat: true,
  locationSharing: true,
  travelMode: true,
  eventDiscovery: true,
};

// Subscription plan details
export const SUBSCRIPTION_PLANS = {
  basic: {
    priceMonthly: 4.99,
    priceYearly: 49.99,
    features: [
      'Unlimited swipes',
      'Basic matching algorithm',
      'Standard support',
    ],
  },
  premium: {
    priceMonthly: 9.99,
    priceYearly: 99.99,
    features: [
      'Unlimited swipes',
      'See who liked you',
      'Rewind last swipe',
      '5 Super Likes per day',
      '1 Profile Boost per month',
      'Advanced filters',
      'Priority support',
    ],
  },
  vip: {
    priceMonthly: 19.99,
    priceYearly: 199.99,
    features: [
      'All Premium features',
      'Unlimited Super Likes',
      '3 Profile Boosts per month',
      'Incognito mode',
      'VIP badge',
      'Read receipts',
      'Premium support',
    ],
  },
};

// Analytics configuration
export const ANALYTICS_CONFIG = {
  enabled: true,
  eventLogging: true,
  performanceMonitoring: true,
  crashReporting: true,
};

// Development flags
export const DEV_CONFIG = {
  enableMockAPI: false,
  logNetworkRequests: __DEV__, // Only log in development
  debugMenu: __DEV__,
  apiLogLevel: 'error', // 'none', 'error', 'warn', 'info', 'debug'
};
