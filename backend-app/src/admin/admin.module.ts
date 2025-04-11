import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserEntity } from '../user/user.entity/user.entity';
import { MatchEntity } from '../matching/match.entity/match.entity';
import { SwipeEntity } from '../matching/match.entity/swipe.entity';
import { SwipeDataEntity } from '../matching/match.entity/swipe-data.entity';
import { CacheModule } from '../cache/cache.module';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { MatchAnalyticsController } from './dashboard/match-analytics/match-analytics.controller';
import { MatchAnalyticsService } from './dashboard/match-analytics/match-analytics.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      UserEntity,
      MatchEntity,
      SwipeEntity,
      SwipeDataEntity,
    ]),
    CacheModule,
  ],
  controllers: [
    AdminController,
    MatchAnalyticsController,
  ],
  providers: [
    AdminService,
    MatchAnalyticsService,
  ],
  exports: [
    AdminService,
    MatchAnalyticsService,
  ],
})
export class AdminModule {}
