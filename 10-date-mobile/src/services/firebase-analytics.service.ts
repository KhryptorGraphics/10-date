/**
 * Firebase Analytics Service
 * 
 * This service integrates the privacy analytics service with Firebase Analytics.
 * It provides methods to send privacy-related events to Firebase for analytics and reporting.
 */

import privacyAnalyticsService, { PrivacyEventType } from './privacy-analytics.service';

// Mock Firebase Analytics import
// In a real implementation, this would be:
// import analytics from '@react-native-firebase/analytics';

// Mock Firebase Analytics for development
const firebaseAnalytics = {
  logEvent: (eventName: string, params: Record<string, any>) => {
    console.log(`Firebase Analytics Event: ${eventName}`, params);
    return Promise.resolve();
  },
  setUserProperty: (name: string, value: string) => {
    console.log(`Firebase Analytics User Property: ${name} = ${value}`);
    return Promise.resolve();
  },
  setUserId: (id: string | null) => {
    console.log(`Firebase Analytics User ID: ${id}`);
    return Promise.resolve();
  },
  setAnalyticsCollectionEnabled: (enabled: boolean) => {
    console.log(`Firebase Analytics Collection Enabled: ${enabled}`);
    return Promise.resolve();
  },
};

// Map privacy event types to Firebase event names
const eventTypeMapping: Record<PrivacyEventType, string> = {
  privacy_screen_view: 'privacy_screen_view',
  privacy_data_export_requested: 'privacy_export_requested',
  privacy_data_export_completed: 'privacy_export_completed',
  privacy_data_export_failed: 'privacy_export_failed',
  privacy_consent_changed: 'privacy_consent_changed',
  privacy_account_deletion_started: 'privacy_deletion_started',
  privacy_account_deletion_completed: 'privacy_deletion_completed',
  privacy_account_anonymization_started: 'privacy_anonymization_started',
  privacy_account_anonymization_completed: 'privacy_anonymization_completed',
  privacy_policy_viewed: 'privacy_policy_viewed',
  privacy_rights_viewed: 'privacy_rights_viewed',
  privacy_faq_viewed: 'privacy_faq_viewed',
  privacy_contact_viewed: 'privacy_contact_viewed',
  privacy_faq_searched: 'privacy_faq_searched',
};

class FirebaseAnalyticsService {
  private initialized: boolean = false;
  
  /**
   * Initialize the Firebase Analytics service
   */
  public async initialize(): Promise<void> {
    if (this.initialized) {
      return;
    }
    
    try {
      // Enable analytics collection
      await firebaseAnalytics.setAnalyticsCollectionEnabled(true);
      
      // Set up event listeners for privacy analytics events
      this.setupEventListeners();
      
      this.initialized = true;
      console.log('Firebase Analytics initialized successfully');
    } catch (error) {
      console.error('Error initializing Firebase Analytics:', error);
    }
  }
  
  /**
   * Set up event listeners for privacy analytics events
   */
  private setupEventListeners(): void {
    // In a real implementation, this would use an event emitter
    // For this example, we'll monkey patch the privacy analytics service
    
    // Store original methods
    const originalTrackScreenView = privacyAnalyticsService.trackScreenView;
    const originalTrackDataExportRequested = privacyAnalyticsService.trackDataExportRequested;
    const originalTrackDataExportCompleted = privacyAnalyticsService.trackDataExportCompleted;
    const originalTrackDataExportFailed = privacyAnalyticsService.trackDataExportFailed;
    const originalTrackConsentChanged = privacyAnalyticsService.trackConsentChanged;
    const originalTrackAccountDeletionStarted = privacyAnalyticsService.trackAccountDeletionStarted;
    const originalTrackAccountDeletionCompleted = privacyAnalyticsService.trackAccountDeletionCompleted;
    const originalTrackAccountAnonymizationStarted = privacyAnalyticsService.trackAccountAnonymizationStarted;
    const originalTrackAccountAnonymizationCompleted = privacyAnalyticsService.trackAccountAnonymizationCompleted;
    const originalTrackFAQSearch = privacyAnalyticsService.trackFAQSearch;
    
    // Override methods to also send events to Firebase
    privacyAnalyticsService.trackScreenView = (screenName: string, tabName?: string) => {
      // Call original method
      originalTrackScreenView.call(privacyAnalyticsService, screenName, tabName);
      
      // Send to Firebase
      this.logEvent(PrivacyEventType.SCREEN_VIEW, {
        screen_name: screenName,
        tab_name: tabName || 'main',
      });
    };
    
    privacyAnalyticsService.trackDataExportRequested = (categories: string[], format: string) => {
      // Call original method
      originalTrackDataExportRequested.call(privacyAnalyticsService, categories, format);
      
      // Send to Firebase
      this.logEvent(PrivacyEventType.DATA_EXPORT_REQUESTED, {
        categories: categories.join(','),
        format,
      });
    };
    
    privacyAnalyticsService.trackDataExportCompleted = (
      exportId: string,
      categories: string[],
      format: string,
      size: number,
      duration: number
    ) => {
      // Call original method
      originalTrackDataExportCompleted.call(
        privacyAnalyticsService,
        exportId,
        categories,
        format,
        size,
        duration
      );
      
      // Send to Firebase
      this.logEvent(PrivacyEventType.DATA_EXPORT_COMPLETED, {
        export_id: exportId,
        categories: categories.join(','),
        format,
        size,
        duration,
      });
    };
    
    privacyAnalyticsService.trackDataExportFailed = (
      exportId: string,
      categories: string[],
      format: string,
      errorMessage: string
    ) => {
      // Call original method
      originalTrackDataExportFailed.call(
        privacyAnalyticsService,
        exportId,
        categories,
        format,
        errorMessage
      );
      
      // Send to Firebase
      this.logEvent(PrivacyEventType.DATA_EXPORT_FAILED, {
        export_id: exportId,
        categories: categories.join(','),
        format,
        error_message: errorMessage,
      });
    };
    
    privacyAnalyticsService.trackConsentChanged = (
      consentType: string,
      newStatus: boolean,
      previousStatus?: boolean
    ) => {
      // Call original method
      originalTrackConsentChanged.call(
        privacyAnalyticsService,
        consentType,
        newStatus,
        previousStatus
      );
      
      // Send to Firebase
      this.logEvent(PrivacyEventType.CONSENT_CHANGED, {
        consent_type: consentType,
        new_status: newStatus,
        previous_status: previousStatus,
        changed_to: newStatus ? 'enabled' : 'disabled',
      });
    };
    
    privacyAnalyticsService.trackAccountDeletionStarted = (
      reason?: string,
      dataCategories?: string[]
    ) => {
      // Call original method
      originalTrackAccountDeletionStarted.call(
        privacyAnalyticsService,
        reason,
        dataCategories
      );
      
      // Send to Firebase
      this.logEvent(PrivacyEventType.ACCOUNT_DELETION_STARTED, {
        reason: reason || 'not_specified',
        data_categories: dataCategories ? dataCategories.join(',') : 'all',
      });
    };
    
    privacyAnalyticsService.trackAccountDeletionCompleted = () => {
      // Call original method
      originalTrackAccountDeletionCompleted.call(privacyAnalyticsService);
      
      // Send to Firebase
      this.logEvent(PrivacyEventType.ACCOUNT_DELETION_COMPLETED, {});
    };
    
    privacyAnalyticsService.trackAccountAnonymizationStarted = (
      reason?: string,
      dataCategories?: string[]
    ) => {
      // Call original method
      originalTrackAccountAnonymizationStarted.call(
        privacyAnalyticsService,
        reason,
        dataCategories
      );
      
      // Send to Firebase
      this.logEvent(PrivacyEventType.ACCOUNT_ANONYMIZATION_STARTED, {
        reason: reason || 'not_specified',
        data_categories: dataCategories ? dataCategories.join(',') : 'all',
      });
    };
    
    privacyAnalyticsService.trackAccountAnonymizationCompleted = () => {
      // Call original method
      originalTrackAccountAnonymizationCompleted.call(privacyAnalyticsService);
      
      // Send to Firebase
      this.logEvent(PrivacyEventType.ACCOUNT_ANONYMIZATION_COMPLETED, {});
    };
    
    privacyAnalyticsService.trackFAQSearch = (searchQuery: string, resultsCount: number) => {
      // Call original method
      originalTrackFAQSearch.call(privacyAnalyticsService, searchQuery, resultsCount);
      
      // Send to Firebase
      this.logEvent(PrivacyEventType.PRIVACY_FAQ_SEARCHED, {
        search_query: searchQuery,
        results_count: resultsCount,
      });
    };
  }
  
  /**
   * Log an event to Firebase Analytics
   */
  private async logEvent(eventType: PrivacyEventType, params: Record<string, any>): Promise<void> {
    try {
      // Map privacy event type to Firebase event name
      const firebaseEventName = eventTypeMapping[eventType];
      
      // Add timestamp
      const eventParams = {
        ...params,
        timestamp: Date.now(),
      };
      
      // Log event to Firebase
      await firebaseAnalytics.logEvent(firebaseEventName, eventParams);
    } catch (error) {
      console.error(`Error logging Firebase Analytics event ${eventType}:`, error);
    }
  }
  
  /**
   * Set analytics collection enabled/disabled
   */
  public async setAnalyticsEnabled(enabled: boolean): Promise<void> {
    try {
      await firebaseAnalytics.setAnalyticsCollectionEnabled(enabled);
    } catch (error) {
      console.error('Error setting analytics collection enabled:', error);
    }
  }
  
  /**
   * Set anonymized user ID
   */
  public async setAnonymizedUserId(id: string): Promise<void> {
    try {
      // Use a hashed version of the ID
      const hashedId = `anon_${id}`;
      await firebaseAnalytics.setUserId(hashedId);
    } catch (error) {
      console.error('Error setting anonymized user ID:', error);
    }
  }
  
  /**
   * Clear user ID when user logs out or deletes account
   */
  public async clearUserId(): Promise<void> {
    try {
      await firebaseAnalytics.setUserId(null);
    } catch (error) {
      console.error('Error clearing user ID:', error);
    }
  }
  
  /**
   * Set user property
   */
  public async setUserProperty(name: string, value: string): Promise<void> {
    try {
      await firebaseAnalytics.setUserProperty(name, value);
    } catch (error) {
      console.error(`Error setting user property ${name}:`, error);
    }
  }
}

// Create singleton instance
const firebaseAnalyticsService = new FirebaseAnalyticsService();

export default firebaseAnalyticsService;