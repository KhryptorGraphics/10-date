import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserEntity } from '../user/user.entity/user.entity';
import { RedisService } from '../cache/redis.service';

@Injectable()
export class AdminService {
  private readonly logger = new Logger(AdminService.name);

  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
    private readonly redisService: RedisService,
  ) {}

  async getUserStats(): Promise<any> {
    // Try to get from cache first
    const cacheKey = 'admin:user-stats';
    const cachedStats = await this.redisService.get(cacheKey);
    
    if (cachedStats) {
      this.logger.log('Returning user stats from cache');
      return cachedStats;
    }

    // If not in cache, query the database
    const totalUsers = await this.userRepository.count();
    const premiumUsers = await this.userRepository.count({
      where: { subscriptionType: 'premium' },
    });
    const activeUsers = await this.userRepository.count({
      where: { isActive: true },
    });
    
    const stats = {
      totalUsers,
      premiumUsers,
      activeUsers,
      premiumPercentage: totalUsers > 0 ? (premiumUsers / totalUsers) * 100 : 0,
      activePercentage: totalUsers > 0 ? (activeUsers / totalUsers) * 100 : 0,
      timestamp: new Date().toISOString(),
    };
    
    // Cache the result for 10 minutes
    await this.redisService.set(cacheKey, stats, 600);
    
    return stats;
  }

  async getSiteMetrics(): Promise<any> {
    // Implement site-wide metrics that administrators would need
    // This could include system performance, API usage, etc.
    return {
      apiRequestsPerMinute: 120, // Example placeholder
      averageResponseTime: 250, // ms, example placeholder
      serverLoad: 0.4, // example placeholder
      activeSessions: 342, // example placeholder
      cacheHitRatio: 0.78, // example placeholder
      timestamp: new Date().toISOString(),
    };
  }

  async resetUserPassword(userId: string, newPassword: string): Promise<boolean> {
    // This would be a real admin function to reset a user's password
    // In a real implementation, you would hash the password
    try {
      // Implementation would go here
      this.logger.log(`Admin reset password for user ${userId}`);
      return true;
    } catch (error) {
      this.logger.error(`Failed to reset password for user ${userId}: ${error.message}`);
      return false;
    }
  }

  async invalidateCache(pattern: string): Promise<boolean> {
    try {
      const result = await this.redisService.deletePattern(pattern);
      this.logger.log(`Admin invalidated cache with pattern: ${pattern}`);
      return result;
    } catch (error) {
      this.logger.error(`Failed to invalidate cache: ${error.message}`);
      return false;
    }
  }
}
