# Firebase Analytics Implementation Guide for 10-Date Mobile App

This guide provides a comprehensive approach to implementing Firebase Analytics in the 10-Date mobile application. It covers setup, event tracking strategies, user properties, and best practices for gaining actionable insights from user behavior.

## 1. Firebase Analytics Setup

### Installation and Configuration

First, install the required Firebase packages:

```bash
# Install Firebase core and analytics packages
npm install --save @react-native-firebase/app @react-native-firebase/analytics

# If using iOS, install pods
cd ios && pod install && cd ..
```

### Project Configuration

#### iOS Configuration:

1. Download the `GoogleService-Info.plist` file from the Firebase Console
2. Add it to your Xcode project (Right-click on the project → "Add Files to...")
3. Update your `ios/Podfile` to include Firebase:

```ruby
# ios/Podfile
target 'TenDate' do
  # ...other configurations
  
  # Add the Firebase pod for Google Analytics
  pod 'Firebase/Analytics'
  
  # Add any other Firebase pods that you want to use in your app
  # For example: pod 'Firebase/Auth'
end
```

4. Install the pods:

```bash
cd ios && pod install && cd ..
```

#### Android Configuration:

1. Download the `google-services.json` file from Firebase Console
2. Place it in the `android/app/` directory
3. Update your project-level `android/build.gradle`:

```gradle
// android/build.gradle
buildscript {
  dependencies {
    // Add this line
    classpath 'com.google.gms:google-services:4.3.15'
  }
}
```

4. Update your app-level `android/app/build.gradle`:

```gradle
// android/app/build.gradle
apply plugin: 'com.android.application'
apply plugin: 'com.google.gms.google-services' // Add this line

dependencies {
  // Other dependencies...
  implementation platform('com.google.firebase:firebase-bom:32.2.0')
  implementation 'com.google.firebase:firebase-analytics'
}
```

### Initialize Firebase in Your App

```typescript
// src/services/firebase.service.ts
import { firebase } from '@react-native-firebase/app';
import '@react-native-firebase/analytics';

class FirebaseService {
  /**
   * Initialize Firebase
   */
  initialize() {
    if (!firebase.apps.length) {
      // Firebase will use GoogleService-Info.plist on iOS 
      // and google-services.json on Android automatically
      firebase.initializeApp();
    }
    this.configureAnalytics();
    return firebase;
  }

  /**
   * Configure Analytics
   */
  async configureAnalytics() {
    if (__DEV__) {
      // Enable analytics debug mode in development
      await firebase.analytics().setAnalyticsCollectionEnabled(true);
      console.log('Firebase Analytics: Debug mode enabled');
    }
  }

  /**
   * Get Firebase Analytics instance
   */
  getAnalytics() {
    return firebase.analytics();
  }
}

export const firebaseService = new FirebaseService();
```

### Integrate with App Initialization

```typescript
// src/App.tsx
import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { store } from './store';
import { Provider } from 'react-redux';
import { firebaseService } from './services/firebase.service';
import AppNavigator from './navigation';

const App = () => {
  useEffect(() => {
    // Initialize Firebase
    firebaseService.initialize();
  }, []);

  return (
    <Provider store={store}>
      <NavigationContainer>
        <AppNavigator />
      </NavigationContainer>
    </Provider>
  );
};

export default App;
```

## 2. Analytics Event Tracking Strategy

### Core Event Categories

For a dating app like 10-Date, track these key event categories:

1. **User Journey Events**: registration, onboarding, profile completion
2. **Engagement Events**: app opens, session duration, feature usage
3. **Matching Events**: profile views, likes, passes, matches
4. **Communication Events**: messages sent, read, replied to
5. **Subscription Events**: subscription views, purchases, renewals, cancellations
6. **Content Events**: photo uploads, profile edits

### Analytics Service Implementation

Create a dedicated analytics service:

```typescript
// src/services/analytics.service.ts
import firebase from '@react-native-firebase/app';
import analytics from '@react-native-firebase/analytics';

class AnalyticsService {
  // User Journey Events
  trackRegistration(method: 'email' | 'phone' | 'facebook' | 'google' | 'apple') {
    analytics().logSignUp({ method });
  }

  trackLogin(method: 'email' | 'phone' | 'facebook' | 'google' | 'apple') {
    analytics().logLogin({ method });
  }

  trackOnboardingStep(step: number, completed: boolean) {
    analytics().logEvent('onboarding_step', {
      step,
      completed,
      timestamp: new Date().toISOString(),
    });
  }

  trackProfileCompletion(completionPercentage: number) {
    analytics().logEvent('profile_completion', {
      percentage: completionPercentage,
    });
  }

  // Engagement Events
  trackScreenView(screenName: string, screenClass: string) {
    analytics().logScreenView({
      screen_name: screenName,
      screen_class: screenClass,
    });
  }

  trackFeatureUsage(featureName: string, parameters?: Record<string, any>) {
    analytics().logEvent(`feature_${featureName}`, parameters);
  }

  // Matching Events
  trackProfileView(viewedUserId: string, fromScreen: string) {
    analytics().logEvent('profile_view', {
      viewed_user_id: viewedUserId,
      from_screen: fromScreen,
      timestamp: new Date().toISOString(),
    });
  }

  trackSwipe(
    direction: 'left' | 'right' | 'up', 
    profileId: string, 
    isSuperLike: boolean = false
  ) {
    analytics().logEvent('profile_swipe', {
      direction,
      profile_id: profileId,
      is_super_like: isSuperLike,
      timestamp: new Date().toISOString(),
    });
  }

  trackMatch(matchId: string, matchedUserId: string) {
    analytics().logEvent('new_match', {
      match_id: matchId,
      matched_user_id: matchedUserId,
      timestamp: new Date().toISOString(),
    });
  }

  // Messaging Events
  trackMessageSent(matchId: string, messageType: 'text' | 'image' | 'gif') {
    analytics().logEvent('message_sent', {
      match_id: matchId,
      message_type: messageType,
      timestamp: new Date().toISOString(),
    });
  }

  trackMessageRead(matchId: string) {
    analytics().logEvent('message_read', {
      match_id: matchId,
      timestamp: new Date().toISOString(),
    });
  }

  // Subscription Events
  trackSubscriptionView(
    subscriptionType: 'premium' | 'platinum', 
    fromScreen: string
  ) {
    analytics().logEvent('subscription_view', {
      subscription_type: subscriptionType,
      from_screen: fromScreen,
      timestamp: new Date().toISOString(),
    });
  }

  trackSubscriptionPurchase(
    subscriptionType: 'premium' | 'platinum',
    period: 'monthly' | 'yearly',
    price: number,
    currency: string
  ) {
    // Log Firebase predefined purchase event
    analytics().logPurchase({
      value: price,
      currency: currency,
      items: [
        {
          item_id: `${subscriptionType}_${period}`,
          item_name: `${subscriptionType} ${period} subscription`,
          item_category: 'subscription',
        }
      ]
    });

    // Log custom subscription event with more details
    analytics().logEvent('subscription_purchased', {
      subscription_type: subscriptionType,
      period: period,
      price: price,
      currency: currency,
      timestamp: new Date().toISOString(),
    });
  }

  trackSubscriptionRenewal(
    subscriptionType: 'premium' | 'platinum',
    period: 'monthly' | 'yearly',
    price: number,
    currency: string
  ) {
    analytics().logEvent('subscription_renewed', {
      subscription_type: subscriptionType,
      period: period,
      price: price,
      currency: currency,
      timestamp: new Date().toISOString(),
    });
  }

  trackSubscriptionCancellation(
    subscriptionType: 'premium' | 'platinum',
    period: 'monthly' | 'yearly',
    reasonCategory?: string,
    reasonDetail?: string
  ) {
    analytics().logEvent('subscription_cancelled', {
      subscription_type: subscriptionType,
      period: period,
      reason_category: reasonCategory,
      reason_detail: reasonDetail,
      timestamp: new Date().toISOString(),
    });
  }

  // Content Events
  trackPhotoUpload(count: number, isProfilePicture: boolean = false) {
    analytics().logEvent('photo_upload', {
      count,
      is_profile_picture: isProfilePicture,
      timestamp: new Date().toISOString(),
    });
  }

  trackProfileEdit(fieldName: string) {
    analytics().logEvent('profile_edit', {
      field_name: fieldName,
      timestamp: new Date().toISOString(),
    });
  }

  // Custom Funnel Events
  trackFunnelStep(funnelName: string, stepNumber: number, stepName: string) {
    analytics().logEvent('funnel_step', {
      funnel_name: funnelName,
      step_number: stepNumber,
      step_name: stepName,
      timestamp: new Date().toISOString(),
    });
  }

  // User Properties
  setUserProperties(properties: Record<string, string | number | boolean>) {
    // Set each property individually
    Object.entries(properties).forEach(([key, value]) => {
      if (typeof value === 'string') {
        analytics().setUserProperty(key, value);
      } else {
        analytics().setUserProperty(key, String(value));
      }
    });
  }
}

export const analyticsService = new AnalyticsService();
```

## 3. User Properties Configuration

User properties help segment your analytics data based on user characteristics. Set these at login and update when they change:

```typescript
// src/services/analytics.service.ts (additional method)
class AnalyticsService {
  // ... other methods ...

  /**
   * Set core user properties for segmentation
   */
  setUserDemographics(userId: string, user: any) {
    // First set user ID for tracking
    analytics().setUserId(userId);

    // Then set user properties
    const userProperties: Record<string, string | number | boolean> = {
      // Core user info
      gender: user.gender,
      age_range: this.getAgeRange(user.birthDate),
      location_city: user.city,
      location_country: user.country,
      
      // Dating preferences
      seeking_gender: user.preferences.gender.join(','),
      seeking_age_min: user.preferences.ageRange.min,
      seeking_age_max: user.preferences.ageRange.max,
      seeking_distance: user.preferences.maxDistance,
      
      // App status
      account_age_days: this.getDaysSinceRegistration(user.createdAt),
      profile_completion: this.calculateProfileCompletion(user),
      is_premium: user.subscription?.isPremium || false,
      subscription_tier: user.subscription?.tier || 'free',
      photo_count: user.photos?.length || 0,
      match_count: user.matchCount || 0,
      
      // Engagement metrics
      has_enabled_notifications: user.notificationSettings?.enabled || false,
      last_active_date: new Date(user.lastActive).toISOString(),
    };

    this.setUserProperties(userProperties);
  }

  /**
   * Calculate age range for demographic segmentation
   */
  private getAgeRange(birthDate: string): string {
    const age = this.calculateAge(new Date(birthDate));
    if (age < 25) return '18-24';
    if (age < 35) return '25-34';
    if (age < 45) return '35-44';
    if (age < 55) return '45-54';
    return '55+';
  }

  /**
   * Calculate age from birthdate
   */
  private calculateAge(birthDate: Date): number {
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  }

  /**
   * Calculate days since registration
   */
  private getDaysSinceRegistration(createdAt: string): number {
    const registrationDate = new Date(createdAt);
    const today = new Date();
    const diffTime = Math.abs(today.getTime() - registrationDate.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  /**
   * Calculate profile completion percentage
   */
  private calculateProfileCompletion(user: any): number {
    // Define fields that contribute to profile completion
    const fields = [
      !!user.name,
      !!user.birthDate,
      !!user.gender,
      !!user.bio,
      user.photos && user.photos.length > 0,
      user.interests && user.interests.length > 0,
      !!user.occupation,
      !!user.education,
      !!user.city,
    ];
    
    // Calculate percentage
    const completedFields = fields.filter(Boolean).length;
    return Math.round((completedFields / fields.length) * 100);
  }
}
```

## 4. Screen Tracking Implementation

For automatic screen tracking with React Navigation:

```typescript
// src/navigation/index.tsx
import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import analytics from '@react-native-firebase/analytics';
import { analyticsService } from '../services/analytics.service';

import HomeScreen from '../screens/HomeScreen';
import ProfileScreen from '../screens/ProfileScreen';
import MessagesScreen from '../screens/MessagesScreen';
// ... other screen imports

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

// Navigation reference
const navigationRef = React.createRef();

// Create the main tab navigator
const TabNavigator = () => (
  <Tab.Navigator>
    <Tab.Screen name="Discover" component={HomeScreen} />
    <Tab.Screen name="Matches" component={MatchesScreen} />
    <Tab.Screen name="Messages" component={MessagesScreen} />
    <Tab.Screen name="Profile" component={ProfileScreen} />
  </Tab.Navigator>
);

// Main app navigator
const AppNavigator = () => {
  return (
    <NavigationContainer
      ref={navigationRef}
      onStateChange={async (state) => {
        // Track screen views
        const currentRouteName = navigationRef.current?.getCurrentRoute()?.name;
        if (currentRouteName) {
          // Track using Firebase's built-in screen tracking
          await analytics().logScreenView({
            screen_name: currentRouteName,
            screen_class: currentRouteName,
          });
          
          // Also track with our custom service for consistency
          analyticsService.trackScreenView(currentRouteName, currentRouteName);
        }
      }}
    >
      <Stack.Navigator>
        <Stack.Screen 
          name="Main" 
          component={TabNavigator} 
          options={{ headerShown: false }} 
        />
        <Stack.Screen name="ChatDetail" component={ChatDetailScreen} />
        <Stack.Screen name="UserProfile" component={UserProfileScreen} />
        <Stack.Screen name="Settings" component={SettingsScreen} />
        <Stack.Screen name="Subscription" component={SubscriptionScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;
```

## 5. Tracking Implementation Examples

### Profile View Tracking Example

```typescript
// src/screens/UserProfileScreen.tsx
import React, { useEffect } from 'react';
import { View, Text, Image } from 'react-native';
import { useRoute } from '@react-navigation/native';
import { analyticsService } from '../services/analytics.service';

const UserProfileScreen = () => {
  const route = useRoute();
  const { userId, userName } = route.params;
  
  useEffect(() => {
    // Track profile view when component mounts
    analyticsService.trackProfileView(userId, 'UserProfile');
  }, [userId]);
  
  // Rest of component implementation...
};
```

### Swipe Action Tracking

```typescript
// src/components/SwipeCard.tsx
import React from 'react';
import { PanResponder, Animated } from 'react-native';
import { analyticsService } from '../services/analytics.service';

const SwipeCard = ({ profile, onSwipeLeft, onSwipeRight, onSuperLike }) => {
  // Pan responder implementation
  
  const handleSwipeLeft = () => {
    analyticsService.trackSwipe('left', profile.id);
    onSwipeLeft();
  };
  
  const handleSwipeRight = () => {
    analyticsService.trackSwipe('right', profile.id);
    onSwipeRight();
  };
  
  const handleSuperLike = () => {
    analyticsService.trackSwipe('up', profile.id, true);
    onSuperLike();
  };
  
  // Rest of component implementation...
};
```

### Subscription Purchase Tracking

```typescript
// src/screens/SubscriptionScreen.tsx
import React from 'react';
import { View, TouchableOpacity, Text } from 'react-native';
import { useDispatch } from 'react-redux';
import { purchaseSubscription } from '../store/slices/subscriptionSlice';
import { analyticsService } from '../services/analytics.service';

const SubscriptionScreen = () => {
  const dispatch = useDispatch();
  
  useEffect(() => {
    // Track screen view with subscription type
    analyticsService.trackSubscriptionView('premium', 'MatchDetail');
  }, []);
  
  const handlePurchase = async (type, period, price, currency) => {
    try {
      // Attempt to purchase
      const result = await dispatch(purchaseSubscription({ type, period }));
      
      if (result.meta.requestStatus === 'fulfilled') {
        // Track successful purchase
        analyticsService.trackSubscriptionPurchase(type, period, price, currency);
      }
    } catch (error) {
      console.error('Purchase failed:', error);
    }
  };
  
  return (
    <View>
      <Text>Choose a Subscription Plan</Text>
      
      <TouchableOpacity 
        onPress={() => handlePurchase('premium', 'monthly', 9.99, 'USD')}
      >
        <Text>Premium Monthly - $9.99</Text>
      </TouchableOpacity>
      
      <TouchableOpacity 
        onPress={() => handlePurchase('premium', 'yearly', 99.99, 'USD')}
      >
        <Text>Premium Yearly - $99.99 (Save 17%)</Text>
      </TouchableOpacity>
      
      <TouchableOpacity 
        onPress={() => handlePurchase('platinum', 'monthly', 19.99, 'USD')}
      >
        <Text>Platinum Monthly - $19.99</Text>
      </TouchableOpacity>
      
      <TouchableOpacity 
        onPress={() => handlePurchase('platinum', 'yearly', 199.99, 'USD')}
      >
        <Text>Platinum Yearly - $199.99 (Save 17%)</Text>
      </TouchableOpacity>
    </View>
  );
};
```

## 6. Conversion Funnels Setup

Define key conversion funnels to track user progression:

```typescript
// src/services/analytics.service.ts (additional code)

// Define conversion funnels
export const FUNNELS = {
  REGISTRATION: {
    name: 'registration_funnel',
    steps: [
      { number: 1, name: 'app_open' },
      { number: 2, name: 'registration_start' },
      { number: 3, name: 'email_entered' },
      { number: 4, name: 'verification_sent' },
      { number: 5, name: 'verification_complete' },
      { number: 6, name: 'profile_creation_start' },
      { number: 7, name: 'profile_basic_complete' },
      { number: 8, name: 'photos_uploaded' },
      { number: 9, name: 'registration_complete' }
    ]
  },
  MATCH_TO_CONVERSATION: {
    name: 'match_to_conversation_funnel',
    steps: [
      { number: 1, name: 'match_created' },
      { number: 2, name: 'match_notification_received' },
      { number: 3, name: 'match_screen_opened' },
      { number: 4, name: 'conversation_started' },
      { number: 5, name: 'message_sent' },
      { number: 6, name: 'reply_received' }
    ]
  },
  SUBSCRIPTION: {
    name: 'subscription_funnel',
    steps: [
      { number: 1, name: 'subscription_page_view' },
      { number: 2, name: 'plan_selected' },
      { number: 3, name: 'checkout_started' },
      { number: 4, name: 'payment_info_entered' },
      { number: 5, name: 'purchase_attempted' },
      { number: 6, name: 'purchase_completed' }
    ]
  }
};

// Usage examples:
// Track registration funnel step
analyticsService.trackFunnelStep(
  FUNNELS.REGISTRATION.name,
  FUNNELS.REGISTRATION.steps[2].number,
  FUNNELS.REGISTRATION.steps[2].name
);

// Track match to conversation funnel step 
analyticsService.trackFunnelStep(
  FUNNELS.MATCH_TO_CONVERSATION.name,
  FUNNELS.MATCH_TO_CONVERSATION.steps[3].number,
  FUNNELS.MATCH_TO_CONVERSATION.steps[3].name
);
```

## 7. Custom Events Dashboard Configuration

In the Firebase Console, set up custom dashboards for key metrics:

1. **User Acquisition Dashboard**:
   - New user registrations by day/week/month
   - Registration completion rate
   - User acquisition source
   - Registration funnel completion

2. **Engagement Dashboard**:
   - Daily/Weekly/Monthly active users
   - Session duration and frequency
   - Feature usage distribution
   - Screen view distribution

3. **Matching Dashboard**:
   - Swipe actions (left, right, super like)
   - Match rate (matches / right swipes)
   - Profile view rate
   - Match to conversation conversion rate

4. **Messaging Dashboard**:
   - Messages sent per user
   - Response rate
   - Average conversation length
   - Conversation initiation rate

5. **Monetization Dashboard**:
   - Subscription view to purchase conversion
   - Revenue by subscription type
   - Renewal rates
   - Subscription cancellation reasons

## 8. Real-time A/B Testing with Firebase Remote Config

Combine analytics with Firebase Remote Config for A/B testing:

```bash
# Install Remote Config
npm install --save @react-native-firebase/remote-config
```

```typescript
// src/services/remote-config.service.ts
import remoteConfig from '@react-native-firebase/remote-config';
import { firebaseService } from './firebase.service';
import { analyticsService } from './analytics.service';

// Default values
const DEFAULTS = {
  welcome_message: 'Welcome to 10-Date!',
  enable_super_likes: true,
  max_daily_likes: 100,
  subscription_cta_text: 'Upgrade to Premium',
  match_algorithm_version: 'v1',
  ab_test_group: 'control'
};

class RemoteConfigService {
  /**
   * Initialize Remote Config
   */
  async initialize() {
    // Ensure Firebase is initialized
    firebaseService.initialize();
    
    // Set default values
    await remoteConfig().setDefaults(DEFAULTS);
    
    // Set fetch settings
    await remoteConfig().setConfigSettings({
      minimumFetchIntervalMillis: __DEV__ ? 0 : 3600000, // 1 hour in prod
    });
    
    // Fetch and activate
    await this.fetchAndActivate();
    
    // Set A/B test group as user property
    const abTestGroup = this.getString('ab_test_group');
    analyticsService.setUserProperties({ ab_test_group: abTestGroup });
    
    return remoteConfig();
  }
  
  /**
   * Fetch and activate remote config values
   */
  async fetchAndActivate() {
    try {
      const fetchedRemotely = await remoteConfig().fetchAndActivate();
      if (fetchedRemotely) {
        console.log('Remote config fetched and activated');
      } else {
        console.log('Remote config activated from cache');
      }
      return fetchedRemotely;
    } catch (error) {
      console.error('Remote config fetch failed:', error);
      return false;
    }
  }
  
  /**
   * Get string value
   */
  getString(key: string): string {
    return remoteConfig().getString(key);
  }
  
  /**
   * Get boolean value
   */
  getBoolean(key: string): boolean {
    return remoteConfig().getBoolean(key);
  }
  
  /**
   * Get number value
   */
  getNumber(key: string): number {
    return remoteConfig().getNumber(key);
  }
  
  /**
   * Get all remote config values
   */
  getAll() {
    return remoteConfig().getAll();
  }
}

export const remoteConfigService = new RemoteConfigService();
```

## 9. Debugging and Testing Analytics Implementation

### Enable Debug Mode in Development

```typescript
// src/services/firebase.service.ts (append to initialize method)

class FirebaseService {
  async initialize() {
    // ... existing code ...
    
    if (__DEV__) {
      // Enable analytics debug logging
      await firebase.analytics().setAnalyticsCollectionEnabled(true);
      
      // Enable debug view
      // This will send your events to DebugView in the Firebase console
      firebase.analytics().setAnalyticsCollectionEnabled(true);
      
      console.log('Firebase Analytics debug mode enabled');
    }
    
    return firebase;
  }
}
```

### Test Analytics Events

Create a utility function to easily test analytics events during development:

```typescript
// src/utils/test-analytics.ts
import { analyticsService } from '../services/analytics.service';

/**
 * Test analytics events in development
 */
export const testAnalyticsEvents = () => {
  if (!__DEV__) return;
  
  console.log('Testing analytics events...');
  
  // Generate a test user ID for debugging
  const testUserId = `test-user-${Date.now()}`;
  
  // Sample user data for testing
  const testUser = {
    id: testUserId,
    name: 'Test User',
    gender: 'male',
    birthDate: '1990-01-01',
    city: 'San Francisco',
    country: 'US',
    preferences: {
      gender: ['female'],
      ageRange: { min: 25, max: 35 },
      maxDistance: 25,
    },
    createdAt: '2023-01-01T00:00:00Z',
    photos: [{ url: 'https://example.com/photo1.jpg' }],
    interests: ['hiking', 'movies', 'travel'],
    occupation: 'Software Developer',
    education: 'University',
    subscription: { isPremium: true, tier: 'premium' },
    matchCount: 10,
    notificationSettings: { enabled: true },
    lastActive: new Date().toISOString(),
  };
  
  // Set user properties
  analyticsService.setUserDemographics(testUserId, testUser);
  
  // Test event tracking
  analyticsService.trackLogin('email');
  analyticsService.trackScreenView('Discover', 'DiscoverScreen');
  analyticsService.trackFeatureUsage('profile_filter', { filter_type: 'age' });
  analyticsService.trackSwipe('right', 'test-profile-123');
  analyticsService.trackMatch('match-123', 'matched-user-456');
  analyticsService.trackMessageSent('match-123', 'text');
  analyticsService.trackSubscriptionView('premium', 'MatchDetail');
  
  // Test funnel tracking
  analyticsService.trackFunnelStep('registration_funnel', 3, 'email_entered');
  
  console.log('Analytics events sent for testing');
};
```

Use this function during development to test events:

```typescript
// src/App.tsx (modified)
import React, { useEffect } from 'react';
import { firebaseService } from './services/firebase.service';
import { testAnalyticsEvents } from './utils/test-analytics';

const App = () => {
  useEffect(() => {
    // Initialize Firebase
    firebaseService.initialize();
    
    // Test analytics in development
    if (__DEV__) {
      testAnalyticsEvents();
    }
  }, []);
  
  // ... rest of App component
};
```

## 10. Best Practices for Firebase Analytics

1. **Standardize Event Names and Parameters**:
   - Use consistent naming conventions
   - Create an events data dictionary document
   - Follow Firebase's recommended event naming

2. **Limit Event Count and Parameter Size**:
   - Keep event names under 40 characters
   - Limit to 500 distinct event types
   - Keep parameter names under 40 characters
   - Up to 25 parameters per event

3. **Use Event Parameters Effectively**:
   - Add contextual information to events
   - Don't create separate events when parameters can be used
   - Standardize parameter values (e.g., screen names)

4. **Focus on Actionable Metrics**:
   - Track events that can lead to product improvements
   - Ensure every event has a clear purpose
   - Set up alerts for critical metrics

5. **Respect User Privacy**:
   - Implement proper consent mechanisms for GDPR/CCPA
   - Don't track personally identifiable information
   - Allow users to opt-out of analytics

6. **Validate Implementation**:
   - Use DebugView in Firebase Console
   - Verify events in development before production
   - Set up automated testing for critical events

7. **Segment Users Meaningfully**:
   - Use user properties for cohort analysis
   - Limit to 25 active user properties
   - Update user properties when values change
