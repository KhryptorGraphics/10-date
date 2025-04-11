import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Privacy Analytics Service
 * 
 * This service handles analytics tracking for privacy-related features.
 * It ensures all tracking is privacy-compliant and anonymized.
 */

// Event types
export enum PrivacyEventType {
  SCREEN_VIEW = 'privacy_screen_view',
  DATA_EXPORT_REQUESTED = 'privacy_data_export_requested',
  DATA_EXPORT_COMPLETED = 'privacy_data_export_completed',
  DATA_EXPORT_FAILED = 'privacy_data_export_failed',
  CONSENT_CHANGED = 'privacy_consent_changed',
  ACCOUNT_DELETION_STARTED = 'privacy_account_deletion_started',
  ACCOUNT_DELETION_COMPLETED = 'privacy_account_deletion_completed',
  ACCOUNT_ANONYMIZATION_STARTED = 'privacy_account_anonymization_started',
  ACCOUNT_ANONYMIZATION_COMPLETED = 'privacy_account_anonymization_completed',
  PRIVACY_POLICY_VIEWED = 'privacy_policy_viewed',
  PRIVACY_RIGHTS_VIEWED = 'privacy_rights_viewed',
  PRIVACY_FAQ_VIEWED = 'privacy_faq_viewed',
  PRIVACY_CONTACT_VIEWED = 'privacy_contact_viewed',
  PRIVACY_FAQ_SEARCHED = 'privacy_faq_searched',
}

// Base event interface
interface PrivacyAnalyticsEvent {
  eventType: PrivacyEventType;
  timestamp: number;
  sessionId: string;
  deviceType: string;
  appVersion: string;
  anonymizedUserId: string;
}

// Screen view event
interface ScreenViewEvent extends PrivacyAnalyticsEvent {
  screenName: string;
  tabName?: string;
}

// Data export event
interface DataExportEvent extends PrivacyAnalyticsEvent {
  exportId?: string;
  categories: string[];
  format: string;
  size?: number;
  duration?: number;
  success?: boolean;
  errorMessage?: string;
}

// Consent change event
interface ConsentChangeEvent extends PrivacyAnalyticsEvent {
  consentType: string;
  newStatus: boolean;
  previousStatus?: boolean;
  userSegment?: string;
}

// Account management event
interface AccountManagementEvent extends PrivacyAnalyticsEvent {
  actionType: 'deletion' | 'anonymization';
  reason?: string;
  dataCategories?: string[];
}

// FAQ search event
interface FAQSearchEvent extends PrivacyAnalyticsEvent {
  searchQuery: string;
  resultsCount: number;
}

// Union type for all event types
type PrivacyEvent = 
  | ScreenViewEvent
  | DataExportEvent
  | ConsentChangeEvent
  | AccountManagementEvent
  | FAQSearchEvent;

// Analytics configuration
interface AnalyticsConfig {
  enabled: boolean;
  anonymizeData: boolean;
  retentionPeriod: number; // in days
}

class PrivacyAnalyticsService {
  private sessionId: string;
  private config: AnalyticsConfig;
  private anonymizedUserId: string;
  private deviceInfo: {
    type: string;
    appVersion: string;
  };
  private eventQueue: PrivacyEvent[] = [];
  private isProcessing: boolean = false;
  private analyticsOptOut: boolean = false;

  constructor() {
    // Generate a random session ID
    this.sessionId = Math.random().toString(36).substring(2, 15);
    
    // Default configuration
    this.config = {
      enabled: true,
      anonymizeData: true,
      retentionPeriod: 90, // 90 days
    };
    
    // Set device info
    this.deviceInfo = {
      type: 'mobile', // This would be determined dynamically in a real implementation
      appVersion: '1.0.0', // This would be fetched from app config
    };
    
    // Generate anonymized user ID
    this.anonymizedUserId = 'anon_' + Math.random().toString(36).substring(2, 15);
    
    // Initialize
    this.initialize();
  }

  /**
   * Initialize the analytics service
   */
  private async initialize(): Promise<void> {
    try {
      // Check if user has opted out of analytics
      const optOut = await AsyncStorage.getItem('privacy_analytics_opt_out');
      this.analyticsOptOut = optOut === 'true';
      
      // Load existing anonymized user ID if available
      const storedId = await AsyncStorage.getItem('privacy_anonymized_user_id');
      if (storedId) {
        this.anonymizedUserId = storedId;
      } else {
        // Store the new anonymized user ID
        await AsyncStorage.setItem('privacy_anonymized_user_id', this.anonymizedUserId);
      }
      
      // Start processing queue
      this.processEventQueue();
    } catch (error) {
      console.error('Error initializing privacy analytics:', error);
    }
  }

  /**
   * Set user opt-out preference
   */
  public async setOptOut(optOut: boolean): Promise<void> {
    try {
      this.analyticsOptOut = optOut;
      await AsyncStorage.setItem('privacy_analytics_opt_out', optOut.toString());
    } catch (error) {
      console.error('Error setting analytics opt-out:', error);
    }
  }

  /**
   * Check if analytics is enabled
   */
  private isEnabled(): boolean {
    return this.config.enabled && !this.analyticsOptOut;
  }

  /**
   * Create base event object
   */
  private createBaseEvent(eventType: PrivacyEventType): PrivacyAnalyticsEvent {
    return {
      eventType,
      timestamp: Date.now(),
      sessionId: this.sessionId,
      deviceType: this.deviceInfo.type,
      appVersion: this.deviceInfo.appVersion,
      anonymizedUserId: this.anonymizedUserId,
    };
  }

  /**
   * Track screen view
   */
  public trackScreenView(screenName: string, tabName?: string): void {
    if (!this.isEnabled()) return;
    
    const event: ScreenViewEvent = {
      ...this.createBaseEvent(PrivacyEventType.SCREEN_VIEW),
      screenName,
      tabName,
    };
    
    this.queueEvent(event);
  }

  /**
   * Track data export request
   */
  public trackDataExportRequested(categories: string[], format: string): void {
    if (!this.isEnabled()) return;
    
    const event: DataExportEvent = {
      ...this.createBaseEvent(PrivacyEventType.DATA_EXPORT_REQUESTED),
      categories,
      format,
    };
    
    this.queueEvent(event);
  }

  /**
   * Track data export completion
   */
  public trackDataExportCompleted(
    exportId: string,
    categories: string[],
    format: string,
    size: number,
    duration: number
  ): void {
    if (!this.isEnabled()) return;
    
    const event: DataExportEvent = {
      ...this.createBaseEvent(PrivacyEventType.DATA_EXPORT_COMPLETED),
      exportId,
      categories,
      format,
      size,
      duration,
      success: true,
    };
    
    this.queueEvent(event);
  }

  /**
   * Track data export failure
   */
  public trackDataExportFailed(
    exportId: string,
    categories: string[],
    format: string,
    errorMessage: string
  ): void {
    if (!this.isEnabled()) return;
    
    const event: DataExportEvent = {
      ...this.createBaseEvent(PrivacyEventType.DATA_EXPORT_FAILED),
      exportId,
      categories,
      format,
      errorMessage,
      success: false,
    };
    
    this.queueEvent(event);
  }

  /**
   * Track consent change
   */
  public trackConsentChanged(
    consentType: string,
    newStatus: boolean,
    previousStatus?: boolean
  ): void {
    if (!this.isEnabled()) return;
    
    const event: ConsentChangeEvent = {
      ...this.createBaseEvent(PrivacyEventType.CONSENT_CHANGED),
      consentType,
      newStatus,
      previousStatus,
      userSegment: 'anonymous', // This would be a more meaningful segment in a real implementation
    };
    
    this.queueEvent(event);
  }

  /**
   * Track account deletion started
   */
  public trackAccountDeletionStarted(
    reason?: string,
    dataCategories?: string[]
  ): void {
    if (!this.isEnabled()) return;
    
    const event: AccountManagementEvent = {
      ...this.createBaseEvent(PrivacyEventType.ACCOUNT_DELETION_STARTED),
      actionType: 'deletion',
      reason,
      dataCategories,
    };
    
    this.queueEvent(event);
  }

  /**
   * Track account deletion completed
   */
  public trackAccountDeletionCompleted(): void {
    if (!this.isEnabled()) return;
    
    const event: AccountManagementEvent = {
      ...this.createBaseEvent(PrivacyEventType.ACCOUNT_DELETION_COMPLETED),
      actionType: 'deletion',
    };
    
    this.queueEvent(event);
  }

  /**
   * Track account anonymization started
   */
  public trackAccountAnonymizationStarted(
    reason?: string,
    dataCategories?: string[]
  ): void {
    if (!this.isEnabled()) return;
    
    const event: AccountManagementEvent = {
      ...this.createBaseEvent(PrivacyEventType.ACCOUNT_ANONYMIZATION_STARTED),
      actionType: 'anonymization',
      reason,
      dataCategories,
    };
    
    this.queueEvent(event);
  }

  /**
   * Track account anonymization completed
   */
  public trackAccountAnonymizationCompleted(): void {
    if (!this.isEnabled()) return;
    
    const event: AccountManagementEvent = {
      ...this.createBaseEvent(PrivacyEventType.ACCOUNT_ANONYMIZATION_COMPLETED),
      actionType: 'anonymization',
    };
    
    this.queueEvent(event);
  }

  /**
   * Track FAQ search
   */
  public trackFAQSearch(searchQuery: string, resultsCount: number): void {
    if (!this.isEnabled()) return;
    
    const event: FAQSearchEvent = {
      ...this.createBaseEvent(PrivacyEventType.PRIVACY_FAQ_SEARCHED),
      searchQuery,
      resultsCount,
    };
    
    this.queueEvent(event);
  }

  /**
   * Queue an event for processing
   */
  private queueEvent(event: PrivacyEvent): void {
    this.eventQueue.push(event);
    
    // Start processing if not already in progress
    if (!this.isProcessing) {
      this.processEventQueue();
    }
  }

  /**
   * Process the event queue
   */
  private async processEventQueue(): Promise<void> {
    if (this.isProcessing || this.eventQueue.length === 0) {
      return;
    }
    
    this.isProcessing = true;
    
    try {
      // Process events in batches
      const batch = this.eventQueue.splice(0, 10);
      
      // In a real implementation, this would send the events to an analytics service
      // For this example, we'll just log them
      console.log('Processing privacy analytics events:', batch);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Store events locally for debugging and backup
      await this.storeEvents(batch);
      
      // Continue processing if there are more events
      if (this.eventQueue.length > 0) {
        this.processEventQueue();
      } else {
        this.isProcessing = false;
      }
    } catch (error) {
      console.error('Error processing privacy analytics events:', error);
      this.isProcessing = false;
      
      // Retry after a delay
      setTimeout(() => this.processEventQueue(), 5000);
    }
  }

  /**
   * Store events locally
   */
  private async storeEvents(events: PrivacyEvent[]): Promise<void> {
    try {
      // Get existing events
      const storedEventsJson = await AsyncStorage.getItem('privacy_analytics_events');
      const storedEvents: PrivacyEvent[] = storedEventsJson ? JSON.parse(storedEventsJson) : [];
      
      // Add new events
      const allEvents = [...storedEvents, ...events];
      
      // Apply retention policy
      const retentionCutoff = Date.now() - (this.config.retentionPeriod * 24 * 60 * 60 * 1000);
      const filteredEvents = allEvents.filter(event => event.timestamp >= retentionCutoff);
      
      // Store updated events
      await AsyncStorage.setItem('privacy_analytics_events', JSON.stringify(filteredEvents));
    } catch (error) {
      console.error('Error storing privacy analytics events:', error);
    }
  }

  /**
   * Get analytics data for dashboard
   * This would be used by an admin dashboard to view analytics
   */
  public async getAnalyticsData(): Promise<{
    exportRequests: number;
    consentChanges: number;
    accountDeletions: number;
    accountAnonymizations: number;
    faqSearches: number;
  }> {
    try {
      // Get stored events
      const storedEventsJson = await AsyncStorage.getItem('privacy_analytics_events');
      const storedEvents: PrivacyEvent[] = storedEventsJson ? JSON.parse(storedEventsJson) : [];
      
      // Count events by type
      const exportRequests = storedEvents.filter(
        event => event.eventType === PrivacyEventType.DATA_EXPORT_REQUESTED
      ).length;
      
      const consentChanges = storedEvents.filter(
        event => event.eventType === PrivacyEventType.CONSENT_CHANGED
      ).length;
      
      const accountDeletions = storedEvents.filter(
        event => event.eventType === PrivacyEventType.ACCOUNT_DELETION_STARTED
      ).length;
      
      const accountAnonymizations = storedEvents.filter(
        event => event.eventType === PrivacyEventType.ACCOUNT_ANONYMIZATION_STARTED
      ).length;
      
      const faqSearches = storedEvents.filter(
        event => event.eventType === PrivacyEventType.PRIVACY_FAQ_SEARCHED
      ).length;
      
      return {
        exportRequests,
        consentChanges,
        accountDeletions,
        accountAnonymizations,
        faqSearches,
      };
    } catch (error) {
      console.error('Error getting privacy analytics data:', error);
      return {
        exportRequests: 0,
        consentChanges: 0,
        accountDeletions: 0,
        accountAnonymizations: 0,
        faqSearches: 0,
      };
    }
  }
}

// Create singleton instance
const privacyAnalyticsService = new PrivacyAnalyticsService();

export default privacyAnalyticsService;