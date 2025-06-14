import { useEffect, useState } from 'react';
import PushNotificationService, { NotificationData } from '../services/push-notification.service';

export const useNotifications = () => {
  const [notifications, setNotifications] = useState<NotificationData[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    // Load stored notifications
    loadStoredNotifications();
  }, []);

  const loadStoredNotifications = async () => {
    try {
      // This would load from AsyncStorage
      const stored = await PushNotificationService.getStoredToken();
      // Implementation would depend on your notification storage structure
    } catch (error) {
      console.error('Failed to load notifications:', error);
    }
  };

  const markAsRead = async (notificationId: string) => {
    // Mark notification as read
    setNotifications(prev => 
      prev.map(notif => 
        notif.id === notificationId 
          ? { ...notif, read: true }
          : notif
      )
    );
    
    // Update unread count
    setUnreadCount(prev => Math.max(0, prev - 1));
  };

  const clearAll = async () => {
    await PushNotificationService.clearNotifications();
    setNotifications([]);
    setUnreadCount(0);
  };

  return {
    notifications,
    unreadCount,
    markAsRead,
    clearAll,
  };
};