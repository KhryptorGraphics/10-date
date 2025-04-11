import { Module } from '@nestjs/common';
import { TerminusModule } from '@nestjs/terminus';
import { HttpModule } from '@nestjs/axios';
import { HealthController } from './health.controller';
import { RedisHealthIndicator } from './redis.health';
import { CacheModule } from '../cache/cache.module';

@Module({
  imports: [
    TerminusModule,
    HttpModule,
    CacheModule
  ],
  controllers: [HealthController],
  providers: [RedisHealthIndicator],
})
export class HealthModule {}
