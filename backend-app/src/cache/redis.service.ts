import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

@Injectable()
export class RedisService implements OnModuleDestroy {
  private readonly client: Redis;

  constructor(private readonly configService: ConfigService) {
    this.client = new Redis({
      host: this.configService.get('redis.host', 'localhost'),
      port: this.configService.get('redis.port', 6379),
      password: this.configService.get('redis.password'),
      db: this.configService.get('redis.db', 0),
      keyPrefix: this.configService.get('redis.keyPrefix', '10date:'),
      retryStrategy: (times) => {
        const delay = Math.min(times * 50, 2000);
        return delay;
      },
    });

    this.client.on('error', (error) => {
      console.error('Redis connection error:', error);
    });
  }

  /**
   * Get the Redis client instance
   */
  getClient(): Redis {
    return this.client;
  }

  /**
   * Ping Redis to check connection
   */
  async ping(): Promise<string> {
    return this.client.ping();
  }

  /**
   * Set a key-value pair in Redis
   * @param key The key to set
   * @param value The value to set
   * @param ttl Time to live in seconds (optional)
   */
  async set(key: string, value: any, ttl?: number): Promise<void> {
    const serializedValue = typeof value === 'object' 
      ? JSON.stringify(value) 
      : String(value);

    if (ttl) {
      await this.client.set(key, serializedValue, 'EX', ttl);
    } else {
      await this.client.set(key, serializedValue);
    }
  }

  /**
   * Get a value from Redis by key
   * @param key The key to get
   */
  async get<T>(key: string): Promise<T | null> {
    const value = await this.client.get(key);

    if (!value) {
      return null;
    }

    try {
      return JSON.parse(value) as T;
    } catch {
      return value as unknown as T;
    }
  }

  /**
   * Delete a key from Redis
   * @param key The key to delete
   */
  async delete(key: string): Promise<void> {
    await this.client.del(key);
  }

  /**
   * Delete keys matching a pattern from Redis
   * @param pattern The pattern to match keys
   */
  async deletePattern(pattern: string): Promise<void> {
    const keys = await this.client.keys(pattern);
    
    if (keys.length > 0) {
      await this.client.del(...keys);
    }
  }

  /**
   * Check if a key exists in Redis
   * @param key The key to check
   */
  async exists(key: string): Promise<boolean> {
    const result = await this.client.exists(key);
    return result === 1;
  }

  /**
   * Set a field in a hash stored at key
   * @param key The key of the hash
   * @param field The field to set
   * @param value The value to set
   */
  async hset(key: string, field: string, value: any): Promise<void> {
    const serializedValue = typeof value === 'object' 
      ? JSON.stringify(value) 
      : String(value);
      
    await this.client.hset(key, field, serializedValue);
  }

  /**
   * Get a field from a hash stored at key
   * @param key The key of the hash
   * @param field The field to get
   */
  async hget<T>(key: string, field: string): Promise<T | null> {
    const value = await this.client.hget(key, field);

    if (!value) {
      return null;
    }

    try {
      return JSON.parse(value) as T;
    } catch {
      return value as unknown as T;
    }
  }

  /**
   * Get all fields and values from a hash
   * @param key The key of the hash
   */
  async hgetall<T>(key: string): Promise<Record<string, T>> {
    const hash = await this.client.hgetall(key);
    const result: Record<string, T> = {};

    for (const field in hash) {
      try {
        result[field] = JSON.parse(hash[field]) as T;
      } catch {
        result[field] = hash[field] as unknown as T;
      }
    }

    return result;
  }

  /**
   * Run a native Redis command
   * @param command The command to run
   * @param args The arguments for the command
   */
  async runNativeCommand(command: string, ...args: any[]): Promise<any> {
    return this.client.call(command, ...args);
  }

  /**
   * Cleanup resources when module is destroyed
   */
  async onModuleDestroy(): Promise<void> {
    await this.client.quit();
  }
}
