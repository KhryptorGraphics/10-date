import { Injectable } from '@nestjs/common';
import { HealthIndicator, HealthIndicatorResult, HealthCheckError } from '@nestjs/terminus';
import { RedisService } from '../cache/redis.service';

@Injectable()
export class RedisHealthIndicator extends HealthIndicator {
  constructor(private readonly redisService: RedisService) {
    super();
  }

  /**
   * Check if Redis is up and running
   * @param key The key which will be used for the result object
   */
  async pingCheck(key: string): Promise<HealthIndicatorResult> {
    try {
      // Attempt to ping Redis
      await this.redisService.ping();
      
      return this.getStatus(key, true);
    } catch (error) {
      throw new HealthCheckError(
        'Redis health check failed', 
        this.getStatus(key, false, { message: error instanceof Error ? error.message : 'Unknown error' })
      );
    }
  }
}
