import { Controller, Get } from '@nestjs/common';
import { 
  HealthCheckService, 
  HealthCheck, 
  TypeOrmHealthIndicator, 
  MemoryHealthIndicator, 
  DiskHealthIndicator 
} from '@nestjs/terminus';
import { RedisHealthIndicator } from './redis.health';
import { Public } from '../auth/public.decorator';

@Controller('health')
export class HealthController {
  constructor(
    private health: HealthCheckService,
    private db: TypeOrmHealthIndicator,
    private redis: RedisHealthIndicator,
    private memory: MemoryHealthIndicator,
    private disk: DiskHealthIndicator,
  ) {}

  @Get()
  @Public()
  @HealthCheck()
  check() {
    return this.health.check([
      // Database health check
      () => this.db.pingCheck('database'),
      
      // Redis cache health check
      () => this.redis.pingCheck('redis'),
      
      // Memory usage check - 250MB max heap size
      () => this.memory.checkHeap('memory_heap', 250 * 1024 * 1024),
      
      // Disk storage check - 90% max usage
      () => this.disk.checkStorage('disk', { path: '/', thresholdPercent: 0.9 }),
    ]);
  }
}
