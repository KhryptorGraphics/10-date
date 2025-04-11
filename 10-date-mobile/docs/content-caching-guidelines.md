# Content Caching Guidelines

This document provides guidelines for using the content caching system in the 10-Date mobile application. The caching system is designed to improve performance, reduce network usage, and enable offline access to content.

## Table of Contents

1. [Overview](#overview)
2. [Key Components](#key-components)
3. [Basic Usage](#basic-usage)
4. [Advanced Usage](#advanced-usage)
5. [Best Practices](#best-practices)
6. [Troubleshooting](#troubleshooting)
7. [API Reference](#api-reference)

## Overview

The content caching system provides a way to store and retrieve data locally on the device, with support for:

- **Expiration times**: Cache items automatically expire after a specified time
- **Version-based invalidation**: Cache items are invalidated when the version changes
- **Offline support**: Content can be accessed even when the device is offline
- **Background refresh**: Content is refreshed in the background when the device is online

The system is particularly useful for caching privacy-related content that doesn't change frequently, such as privacy policies, user rights information, and FAQs.

## Key Components

The caching system consists of the following key components:

- **`content-cache.ts`**: The main utility file that provides caching functions
- **Cache keys**: Predefined keys for different types of content
- **Expiration times**: Predefined expiration times for different types of content
- **React hook**: A hook for using cached content in React components

## Basic Usage

### Using the `useCachedContent` Hook

The easiest way to use the caching system is with the `useCachedContent` hook:

```typescript
import contentCache, { CACHE_KEYS, CACHE_EXPIRATION } from '../utils/content-cache';

const MyComponent = () => {
  // Use the hook to fetch and cache data
  const { data, loading, error, refresh, isOffline } = contentCache.useCachedContent(
    CACHE_KEYS.POLICY_CONTENT,
    fetchPolicyContent,
    CACHE_EXPIRATION.MEDIUM,
    '1.0.0'
  );

  // Function to fetch fresh data
  const fetchPolicyContent = async () => {
    const response = await fetch('https://api.example.com/policy');
    return response.json();
  };

  // Render based on the state
  if (loading) {
    return <LoadingIndicator />;
  }

  if (error) {
    return <ErrorMessage message={error} />;
  }

  if (isOffline && !data) {
    return <OfflineMessage />;
  }

  return (
    <View>
      {isOffline && <OfflineBanner />}
      <PolicyContent data={data} />
      <Button title="Refresh" onPress={refresh} />
    </View>
  );
};
```

### Manual Caching

You can also use the caching functions directly:

```typescript
import contentCache, { CACHE_KEYS, CACHE_EXPIRATION } from '../utils/content-cache';

// Save data to cache
const saveData = async (data) => {
  await contentCache.saveToCache(
    CACHE_KEYS.POLICY_CONTENT,
    data,
    CACHE_EXPIRATION.MEDIUM,
    '1.0.0'
  );
};

// Get data from cache
const getData = async () => {
  const data = await contentCache.getFromCache(
    CACHE_KEYS.POLICY_CONTENT,
    '1.0.0'
  );
  return data;
};

// Remove data from cache
const removeData = async () => {
  await contentCache.removeFromCache(CACHE_KEYS.POLICY_CONTENT);
};

// Clear all cache
const clearCache = async () => {
  await contentCache.clearAllCache();
};
```

## Advanced Usage

### Cache Invalidation

The caching system supports two types of cache invalidation:

1. **Time-based invalidation**: Cache items automatically expire after a specified time
2. **Version-based invalidation**: Cache items are invalidated when the version changes

#### Time-based Invalidation

```typescript
// Cache for 1 hour
await contentCache.saveToCache(
  CACHE_KEYS.POLICY_CONTENT,
  data,
  CACHE_EXPIRATION.SHORT // 1 hour
);

// Cache for 24 hours
await contentCache.saveToCache(
  CACHE_KEYS.POLICY_CONTENT,
  data,
  CACHE_EXPIRATION.MEDIUM // 24 hours
);

// Cache for 7 days
await contentCache.saveToCache(
  CACHE_KEYS.POLICY_CONTENT,
  data,
  CACHE_EXPIRATION.LONG // 7 days
);

// Cache for a custom time (in milliseconds)
await contentCache.saveToCache(
  CACHE_KEYS.POLICY_CONTENT,
  data,
  12 * 60 * 60 * 1000 // 12 hours
);
```

#### Version-based Invalidation

```typescript
// Save data with version
await contentCache.saveToCache(
  CACHE_KEYS.POLICY_CONTENT,
  data,
  CACHE_EXPIRATION.MEDIUM,
  '1.0.0'
);

// Get data with version check
const data = await contentCache.getFromCache(
  CACHE_KEYS.POLICY_CONTENT,
  '1.0.0'
);
// Returns null if the cached version doesn't match

// Update cache version without changing data
await contentCache.updateCacheVersion(
  CACHE_KEYS.POLICY_CONTENT,
  '1.1.0'
);
```

### Offline Support

The `useCachedContent` hook provides built-in offline support:

```typescript
const { data, loading, error, refresh, isOffline } = contentCache.useCachedContent(
  CACHE_KEYS.POLICY_CONTENT,
  fetchPolicyContent
);

// Check if the device is offline
if (isOffline) {
  // Show offline indicator
}

// If offline and no cached data
if (isOffline && !data) {
  // Show offline message
}
```

### Cache Expiration Management

You can check and extend cache expiration:

```typescript
// Check if cache is valid
const isValid = await contentCache.isCacheValid(
  CACHE_KEYS.POLICY_CONTENT,
  '1.0.0'
);

// Get cache expiration time (in milliseconds)
const expirationTime = await contentCache.getCacheExpirationTime(
  CACHE_KEYS.POLICY_CONTENT
);

// Extend cache expiration
await contentCache.extendCacheExpiration(
  CACHE_KEYS.POLICY_CONTENT,
  24 * 60 * 60 * 1000 // Extend by 24 hours
);
```

## Best Practices

### When to Use Caching

- **Use caching for**:
  - Content that doesn't change frequently (e.g., privacy policy, FAQs)
  - Content that is expensive to fetch (e.g., large data sets)
  - Content that should be available offline

- **Don't use caching for**:
  - Sensitive user data that should be encrypted
  - Content that changes frequently
  - Small, easily fetchable data

### Choosing Expiration Times

- **Short (1 hour)**:
  - Content that may change somewhat frequently
  - Content that is less critical to be up-to-date

- **Medium (24 hours)**:
  - Content that changes occasionally
  - Most privacy-related content

- **Long (7 days)**:
  - Content that rarely changes
  - Static reference content

### Version Management

- Use semantic versioning for cache versions (e.g., `1.0.0`)
- Increment the version when the content structure changes
- Consider using a content hash as the version for automatic invalidation

### Offline Experience

- Always check `isOffline` to show appropriate UI indicators
- Provide clear messaging when content is not available offline
- Use placeholder content when possible

### Performance Considerations

- Cache only what's necessary
- Use appropriate expiration times
- Consider the size of cached data (avoid caching very large data sets)
- Implement pagination for large content

## Troubleshooting

### Common Issues

#### Cache Not Working

- Check if AsyncStorage is working properly
- Verify that the cache key is correct
- Check if the cache has expired
- Check if the version has changed

#### Offline Mode Not Detected

- Ensure NetInfo is properly configured
- Check if the device has connectivity
- Verify that the offline detection logic is working

#### Memory Issues

- Reduce the amount of cached data
- Implement pagination for large content
- Clear unused cache items

### Debugging

- Use the `__DEV__` flag to enable debug logging
- Check AsyncStorage content using the React Native Debugger
- Monitor cache operations in development

## API Reference

### Constants

#### Cache Keys

```typescript
export const CACHE_KEYS = {
  POLICY_CONTENT: 'privacy_policy_content',
  RIGHTS_CONTENT: 'privacy_rights_content',
  FAQ_CONTENT: 'privacy_faq_content',
  CONTACT_CONTENT: 'privacy_contact_content',
  CONSENT_PREFERENCES: 'privacy_consent_preferences',
  EXPORT_HISTORY: 'privacy_export_history',
};
```

#### Cache Expiration Times

```typescript
export const CACHE_EXPIRATION = {
  SHORT: 1 * 60 * 60 * 1000, // 1 hour
  MEDIUM: 24 * 60 * 60 * 1000, // 24 hours
  LONG: 7 * 24 * 60 * 60 * 1000, // 7 days
};
```

### Functions

#### `saveToCache<T>`

Saves data to the cache.

```typescript
saveToCache<T>(
  key: string,
  data: T,
  expiration: number = CACHE_EXPIRATION.MEDIUM,
  version?: string
): Promise<void>
```

#### `getFromCache<T>`

Gets data from the cache.

```typescript
getFromCache<T>(
  key: string,
  currentVersion?: string
): Promise<T | null>
```

#### `removeFromCache`

Removes an item from the cache.

```typescript
removeFromCache(key: string): Promise<void>
```

#### `clearAllCache`

Clears all cached content.

```typescript
clearAllCache(): Promise<void>
```

#### `isCacheValid`

Checks if cache exists and is valid.

```typescript
isCacheValid(
  key: string,
  currentVersion?: string
): Promise<boolean>
```

#### `getCacheExpirationTime`

Gets the remaining cache expiration time.

```typescript
getCacheExpirationTime(key: string): Promise<number | null>
```

#### `updateCacheVersion`

Updates the version of a cached item.

```typescript
updateCacheVersion(
  key: string,
  newVersion: string
): Promise<void>
```

#### `extendCacheExpiration`

Extends the expiration time of a cached item.

```typescript
extendCacheExpiration(
  key: string,
  additionalTime: number
): Promise<void>
```

### Hooks

#### `useCachedContent<T>`

A hook for using cached content in React components.

```typescript
useCachedContent<T>(
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
}
```

---

## Example Implementation

Here's a complete example of using the caching system in a component:

```typescript
import React from 'react';
import { View, Text, ActivityIndicator, Button } from 'react-native';
import contentCache, { CACHE_KEYS, CACHE_EXPIRATION } from '../utils/content-cache';

const PrivacyPolicyScreen = () => {
  // Define the fetch function
  const fetchPolicyContent = async () => {
    try {
      const response = await fetch('https://api.example.com/privacy-policy');
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching policy content:', error);
      throw error;
    }
  };

  // Use the hook to fetch and cache data
  const { data, loading, error, refresh, isOffline } = contentCache.useCachedContent(
    CACHE_KEYS.POLICY_CONTENT,
    fetchPolicyContent,
    CACHE_EXPIRATION.MEDIUM,
    '1.0.0'
  );

  // Render based on the state
  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#FF006E" />
        <Text style={{ marginTop: 10 }}>Loading privacy policy...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
        <Text style={{ color: 'red', textAlign: 'center', marginBottom: 20 }}>
          {error}
        </Text>
        <Button title="Try Again" onPress={refresh} />
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      {isOffline && (
        <View style={{ backgroundColor: '#FFF3CD', padding: 10 }}>
          <Text style={{ color: '#856404', textAlign: 'center' }}>
            You are currently offline. Showing cached content.
          </Text>
        </View>
      )}
      
      <View style={{ padding: 16 }}>
        <Text style={{ fontSize: 24, fontWeight: 'bold', marginBottom: 16 }}>
          Privacy Policy
        </Text>
        
        {data ? (
          <>
            <Text style={{ fontSize: 16, lineHeight: 24 }}>
              {data.content}
            </Text>
            
            <Text style={{ marginTop: 16, fontStyle: 'italic' }}>
              Last Updated: {data.lastUpdated}
            </Text>
          </>
        ) : (
          <Text>No privacy policy content available.</Text>
        )}
        
        <Button
          title="Refresh"
          onPress={refresh}
          disabled={loading}
          style={{ marginTop: 20 }}
        />
      </View>
    </View>
  );
};

export default PrivacyPolicyScreen;
```

This example demonstrates a complete implementation of the caching system in a privacy policy screen, including loading states, error handling, and offline support.