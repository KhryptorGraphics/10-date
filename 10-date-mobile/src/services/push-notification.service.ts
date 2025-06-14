import messaging from '@react-native-firebase/messaging';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform, PermissionsAndroid } from 'react-native';

export interface NotificationData {
  title: string;
  body: string;
  data?: Record<string, any>;
  type?: 'match' | 'message' | 'like' | 'system';
}

class PushNotificationService {
  private fcmToken: string | null = null;
  private isInitialized = false;

  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      // Request permission for iOS
      if (Platform.OS === 'ios') {
        const authStatus = await messaging().requestPermission();
        const enabled =
          authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
          authStatus === messaging.AuthorizationStatus.PROVISIONAL;

        if (!enabled) {
          console.log('Push notification permission denied');
          return;
        }
      }

      // Request permission for Android
      if (Platform.OS === 'android') {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS,
        );
        if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
          console.log('Push notification permission denied');
          return;
        }
      }

      // Get FCM token
      await this.getFCMToken();

      // Set up message handlers
      this.setupMessageHandlers();

      this.isInitialized = true;
      console.log('Push notification service initialized');
    } catch (error) {
      console.error('Failed to initialize push notifications:', error);
    }
  }

  private async getFCMToken(): Promise<string | null> {
    try {
      const token = await messaging().getToken();
      this.fcmToken = token;
      
      // Store token locally
      await AsyncStorage.setItem('fcm_token', token);
      
      console.log('FCM Token:', token);
      return token;
    } catch (error) {
      console.error('Failed to get FCM token:', error);
      return null;
    }
  }

  private setupMessageHandlers(): void {
    // Handle background messages
    messaging().setBackgroundMessageHandler(async (remoteMessage) => {
      console.log('Message handled in the background!', remoteMessage);
      await this.handleBackgroundMessage(remoteMessage);
    });

    // Handle foreground messages
    messaging().onMessage(async (remoteMessage) => {
      console.log('Message handled in the foreground!', remoteMessage);
      await this.handleForegroundMessage(remoteMessage);
    });

    // Handle notification opened app
    messaging().onNotificationOpenedApp((remoteMessage) => {
      console.log('Notification caused app to open from background state:', remoteMessage);
      this.handleNotificationPress(remoteMessage);
    });

    // Check whether an initial notification is available
    messaging()
      .getInitialNotification()
      .then((remoteMessage) => {
        if (remoteMessage) {
          console.log('Notification caused app to open from quit state:', remoteMessage);
          this.handleNotificationPress(remoteMessage);
        }
      });

    // Handle token refresh
    messaging().onTokenRefresh((token) => {
      console.log('FCM token refreshed:', token);
      this.fcmToken = token;
      AsyncStorage.setItem('fcm_token', token);
      // Send updated token to server
      this.sendTokenToServer(token);
    });
  }

  private async handleBackgroundMessage(remoteMessage: any): Promise<void> {
    // Store notification for later processing
    const notifications = await this.getStoredNotifications();
    notifications.push({
      ...remoteMessage,
      receivedAt: Date.now(),
      read: false,
    });
    await AsyncStorage.setItem('stored_notifications', JSON.stringify(notifications));
  }

  private async handleForegroundMessage(remoteMessage: any): Promise<void> {
    // Show in-app notification or update UI
    const notificationData: NotificationData = {
      title: remoteMessage.notification?.title || 'New notification',
      body: remoteMessage.notification?.body || '',
      data: remoteMessage.data,
      type: remoteMessage.data?.type || 'system',
    };

    // Emit event for components to listen to
    this.emitNotificationReceived(notificationData);
  }

  private handleNotificationPress(remoteMessage: any): void {
    // Navigate to appropriate screen based on notification type
    const notificationType = remoteMessage.data?.type;
    const navigationData = {
      type: notificationType,
      data: remoteMessage.data,
    };

    // Emit navigation event
    this.emitNotificationPressed(navigationData);
  }

  private async getStoredNotifications(): Promise<any[]> {
    try {
      const stored = await AsyncStorage.getItem('stored_notifications');
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Failed to get stored notifications:', error);
      return [];
    }
  }

  private emitNotificationReceived(notification: NotificationData): void {
    // This would typically use an event emitter or state management
    console.log('Notification received:', notification);
  }

  private emitNotificationPressed(navigationData: any): void {
    // This would typically use navigation service
    console.log('Notification pressed:', navigationData);
  }

  async sendTokenToServer(token?: string): Promise<void> {
    const fcmToken = token || this.fcmToken;
    if (!fcmToken) return;

    try {
      // Send token to your backend
      const response = await fetch('/api/user/fcm-token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // Add authorization header
        },
        body: JSON.stringify({ fcmToken }),
      });

      if (response.ok) {
        console.log('FCM token sent to server successfully');
      }
    } catch (error) {
      console.error('Failed to send FCM token to server:', error);
    }
  }

  async subscribeToTopic(topic: string): Promise<void> {
    try {
      await messaging().subscribeToTopic(topic);
      console.log(`Subscribed to topic: ${topic}`);
    } catch (error) {
      console.error(`Failed to subscribe to topic ${topic}:`, error);
    }
  }

  async unsubscribeFromTopic(topic: string): Promise<void> {
    try {
      await messaging().unsubscribeFromTopic(topic);
      console.log(`Unsubscribed from topic: ${topic}`);
    } catch (error) {
      console.error(`Failed to unsubscribe from topic ${topic}:`, error);
    }
  }

  async clearNotifications(): Promise<void> {
    try {
      await AsyncStorage.removeItem('stored_notifications');
      console.log('Notifications cleared');
    } catch (error) {
      console.error('Failed to clear notifications:', error);
    }
  }

  getToken(): string | null {
    return this.fcmToken;
  }

  async getStoredToken(): Promise<string | null> {
    try {
      return await AsyncStorage.getItem('fcm_token');
    } catch (error) {
      console.error('Failed to get stored FCM token:', error);
      return null;
    }
  }
}

export default new PushNotificationService();