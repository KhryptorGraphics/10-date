import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RedisService } from '../../../cache/redis.service';
import { MatchEntity } from '../../../matching/match.entity/match.entity';
import { SwipeEntity } from '../../../matching/match.entity/swipe.entity';
import { SwipeDataEntity } from '../../../matching/match.entity/swipe-data.entity';
import { UserEntity } from '../../../user/user.entity/user.entity';

@Injectable()
export class MatchAnalyticsService {
  private readonly logger = new Logger(MatchAnalyticsService.name);

  constructor(
    @InjectRepository(MatchEntity)
    private readonly matchRepository: Repository<MatchEntity>,
    @InjectRepository(SwipeEntity)
    private readonly swipeRepository: Repository<SwipeEntity>,
    @InjectRepository(SwipeDataEntity)
    private readonly swipeDataRepository: Repository<SwipeDataEntity>,
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
    private readonly redisService: RedisService,
  ) {}

  async getMatchQualityMetrics(startDate?: Date, endDate?: Date): Promise<any> {
    // Try to get from cache if no date filter is applied
    if (!startDate && !endDate) {
      const cacheKey = 'admin:match-quality-metrics';
      const cachedMetrics = await this.redisService.get(cacheKey);
      
      if (cachedMetrics) {
        this.logger.log('Returning match quality metrics from cache');
        return cachedMetrics;
      }
    }

    // Build query with date range if provided
    const query = this.matchRepository.createQueryBuilder('match')
      .leftJoinAndSelect('match.user1', 'user1')
      .leftJoinAndSelect('match.user2', 'user2')
      .leftJoinAndSelect('match.messages', 'messages');
    
    if (startDate) {
      query.andWhere('match.createdAt >= :startDate', { startDate });
    }
    
    if (endDate) {
      query.andWhere('match.createdAt <= :endDate', { endDate });
    }

    // Get matches with their related entities
    const matches = await query.getMany();
    
    // Calculate metrics
    const totalMatches = matches.length;
    
    // Matches with messages
    const matchesWithMessages = matches.filter(match => match.messages && match.messages.length > 0);
    const successRate = totalMatches > 0 ? (matchesWithMessages.length / totalMatches) * 100 : 0;
    
    // Average messages per match
    const totalMessages = matchesWithMessages.reduce(
      (sum, match) => sum + match.messages.length, 0
    );
    const avgMessagesPerMatch = matchesWithMessages.length > 0 
      ? totalMessages / matchesWithMessages.length 
      : 0;
    
    // Mock average compatibility score (in a real system, this would be calculated based on algorithm scores)
    const avgCompatibilityScore = 78.5;
    
    // Mock average response time (in minutes)
    const avgResponseTime = 12.3;
    
    const metrics = {
      averageCompatibilityScore: avgCompatibilityScore,
      matchSuccessRate: successRate,
      averageResponseTime: avgResponseTime,
      averageMessagesPerMatch: avgMessagesPerMatch,
      totalMatchesAnalyzed: totalMatches,
      timestamp: new Date().toISOString(),
    };
    
    // Cache results if no date filter applied
    if (!startDate && !endDate) {
      await this.redisService.set('admin:match-quality-metrics', metrics, 1800); // 30 minutes
    }
    
    return metrics;
  }

  async getCompatibilityDistribution(): Promise<any[]> {
    // This would calculate the distribution of compatibility scores
    // Mocked data for now - in a real implementation, this would query actual data
    return [
      { range: '90-100%', count: 156, percentage: 12 },
      { range: '80-89%', count: 423, percentage: 32 },
      { range: '70-79%', count: 378, percentage: 29 },
      { range: '60-69%', count: 214, percentage: 16 },
      { range: 'Below 60%', count: 143, percentage: 11 },
    ];
  }

  async getParameterImpact(): Promise<any[]> {
    // This would analyze which matching parameters have the most impact
    // Mocked data for now
    return [
      { parameter: 'Age Proximity', importance: 0.85, correlationWithSuccess: 0.72 },
      { parameter: 'Shared Interests', importance: 0.92, correlationWithSuccess: 0.88 },
      { parameter: 'Location Distance', importance: 0.78, correlationWithSuccess: 0.65 },
      { parameter: 'Education Level', importance: 0.45, correlationWithSuccess: 0.38 },
      { parameter: 'Activity Level', importance: 0.67, correlationWithSuccess: 0.59 },
    ];
  }

  async getSuccessTrend(interval: 'day' | 'week' | 'month' = 'day', limit: number = 30): Promise<any[]> {
    // Get trend data over time
    // Mocked data for now
    const today = new Date();
    const result = [];
    
    for (let i = 0; i < limit; i++) {
      const date = new Date();
      date.setDate(today.getDate() - i);
      
      result.unshift({
        date: date.toISOString().split('T')[0],
        successRate: 50 + Math.random() * 30, // Random value between 50-80
        matchCount: Math.floor(100 + Math.random() * 400), // Random count 100-500
      });
    }
    
    return result;
  }

  async getBehavioralInsights(): Promise<any[]> {
    // This would provide insights into user behavioral patterns
    // Mocked data for now
    return [
      {
        metric: 'Avg. Profile View Time',
        value: 12.5,
        change: 2.3,
        insight: 'Users are spending more time viewing profiles before swiping',
      },
      {
        metric: 'Right Swipe Ratio',
        value: 42.8,
        change: -3.7,
        insight: 'Users are becoming more selective in their right swipes',
      },
      {
        metric: 'Interest-Based Matches',
        value: 68.2,
        change: 5.1,
        insight: 'Shared interests are increasingly driving successful matches',
      },
      {
        metric: 'Photo-Only Decisions',
        value: 31.5,
        change: -4.2,
        insight: 'Fewer users are making decisions based solely on photos',
      },
      {
        metric: 'Bio Read Rate',
        value: 58.3,
        change: 6.9,
        insight: 'More users are reading bios before making swiping decisions',
      },
      {
        metric: 'First Message Response',
        value: 76.4,
        change: 3.2,
        insight: 'Response rate to first messages has improved',
      },
    ];
  }
}
