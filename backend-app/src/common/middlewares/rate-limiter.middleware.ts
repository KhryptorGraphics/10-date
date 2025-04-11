import { Injectable, NestMiddleware, Logger, HttpStatus } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { RedisService } from '../../cache/redis.service';
import { ConfigService } from '@nestjs/config';

/**
 * Rate limiting middleware that uses Redis to track and limit request rates.
 * This middleware can be applied to controllers or routes to protect against abuse.
 */
@Injectable()
export class RateLimiterMiddleware implements NestMiddleware {
  private readonly logger = new Logger('RateLimiterMiddleware');
  private readonly windowMs: number;
  private readonly maxRequests: number;
  private readonly message: string;

  constructor(
    private readonly redisService: RedisService,
    private readonly configService: ConfigService,
  ) {
    // Read configuration from environment variables
    this.windowMs = this.configService.get<number>('RATE_LIMIT_WINDOW_MS', 60000); // Default: 1 minute
    this.maxRequests = this.configService.get<number>('RATE_LIMIT_MAX_REQUESTS', 100); // Default: 100 requests per minute
    this.message = this.configService.get<string>(
      'RATE_LIMIT_MESSAGE',
      'Too many requests, please try again later',
    );
    
    this.logger.log(`Rate limiter initialized: ${this.maxRequests} requests per ${this.windowMs / 1000}s window`);
  }

  async use(req: Request, res: Response, next: NextFunction): Promise<void> {
    // Determine the client identifier (either user ID or IP address)
    const identifier = this.getClientIdentifier(req);
    const endpoint = this.getEndpointIdentifier(req);
    
    // Adjust limits based on user role if authenticated
    const { limit, windowSec } = this.getLimitsForUser(req);

    // Create a unique key for this client+endpoint combination
    const rateLimitKey = `ratelimit:${endpoint}:${identifier}`;

    try {
      // Apply rate limiting
      const result = await this.redisService.rateLimit(
        rateLimitKey,
        limit,
        windowSec,
      );

      // Set rate limiting headers
      res.header('X-RateLimit-Limit', limit.toString());
      res.header('X-RateLimit-Remaining', result.remaining.toString());

      if (!result.success) {
        // Add Retry-After header if limit is exceeded
        res.header('Retry-After', result.resetTime.toString());
        res.status(HttpStatus.TOO_MANY_REQUESTS).json({
          statusCode: HttpStatus.TOO_MANY_REQUESTS,
          message: this.message,
          retryAfter: result.resetTime,
        });
        return;
      }

      next();
    } catch (error) {
      // Log error but allow the request to proceed in case of Redis failure
      this.logger.error(`Rate limiter failed: ${error.message}`);
      next();
    }
  }

  /**
   * Extract a unique identifier for the client from the request
   */
  private getClientIdentifier(req: Request): string {
    // Use user ID if authenticated
    if (req.user && 'id' in req.user) {
      return `user:${req.user.id}`;
    }

    // Fall back to IP address
    const xForwardedFor = req.headers['x-forwarded-for'];
    const ip = Array.isArray(xForwardedFor)
      ? xForwardedFor[0]
      : typeof xForwardedFor === 'string'
      ? xForwardedFor.split(',')[0].trim()
      : req.ip || 'unknown';

    return `ip:${ip}`;
  }

  /**
   * Extract an identifier for the endpoint being accessed
   */
  private getEndpointIdentifier(req: Request): string {
    // Use route path if available, otherwise use URL path
    return req.route?.path || req.path || req.url || 'unknown';
  }

  /**
   * Get appropriate rate limits based on user role
   */
  private getLimitsForUser(req: Request): { limit: number; windowSec: number } {
    // Higher limits for authenticated users
    if (req.user) {
      // Check for administrator role
      if (req.user['role'] === 'admin') {
        return { 
          limit: this.maxRequests * 5, // 5x the normal limit for admins
          windowSec: this.windowMs / 1000,
        };
      }
      
      // Premium users get higher limits
      if (req.user['subscriptionType'] && req.user['subscriptionType'] !== 'free') {
        return { 
          limit: this.maxRequests * 2, // 2x the normal limit for premium users
          windowSec: this.windowMs / 1000,
        };
      }
      
      // Regular authenticated users
      return { 
        limit: this.maxRequests, 
        windowSec: this.windowMs / 1000,
      };
    }
    
    // Unauthenticated users get a lower limit
    return { 
      limit: Math.floor(this.maxRequests / 2), // Half the limit for unauthenticated users
      windowSec: this.windowMs / 1000,
    };
  }
}
