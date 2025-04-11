import { Controller, Post, Get, Body, Param, UseGuards, Patch, Req } from '@nestjs/common';
import { MessagingService } from './messaging.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Request } from 'express';

@Controller('messaging')
@UseGuards(JwtAuthGuard)
export class MessagingController {
  constructor(private readonly messagingService: MessagingService) {}

  @Post('send')
  async sendMessage(
    @Body('senderId') senderId: string,
    @Body('matchId') matchId: string,
    @Body('content') content: string,
  ) {
    return this.messagingService.sendMessage(senderId, matchId, content);
  }

  @Get('messages/:matchId')
  async getMessages(
    @Param('matchId') matchId: string,
    @Req() request: Request
  ) {
    // Extract user ID from JWT token
    const userId = request.user?.id;
    
    if (!userId) {
      throw new Error('User ID not found in request');
    }
    
    return this.messagingService.getMessages(matchId, userId);
  }

  @Patch('messages/read/:messageId')
  async markMessageAsRead(@Param('messageId') messageId: string) {
    return this.messagingService.markAsRead(messageId);
  }
}
