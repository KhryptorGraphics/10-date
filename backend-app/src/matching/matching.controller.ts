import { Controller, Post, Get, Body, Param } from '@nestjs/common';
import { MatchingService } from './matching.service';

@Controller('matching')
export class MatchingController {
  constructor(private readonly matchingService: MatchingService) {}

  @Post('swipe')
  async swipe(
    @Body('userId') userId: string,
    @Body('targetUserId') targetUserId: string,
    @Body('direction') direction: 'like' | 'dislike',
  ) {
    return this.matchingService.swipe(userId, targetUserId, direction);
  }

  @Get('matches/:userId')
  async getMatches(@Param('userId') userId: string) {
    return this.matchingService.getMatches(userId);
  }

  @Get('recommendations/:userId')
  async getRecommendations(@Param('userId') userId: string) {
    return this.matchingService.getRecommendations(userId);
  }
}
