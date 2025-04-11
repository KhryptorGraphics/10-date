import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MessageEntity } from './message.entity/message.entity';

@Injectable()
export class MessagingService {
  constructor(
    @InjectRepository(MessageEntity)
    private messageRepo: Repository<MessageEntity>
  ) {}

  async sendMessage(senderId: string, matchId: string, content: string) {
    const message = this.messageRepo.create({
      senderId,
      matchId,
      content,
      read: false
    });
    
    await this.messageRepo.save(message);
    
    return {
      id: message.id,
      senderId: message.senderId,
      matchId: message.matchId,
      content: message.content,
      createdAt: message.createdAt,
      read: message.read
    };
  }

  async getMessages(matchId: string) {
    const messages = await this.messageRepo.find({
      where: { matchId },
      relations: ['sender'],
      order: { createdAt: 'ASC' }
    });

    if (!messages.length) {
      return [];
    }

    return messages.map(message => ({
      id: message.id,
      senderId: message.senderId,
      senderName: message.sender?.name || 'Unknown',
      content: message.content,
      createdAt: message.createdAt,
      read: message.read
    }));
  }

  async markAsRead(messageId: string) {
    const message = await this.messageRepo.findOne({ where: { id: messageId } });
    
    if (!message) {
      throw new NotFoundException(`Message with ID ${messageId} not found`);
    }

    message.read = true;
    await this.messageRepo.save(message);

    return { success: true };
  }
}
