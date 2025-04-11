import { Controller, Post, Body, Get, Param, Delete, UseGuards, Patch } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Post('send')
  async sendNotification(@Body() notificationData: any) {
    return this.notificationsService.sendNotification(notificationData);
  }

  @Get(':userId')
  async getUserNotifications(@Param('userId') userId: string) {
    return this.notificationsService.getUserNotifications(userId);
  }

  @Get('notification/:id')
  async getNotification(@Param('id') id: string) {
    return this.notificationsService.getNotificationById(id);
  }

  @Delete('notification/:id')
  async deleteNotification(@Param('id') id: string) {
    return this.notificationsService.deleteNotification(id);
  }

  @Patch('notification/:id/read')
  async markNotificationAsRead(@Param('id') id: string) {
    return this.notificationsService.markAsRead(id);
  }
}
