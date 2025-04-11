import { Controller, Get, UseGuards } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';

@Controller('analytics')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('user-engagement')
  async getUserEngagement() {
    return this.analyticsService.getUserEngagement();
  }

  @Get('revenue')
  async getRevenueStats() {
    return this.analyticsService.getRevenueStats();
  }

  @Get('system-health')
  async getSystemHealth() {
    return this.analyticsService.getSystemHealth();
  }

  @Get('active-users')
  async getActiveUsers() {
    return this.analyticsService.getActiveUsers();
  }

  @Get('new-users')
  async getNewUsers() {
    return this.analyticsService.getNewUsers();
  }
}
