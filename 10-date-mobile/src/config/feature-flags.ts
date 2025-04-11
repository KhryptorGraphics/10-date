/**
 * Feature Flags Configuration
 * 
 * This file contains the configuration for feature flags used in the 10-Date mobile app.
 * Feature flags allow for gradual rollout of features, A/B testing, and quick disabling
 * of problematic features without requiring a new app release.
 */

import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Feature flag storage key
const FEATURE_FLAGS_STORAGE_KEY = 'feature_flags';

// Default feature flag values
export const DEFAULT_FEATURE_FLAGS = {
  // Privacy Center Enhancements
  'privacy-center-content-caching': true,
  'privacy-center-lazy-loading': true,
  'privacy-center-analytics': true,
  'privacy-center-accessibility': true,
  
  // Content Caching Specific Flags
  'content-caching-offline-support': true,
  'content-caching-background-refresh': true,
  
  // Analytics Dashboard Flags
  'analytics-dashboard-enabled': false, // Disabled by default, enable for admin users only
  'analytics-dashboard-export': false,
  
  // A/B Testing Flags
  'privacy-center-ui-variant': 'A', // A or B
  
  // Performance Optimization Flags
  'use-native-driver-animations': true,
  'use-windowing-for-lists': true,
};

// User segment types
export enum UserSegment {
  ALL = 'all',
  BETA = 'beta',
  ADMIN = 'admin',
  PERCENTAGE = 'percentage',
}

// Feature flag configuration with rollout rules
export const FEATURE_FLAGS_CONFIG = {
  // Privacy Center Enhancements
  'privacy-center-content-caching': {
    description: 'Enables content caching for Privacy Center screens',
    defaultValue: true,
    rollout: {
      segment: UserSegment.PERCENTAGE,
      value: 100, // 100% of users
    },
  },
  'privacy-center-lazy-loading': {
    description: 'Enables lazy loading for Privacy Center content',
    defaultValue: true,
    rollout: {
      segment: UserSegment.PERCENTAGE,
      value: 100, // 100% of users
    },
  },
  'privacy-center-analytics': {
    description: 'Enables analytics tracking for Privacy Center features',
    defaultValue: true,
    rollout: {
      segment: UserSegment.PERCENTAGE,
      value: 100, // 100% of users
    },
    dependsOn: ['privacy-center-content-caching', 'privacy-center-lazy-loading'],
  },
  'privacy-center-accessibility': {
    description: 'Enables enhanced accessibility features for Privacy Center',
    defaultValue: true,
    rollout: {
      segment: UserSegment.PERCENTAGE,
      value: 100, // 100% of users
    },
  },
  
  // Content Caching Specific Flags
  'content-caching-offline-support': {
    description: 'Enables offline support for cached content',
    defaultValue: true,
    rollout: {
      segment: UserSegment.PERCENTAGE,
      value: 100, // 100% of users
    },
    dependsOn: ['privacy-center-content-caching'],
  },
  'content-caching-background-refresh': {
    description: 'Enables background refresh for cached content',
    defaultValue: true,
    rollout: {
      segment: UserSegment.PERCENTAGE,
      value: 100, // 100% of users
    },
    dependsOn: ['privacy-center-content-caching'],
  },
  
  // Analytics Dashboard Flags
  'analytics-dashboard-enabled': {
    description: 'Enables the Privacy Analytics Dashboard',
    defaultValue: false,
    rollout: {
      segment: UserSegment.ADMIN,
      value: true, // Admin users only
    },
  },
  'analytics-dashboard-export': {
    description: 'Enables data export functionality in the Analytics Dashboard',
    defaultValue: false,
    rollout: {
      segment: UserSegment.ADMIN,
      value: true, // Admin users only
    },
    dependsOn: ['analytics-dashboard-enabled'],
  },
  
  // A/B Testing Flags
  'privacy-center-ui-variant': {
    description: 'UI variant for A/B testing of Privacy Center design',
    defaultValue: 'A',
    rollout: {
      segment: UserSegment.PERCENTAGE,
      value: 50, // 50% of users get variant A, 50% get variant B
      variants: ['A', 'B'],
    },
  },
  
  // Performance Optimization Flags
  'use-native-driver-animations': {
    description: 'Use native driver for animations to improve performance',
    defaultValue: true,
    rollout: {
      segment: UserSegment.PERCENTAGE,
      value: 100, // 100% of users
    },
    platform: {
      ios: true,
      android: true,
    },
  },
  'use-windowing-for-lists': {
    description: 'Use windowing for long lists to improve performance',
    defaultValue: true,
    rollout: {
      segment: UserSegment.PERCENTAGE,
      value: 100, // 100% of users
    },
    platform: {
      ios: true,
      android: true,
    },
  },
};

// Feature flag service
class FeatureFlagService {
  private flags: Record<string, any> = { ...DEFAULT_FEATURE_FLAGS };
  private isInitialized: boolean = false;
  private userSegments: string[] = [UserSegment.ALL];
  private userPercentile: number = 0;

  /**
   * Initialize the feature flag service
   * @param userSegments User segments
   * @param userPercentile User percentile (0-100)
   */
  async initialize(userSegments: string[] = [UserSegment.ALL], userPercentile: number = 0): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    this.userSegments = [...userSegments, UserSegment.ALL];
    this.userPercentile = userPercentile;

    try {
      // Load saved flags from storage
      const savedFlags = await this.loadFlags();
      
      // Merge saved flags with default flags
      this.flags = { ...DEFAULT_FEATURE_FLAGS, ...savedFlags };
      
      // Apply rollout rules
      this.applyRolloutRules();
      
      // Save updated flags
      await this.saveFlags();
      
      this.isInitialized = true;
      
      console.log('Feature flags initialized:', this.flags);
    } catch (error) {
      console.error('Error initializing feature flags:', error);
      // Use default flags if there's an error
      this.flags = { ...DEFAULT_FEATURE_FLAGS };
      this.isInitialized = true;
    }
  }

  /**
   * Get the value of a feature flag
   * @param flagName Feature flag name
   * @param defaultValue Default value if flag is not found
   * @returns Feature flag value
   */
  getFlag<T>(flagName: string, defaultValue?: T): T {
    if (!this.isInitialized) {
      console.warn('Feature flag service not initialized. Using default value for:', flagName);
      return (defaultValue !== undefined) ? defaultValue : (DEFAULT_FEATURE_FLAGS[flagName] as T);
    }

    if (this.flags[flagName] === undefined) {
      return (defaultValue !== undefined) ? defaultValue : (DEFAULT_FEATURE_FLAGS[flagName] as T);
    }

    return this.flags[flagName] as T;
  }

  /**
   * Set the value of a feature flag
   * @param flagName Feature flag name
   * @param value Feature flag value
   */
  async setFlag<T>(flagName: string, value: T): Promise<void> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    this.flags[flagName] = value;
    await this.saveFlags();
  }

  /**
   * Reset all feature flags to their default values
   */
  async resetFlags(): Promise<void> {
    this.flags = { ...DEFAULT_FEATURE_FLAGS };
    await this.saveFlags();
  }

  /**
   * Apply rollout rules to feature flags
   */
  private applyRolloutRules(): void {
    for (const [flagName, config] of Object.entries(FEATURE_FLAGS_CONFIG)) {
      // Skip if no rollout configuration
      if (!config.rollout) {
        continue;
      }

      // Check platform compatibility
      if (config.platform) {
        const platform = Platform.OS as 'ios' | 'android';
        if (config.platform[platform] === false) {
          this.flags[flagName] = false;
          continue;
        }
      }

      // Check dependencies
      if (config.dependsOn) {
        const dependenciesMet = config.dependsOn.every(dep => this.flags[dep] === true);
        if (!dependenciesMet) {
          this.flags[flagName] = false;
          continue;
        }
      }

      // Apply rollout rules based on segment
      switch (config.rollout.segment) {
        case UserSegment.ALL:
          // Flag is enabled for all users
          this.flags[flagName] = config.rollout.value;
          break;

        case UserSegment.BETA:
          // Flag is enabled for beta users
          this.flags[flagName] = this.userSegments.includes(UserSegment.BETA)
            ? config.rollout.value
            : config.defaultValue;
          break;

        case UserSegment.ADMIN:
          // Flag is enabled for admin users
          this.flags[flagName] = this.userSegments.includes(UserSegment.ADMIN)
            ? config.rollout.value
            : config.defaultValue;
          break;

        case UserSegment.PERCENTAGE:
          // Flag is enabled for a percentage of users
          if (config.rollout.variants) {
            // A/B testing with variants
            const variantCount = config.rollout.variants.length;
            const variantIndex = Math.floor(this.userPercentile / (100 / variantCount));
            this.flags[flagName] = config.rollout.variants[variantIndex] || config.defaultValue;
          } else {
            // Simple percentage rollout
            this.flags[flagName] = this.userPercentile < config.rollout.value
              ? true
              : config.defaultValue;
          }
          break;

        default:
          // Use default value
          this.flags[flagName] = config.defaultValue;
          break;
      }
    }
  }

  /**
   * Load feature flags from storage
   */
  private async loadFlags(): Promise<Record<string, any>> {
    try {
      const savedFlags = await AsyncStorage.getItem(FEATURE_FLAGS_STORAGE_KEY);
      return savedFlags ? JSON.parse(savedFlags) : {};
    } catch (error) {
      console.error('Error loading feature flags:', error);
      return {};
    }
  }

  /**
   * Save feature flags to storage
   */
  private async saveFlags(): Promise<void> {
    try {
      await AsyncStorage.setItem(FEATURE_FLAGS_STORAGE_KEY, JSON.stringify(this.flags));
    } catch (error) {
      console.error('Error saving feature flags:', error);
    }
  }
}

// Create and export the feature flag service instance
export const featureFlagService = new FeatureFlagService();

// React hook for using feature flags in components
import { useState, useEffect } from 'react';

/**
 * Hook for using feature flags in components
 * @param flagName Feature flag name
 * @param defaultValue Default value if flag is not found
 * @returns Feature flag value
 */
export function useFeatureFlag<T>(flagName: string, defaultValue?: T): T {
  const [flagValue, setFlagValue] = useState<T>(
    featureFlagService.getFlag<T>(flagName, defaultValue)
  );

  useEffect(() => {
    // Initialize feature flags if not already initialized
    if (!featureFlagService.isInitialized) {
      featureFlagService.initialize().then(() => {
        setFlagValue(featureFlagService.getFlag<T>(flagName, defaultValue));
      });
    }
  }, [flagName, defaultValue]);

  return flagValue;
}

export default featureFlagService;