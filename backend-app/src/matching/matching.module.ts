import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MatchingService } from './matching.service';
import { MatchingController } from './matching.controller';
import { SwipeEntity } from './match.entity/swipe.entity';
import { MatchEntity } from './match.entity/match.entity';
import { UserModule } from '../user/user.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([SwipeEntity, MatchEntity]),
    UserModule
  ],
  providers: [MatchingService],
  controllers: [MatchingController],
  exports: [MatchingService]
})
export class MatchingModule {}
