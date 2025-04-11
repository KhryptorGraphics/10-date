import { Controller, Post, Get, Body, Param, Query } from '@nestjs/common';
import { MatchingService } from './matching.service';

@Controller('matching')
export class MatchingController {
  constructor(private readonly matchingService: MatchingService) {}

  @Post('swipe')
  async swipe(
    @Body('userId') userId: string,
    @Body('targetUserId') targetUserId: string,
    @Body('direction') direction: 'like' | 'dislike',
    @Body('metadata') metadata?: {
      swipeTime: number;
      profileViewDuration: number;
      viewedSections?: string[];
    }
  ) {
    return this.matchingService.swipe(userId, targetUserId, direction, metadata);
  }

  @Get('matches/:userId')
  async getMatches(@Param('userId') userId: string) {
    return this.matchingService.getMatches(userId);
  }

  @Get('recommendations/:userId')
  async getRecommendations(
    @Param('userId') userId: string,
    @Query('limit') limit: number = 10,
    @Query('includeDetails') includeDetails: boolean = false
  ) {
    return this.matchingService.getRecommendations(userId);
  }
  
  @Get('match-factors/:userId/:targetUserId')
  async getMatchFactors(
    @Param('userId') userId: string,
    @Param('targetUserId') targetUserId: string
  ) {
    return this.matchingService.getMatchFactors(userId, targetUserId);
  }
}
