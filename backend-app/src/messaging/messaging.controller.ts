import { Controller, Post, Get, Body, Param, UseGuards, Patch } from '@nestjs/common';
import { MessagingService } from './messaging.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

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
  async getMessages(@Param('matchId') matchId: string) {
    return this.messagingService.getMessages(matchId);
  }

  @Patch('messages/read/:messageId')
  async markMessageAsRead(@Param('messageId') messageId: string) {
    return this.messagingService.markAsRead(messageId);
  }
}
