import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

@Injectable()
export class RedisService {
  private readonly redis: Redis;
  private readonly ttl: number = 3600; // Default TTL = 1 hour

  constructor(private readonly configService: ConfigService) {
    this.redis = new Redis({
      host: this.configService.get<string>('REDIS_HOST', 'localhost'),
      port: this.configService.get<number>('REDIS_PORT', 6379),
      password: this.configService.get<string>('REDIS_PASSWORD', ''),
      db: this.configService.get<number>('REDIS_DB', 0),
    });
  }

  /**
   * Set a key-value pair in Redis with optional expiration
   */
  async set(key: string, value: any, expireSeconds?: number): Promise<void> {
    const serializedValue = JSON.stringify(value);
    if (expireSeconds) {
      await this.redis.setex(key, expireSeconds, serializedValue);
    } else {
      await this.redis.setex(key, this.ttl, serializedValue);
    }
  }

  /**
   * Get a value from Redis by key
   */
  async get<T>(key: string): Promise<T | null> {
    const value = await this.redis.get(key);
    if (!value) {
      return null;
    }
    
    return JSON.parse(value) as T;
  }

  /**
   * Delete a key from Redis
   */
  async delete(key: string): Promise<void> {
    await this.redis.del(key);
  }

  /**
   * Delete keys matching a pattern
   */
  async deletePattern(pattern: string): Promise<void> {
    const keys = await this.redis.keys(pattern);
    if (keys.length > 0) {
      await this.redis.del(...keys);
    }
  }

  /**
   * Check if key exists
   */
  async exists(key: string): Promise<boolean> {
    const exists = await this.redis.exists(key);
    return exists === 1;
  }

  /**
   * Set expiration time on key
   */
  async expire(key: string, seconds: number): Promise<void> {
    await this.redis.expire(key, seconds);
  }

  /**
   * Get remaining TTL of a key
   */
  async ttlOf(key: string): Promise<number> {
    return this.redis.ttl(key);
  }

  /**
   * Increment a value
   */
  async increment(key: string, by: number = 1): Promise<number> {
    return this.redis.incrby(key, by);
  }

  /**
   * Sets multiple hash fields to multiple values
   */
  async hmset(key: string, obj: Record<string, any>): Promise<void> {
    const serialized = Object.entries(obj).reduce(
      (result, [field, value]) => {
        result[field] = typeof value === 'object' 
          ? JSON.stringify(value) 
          : String(value);
        return result;
      },
      {} as Record<string, string>
    );
    
    await this.redis.hmset(key, serialized);
  }

  /**
   * Gets all the fields and values in a hash
   */
  async hgetall<T>(key: string): Promise<T | null> {
    const data = await this.redis.hgetall(key);
    
    if (!data || Object.keys(data).length === 0) {
      return null;
    }
    
    // Try to parse JSON values
    const parsed = Object.entries(data).reduce(
      (result, [field, value]) => {
        try {
          result[field] = JSON.parse(value);
        } catch {
          result[field] = value;
        }
        return result;
      },
      {} as Record<string, any>
    );
    
    return parsed as T;
  }
}
