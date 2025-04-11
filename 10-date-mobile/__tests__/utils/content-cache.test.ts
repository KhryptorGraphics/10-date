import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import { renderHook, act } from '@testing-library/react-hooks';
import contentCache, {
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
} from '../../src/utils/content-cache';

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
  setItem: jest.fn(() => Promise.resolve()),
  getItem: jest.fn(() => Promise.resolve(null)),
  removeItem: jest.fn(() => Promise.resolve()),
  multiRemove: jest.fn(() => Promise.resolve()),
}));

// Mock NetInfo
jest.mock('@react-native-community/netinfo', () => ({
  fetch: jest.fn(() => Promise.resolve({ isConnected: true })),
}));

describe('Content Cache Utility', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
  });

  describe('saveToCache', () => {
    it('should save data to cache with correct format', async () => {
      const key = 'test_key';
      const data = { test: 'data' };
      const expiration = 3600000; // 1 hour
      const version = '1.0.0';

      await saveToCache(key, data, expiration, version);

      // Check if AsyncStorage.setItem was called with correct parameters
      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        key,
        expect.any(String)
      );

      // Get the saved data
      const savedData = JSON.parse(
        (AsyncStorage.setItem as jest.Mock).mock.calls[0][1]
      );

      // Check if the saved data has the correct structure
      expect(savedData).toHaveProperty('data', data);
      expect(savedData).toHaveProperty('timestamp');
      expect(savedData).toHaveProperty('version', version);

      // Check if the timestamp is in the future (current time + expiration)
      const now = Date.now();
      expect(savedData.timestamp).toBeGreaterThan(now);
      expect(savedData.timestamp).toBeLessThanOrEqual(now + expiration + 100); // Add small buffer for test execution time
    });

    it('should handle errors when saving to cache', async () => {
      // Mock AsyncStorage.setItem to throw an error
      (AsyncStorage.setItem as jest.Mock).mockRejectedValueOnce(
        new Error('Test error')
      );

      const key = 'test_key';
      const data = { test: 'data' };

      // Expect saveToCache to throw an error
      await expect(saveToCache(key, data)).rejects.toThrow('Test error');
    });
  });

  describe('getFromCache', () => {
    it('should return null if no cached data exists', async () => {
      // Mock AsyncStorage.getItem to return null
      (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(null);

      const result = await getFromCache('test_key');

      expect(result).toBeNull();
      expect(AsyncStorage.getItem).toHaveBeenCalledWith('test_key');
    });

    it('should return null if cache is expired', async () => {
      // Mock AsyncStorage.getItem to return expired cache
      const expiredCache = {
        data: { test: 'data' },
        timestamp: Date.now() - 1000, // Expired 1 second ago
        version: '1.0.0',
      };

      (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(
        JSON.stringify(expiredCache)
      );

      const result = await getFromCache('test_key');

      expect(result).toBeNull();
      expect(AsyncStorage.getItem).toHaveBeenCalledWith('test_key');
    });

    it('should return null if version mismatch', async () => {
      // Mock AsyncStorage.getItem to return cache with different version
      const cacheWithDifferentVersion = {
        data: { test: 'data' },
        timestamp: Date.now() + 3600000, // Valid for 1 hour
        version: '1.0.0',
      };

      (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(
        JSON.stringify(cacheWithDifferentVersion)
      );

      const result = await getFromCache('test_key', '2.0.0');

      expect(result).toBeNull();
      expect(AsyncStorage.getItem).toHaveBeenCalledWith('test_key');
    });

    it('should return cached data if valid', async () => {
      const testData = { test: 'data' };
      // Mock AsyncStorage.getItem to return valid cache
      const validCache = {
        data: testData,
        timestamp: Date.now() + 3600000, // Valid for 1 hour
        version: '1.0.0',
      };

      (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(
        JSON.stringify(validCache)
      );

      const result = await getFromCache('test_key', '1.0.0');

      expect(result).toEqual(testData);
      expect(AsyncStorage.getItem).toHaveBeenCalledWith('test_key');
    });

    it('should handle errors when getting from cache', async () => {
      // Mock AsyncStorage.getItem to throw an error
      (AsyncStorage.getItem as jest.Mock).mockRejectedValueOnce(
        new Error('Test error')
      );

      const result = await getFromCache('test_key');

      expect(result).toBeNull();
      expect(AsyncStorage.getItem).toHaveBeenCalledWith('test_key');
    });
  });

  describe('removeFromCache', () => {
    it('should remove item from cache', async () => {
      await removeFromCache('test_key');

      expect(AsyncStorage.removeItem).toHaveBeenCalledWith('test_key');
    });

    it('should handle errors when removing from cache', async () => {
      // Mock AsyncStorage.removeItem to throw an error
      (AsyncStorage.removeItem as jest.Mock).mockRejectedValueOnce(
        new Error('Test error')
      );

      await expect(removeFromCache('test_key')).rejects.toThrow('Test error');
    });
  });

  describe('clearAllCache', () => {
    it('should clear all cached content', async () => {
      await clearAllCache();

      expect(AsyncStorage.multiRemove).toHaveBeenCalledWith(
        Object.values(CACHE_KEYS)
      );
    });

    it('should handle errors when clearing cache', async () => {
      // Mock AsyncStorage.multiRemove to throw an error
      (AsyncStorage.multiRemove as jest.Mock).mockRejectedValueOnce(
        new Error('Test error')
      );

      await expect(clearAllCache()).rejects.toThrow('Test error');
    });
  });

  describe('isCacheValid', () => {
    it('should return false if no cached data exists', async () => {
      // Mock AsyncStorage.getItem to return null
      (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(null);

      const result = await isCacheValid('test_key');

      expect(result).toBe(false);
      expect(AsyncStorage.getItem).toHaveBeenCalledWith('test_key');
    });

    it('should return false if cache is expired', async () => {
      // Mock AsyncStorage.getItem to return expired cache
      const expiredCache = {
        data: { test: 'data' },
        timestamp: Date.now() - 1000, // Expired 1 second ago
        version: '1.0.0',
      };

      (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(
        JSON.stringify(expiredCache)
      );

      const result = await isCacheValid('test_key');

      expect(result).toBe(false);
      expect(AsyncStorage.getItem).toHaveBeenCalledWith('test_key');
    });

    it('should return false if version mismatch', async () => {
      // Mock AsyncStorage.getItem to return cache with different version
      const cacheWithDifferentVersion = {
        data: { test: 'data' },
        timestamp: Date.now() + 3600000, // Valid for 1 hour
        version: '1.0.0',
      };

      (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(
        JSON.stringify(cacheWithDifferentVersion)
      );

      const result = await isCacheValid('test_key', '2.0.0');

      expect(result).toBe(false);
      expect(AsyncStorage.getItem).toHaveBeenCalledWith('test_key');
    });

    it('should return true if cache is valid', async () => {
      // Mock AsyncStorage.getItem to return valid cache
      const validCache = {
        data: { test: 'data' },
        timestamp: Date.now() + 3600000, // Valid for 1 hour
        version: '1.0.0',
      };

      (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(
        JSON.stringify(validCache)
      );

      const result = await isCacheValid('test_key', '1.0.0');

      expect(result).toBe(true);
      expect(AsyncStorage.getItem).toHaveBeenCalledWith('test_key');
    });
  });

  describe('useCachedContent', () => {
    it('should load data from cache if available', async () => {
      const testData = { test: 'data' };
      // Mock AsyncStorage.getItem to return valid cache
      const validCache = {
        data: testData,
        timestamp: Date.now() + 3600000, // Valid for 1 hour
        version: '1.0.0',
      };

      (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(
        JSON.stringify(validCache)
      );

      // Mock fetch function
      const fetchFunction = jest.fn(() => Promise.resolve({ fresh: 'data' }));

      // Render the hook
      const { result, waitForNextUpdate } = renderHook(() =>
        useCachedContent('test_key', fetchFunction, 3600000, '1.0.0')
      );

      // Initial state
      expect(result.current.loading).toBe(true);
      expect(result.current.data).toBeNull();
      expect(result.current.error).toBeNull();

      // Wait for the hook to update
      await waitForNextUpdate();

      // Check if data is loaded from cache
      expect(result.current.loading).toBe(false);
      expect(result.current.data).toEqual(testData);
      expect(result.current.error).toBeNull();

      // Check if fetch function was not called (since cache was valid)
      expect(fetchFunction).not.toHaveBeenCalled();
    });

    it('should fetch fresh data if cache is not available', async () => {
      // Mock AsyncStorage.getItem to return null (no cache)
      (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(null);

      // Mock fetch function
      const freshData = { fresh: 'data' };
      const fetchFunction = jest.fn(() => Promise.resolve(freshData));

      // Render the hook
      const { result, waitForNextUpdate } = renderHook(() =>
        useCachedContent('test_key', fetchFunction)
      );

      // Initial state
      expect(result.current.loading).toBe(true);
      expect(result.current.data).toBeNull();
      expect(result.current.error).toBeNull();

      // Wait for the hook to update
      await waitForNextUpdate();

      // Check if data is fetched and cached
      expect(result.current.loading).toBe(false);
      expect(result.current.data).toEqual(freshData);
      expect(result.current.error).toBeNull();

      // Check if fetch function was called
      expect(fetchFunction).toHaveBeenCalled();

      // Check if data was saved to cache
      expect(AsyncStorage.setItem).toHaveBeenCalled();
    });

    it('should handle offline mode with cached data', async () => {
      const testData = { test: 'data' };
      // Mock AsyncStorage.getItem to return valid cache
      const validCache = {
        data: testData,
        timestamp: Date.now() + 3600000, // Valid for 1 hour
        version: '1.0.0',
      };

      (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(
        JSON.stringify(validCache)
      );

      // Mock NetInfo to return offline
      (NetInfo.fetch as jest.Mock).mockResolvedValueOnce({
        isConnected: false,
      });

      // Mock fetch function
      const fetchFunction = jest.fn(() => Promise.resolve({ fresh: 'data' }));

      // Render the hook
      const { result, waitForNextUpdate } = renderHook(() =>
        useCachedContent('test_key', fetchFunction)
      );

      // Wait for the hook to update
      await waitForNextUpdate();

      // Check if data is loaded from cache
      expect(result.current.loading).toBe(false);
      expect(result.current.data).toEqual(testData);
      expect(result.current.error).toBeNull();
      expect(result.current.isOffline).toBe(true);

      // Check if fetch function was not called (since offline)
      expect(fetchFunction).not.toHaveBeenCalled();
    });

    it('should show error if offline and no cache', async () => {
      // Mock AsyncStorage.getItem to return null (no cache)
      (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(null);

      // Mock NetInfo to return offline
      (NetInfo.fetch as jest.Mock).mockResolvedValueOnce({
        isConnected: false,
      });

      // Mock fetch function
      const fetchFunction = jest.fn(() => Promise.resolve({ fresh: 'data' }));

      // Render the hook
      const { result, waitForNextUpdate } = renderHook(() =>
        useCachedContent('test_key', fetchFunction)
      );

      // Wait for the hook to update
      await waitForNextUpdate();

      // Check if error is shown
      expect(result.current.loading).toBe(false);
      expect(result.current.data).toBeNull();
      expect(result.current.error).toBe(
        'No internet connection and no cached data available'
      );
      expect(result.current.isOffline).toBe(true);

      // Check if fetch function was not called (since offline)
      expect(fetchFunction).not.toHaveBeenCalled();
    });

    it('should handle fetch errors', async () => {
      // Mock AsyncStorage.getItem to return null (no cache)
      (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(null);

      // Mock fetch function to throw error
      const fetchFunction = jest.fn(() =>
        Promise.reject(new Error('Fetch error'))
      );

      // Render the hook
      const { result, waitForNextUpdate } = renderHook(() =>
        useCachedContent('test_key', fetchFunction)
      );

      // Wait for the hook to update
      await waitForNextUpdate();

      // Check if error is shown
      expect(result.current.loading).toBe(false);
      expect(result.current.data).toBeNull();
      expect(result.current.error).toBe(
        'Failed to refresh content. Please try again later.'
      );

      // Check if fetch function was called
      expect(fetchFunction).toHaveBeenCalled();
    });

    it('should refresh data when refresh function is called', async () => {
      // Mock AsyncStorage.getItem to return valid cache
      const validCache = {
        data: { test: 'data' },
        timestamp: Date.now() + 3600000, // Valid for 1 hour
        version: '1.0.0',
      };

      (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(
        JSON.stringify(validCache)
      );

      // For the refresh call, return null to force a fetch
      (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(null);

      // Mock fetch function
      const freshData = { fresh: 'data' };
      const fetchFunction = jest.fn(() => Promise.resolve(freshData));

      // Render the hook
      const { result, waitForNextUpdate } = renderHook(() =>
        useCachedContent('test_key', fetchFunction)
      );

      // Wait for the hook to update
      await waitForNextUpdate();

      // Check if data is loaded from cache
      expect(result.current.data).toEqual(validCache.data);

      // Call refresh function
      act(() => {
        result.current.refresh();
      });

      // Wait for the hook to update again
      await waitForNextUpdate();

      // Check if data is refreshed
      expect(result.current.data).toEqual(freshData);
      expect(fetchFunction).toHaveBeenCalledTimes(1);
    });
  });
});