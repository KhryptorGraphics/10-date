import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notification } from './notification.entity';
import { WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Server } from 'socket.io';

@WebSocketGateway({ namespace: 'notifications' })
@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);
  
  @WebSocketServer()
  server: Server;
  
  constructor(
    @InjectRepository(Notification)
    private notificationRepository: Repository<Notification>,
  ) {}

  // Notification templates for common events
  private notificationTemplates = {
    newMatch: (matchedUser: string) => ({
      title: 'New Match!',
      body: `You matched with ${matchedUser}! Start a conversation now.`,
    }),
    newMessage: (sender: string) => ({
      title: 'New Message',
      body: `${sender} sent you a message.`,
    }),
    profileLike: (liker: string) => ({
      title: 'Someone Likes You',
      body: `${liker} liked your profile! Like them back to match.`,
    }),
    dailyPicks: () => ({
      title: 'Daily Picks Ready',
      body: 'Your top daily matches are ready to view!',
    }),
    subscriptionRenewal: (daysLeft: number) => ({
      title: 'Subscription Reminder',
      body: `Your premium subscription will renew in ${daysLeft} days.`,
    }),
  };

  async sendNotification(notificationData: Partial<Notification>) {
    const notification = this.notificationRepository.create({
      ...notificationData,
      status: notificationData.status || 'unread'
    });
    
    const savedNotification = await this.notificationRepository.save(notification);
    
    // Emit real-time notification via WebSockets if server is available
    if (this.server) {
      this.server.to(`user-${notification.userId}`).emit('notification', savedNotification);
    }
    
    // Send push notification if applicable
    await this.sendPushNotification(savedNotification);
    
    return savedNotification;
  }
  
  async sendPushNotification(notification: Notification) {
    try {
      // This would integrate with a push notification service like Firebase Cloud Messaging
      // or web push notifications. For now it's just a placeholder.
      this.logger.log(`Would send push notification: ${JSON.stringify(notification.content)}`);
      return { success: true };
    } catch (error) {
      this.logger.error(`Failed to send push notification: ${error.message}`);
      return { success: false, error: error.message };
    }
  }
  
  // Event-based notification methods
  async notifyNewMatch(userId: string, matchedUserId: string, matchedUserName: string) {
    const template = this.notificationTemplates.newMatch(matchedUserName);
    return this.sendNotification({
      userId,
      type: 'match',
      content: {
        matchedUserId,
        matchedUserName,
        ...template
      }
    });
  }
  
  async notifyNewMessage(userId: string, senderId: string, senderName: string, messagePreview: string) {
    const template = this.notificationTemplates.newMessage(senderName);
    return this.sendNotification({
      userId,
      type: 'message',
      content: {
        senderId,
        senderName,
        messagePreview,
        ...template
      }
    });
  }
  
  async notifyProfileLike(userId: string, likerId: string, likerName: string) {
    const template = this.notificationTemplates.profileLike(likerName);
    return this.sendNotification({
      userId,
      type: 'like',
      content: {
        likerId,
        likerName,
        ...template
      }
    });
  }

  async getUserNotifications(userId: string) {
    return this.notificationRepository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
    });
  }

  async getNotificationById(id: string) {
    return this.notificationRepository.findOne({ where: { id } });
  }

  async deleteNotification(id: string) {
    const notification = await this.notificationRepository.findOne({ where: { id } });
    if (!notification) return { deleted: false };
    await this.notificationRepository.remove(notification);
    
    // Emit notification delete event via WebSockets
    if (this.server) {
      this.server.to(`user-${notification.userId}`).emit('notification_deleted', { id });
    }
    
    return { deleted: true };
  }
  
  async deleteAllUserNotifications(userId: string) {
    const notifications = await this.notificationRepository.find({ where: { userId } });
    await this.notificationRepository.remove(notifications);
    
    // Emit notification clear event via WebSockets
    if (this.server) {
      this.server.to(`user-${userId}`).emit('notifications_cleared');
    }
    
    return { deleted: true, count: notifications.length };
  }

  async markAsRead(id: string) {
    const notification = await this.notificationRepository.findOne({ where: { id } });
    if (!notification) return { success: false, message: 'Notification not found' };
    
    notification.status = 'read';
    const updated = await this.notificationRepository.save(notification);
    
    // Emit notification status change via WebSockets
    if (this.server) {
      this.server.to(`user-${notification.userId}`).emit('notification_updated', updated);
    }
    
    return { success: true, notification: updated };
  }
  
  async markAllAsRead(userId: string) {
    const result = await this.notificationRepository.update(
      { userId, status: 'unread' },
      { status: 'read' }
    );
    
    // Emit notification batch update via WebSockets
    if (this.server && result.affected && result.affected > 0) {
      this.server.to(`user-${userId}`).emit('notifications_all_read');
    }
    
    return { success: true, count: result.affected || 0 };
  }
  
  // Helper method to register a user to the notification socket room
  registerUserSocket(userId: string, socketId: string) {
    if (this.server) {
      try {
        const socket = this.server.in(socketId);
        if (socket) {
          socket.socketsJoin(`user-${userId}`);
          this.logger.log(`User ${userId} registered for notifications on socket ${socketId}`);
        }
      } catch (error) {
        this.logger.error(`Error registering socket: ${error instanceof Error ? error.message : String(error)}`);
      }
    }
  }
}
