import React, { useEffect } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import PushNotificationService from '../services/push-notification.service';

interface NotificationProviderProps {
  children: React.ReactNode;
}

export const NotificationProvider: React.FC<NotificationProviderProps> = ({ children }) => {
  useEffect(() => {
    // Initialize push notifications when app starts
    PushNotificationService.initialize();

    // Handle app state changes
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      if (nextAppState === 'active') {
        // App has come to the foreground
        console.log('App has come to the foreground');
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);

    return () => {
      subscription?.remove();
    };
  }, []);

  return <>{children}</>;
};