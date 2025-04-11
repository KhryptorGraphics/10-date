/**
 * Monitoring Service
 * 
 * This service provides monitoring and alerting for the Privacy Center features.
 * It tracks performance metrics, error rates, and usage patterns to help identify
 * issues and optimize the user experience.
 */

import { Platform } from 'react-native';
import NetInfo from '@react-native-community/netinfo';
import { featureFlagService } from '../config/feature-flags';
import firebaseAnalyticsService from './firebase-analytics.service';

// Monitoring event types
export enum MonitoringEventType {
  // Performance events
  PERFORMANCE_METRIC = 'performance_metric',
  SCREEN_LOAD_TIME = 'screen_load_time',
  NETWORK_REQUEST = 'network_request',
  CACHE_OPERATION = 'cache_operation',
  
  // Error events
  ERROR = 'error',
  CACHE_ERROR = 'cache_error',
  NETWORK_ERROR = 'network_error',
  RENDER_ERROR = 'render_error',
  
  // Usage events
  FEATURE_USAGE = 'feature_usage',
  OFFLINE_USAGE = 'offline_usage',
  CACHE_HIT = 'cache_hit',
  CACHE_MISS = 'cache_miss',
}

// Monitoring event severity
export enum MonitoringEventSeverity {
  INFO = 'info',
  WARNING = 'warning',
  ERROR = 'error',
  CRITICAL = 'critical',
}

// Monitoring event interface
export interface MonitoringEvent {
  type: MonitoringEventType;
  name: string;
  timestamp: number;
  severity: MonitoringEventSeverity;
  data?: Record<string, any>;
  tags?: string[];
}

// Performance metric interface
export interface PerformanceMetric {
  name: string;
  value: number;
  unit: 'ms' | 'bytes' | 'count' | 'percentage';
  context?: Record<string, any>;
}

// Error event interface
export interface ErrorEvent {
  name: string;
  message: string;
  stack?: string;
  context?: Record<string, any>;
}

// Network info interface
export interface NetworkInfo {
  isConnected: boolean;
  connectionType?: string;
  isInternetReachable?: boolean;
}

// Device info interface
export interface DeviceInfo {
  platform: string;
  version: string;
  appVersion: string;
  deviceModel?: string;
  memoryUsage?: number;
}

// Monitoring service class
class MonitoringService {
  private events: MonitoringEvent[] = [];
  private maxEvents: number = 100;
  private isEnabled: boolean = true;
  private networkInfo: NetworkInfo = { isConnected: true };
  private deviceInfo: DeviceInfo = {
    platform: Platform.OS,
    version: Platform.Version.toString(),
    appVersion: '1.0.0', // Replace with actual app version
  };
  private performanceMetrics: Record<string, number[]> = {};
  private errorCounts: Record<string, number> = {};
  private alertCallbacks: ((event: MonitoringEvent) => void)[] = [];
  private flushInterval: NodeJS.Timeout | null = null;
  private isInitialized: boolean = false;

  /**
   * Initialize the monitoring service
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    try {
      // Check if monitoring is enabled via feature flags
      this.isEnabled = featureFlagService.getFlag('privacy-center-analytics', true);
      
      // Set up network info listener
      NetInfo.addEventListener(state => {
        this.networkInfo = {
          isConnected: state.isConnected ?? false,
          connectionType: state.type,
          isInternetReachable: state.isInternetReachable,
        };
      });
      
      // Set up flush interval
      this.flushInterval = setInterval(() => {
        this.flushEvents();
      }, 60000); // Flush every minute
      
      this.isInitialized = true;
      
      // Log initialization
      this.logEvent({
        type: MonitoringEventType.FEATURE_USAGE,
        name: 'monitoring_initialized',
        timestamp: Date.now(),
        severity: MonitoringEventSeverity.INFO,
        data: {
          isEnabled: this.isEnabled,
        },
      });
      
      console.log('Monitoring service initialized');
    } catch (error) {
      console.error('Error initializing monitoring service:', error);
    }
  }

  /**
   * Log a monitoring event
   * @param event Monitoring event
   */
  logEvent(event: MonitoringEvent): void {
    if (!this.isEnabled) {
      return;
    }

    // Add event to queue
    this.events.push(event);
    
    // Trim events if needed
    if (this.events.length > this.maxEvents) {
      this.events = this.events.slice(-this.maxEvents);
    }
    
    // Check if event should trigger an alert
    if (event.severity === MonitoringEventSeverity.ERROR || 
        event.severity === MonitoringEventSeverity.CRITICAL) {
      this.triggerAlert(event);
    }
    
    // Track error counts
    if (event.type.includes('ERROR')) {
      this.errorCounts[event.name] = (this.errorCounts[event.name] || 0) + 1;
    }
    
    // Log to console in development
    if (__DEV__) {
      console.log(`[Monitoring] ${event.severity.toUpperCase()}: ${event.type} - ${event.name}`, event.data);
    }
  }

  /**
   * Log a performance metric
   * @param metric Performance metric
   */
  logPerformanceMetric(metric: PerformanceMetric): void {
    if (!this.isEnabled) {
      return;
    }

    // Store metric for aggregation
    if (!this.performanceMetrics[metric.name]) {
      this.performanceMetrics[metric.name] = [];
    }
    this.performanceMetrics[metric.name].push(metric.value);
    
    // Trim metrics if needed
    if (this.performanceMetrics[metric.name].length > 100) {
      this.performanceMetrics[metric.name] = this.performanceMetrics[metric.name].slice(-100);
    }
    
    // Log event
    this.logEvent({
      type: MonitoringEventType.PERFORMANCE_METRIC,
      name: metric.name,
      timestamp: Date.now(),
      severity: MonitoringEventSeverity.INFO,
      data: {
        value: metric.value,
        unit: metric.unit,
        context: metric.context,
      },
    });
    
    // Check for performance issues
    this.checkPerformanceThresholds(metric);
  }

  /**
   * Log screen load time
   * @param screenName Screen name
   * @param loadTimeMs Load time in milliseconds
   * @param context Additional context
   */
  logScreenLoadTime(screenName: string, loadTimeMs: number, context?: Record<string, any>): void {
    this.logPerformanceMetric({
      name: `screen_load_${screenName}`,
      value: loadTimeMs,
      unit: 'ms',
      context,
    });
  }

  /**
   * Log a network request
   * @param url Request URL
   * @param method Request method
   * @param durationMs Request duration in milliseconds
   * @param status HTTP status code
   * @param context Additional context
   */
  logNetworkRequest(
    url: string,
    method: string,
    durationMs: number,
    status?: number,
    context?: Record<string, any>
  ): void {
    this.logEvent({
      type: MonitoringEventType.NETWORK_REQUEST,
      name: `network_request_${method}`,
      timestamp: Date.now(),
      severity: MonitoringEventSeverity.INFO,
      data: {
        url,
        method,
        durationMs,
        status,
        context,
      },
    });
  }

  /**
   * Log a cache operation
   * @param operation Operation type (get, set, remove)
   * @param key Cache key
   * @param durationMs Operation duration in milliseconds
   * @param success Whether the operation was successful
   * @param context Additional context
   */
  logCacheOperation(
    operation: 'get' | 'set' | 'remove',
    key: string,
    durationMs: number,
    success: boolean,
    context?: Record<string, any>
  ): void {
    this.logEvent({
      type: MonitoringEventType.CACHE_OPERATION,
      name: `cache_${operation}`,
      timestamp: Date.now(),
      severity: success ? MonitoringEventSeverity.INFO : MonitoringEventSeverity.WARNING,
      data: {
        key,
        operation,
        durationMs,
        success,
        context,
      },
    });
  }

  /**
   * Log a cache hit or miss
   * @param key Cache key
   * @param hit Whether the cache was hit
   * @param context Additional context
   */
  logCacheHitOrMiss(key: string, hit: boolean, context?: Record<string, any>): void {
    this.logEvent({
      type: hit ? MonitoringEventType.CACHE_HIT : MonitoringEventType.CACHE_MISS,
      name: hit ? 'cache_hit' : 'cache_miss',
      timestamp: Date.now(),
      severity: MonitoringEventSeverity.INFO,
      data: {
        key,
        context,
      },
    });
  }

  /**
   * Log an error
   * @param error Error object or message
   * @param context Additional context
   */
  logError(error: Error | string, context?: Record<string, any>): void {
    const errorObj = typeof error === 'string' ? new Error(error) : error;
    
    this.logEvent({
      type: MonitoringEventType.ERROR,
      name: errorObj.name || 'unknown_error',
      timestamp: Date.now(),
      severity: MonitoringEventSeverity.ERROR,
      data: {
        message: errorObj.message,
        stack: errorObj.stack,
        context,
      },
    });
  }

  /**
   * Log a cache error
   * @param error Error object or message
   * @param key Cache key
   * @param operation Cache operation
   * @param context Additional context
   */
  logCacheError(
    error: Error | string,
    key: string,
    operation: 'get' | 'set' | 'remove',
    context?: Record<string, any>
  ): void {
    const errorObj = typeof error === 'string' ? new Error(error) : error;
    
    this.logEvent({
      type: MonitoringEventType.CACHE_ERROR,
      name: `cache_error_${operation}`,
      timestamp: Date.now(),
      severity: MonitoringEventSeverity.ERROR,
      data: {
        key,
        operation,
        message: errorObj.message,
        stack: errorObj.stack,
        context,
      },
    });
  }

  /**
   * Log a network error
   * @param error Error object or message
   * @param url Request URL
   * @param method Request method
   * @param context Additional context
   */
  logNetworkError(
    error: Error | string,
    url: string,
    method: string,
    context?: Record<string, any>
  ): void {
    const errorObj = typeof error === 'string' ? new Error(error) : error;
    
    this.logEvent({
      type: MonitoringEventType.NETWORK_ERROR,
      name: `network_error_${method}`,
      timestamp: Date.now(),
      severity: MonitoringEventSeverity.ERROR,
      data: {
        url,
        method,
        message: errorObj.message,
        stack: errorObj.stack,
        context,
      },
    });
  }

  /**
   * Log a render error
   * @param error Error object or message
   * @param componentName Component name
   * @param context Additional context
   */
  logRenderError(
    error: Error | string,
    componentName: string,
    context?: Record<string, any>
  ): void {
    const errorObj = typeof error === 'string' ? new Error(error) : error;
    
    this.logEvent({
      type: MonitoringEventType.RENDER_ERROR,
      name: `render_error_${componentName}`,
      timestamp: Date.now(),
      severity: MonitoringEventSeverity.ERROR,
      data: {
        componentName,
        message: errorObj.message,
        stack: errorObj.stack,
        context,
      },
    });
  }

  /**
   * Log feature usage
   * @param featureName Feature name
   * @param context Additional context
   */
  logFeatureUsage(featureName: string, context?: Record<string, any>): void {
    this.logEvent({
      type: MonitoringEventType.FEATURE_USAGE,
      name: `feature_${featureName}`,
      timestamp: Date.now(),
      severity: MonitoringEventSeverity.INFO,
      data: {
        featureName,
        context,
      },
    });
  }

  /**
   * Log offline usage
   * @param featureName Feature name
   * @param context Additional context
   */
  logOfflineUsage(featureName: string, context?: Record<string, any>): void {
    this.logEvent({
      type: MonitoringEventType.OFFLINE_USAGE,
      name: `offline_${featureName}`,
      timestamp: Date.now(),
      severity: MonitoringEventSeverity.INFO,
      data: {
        featureName,
        context,
      },
    });
  }

  /**
   * Register an alert callback
   * @param callback Alert callback function
   */
  registerAlertCallback(callback: (event: MonitoringEvent) => void): void {
    this.alertCallbacks.push(callback);
  }

  /**
   * Get performance metrics
   * @returns Performance metrics
   */
  getPerformanceMetrics(): Record<string, { avg: number; min: number; max: number; count: number }> {
    const metrics: Record<string, { avg: number; min: number; max: number; count: number }> = {};
    
    for (const [name, values] of Object.entries(this.performanceMetrics)) {
      if (values.length === 0) {
        continue;
      }
      
      const sum = values.reduce((a, b) => a + b, 0);
      const avg = sum / values.length;
      const min = Math.min(...values);
      const max = Math.max(...values);
      
      metrics[name] = {
        avg,
        min,
        max,
        count: values.length,
      };
    }
    
    return metrics;
  }

  /**
   * Get error counts
   * @returns Error counts
   */
  getErrorCounts(): Record<string, number> {
    return { ...this.errorCounts };
  }

  /**
   * Get recent events
   * @param limit Maximum number of events to return
   * @returns Recent events
   */
  getRecentEvents(limit: number = 10): MonitoringEvent[] {
    return this.events.slice(-limit);
  }

  /**
   * Flush events to analytics service
   */
  private flushEvents(): void {
    if (!this.isEnabled || this.events.length === 0) {
      return;
    }

    try {
      // Group events by type
      const eventsByType: Record<string, MonitoringEvent[]> = {};
      
      for (const event of this.events) {
        if (!eventsByType[event.type]) {
          eventsByType[event.type] = [];
        }
        eventsByType[event.type].push(event);
      }
      
      // Send aggregated events to analytics
      for (const [type, events] of Object.entries(eventsByType)) {
        firebaseAnalyticsService.logEvent('monitoring_events', {
          type,
          count: events.length,
          errors: events.filter(e => e.severity === MonitoringEventSeverity.ERROR || 
                                    e.severity === MonitoringEventSeverity.CRITICAL).length,
          timestamp: Date.now(),
        });
      }
      
      // Send performance metrics
      const metrics = this.getPerformanceMetrics();
      
      for (const [name, metric] of Object.entries(metrics)) {
        firebaseAnalyticsService.logEvent('performance_metric', {
          name,
          avg: metric.avg,
          min: metric.min,
          max: metric.max,
          count: metric.count,
          timestamp: Date.now(),
        });
      }
      
      // Clear events
      this.events = [];
      
      console.log('Monitoring events flushed to analytics');
    } catch (error) {
      console.error('Error flushing monitoring events:', error);
    }
  }

  /**
   * Check performance thresholds
   * @param metric Performance metric
   */
  private checkPerformanceThresholds(metric: PerformanceMetric): void {
    // Define thresholds for different metrics
    const thresholds: Record<string, { warning: number; error: number; unit: string }> = {
      'screen_load_PrivacyCenterScreen': { warning: 500, error: 1000, unit: 'ms' },
      'screen_load_PrivacyInformationScreen': { warning: 800, error: 1500, unit: 'ms' },
      'screen_load_DataAccessScreen': { warning: 500, error: 1000, unit: 'ms' },
      'screen_load_ConsentManagementScreen': { warning: 500, error: 1000, unit: 'ms' },
      'screen_load_AccountManagementScreen': { warning: 500, error: 1000, unit: 'ms' },
      'cache_get': { warning: 100, error: 300, unit: 'ms' },
      'cache_set': { warning: 200, error: 500, unit: 'ms' },
    };
    
    // Check if metric has a threshold
    const threshold = thresholds[metric.name];
    
    if (!threshold) {
      return;
    }
    
    // Check if metric exceeds thresholds
    if (metric.value >= threshold.error) {
      this.logEvent({
        type: MonitoringEventType.PERFORMANCE_METRIC,
        name: `${metric.name}_threshold_exceeded`,
        timestamp: Date.now(),
        severity: MonitoringEventSeverity.ERROR,
        data: {
          value: metric.value,
          threshold: threshold.error,
          unit: threshold.unit,
          context: metric.context,
        },
      });
    } else if (metric.value >= threshold.warning) {
      this.logEvent({
        type: MonitoringEventType.PERFORMANCE_METRIC,
        name: `${metric.name}_threshold_warning`,
        timestamp: Date.now(),
        severity: MonitoringEventSeverity.WARNING,
        data: {
          value: metric.value,
          threshold: threshold.warning,
          unit: threshold.unit,
          context: metric.context,
        },
      });
    }
  }

  /**
   * Trigger an alert for an event
   * @param event Monitoring event
   */
  private triggerAlert(event: MonitoringEvent): void {
    // Call all registered alert callbacks
    for (const callback of this.alertCallbacks) {
      try {
        callback(event);
      } catch (error) {
        console.error('Error in alert callback:', error);
      }
    }
    
    // Log alert to analytics
    firebaseAnalyticsService.logEvent('monitoring_alert', {
      type: event.type,
      name: event.name,
      severity: event.severity,
      timestamp: event.timestamp,
    });
  }

  /**
   * Clean up resources
   */
  cleanup(): void {
    if (this.flushInterval) {
      clearInterval(this.flushInterval);
      this.flushInterval = null;
    }
    
    // Flush any remaining events
    this.flushEvents();
    
    this.isInitialized = false;
  }
}

// Create and export the monitoring service instance
export const monitoringService = new MonitoringService();

// React hook for using monitoring in components
import { useEffect } from 'react';

/**
 * Hook for monitoring screen load time
 * @param screenName Screen name
 */
export function useScreenLoadMonitoring(screenName: string): void {
  useEffect(() => {
    const startTime = Date.now();
    
    return () => {
      const loadTime = Date.now() - startTime;
      monitoringService.logScreenLoadTime(screenName, loadTime);
    };
  }, [screenName]);
}

/**
 * Hook for monitoring feature usage
 * @param featureName Feature name
 */
export function useFeatureUsageMonitoring(featureName: string): {
  logUsage: (context?: Record<string, any>) => void;
  logError: (error: Error | string, context?: Record<string, any>) => void;
} {
  useEffect(() => {
    // Initialize monitoring service if not already initialized
    if (!monitoringService.isInitialized) {
      monitoringService.initialize();
    }
  }, []);
  
  return {
    logUsage: (context?: Record<string, any>) => {
      monitoringService.logFeatureUsage(featureName, context);
    },
    logError: (error: Error | string, context?: Record<string, any>) => {
      monitoringService.logError(error, { featureName, ...context });
    },
  };
}

export default monitoringService;