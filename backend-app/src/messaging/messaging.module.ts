import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MessagingService } from './messaging.service';
import { MessagingController } from './messaging.controller';
import { ChatGateway } from './chat.gateway';
import { MessageEntity } from './message.entity/message.entity';
import { AuthModule } from '../auth/auth.module';
import { CommonModule } from '../common/common.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([MessageEntity]),
    AuthModule,
    CommonModule
  ],
  providers: [MessagingService, ChatGateway],
  controllers: [MessagingController],
  exports: [MessagingService]
})
export class MessagingModule {}
