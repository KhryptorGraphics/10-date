import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MatchingController } from './matching.controller';
import { MatchingService } from './matching.service';
import { MatchEntity } from './match.entity/match.entity';
import { SwipeEntity } from './match.entity/swipe.entity';
import { SwipeDataEntity } from './match.entity/swipe-data.entity';
import { UserModule } from '../user/user.module';
import { CacheModule } from '../cache/cache.module';
import { RateLimiterMiddleware } from '../common/middlewares/rate-limiter.middleware';
import { MatchingFactorsService } from './services/matching-factors.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([MatchEntity, SwipeEntity, SwipeDataEntity]),
    UserModule,
    CacheModule,
  ],
  controllers: [MatchingController],
  providers: [MatchingService, MatchingFactorsService],
  exports: [MatchingService],
})
export class MatchingModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    // Apply rate limiting to matching endpoints
    consumer
      .apply(RateLimiterMiddleware)
      .forRoutes(MatchingController);
  }
}
