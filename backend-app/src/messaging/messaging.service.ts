import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MessageEntity } from './message.entity/message.entity';
import { EncryptionService, EncryptedData } from '../common/services/encryption.service';

@Injectable()
export class MessagingService {
  private readonly logger = new Logger(MessagingService.name);

  constructor(
    @InjectRepository(MessageEntity)
    private messageRepo: Repository<MessageEntity>,
    private encryptionService: EncryptionService
  ) {}

  /**
   * Send a new message with end-to-end encryption
   * @param senderId The ID of the user sending the message
   * @param matchId The ID of the match this message belongs to
   * @param content The message content
   * @returns The created message
   */
  async sendMessage(senderId: string, matchId: string, content: string) {
    try {
      // Create a new message entity
      const message = this.messageRepo.create({
        senderId,
        matchId,
        read: false
      });
      
      // Get the recipient user ID from the match
      const match = await this.messageRepo.manager.findOne('matches', {
        where: { id: matchId }
      });
      
      if (!match) {
        throw new NotFoundException(`Match with ID ${matchId} not found`);
      }
      
      // Determine the recipient ID (the other user in the match)
      const recipientId = match.user1Id === senderId ? match.user2Id : match.user1Id;
      
      // Encrypt the message content
      const encryptedData = await this.encryptionService.encryptMessage(
        content,
        senderId,
        recipientId
      );
      
      // Store the encrypted data
      message.encryptedContent = encryptedData.encryptedData;
      message.iv = encryptedData.iv;
      message.authTag = encryptedData.authTag;
      message.algorithm = encryptedData.algorithm;
      message.keyId = encryptedData.keyId;
      message.isEncrypted = true;
      
      // For backward compatibility, store the plaintext content temporarily
      // This should be removed in production or when all clients support encryption
      message.content = content;
      
      await this.messageRepo.save(message);
      
      return {
        id: message.id,
        senderId: message.senderId,
        matchId: message.matchId,
        content: message.content, // Return plaintext for now
        createdAt: message.createdAt,
        read: message.read,
        isEncrypted: message.isEncrypted
      };
    } catch (error) {
      this.logger.error(`Error sending message: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Get all messages for a match
   * @param matchId The match ID
   * @param userId The user ID requesting the messages (for decryption)
   * @returns Array of messages with decrypted content
   */
  async getMessages(matchId: string, userId: string) {
    try {
      const messages = await this.messageRepo.find({
        where: { matchId },
        relations: ['sender'],
        order: { createdAt: 'ASC' }
      });

      if (!messages.length) {
        return [];
      }

      // Process each message to decrypt content if needed
      const processedMessages = await Promise.all(
        messages.map(async (message) => {
          let messageContent = message.content;
          
          // If the message is encrypted and has all required encryption metadata
          if (
            message.isEncrypted &&
            message.encryptedContent &&
            message.iv &&
            message.authTag &&
            message.keyId
          ) {
            try {
              // Decrypt the message content
              messageContent = await this.encryptionService.decryptMessage(
                {
                  encryptedData: message.encryptedContent,
                  iv: message.iv,
                  authTag: message.authTag,
                  algorithm: message.algorithm || 'AES-256-GCM',
                  keyId: message.keyId
                },
                userId
              );
            } catch (decryptError) {
              this.logger.error(
                `Failed to decrypt message ${message.id}: ${decryptError.message}`,
                decryptError.stack
              );
              // Fall back to the stored plaintext content if available
              messageContent = message.content || '[Encrypted message - cannot decrypt]';
            }
          }
          
          return {
            id: message.id,
            senderId: message.senderId,
            senderName: message.sender?.name || 'Unknown',
            content: messageContent,
            createdAt: message.createdAt,
            read: message.read,
            isEncrypted: message.isEncrypted
          };
        })
      );

      return processedMessages;
    } catch (error) {
      this.logger.error(`Error getting messages: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Mark a message as read
   * @param messageId The message ID
   * @returns Success status
   */
  async markAsRead(messageId: string) {
    try {
      const message = await this.messageRepo.findOne({ where: { id: messageId } });
      
      if (!message) {
        throw new NotFoundException(`Message with ID ${messageId} not found`);
      }

      message.read = true;
      await this.messageRepo.save(message);

      return { success: true };
    } catch (error) {
      this.logger.error(`Error marking message as read: ${error.message}`, error.stack);
      throw error;
    }
  }
}
