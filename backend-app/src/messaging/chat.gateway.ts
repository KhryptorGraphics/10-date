import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';
import { MessagingService } from './messaging.service';
import { EncryptionService } from '../common/services/encryption.service';

@WebSocketGateway({ cors: true })
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  private readonly logger = new Logger(ChatGateway.name);
  
  @WebSocketServer()
  server: Server;
  
  constructor(
    private messagingService: MessagingService,
    private encryptionService: EncryptionService
  ) {}

  handleConnection(client: Socket) {
    console.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    console.log(`Client disconnected: ${client.id}`);
  }

  @SubscribeMessage('joinRoom')
  handleJoinRoom(@MessageBody() room: string, @ConnectedSocket() client: Socket) {
    client.join(room);
    client.emit('joinedRoom', room);
  }

  @SubscribeMessage('sendMessage')
  async handleSendMessage(
    @MessageBody() data: {
      room: string;
      senderId: string;
      recipientId: string;
      matchId: string;
      content: string
    },
    @ConnectedSocket() client: Socket
  ) {
    try {
      // Save the message to the database using the messaging service
      const savedMessage = await this.messagingService.sendMessage(
        data.senderId,
        data.matchId,
        data.content
      );
      
      // Emit the message to the room
      this.server.to(data.room).emit('newMessage', {
        ...data,
        id: savedMessage.id,
        createdAt: savedMessage.createdAt,
        read: savedMessage.read,
        isEncrypted: savedMessage.isEncrypted
      });
    } catch (error) {
      this.logger.error(`Error handling message: ${error.message}`, error.stack);
      client.emit('error', { message: 'Failed to send message' });
    }
  }
}
