import { 
  Controller, 
  Get, 
  Post, 
  Put, 
  Delete, 
  Param, 
  Body, 
  UseGuards, 
  Query, 
  UseInterceptors,
  UploadedFile,
  ParseUUIDPipe,
  HttpStatus,
  HttpCode,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { UserService } from '../user/user.service';
import { MatchingService } from '../matching/matching.service';
import { PaymentsService } from '../payments/payments.service';
import { NotificationsService } from '../notifications/notifications.service';
import { AnalyticsService } from '../analytics/analytics.service';
import { MediaService } from '../media/media.service';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

// DTOs for admin functionality
class UpdateUserStatusDto {
  active: boolean;
  reason?: string;
}

class CreateNotificationDto {
  userIds: string[];
  type: string;
  title: string;
  body: string;
  action?: string;
  actionUrl?: string;
}

class DateRangeDto {
  startDate: Date;
  endDate: Date;
}

class CreateInterestDto {
  name: string;
  category: string;
}

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('admin')
export class AdminController {
  constructor(
    private readonly userService: UserService,
    private readonly matchingService: MatchingService,
    private readonly paymentsService: PaymentsService,
    private readonly notificationsService: NotificationsService,
    private readonly analyticsService: AnalyticsService,
    private readonly mediaService: MediaService,
  ) {}

  // User Management
  @Roles('admin')
  @Get('users')
  async getAllUsers(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 20,
    @Query('search') search?: string,
    @Query('status') status?: 'active' | 'inactive' | 'suspended',
  ) {
    return this.userService.getAllUsers({ 
      page, 
      limit, 
      search, 
      status
    });
  }

  @Roles('admin')
  @Get('users/:id')
  async getUser(@Param('id', ParseUUIDPipe) id: string) {
    return this.userService.getUserById(id, { includeDetails: true });
  }

  @Roles('admin')
  @Put('users/:id')
  async updateUser(
    @Param('id', ParseUUIDPipe) id: string, 
    @Body() updateData: any
  ) {
    return this.userService.updateUser(id, updateData);
  }

  @Roles('admin')
  @Put('users/:id/status')
  async updateUserStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() statusData: UpdateUserStatusDto,
  ) {
    const { active, reason } = statusData;
    if (active) {
      return this.userService.activateUser(id);
    } else {
      return this.userService.deactivateUser(id, reason);
    }
  }

  @Roles('admin')
  @Delete('users/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteUser(@Param('id', ParseUUIDPipe) id: string) {
    await this.userService.deleteUser(id);
  }

  // Content Moderation
  @Roles('admin')
  @Get('moderation/reports')
  async getReports(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 20,
    @Query('status') status?: 'open' | 'resolved' | 'rejected',
  ) {
    // Would connect to a ReportService in a real implementation
    return { reports: [], total: 0 };
  }

  @Roles('admin')
  @Put('moderation/reports/:id')
  async updateReportStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateData: { status: 'resolved' | 'rejected'; comment?: string },
  ) {
    // Would connect to a ReportService in a real implementation
    return { id, status: updateData.status };
  }

  @Roles('admin')
  @Delete('media/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteMedia(@Param('id', ParseUUIDPipe) id: string) {
    await this.mediaService.deleteFile(id);
  }

  @Roles('admin')
  @Get('media/review')
  async getMediaForReview(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 20,
    @Query('status') status?: 'pending' | 'approved' | 'rejected',
  ) {
    // Would connect to a MediaReviewService in a real implementation
    return { media: [], total: 0 };
  }

  // Analytics & Reporting
  @Roles('admin')
  @Get('analytics/engagement')
  async getEngagementAnalytics(@Body() dateRange?: DateRangeDto) {
    return this.analyticsService.getUserEngagement(dateRange);
  }

  @Roles('admin')
  @Get('analytics/revenue')
  async getRevenueAnalytics(@Body() dateRange?: DateRangeDto) {
    return this.analyticsService.getRevenueStats(dateRange);
  }

  @Roles('admin')
  @Get('analytics/system')
  async getSystemAnalytics() {
    return this.analyticsService.getSystemHealth();
  }

  @Roles('admin')
  @Get('analytics/matching')
  async getMatchingAnalytics(@Body() dateRange?: DateRangeDto) {
    // This would be part of an enhanced analytics service
    return { 
      swipes: { total: 0, right: 0, left: 0 },
      matches: { total: 0, conversationStarted: 0 },
      avgMatchesPerUser: 0
    };
  }

  // Notification Management
  @Roles('admin')
  @Post('notifications')
  async sendBulkNotifications(@Body() notification: CreateNotificationDto) {
    const sentNotifications = [];
    
    for (const userId of notification.userIds) {
      const sent = await this.notificationsService.sendNotification({
        userId,
        type: notification.type,
        content: {
          title: notification.title,
          body: notification.body,
          action: notification.action,
          actionUrl: notification.actionUrl,
        },
        status: 'unread',
      });
      sentNotifications.push(sent);
    }
    
    return { sent: sentNotifications.length };
  }

  @Roles('admin')
  @Get('notifications/templates')
  async getNotificationTemplates() {
    // Would connect to a notification template service in a real implementation
    return [
      { id: 'new-feature', name: 'New Feature Announcement' },
      { id: 'important-update', name: 'Important Update' },
      { id: 'promotion', name: 'Special Promotion' },
    ];
  }

  // Subscription & Payment Management
  @Roles('admin')
  @Get('subscriptions')
  async getAllSubscriptions(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 20,
    @Query('status') status?: 'active' | 'canceled' | 'expired',
  ) {
    // Would connect to an enhanced PaymentsService in a real implementation
    return { subscriptions: [], total: 0 };
  }

  @Roles('admin')
  @Get('subscriptions/:id')
  async getSubscription(@Param('id', ParseUUIDPipe) id: string) {
    // Would connect to an enhanced PaymentsService in a real implementation
    return { id, status: 'active' };
  }

  @Roles('admin')
  @Put('subscriptions/:id')
  async updateSubscription(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateData: { status: 'active' | 'canceled' | 'expired' },
  ) {
    // Would connect to an enhanced PaymentsService in a real implementation
    return { id, status: updateData.status };
  }

  // System Settings
  @Roles('admin')
  @Get('settings')
  async getSystemSettings() {
    return {
      registration: { enabled: true },
      matching: { dailyLimit: 100 },
      fees: { subscriptionAmount: 9.99 },
      features: { videoChat: true }
    };
  }

  @Roles('admin')
  @Put('settings')
  async updateSystemSettings(@Body() settings: any) {
    // Would connect to a settings service in a real implementation
    return settings;
  }

  // Manage interests/categories
  @Roles('admin')
  @Get('interests')
  async getAllInterests() {
    return this.userService.getAllInterests();
  }

  @Roles('admin')
  @Post('interests')
  async createInterest(@Body() interestData: CreateInterestDto) {
    return this.userService.createInterest(interestData);
  }

  @Roles('admin')
  @Put('interests/:id')
  async updateInterest(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateData: Partial<CreateInterestDto>,
  ) {
    return this.userService.updateInterest(id, updateData);
  }

  @Roles('admin')
  @Delete('interests/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteInterest(@Param('id', ParseUUIDPipe) id: string) {
    await this.userService.deleteInterest(id);
  }

  // Verification Management
  @Roles('admin')
  @Get('verifications')
  async getPendingVerifications(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 20,
    @Query('status') status: 'pending' | 'approved' | 'rejected' = 'pending',
  ) {
    // Would connect to a verification service in a real implementation
    return { verifications: [], total: 0 };
  }

  @Roles('admin')
  @Put('verifications/:id')
  async processVerification(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateData: { status: 'approved' | 'rejected'; reason?: string },
  ) {
    // Would connect to a verification service in a real implementation
    return { id, status: updateData.status };
  }
}
