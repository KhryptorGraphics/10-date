# Push Notification Implementation Guide

This document outlines the steps to implement push notifications in the 10-Date mobile application. Push notifications are crucial for user engagement, providing timely updates about matches, messages, and app events.

## 1. Firebase Cloud Messaging (FCM) Setup

### Project Setup in Firebase Console

1. Go to the [Firebase Console](https://console.firebase.google.com/)
2. Create a new project or use an existing one
3. Add iOS and Android apps to your Firebase project
4. Follow the setup instructions to download and configure the necessary files:
   - For iOS: `GoogleService-Info.plist`
   - For Android: `google-services.json`

### Installation and Configuration

#### Install Dependencies

```bash
# Install FCM packages
npm install --save @react-native-firebase/app @react-native-firebase/messaging

# For iOS specific setup
cd ios && pod install && cd ..
```

#### iOS Setup

1. Add the `GoogleService-Info.plist` file to your Xcode project
2. Update `AppDelegate.m`

```objective-c
#import <Firebase.h>

@implementation AppDelegate

- (BOOL)application:(UIApplication *)application didFinishLaunchingWithOptions:(NSDictionary *)launchOptions {
  // Add this line
  [FIRApp configure];
  
  // Existing setup...
  return YES;
}
@end
```

3. Enable push notification capabilities in Xcode:
   - Select your project in Xcode
   - Go to "Signing & Capabilities"
   - Click "+ Capability"
   - Add "Push Notifications"
   - Add "Background Modes" and check "Remote notifications"

4. Update `Info.plist` to include required permissions:

```xml
<key>UIBackgroundModes</key>
<array>
  <string>remote-notification</string>
</array>
```

#### Android Setup

1. Add the `google-services.json` file to the `android/app` directory
2. Update `android/build.gradle`:

```gradle
buildscript {
  dependencies {
    // Add this line
    classpath 'com.google.gms:google-services:4.3.15'
  }
}
```

3. Update `android/app/build.gradle`:

```gradle
apply plugin: 'com.android.application'
apply plugin: 'com.google.gms.google-services' // Add this line

dependencies {
  // Other dependencies...
  implementation 'com.google.firebase:firebase-messaging:23.1.2'
}
```

4. Update `AndroidManifest.xml` to include required permissions:

```xml
<manifest xmlns:android="http://schemas.android.com/apk/res/android">
  <uses-permission android:name="android.permission.INTERNET" />
  <uses-permission android:name="android.permission.VIBRATE" />
  <uses-permission android:name="android.permission.RECEIVE_BOOT_COMPLETED"/>
  
  <!-- Rest of your manifest -->
</manifest>
```

## 2. Notification Service Implementation

### Create Notification Service

Create a notification service to handle FCM token management and notification handling:

#### src/services/notification.service.ts

```typescript
import messaging from '@react-native-firebase/messaging';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { apiClient } from './api.client';
import { API_ENDPOINTS } from './api.config';

class NotificationService {
  // Token storage key
  private readonly FCM_TOKEN_KEY = '@10Date:fcmToken';
  
  /**
   * Initialize the notification service
   */
  public async initialize() {
    // Request permission on iOS (Android doesn't need this)
    if (Platform.OS === 'ios') {
      const authStatus = await messaging().requestPermission();
      const enabled =
        authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
        authStatus === messaging.AuthorizationStatus.PROVISIONAL;
      
      if (!enabled) {
        console.log('User notification permissions denied');
        return false;
      }
    }
    
    // Get and save FCM token
    await this.getFcmToken();
    
    // Set up foreground notification handler
    this.setupForegroundHandler();
    
    // Set up background notification handler
    this.setupBackgroundHandler();
    
    return true;
  }
  
  /**
   * Get the FCM token and store it
   */
  public async getFcmToken() {
    try {
      const fcmToken = await messaging().getToken();
      
      // Store the token locally
      await AsyncStorage.setItem(this.FCM_TOKEN_KEY, fcmToken);
      console.log('FCM Token stored:', fcmToken);
      
      // Send token to backend
      await this.registerTokenWithBackend(fcmToken);
      
      return fcmToken;
    } catch (error) {
      console.error('Failed to get or store FCM token', error);
      return null;
    }
  }
  
  /**
   * Register FCM token with backend
   */
  private async registerTokenWithBackend(token: string) {
    try {
      await apiClient.post('/user/notification-token', { token, platform: Platform.OS });
      console.log('FCM token registered with backend');
    } catch (error) {
      console.error('Failed to register FCM token with backend', error);
    }
  }
  
  /**
   * Handle foreground notifications
   */
  private setupForegroundHandler() {
    // Handle foreground messages
    const unsubscribe = messaging().onMessage(async (remoteMessage) => {
      console.log('Foreground notification received:', remoteMessage);
      
      // Process notification data
      this.processNotification(remoteMessage);
    });
    
    return unsubscribe;
  }
  
  /**
   * Handle background notifications
   */
  private setupBackgroundHandler() {
    // Set background message handler
    messaging().setBackgroundMessageHandler(async (remoteMessage) => {
      console.log('Background notification received:', remoteMessage);
      
      // Process notification data
      this.processNotification(remoteMessage);
    });
  }
  
  /**
   * Process notification data
   */
  private processNotification(remoteMessage: any) {
    const { data, notification } = remoteMessage;
    
    // Handle different notification types
    switch (data?.type) {
      case 'new_match':
        // Handle new match notification
        this.handleNewMatch(data);
        break;
        
      case 'new_message':
        // Handle new message notification
        this.handleNewMessage(data);
        break;
        
      case 'like_received':
        // Handle received like notification
        this.handleLikeReceived(data);
        break;
        
      default:
        // Handle other notification types
        console.log('Received notification of unknown type:', data?.type);
    }
  }
  
  /**
   * Handle new match notification
   */
  private handleNewMatch(data: any) {
    // Parse match data
    const matchId = data.matchId;
    const matchedUserName = data.matchedUserName;
    
    // Update local state via Redux (example)
    // store.dispatch(addNewMatch({ matchId, matchedUserName }));
    
    console.log('New match notification processed:', matchId, matchedUserName);
  }
  
  /**
   * Handle new message notification
   */
  private handleNewMessage(data: any) {
    // Parse message data
    const messageId = data.messageId;
    const matchId = data.matchId;
    const senderId = data.senderId;
    const senderName = data.senderName;
    const messageContent = data.content;
    
    // Update local state via Redux (example)
    // store.dispatch(addNewMessage({ messageId, matchId, senderId, content: messageContent }));
    
    console.log('New message notification processed:', messageId, senderName);
  }
  
  /**
   * Handle like received notification
   */
  private handleLikeReceived(data: any) {
    // Parse like data
    const userId = data.userId;
    const userName = data.userName;
    
    // Update local state via Redux (example)
    // store.dispatch(likeReceived({ userId, userName }));
    
    console.log('Like received notification processed:', userId, userName);
  }
  
  /**
   * Delete the FCM token when user logs out
   */
  public async deleteToken() {
    try {
      await messaging().deleteToken();
      await AsyncStorage.removeItem(this.FCM_TOKEN_KEY);
      console.log('FCM token deleted');
      return true;
    } catch (error) {
      console.error('Failed to delete FCM token', error);
      return false;
    }
  }
}

// Create singleton instance
export const notificationService = new NotificationService();
```

### Integrate with App Initialization

Update your app initialization to set up notifications:

#### src/App.tsx (update)

```typescript
import React, { useEffect } from 'react';
import { Platform, AppState } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { store, persistor } from './store';
import RootNavigator from './navigation';
import { notificationService } from './services/notification.service';

const App = () => {
  useEffect(() => {
    // Initialize notification service
    initializeNotifications();
    
    // Handle app state changes for notification permissions
    const appStateSubscription = AppState.addEventListener('change', nextAppState => {
      if (nextAppState === 'active') {
        // Refresh notification permissions when app comes to foreground
        notificationService.initialize();
      }
    });
    
    return () => {
      appStateSubscription.remove();
    };
  }, []);
  
  const initializeNotifications = async () => {
    try {
      await notificationService.initialize();
    } catch (error) {
      console.error('Error initializing notifications:', error);
    }
  };
  
  return (
    <Provider store={store}>
      <PersistGate loading={null} persistor={persistor}>
        <SafeAreaProvider>
          <NavigationContainer>
            <RootNavigator />
          </NavigationContainer>
        </SafeAreaProvider>
      </PersistGate>
    </Provider>
  );
};

export default App;
```

### Handle Notification Navigation

Implement navigation to the appropriate screen when a notification is tapped:

#### src/navigation/index.tsx (update)

```typescript
import React, { useEffect, useRef } from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { NavigationContainerRef } from '@react-navigation/native';
import { useSelector } from 'react-redux';
import messaging from '@react-native-firebase/messaging';

import AuthNavigator from './AuthNavigator';
import MainNavigator from './MainNavigator';
import { RootState } from '../store';

const Stack = createStackNavigator();

const RootNavigator = () => {
  const { isAuthenticated } = useSelector((state: RootState) => state.auth);
  const navigationRef = useRef<NavigationContainerRef>(null);
  
  useEffect(() => {
    // Handle notification open when app was in background
    messaging().onNotificationOpenedApp(remoteMessage => {
      console.log('Notification opened app from background state:', remoteMessage);
      handleNotificationNavigation(remoteMessage);
    });
    
    // Handle notification open when app was closed
    messaging()
      .getInitialNotification()
      .then(remoteMessage => {
        if (remoteMessage) {
          console.log('Notification opened app from quit state:', remoteMessage);
          handleNotificationNavigation(remoteMessage);
        }
      });
  }, []);
  
  const handleNotificationNavigation = (remoteMessage: any) => {
    const { data } = remoteMessage;
    
    if (!navigationRef.current || !isAuthenticated) {
      return;
    }
    
    switch (data?.type) {
      case 'new_match':
        navigationRef.current.navigate('ChatDetail', {
          matchId: data.matchId,
          userName: data.matchedUserName,
        });
        break;
        
      case 'new_message':
        navigationRef.current.navigate('ChatDetail', {
          matchId: data.matchId,
          userName: data.senderName,
        });
        break;
        
      case 'like_received':
        // Navigate to the premium screen to see who liked you (requires premium)
        navigationRef.current.navigate('Subscription');
        break;
        
      default:
        // Default navigation
        navigationRef.current.navigate('Discover');
    }
  };
  
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {isAuthenticated ? (
        <Stack.Screen name="Main" component={MainNavigator} />
      ) : (
        <Stack.Screen name="Auth" component={AuthNavigator} />
      )}
    </Stack.Navigator>
  );
};

export default RootNavigator;
```

## 3. Backend Integration for Push Notifications

### Server-Side Implementation

On the backend, implement endpoints to:

1. Store user FCM tokens
2. Send notifications for different events

#### Example Server-Side Notification Service (Node.js)

```javascript
// server/src/services/notification.service.js
const admin = require('firebase-admin');
const serviceAccount = require('../config/firebase-admin-key.json');

// Initialize Firebase Admin SDK
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

class NotificationService {
  /**
   * Send a push notification to a user
   */
  async sendNotification(userId, notification) {
    try {
      // Get user's FCM tokens from database
      const user = await User.findById(userId).select('notificationTokens');
      
      if (!user || !user.notificationTokens || user.notificationTokens.length === 0) {
        console.log(`No FCM tokens found for user ${userId}`);
        return false;
      }
      
      // Send notification to all user's devices
      const results = await Promise.all(
        user.notificationTokens.map(token => 
          admin.messaging().send({
            token: token.token,
            notification: {
              title: notification.title,
              body: notification.body,
            },
            data: notification.data || {},
            android: {
              priority: 'high',
            },
            apns: {
              payload: {
                aps: {
                  contentAvailable: true,
                },
              },
            },
          })
        )
      );
      
      console.log(`Sent notification to user ${userId}:`, results);
      return true;
    } catch (error) {
      console.error('Error sending notification:', error);
      return false;
    }
  }
  
  /**
   * Send a new match notification
   */
  async sendNewMatchNotification(userId, matchId, matchedUserName) {
    return this.sendNotification(userId, {
      title: 'New Match!',
      body: `You matched with ${matchedUserName}!`,
      data: {
        type: 'new_match',
        matchId,
        matchedUserName,
      },
    });
  }
  
  /**
   * Send a new message notification
   */
  async sendNewMessageNotification(userId, message, sender) {
    return this.sendNotification(userId, {
      title: `New message from ${sender.name}`,
      body: message.content.substring(0, 100), // Truncate message content for notification
      data: {
        type: 'new_message',
        messageId: message._id.toString(),
        matchId: message.matchId.toString(),
        senderId: sender._id.toString(),
        senderName: sender.name,
        content: message.content.substring(0, 100),
      },
    });
  }
  
  /**
   * Send a like received notification (for premium users)
   */
  async sendLikeReceivedNotification(userId, likerUser) {
    return this.sendNotification(userId, {
      title: 'Someone Likes You!',
      body: 'Someone new has liked your profile. Upgrade to Premium to see who!',
      data: {
        type: 'like_received',
        userId: likerUser._id.toString(),
        userName: likerUser.name,
      },
    });
  }
}

module.exports = new NotificationService();
```

### Notification Analytics and Monitoring

Implement analytics for push notifications to track:

- Delivery rates
- Open rates
- Conversion rates
- A/B testing of notification messages

#### Firebase Analytics Integration

```typescript
import analytics from '@react-native-firebase/analytics';

// Track notification opened
export const trackNotificationOpened = (notificationType, notificationId) => {
  analytics().logEvent('notification_opened', {
    notification_type: notificationType,
    notification_id: notificationId,
  });
};

// Track notification received
export const trackNotificationReceived = (notificationType, notificationId) => {
  analytics().logEvent('notification_received', {
    notification_type: notificationType,
    notification_id: notificationId,
  });
};
```

## 4. Advanced Notification Features

### Rich Notifications (Images, Actions)

For iOS, create a Notification Service Extension:

1. In Xcode, go to File > New > Target
2. Select "Notification Service Extension"
3. Name it "NotificationServiceExtension"
4. Implement the extension to handle rich media:

```swift
// NotificationService.swift
import UserNotifications

class NotificationService: UNNotificationServiceExtension {
    var contentHandler: ((UNNotificationContent) -> Void)?
    var bestAttemptContent: UNMutableNotificationContent?

    override func didReceive(_ request: UNNotificationRequest, withContentHandler contentHandler: @escaping (UNNotificationContent) -> Void) {
        self.contentHandler = contentHandler
        bestAttemptContent = (request.content.mutableCopy() as? UNMutableNotificationContent)
        
        guard let bestAttemptContent = bestAttemptContent else { return }
        
        // Check if the notification contains an image URL
        guard let imageURLString = request.content.userInfo["image_url"] as? String,
              let imageURL = URL(string: imageURLString) else {
            contentHandler(bestAttemptContent)
            return
        }
        
        // Download the image
        downloadImageAndAttach(from: imageURL, to: bestAttemptContent, completion: contentHandler)
    }
    
    private func downloadImageAndAttach(from url: URL, to content: UNMutableNotificationContent, completion: @escaping (UNNotificationContent) -> Void) {
        let task = URLSession.shared.downloadTask(with: url) { (temporaryFileLocation, response, error) in
            guard let temporaryFileLocation = temporaryFileLocation else {
                completion(content)
                return
            }
            
            let fileManager = FileManager.default
            let localURL = URL(fileURLWithPath: NSTemporaryDirectory()).appendingPathComponent(url.lastPathComponent)
            
            do {
                try fileManager.moveItem(at: temporaryFileLocation, to: localURL)
                
                // Create the attachment
                let attachment = try UNNotificationAttachment(identifier: "image", url: localURL, options: nil)
                content.attachments = [attachment]
                
                completion(content)
            } catch {
                print("Error creating attachment: \(error)")
                completion(content)
            }
        }
        
        task.resume()
    }
    
    override func serviceExtensionTimeWillExpire() {
        if let contentHandler = contentHandler, let bestAttemptContent = bestAttemptContent {
            contentHandler(bestAttemptContent)
        }
    }
}
```

For Android, add image URL in the FCM payload:

```json
{
  "to": "USER_FCM_TOKEN",
  "notification": {
    "title": "New Match!",
    "body": "You matched with Sarah!",
    "image": "https://example.com/notification-image.jpg"
  },
  "data": {
    "type": "new_match",
    "matchId": "123456",
    "matchedUserName": "Sarah"
  }
}
```

### Notification Channels (Android)

Create notification channels for different types of notifications:

```typescript
import messaging from '@react-native-firebase/messaging';
import notifee, { AndroidImportance } from '@notifee/react-native';

// Create notification channels
export const createNotificationChannels = async () => {
  // Only applies to Android
  if (Platform.OS === 'android') {
    await notifee.createChannel({
      id: 'matches',
      name: 'Matches',
      description: 'Notifications for new matches',
      importance: AndroidImportance.HIGH,
      vibration: true,
      lights: true,
    });
    
    await notifee.createChannel({
      id: 'messages',
      name: 'Messages',
      description: 'Notifications for new messages',
      importance: AndroidImportance.HIGH,
      vibration: true,
      lights: true,
    });
    
    await notifee.createChannel({
      id: 'likes',
      name: 'Likes',
      description: 'Notifications when someone likes you',
      importance: AndroidImportance.DEFAULT,
      vibration: true,
    });
    
    await notifee.createChannel({
      id: 'general',
      name: 'General',
      description: 'General notifications and updates',
      importance: AndroidImportance.LOW,
    });
  }
};
```

### Notification Preferences

Create a notification preferences screen to allow users to control what notifications they receive:

```tsx
// src/screens/settings/NotificationPreferencesScreen.tsx
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Switch, ScrollView } from 'react-native';
import { useAppDispatch, useAppSelector } from '../../store';
import { updateNotificationPreferences } from '../../store/slices/userSlice';
import { apiClient } from '../../services/api.client';
import { API_ENDPOINTS } from '../../services/api.config';

const NotificationPreferencesScreen = () => {
  const dispatch = useAppDispatch();
  const { notificationPreferences } = useAppSelector(state => state.user);
  
  const [preferences, setPreferences] = useState({
    newMatches: true,
    messages: true,
    likes: true,
    appUpdates: false,
    emailMarketing: false,
  });
  
  // Load user's notification preferences
  useEffect(() => {
    if (notificationPreferences) {
      setPreferences(notificationPreferences);
    }
  }, [notificationPreferences]);
  
  // Handle toggle for a preference
  const handleToggle = async (key, value) => {
    const updatedPreferences = {
      ...preferences,
      [key]: value,
    };
    
    try {
      // Update locally
      setPreferences(updatedPreferences);
      
      // Save to backend
      await apiClient.put(API_ENDPOINTS.USER_NOTIFICATION_PREFERENCES, updatedPreferences);
      
      // Update Redux
      dispatch(updateNotificationPreferences(updatedPreferences));
    } catch (error) {
      console.error('Failed to update notification preferences:', error);
      // Revert change on error
      setPreferences(preferences);
    }
  };
  
  return (
    <ScrollView style={styles.container}>
      <Text style={styles.sectionTitle}>Push Notifications</Text>
      
      <View style={styles.preferenceItem}>
        <View>
          <Text style={styles.preferenceName}>New Matches</Text>
          <Text style={styles.preferenceDescription}>
            When you get a new match
          </Text>
        </View>
        <Switch
          value={preferences.newMatches}
          onValueChange={value => handleToggle('newMatches', value)}
        />
      </View>
      
      <View style={styles.preferenceItem}>
        <View>
          <Text style={styles.preferenceName}>Messages</Text>
          <Text style={styles.preferenceDescription}>
            When you receive new messages
          </Text>
        </View>
        <Switch
          value={preferences.messages}
          onValueChange={value => handleToggle('messages', value)}
        />
      </View>
      
      <View style={styles.preferenceItem}>
        <View>
          <Text style={styles.preferenceName}>Likes</Text>
          <Text style={styles.preferenceDescription}>
            When someone likes your profile
          </Text>
        </View>
        <Switch
          value={preferences.likes}
          onValueChange={value => handleToggle('likes', value)}
        />
      </View>
      
      <Text style={styles.sectionTitle}>Other Notifications</Text>
      
      <View style={styles.preferenceItem}>
        <View>
          <Text style={styles.preferenceName}>App Updates</Text>
          <Text style={styles.preferenceDescription}>
            Updates about new features and improvements
          </Text>
        </View>
        <Switch
          value={preferences.appUpdates}
          onValueChange={value => handleToggle('appUpdates', value)}
        />
      </View>
      
      <View style={styles.preferenceItem}>
        <View>
          <Text style={styles.preferenceName}>Marketing Emails</Text>
          <Text style={styles.preferenceDescription}>
            Promotional emails and special offers
          </Text>
        </View>
        <Switch
          value={preferences.emailMarketing}
          onValueChange={value => handleToggle('emailMarketing', value)}
        />
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginVertical: 16,
    color: '#333',
  },
  preferenceItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  preferenceName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginBottom: 4,
  },
  preferenceDescription: {
    fontSize: 14,
    color: '#666',
    maxWidth: '80%',
  },
});

export default NotificationPreferencesScreen;
```

## 5. Testing Push Notifications

### Local Testing

For local testing during development, use the Firebase console to send test notifications:

1. Go to the Firebase Console > Your Project > Cloud Messaging
2. Click "Send your first message"
3. Enter the notification details and test device tokens

### Automated Testing

For automated testing, create a script to simulate different notification scenarios:

```typescript
// scripts/test-notifications.js
const admin = require('firebase-admin');
const serviceAccount = require('../server/config/firebase-admin-key.json');

// Initialize Firebase Admin SDK
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

// Function to send test notification
const sendTestNotification = async (token, type) => {
  try {
    let notification;
    let data;
    
    switch (type) {
      case 'match':
        notification = {
          title: 'New Match! (TEST)',
          body: 'You matched with Test User!',
        };
        data = {
          type: 'new_match',
          matchId: 'test-match-id',
          matchedUserName: 'Test User',
        };
        break;
        
      case 'message':
        notification = {
          title: 'New message from Test User (TEST)',
          body: 'This is a test message',
        };
        data = {
          type: 'new_message',
          messageId: 'test-message-id',
          matchId: 'test-match-id',
          senderId: 'test-user-id',
          senderName: 'Test User',
          content: 'This is a test message',
        };
        break;
        
      case 'like':
        notification = {
          title: 'Someone Likes You! (TEST)',
          body: 'Someone new has liked your profile. Upgrade to Premium to see who!',
        };
        data = {
          type: 'like_received',
          userId: 'test-user-id',
          userName: 'Test User',
        };
        break;
        
      default:
        notification = {
          title: 'Test Notification',
          body: 'This is a test notification',
        };
        data = {
          type: 'test',
        };
    }
    
    const message = {
      token,
      notification,
      data,
      android: {
        priority: 'high',
      },
      apns: {
        payload: {
          aps: {
            contentAvailable: true,
          },
        },
      },
    };
    
    const result = await admin.messaging().send(message);
    console.log(`Successfully sent ${type} test notification:`, result);
    return result;
  } catch (error) {
    console.error('Error sending test notification:', error);
    throw error;
  }
};

// Usage:
// Provide your device FCM token as an argument
const deviceToken = process.argv[2];
if (!deviceToken) {
  console.error('Please provide a device FCM token as argument');
  process.exit(1);
}

// Send test notifications of all types
Promise.all([
  sendTestNotification(deviceToken, 'match'),
  // Wait 5 seconds between notifications
  new Promise(resolve => setTimeout(() => resolve(
    sendTestNotification(deviceToken, 'message')
  ), 5000)),
  // Wait 5 more seconds
  new Promise(resolve => setTimeout(() => resolve(
    sendTestNotification(deviceToken, 'like')
  ), 10000)),
])
  .then(() => {
    console.log('All test notifications sent successfully');
    process.exit(0);
  })
  .catch(error => {
    console.error('Error in test notification sequence:', error);
    process.exit(1);
  });
```

### Production Considerations

1. **Token Refresh**: Implement token refresh logic to ensure tokens are always up-to-date
2. **Invalid Token Handling**: Remove invalid tokens from your database when FCM reports them as invalid
3. **Batch Processing**: Use Firebase Admin SDK's batch sending capabilities for efficiency when sending to many users
4. **Rate Limiting**: Implement rate limiting to prevent notification spam
5. **Quiet Hours**: Consider implementing quiet hours based on user timezone
6. **Delivery Metrics**: Track notification delivery and open rates to optimize engagement

## Conclusion

This implementation guide provides a comprehensive approach to integrating push notifications in the 10-Date mobile app. By following these steps, you'll create a reliable notification system that enhances user engagement and experience.

Remember to regularly test your notification system across different devices and scenarios to ensure consistent delivery and proper handling of all notification types.
