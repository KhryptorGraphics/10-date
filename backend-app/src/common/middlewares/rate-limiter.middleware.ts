import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { RedisService } from '../../cache/redis.service';
import { ConfigService } from '@nestjs/config';
import { HttpException, HttpStatus } from '@nestjs/common';

/**
 * Rate limiter middleware that uses Redis to track and limit API requests
 * Can be applied globally or to specific routes
 */
@Injectable()
export class RateLimiterMiddleware implements NestMiddleware {
  private readonly windowMs: number; // Time window in milliseconds
  private readonly maxRequests: number; // Maximum requests per window
  private readonly message: string; // Error message

  constructor(
    private readonly redisService: RedisService,
    private readonly configService: ConfigService,
  ) {
    // Default values can be overridden by environment variables
    this.windowMs = this.configService.get<number>('RATE_LIMIT_WINDOW_MS', 60 * 1000); // 1 minute
    this.maxRequests = this.configService.get<number>('RATE_LIMIT_MAX_REQUESTS', 100); // 100 requests
    this.message = this.configService.get<string>('RATE_LIMIT_MESSAGE', 'Too many requests, please try again later');
  }

  /**
   * Middleware implementation that checks if the request exceeds rate limits
   */
  async use(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // Get client identifier (IP address, user ID if authenticated, etc.)
      const identifier = this.getIdentifier(req);
      const key = `ratelimit:${identifier}`;

      // Get current count
      const current = await this.redisService.get<number>(key) || 0;

      // If exceeds limit, reject request
      if (current >= this.maxRequests) {
        const retryAfter = Math.ceil(this.windowMs / 1000); // Convert to seconds
        res.setHeader('Retry-After', retryAfter);
        throw new HttpException(this.message, HttpStatus.TOO_MANY_REQUESTS);
      }

      // If first request, set key with expiry based on window
      if (current === 0) {
        await this.redisService.set(key, 1, Math.ceil(this.windowMs / 1000));
      } else {
        // Increment counter
        await this.redisService.increment(key);
      }

      // Add X-RateLimit headers to response
      res.setHeader('X-RateLimit-Limit', this.maxRequests);
      res.setHeader('X-RateLimit-Remaining', this.maxRequests - Number(current) - 1);

      next();
    } catch (error) {
      if (error instanceof HttpException) {
        res.status(error.getStatus()).json({
          statusCode: error.getStatus(),
          message: error.message,
        });
      } else {
        next(error);
      }
    }
  }

  /**
   * Helper method to get a unique identifier for the client
   * Prioritizes auth token > user ID > IP address
   */
  private getIdentifier(req: Request): string {
    // If user is authenticated, use user ID
    const user = req.user as { id?: string } | undefined;
    if (user && user.id) {
      return `user:${user.id}`;
    }

    // If auth token exists, use that
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      // Use just a hash of the token to avoid storing sensitive data
      const token = authHeader.substring(7);
      return `token:${this.hashString(token)}`;
    }

    // Fall back to IP address
    const ip = req.ip || 
               req.connection?.remoteAddress || 
               req.headers['x-forwarded-for'] || 
               'unknown';
    
    return `ip:${ip}`;
  }

  /**
   * Simple string hash function
   */
  private hashString(str: string): string {
    let hash = 0;
    if (str.length === 0) return hash.toString();
    
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    
    return hash.toString();
  }
}
