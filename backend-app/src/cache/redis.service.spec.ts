import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { RedisService } from './redis.service';
import Redis from 'ioredis';

// Mock ioredis
jest.mock('ioredis');

describe('RedisService', () => {
  let service: RedisService;
  let mockRedis: any;

  const mockConfigService = {
    get: jest.fn((key, defaultValue) => {
      const config = {
        REDIS_HOST: 'localhost',
        REDIS_PORT: 6379,
        REDIS_PASSWORD: '',
        REDIS_DB: 0,
      };
      return config[key] || defaultValue;
    }),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    
    // Setup Redis mock implementation
    mockRedis = {
      setex: jest.fn(),
      get: jest.fn(),
      del: jest.fn(),
      keys: jest.fn(),
      exists: jest.fn(),
      expire: jest.fn(),
      ttl: jest.fn(),
      incrby: jest.fn(),
      hmset: jest.fn(),
      hgetall: jest.fn(),
    };
    
    (Redis as jest.Mock).mockImplementation(() => mockRedis);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RedisService,
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    service = module.get<RedisService>(RedisService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should initialize Redis with correct config', () => {
    expect(Redis).toHaveBeenCalledWith({
      host: 'localhost',
      port: 6379,
      password: '',
      db: 0,
    });
  });

  describe('set', () => {
    it('should set a key with value and default TTL', async () => {
      await service.set('test-key', { data: 'test-value' });
      
      expect(mockRedis.setex).toHaveBeenCalledWith(
        'test-key',
        3600, // Default TTL
        JSON.stringify({ data: 'test-value' })
      );
    });

    it('should set a key with value and custom TTL', async () => {
      await service.set('test-key', { data: 'test-value' }, 600);
      
      expect(mockRedis.setex).toHaveBeenCalledWith(
        'test-key',
        600,
        JSON.stringify({ data: 'test-value' })
      );
    });
  });

  describe('get', () => {
    it('should return null when key does not exist', async () => {
      mockRedis.get.mockResolvedValue(null);
      
      const result = await service.get('non-existent-key');
      
      expect(result).toBeNull();
      expect(mockRedis.get).toHaveBeenCalledWith('non-existent-key');
    });

    it('should return parsed value when key exists', async () => {
      const mockData = { name: 'test', value: 123 };
      mockRedis.get.mockResolvedValue(JSON.stringify(mockData));
      
      const result = await service.get('test-key');
      
      expect(result).toEqual(mockData);
      expect(mockRedis.get).toHaveBeenCalledWith('test-key');
    });
  });

  describe('deletePattern', () => {
    it('should not delete any keys when pattern matches nothing', async () => {
      mockRedis.keys.mockResolvedValue([]);
      
      await service.deletePattern('pattern:*');
      
      expect(mockRedis.keys).toHaveBeenCalledWith('pattern:*');
      expect(mockRedis.del).not.toHaveBeenCalled();
    });

    it('should delete all keys matching the pattern', async () => {
      const matchingKeys = ['pattern:1', 'pattern:2', 'pattern:3'];
      mockRedis.keys.mockResolvedValue(matchingKeys);
      
      await service.deletePattern('pattern:*');
      
      expect(mockRedis.keys).toHaveBeenCalledWith('pattern:*');
      expect(mockRedis.del).toHaveBeenCalledWith(...matchingKeys);
    });
  });

  describe('exists', () => {
    it('should return true when key exists', async () => {
      mockRedis.exists.mockResolvedValue(1);
      
      const result = await service.exists('test-key');
      
      expect(result).toBe(true);
      expect(mockRedis.exists).toHaveBeenCalledWith('test-key');
    });

    it('should return false when key does not exist', async () => {
      mockRedis.exists.mockResolvedValue(0);
      
      const result = await service.exists('test-key');
      
      expect(result).toBe(false);
      expect(mockRedis.exists).toHaveBeenCalledWith('test-key');
    });
  });

  describe('hmset and hgetall', () => {
    it('should store and retrieve hash objects', async () => {
      const mockObj = {
        name: 'Test User',
        age: 30,
        details: { email: 'test@example.com' }
      };
      
      const serializedObj = {
        name: 'Test User',
        age: '30',
        details: JSON.stringify({ email: 'test@example.com' })
      };
      
      await service.hmset('user:123', mockObj);
      expect(mockRedis.hmset).toHaveBeenCalledWith('user:123', serializedObj);
      
      mockRedis.hgetall.mockResolvedValue(serializedObj);
      
      const result = await service.hgetall('user:123');
      expect(result).toEqual({
        name: 'Test User',
        age: '30',
        details: { email: 'test@example.com' }
      });
    });

    it('should return null when hash does not exist', async () => {
      mockRedis.hgetall.mockResolvedValue({});
      
      const result = await service.hgetall('non-existent-hash');
      
      expect(result).toBeNull();
    });
  });
});
