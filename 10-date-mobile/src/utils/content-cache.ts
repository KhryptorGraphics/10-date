import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Content Cache Utility
 * 
 * This utility provides functions for caching and retrieving content
 * to improve performance and enable offline access.
 */

// Cache keys
export const CACHE_KEYS = {
  POLICY_CONTENT: 'privacy_policy_content',
  RIGHTS_CONTENT: 'privacy_rights_content',
  FAQ_CONTENT: 'privacy_faq_content',
  CONTACT_CONTENT: 'privacy_contact_content',
  CONSENT_PREFERENCES: 'privacy_consent_preferences',
  EXPORT_HISTORY: 'privacy_export_history',
};

// Cache expiration times (in milliseconds)
export const CACHE_EXPIRATION = {
  SHORT: 1 * 60 * 60 * 1000, // 1 hour
  MEDIUM: 24 * 60 * 60 * 1000, // 24 hours
  LONG: 7 * 24 * 60 * 60 * 1000, // 7 days
};

// Cache item interface
export interface CacheItem<T> {
  data: T;
  timestamp: number;
  version?: string;
}

/**
 * Save data to cache
 * 
 * @param key Cache key
 * @param data Data to cache
 * @param expiration Cache expiration time in milliseconds
 * @param version Optional version string for cache invalidation
 * @returns Promise that resolves when data is cached
 */
export const saveToCache = async <T>(
  key: string,
  data: T,
  expiration: number = CACHE_EXPIRATION.MEDIUM,
  version?: string
): Promise<void> => {
  try {
    const cacheItem: CacheItem<T> = {
      data,
      timestamp: Date.now() + expiration, // Expiration timestamp
      version,
    };
    
    await AsyncStorage.setItem(key, JSON.stringify(cacheItem));
    console.log(`Cached data for key: ${key}`);
  } catch (error) {
    console.error(`Error caching data for key ${key}:`, error);
    throw error;
  }
};

/**
 * Get data from cache
 * 
 * @param key Cache key
 * @param currentVersion Optional current version to check against cached version
 * @returns Promise that resolves to cached data or null if not found or expired
 */
export const getFromCache = async <T>(
  key: string,
  currentVersion?: string
): Promise<T | null> => {
  try {
    const cachedItemJson = await AsyncStorage.getItem(key);
    
    if (!cachedItemJson) {
      return null;
    }
    
    const cachedItem: CacheItem<T> = JSON.parse(cachedItemJson);
    const now = Date.now();
    
    // Check if cache is expired
    if (now > cachedItem.timestamp) {
      console.log(`Cache expired for key: ${key}`);
      return null;
    }
    
    // Check if version is different
    if (currentVersion && cachedItem.version && currentVersion !== cachedItem.version) {
      console.log(`Cache version mismatch for key: ${key}`);
      return null;
    }
    
    console.log(`Retrieved cached data for key: ${key}`);
    return cachedItem.data;
  } catch (error) {
    console.error(`Error retrieving cached data for key ${key}:`, error);
    return null;
  }
};

/**
 * Remove item from cache
 * 
 * @param key Cache key
 * @returns Promise that resolves when item is removed
 */
export const removeFromCache = async (key: string): Promise<void> => {
  try {
    await AsyncStorage.removeItem(key);
    console.log(`Removed cache for key: ${key}`);
  } catch (error) {
    console.error(`Error removing cache for key ${key}:`, error);
    throw error;
  }
};

/**
 * Clear all cached content
 * 
 * @returns Promise that resolves when all cache is cleared
 */
export const clearAllCache = async (): Promise<void> => {
  try {
    const keys = Object.values(CACHE_KEYS);
    await AsyncStorage.multiRemove(keys);
    console.log('Cleared all cached content');
  } catch (error) {
    console.error('Error clearing all cached content:', error);
    throw error;
  }
};

/**
 * Check if cache exists and is valid
 * 
 * @param key Cache key
 * @param currentVersion Optional current version to check against cached version
 * @returns Promise that resolves to boolean indicating if cache is valid
 */
export const isCacheValid = async (
  key: string,
  currentVersion?: string
): Promise<boolean> => {
  try {
    const cachedItemJson = await AsyncStorage.getItem(key);
    
    if (!cachedItemJson) {
      return false;
    }
    
    const cachedItem: CacheItem<any> = JSON.parse(cachedItemJson);
    const now = Date.now();
    
    // Check if cache is expired
    if (now > cachedItem.timestamp) {
      return false;
    }
    
    // Check if version is different
    if (currentVersion && cachedItem.version && currentVersion !== cachedItem.version) {
      return false;
    }
    
    return true;
  } catch (error) {
    console.error(`Error checking cache validity for key ${key}:`, error);
    return false;
  }
};

/**
 * Get cache expiration time
 * 
 * @param key Cache key
 * @returns Promise that resolves to remaining time in milliseconds or null if not found
 */
export const getCacheExpirationTime = async (key: string): Promise<number | null> => {
  try {
    const cachedItemJson = await AsyncStorage.getItem(key);
    
    if (!cachedItemJson) {
      return null;
    }
    
    const cachedItem: CacheItem<any> = JSON.parse(cachedItemJson);
    const now = Date.now();
    
    // Calculate remaining time
    const remainingTime = cachedItem.timestamp - now;
    
    return remainingTime > 0 ? remainingTime : null;
  } catch (error) {
    console.error(`Error getting cache expiration time for key ${key}:`, error);
    return null;
  }
};

/**
 * Update cache version
 * 
 * @param key Cache key
 * @param newVersion New version string
 * @returns Promise that resolves when version is updated
 */
export const updateCacheVersion = async (
  key: string,
  newVersion: string
): Promise<void> => {
  try {
    const cachedItemJson = await AsyncStorage.getItem(key);
    
    if (!cachedItemJson) {
      return;
    }
    
    const cachedItem: CacheItem<any> = JSON.parse(cachedItemJson);
    
    // Update version
    cachedItem.version = newVersion;
    
    await AsyncStorage.setItem(key, JSON.stringify(cachedItem));
    console.log(`Updated cache version for key: ${key}`);
  } catch (error) {
    console.error(`Error updating cache version for key ${key}:`, error);
    throw error;
  }
};

/**
 * Extend cache expiration time
 * 
 * @param key Cache key
 * @param additionalTime Additional time in milliseconds
 * @returns Promise that resolves when expiration is extended
 */
export const extendCacheExpiration = async (
  key: string,
  additionalTime: number
): Promise<void> => {
  try {
    const cachedItemJson = await AsyncStorage.getItem(key);
    
    if (!cachedItemJson) {
      return;
    }
    
    const cachedItem: CacheItem<any> = JSON.parse(cachedItemJson);
    
    // Extend expiration time
    cachedItem.timestamp += additionalTime;
    
    await AsyncStorage.setItem(key, JSON.stringify(cachedItem));
    console.log(`Extended cache expiration for key: ${key}`);
  } catch (error) {
    console.error(`Error extending cache expiration for key ${key}:`, error);
    throw error;
  }
};

/**
 * Create a hook for using cached content
 * 
 * @param key Cache key
 * @param fetchFunction Function to fetch fresh data
 * @param expiration Cache expiration time in milliseconds
 * @param version Optional version string for cache invalidation
 * @returns Object with data, loading state, error, and refresh function
 */
export const useCachedContent = <T>(
  key: string,
  fetchFunction: () => Promise<T>,
  expiration: number = CACHE_EXPIRATION.MEDIUM,
  version?: string
): {
  data: T | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  isOffline: boolean;
} => {
  const [data, setData] = React.useState<T | null>(null);
  const [loading, setLoading] = React.useState<boolean>(true);
  const [error, setError] = React.useState<string | null>(null);
  const [isOffline, setIsOffline] = React.useState<boolean>(false);
  
  // Function to load content
  const loadContent = React.useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Check network connectivity
      const isConnected = await NetInfo.fetch().then(state => state.isConnected);
      setIsOffline(!isConnected);
      
      // Try to get from cache first
      const cachedData = await getFromCache<T>(key, version);
      
      if (cachedData) {
        setData(cachedData);
        setLoading(false);
        
        // If online, refresh cache in background
        if (isConnected) {
          refreshCache();
        }
        return;
      }
      
      // If offline and no cache, show error
      if (!isConnected) {
        setError('No internet connection and no cached data available');
        setLoading(false);
        return;
      }
      
      // Fetch fresh data
      await refreshCache();
    } catch (err) {
      setError('Failed to load content. Please try again later.');
      console.error(`Error loading content for key ${key}:`, err);
      setLoading(false);
    }
  }, [key, version, fetchFunction, expiration]);
  
  // Function to refresh cache
  const refreshCache = async () => {
    try {
      const freshData = await fetchFunction();
      setData(freshData);
      
      // Update cache
      await saveToCache<T>(key, freshData, expiration, version);
      
      setLoading(false);
    } catch (err) {
      setError('Failed to refresh content. Please try again later.');
      console.error(`Error refreshing content for key ${key}:`, err);
      setLoading(false);
    }
  };
  
  // Load content on mount and when dependencies change
  React.useEffect(() => {
    loadContent();
  }, [loadContent]);
  
  return { data, loading, error, refresh: loadContent, isOffline };
};

// Import these at the top of the file
import React from 'react';
import NetInfo from '@react-native-community/netinfo';

export default {
  saveToCache,
  getFromCache,
  removeFromCache,
  clearAllCache,
  isCacheValid,
  getCacheExpirationTime,
  updateCacheVersion,
  extendCacheExpiration,
  useCachedContent,
  CACHE_KEYS,
  CACHE_EXPIRATION,
};