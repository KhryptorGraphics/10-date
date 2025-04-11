import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { MatchAnalyticsService } from './match-analytics.service';
import { JwtAuthGuard } from '../../../auth/jwt-auth.guard';
import { RolesGuard } from '../../../auth/roles.guard';
import { Roles } from '../../../auth/roles.decorator';

Controller('admin/analytics/matches')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
export class MatchAnalyticsController {
  constructor(private readonly matchAnalyticsService: MatchAnalyticsService) {}

  @Get('quality-metrics')
  async getQualityMetrics(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const startDateObj = startDate ? new Date(startDate) : undefined;
    const endDateObj = endDate ? new Date(endDate) : undefined;
    
    return this.matchAnalyticsService.getMatchQualityMetrics(startDateObj, endDateObj);
  }

  @Get('compatibility-distribution')
  async getCompatibilityDistribution() {
    return this.matchAnalyticsService.getCompatibilityDistribution();
  }

  @Get('parameter-impact')
  async getParameterImpact() {
    return this.matchAnalyticsService.getParameterImpact();
  }

  @Get('success-trend')
  async getSuccessTrend(
    @Query('interval') interval?: 'day' | 'week' | 'month',
    @Query('limit') limit?: number,
  ) {
    return this.matchAnalyticsService.getSuccessTrend(
      interval || 'day',
      limit ? Math.min(Math.max(1, Number(limit)), 90) : 30,
    );
  }

  @Get('behavioral-insights')
  async getBehavioralInsights() {
    return this.matchAnalyticsService.getBehavioralInsights();
  }

  @Get('dashboard')
  async getDashboardData() {
    const [
      qualityMetrics,
      compatibilityDistribution,
      parameterImpact,
      successTrend,
      behavioralInsights,
    ] = await Promise.all([
      this.matchAnalyticsService.getMatchQualityMetrics(),
      this.matchAnalyticsService.getCompatibilityDistribution(),
      this.matchAnalyticsService.getParameterImpact(),
      this.matchAnalyticsService.getSuccessTrend(),
      this.matchAnalyticsService.getBehavioralInsights(),
    ]);
    
    return {
      qualityMetrics,
      compatibilityDistribution,
      parameterImpact,
      successTrend,
      behavioralInsights,
      timestamp: new Date().toISOString(),
    };
  }
}
