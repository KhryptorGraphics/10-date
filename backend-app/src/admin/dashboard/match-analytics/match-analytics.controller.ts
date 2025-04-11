import { Controller, Get, UseGuards, Query, Param } from '@nestjs/common';
import { JwtAuthGuard } from '../../../auth/jwt-auth.guard';
import { RolesGuard } from '../../../auth/roles.guard';
import { Roles } from '../../../auth/roles.decorator';
import { MatchAnalyticsService } from './match-analytics.service';
import { UserRole } from '../../../user/user.entity/user.entity';

@Controller('admin/analytics/matches')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
export class MatchAnalyticsController {
  constructor(private readonly matchAnalyticsService: MatchAnalyticsService) {}

  /**
   * Get overall matching quality metrics
   */
  @Get('quality')
  async getMatchQualityMetrics(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.matchAnalyticsService.getMatchQualityMetrics(startDate, endDate);
  }

  /**
   * Get compatibility distribution
   */
  @Get('compatibility/distribution')
  async getCompatibilityDistribution(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.matchAnalyticsService.getCompatibilityDistribution(startDate, endDate);
  }

  /**
   * Get algorithm parameter impact analysis
   */
  @Get('parameters/impact')
  async getParameterImpactAnalysis(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.matchAnalyticsService.getParameterImpactAnalysis(startDate, endDate);
  }

  /**
   * Get match success rate over time
   */
  @Get('success/trend')
  async getMatchSuccessTrend(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('interval') interval: 'day' | 'week' | 'month' = 'day',
  ) {
    return this.matchAnalyticsService.getMatchSuccessTrend(startDate, endDate, interval);
  }

  /**
   * Get behavioral data insights
   */
  @Get('behavioral/insights')
  async getBehavioralInsights(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.matchAnalyticsService.getBehavioralInsights(startDate, endDate);
  }

  /**
   * Get detailed stats for a specific user
   */
  @Get('user/:userId')
  async getUserMatchStats(@Param('userId') userId: string) {
    return this.matchAnalyticsService.getUserMatchStats(userId);
  }
  
  /**
   * Get algorithm tuning recommendations based on historical data
   */
  @Get('tuning/recommendations')
  async getTuningRecommendations() {
    return this.matchAnalyticsService.getTuningRecommendations();
  }
  
  /**
   * Get A/B test comparison results
   */
  @Get('ab-tests')
  async getABTestResults(
    @Query('testId') testId?: string,
  ) {
    return this.matchAnalyticsService.getABTestResults(testId);
  }
  
  /**
   * Get match engagement metrics
   */
  @Get('engagement')
  async getMatchEngagementMetrics(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.matchAnalyticsService.getMatchEngagementMetrics(startDate, endDate);
  }
}
