import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notification } from './notification.entity';

@Injectable()
export class NotificationsService {
  constructor(
    @InjectRepository(Notification)
    private notificationRepository: Repository<Notification>,
  ) {}

  async sendNotification(notificationData: Partial<Notification>) {
    const notification = this.notificationRepository.create(notificationData);
    return this.notificationRepository.save(notification);
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
    return { deleted: true };
  }

  async markAsRead(id: string) {
    const notification = await this.notificationRepository.findOne({ where: { id } });
    if (!notification) return { success: false, message: 'Notification not found' };
    
    notification.status = 'read';
    await this.notificationRepository.save(notification);
    return { success: true, notification };
  }
}
