import { Injectable, Inject, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { createCipheriv, createDecipheriv, randomBytes } from 'crypto';
import { ConfigService } from '@nestjs/config';
import { EncryptionKeyEntity } from '../entities/encryption-key.entity';

/**
 * Interface for encrypted data with metadata
 */
export interface EncryptedData {
  encryptedData: string;
  iv: string;
  authTag: string;
  algorithm: string;
  keyId: string;
}

/**
 * Service for handling encryption and decryption of sensitive data
 * Implements HIPAA-compliant encryption for PHI (Protected Health Information)
 */
@Injectable()
export class EncryptionService {
  private readonly logger = new Logger(EncryptionService.name);
  private readonly masterKey: Buffer;

  constructor(
    private readonly configService: ConfigService,
    @InjectRepository(EncryptionKeyEntity)
    private readonly keyRepository: Repository<EncryptionKeyEntity>,
  ) {
    // In production, this should be loaded from a secure key management service
    // For development, we'll use an environment variable
    const masterKeyString = this.configService.get<string>('ENCRYPTION_MASTER_KEY');
    if (!masterKeyString) {
      this.logger.error('ENCRYPTION_MASTER_KEY not set in environment variables');
      throw new Error('Encryption master key not configured');
    }
    this.masterKey = Buffer.from(masterKeyString, 'hex');
  }

  /**
   * Encrypts sensitive data using AES-256-GCM
   * @param data The data to encrypt
   * @param userId The user ID associated with the data
   * @returns Encrypted data with metadata
   */
  async encryptData(data: string, userId: string): Promise<EncryptedData> {
    try {
      // Get or create a data encryption key for this user
      const dek = await this.getUserDEK(userId);
      
      // Generate a random IV for this encryption operation
      const iv = randomBytes(12); // 96 bits for GCM mode
      
      // Create cipher with AES-256-GCM
      const cipher = createCipheriv('aes-256-gcm', dek, iv);
      
      // Encrypt the data
      let encrypted = cipher.update(data, 'utf8', 'base64');
      encrypted += cipher.final('base64');
      
      // Get the authentication tag
      const authTag = cipher.getAuthTag().toString('base64');
      
      // Get the key identifier
      const keyId = await this.getKeyIdentifier(userId);
      
      return {
        encryptedData: encrypted,
        iv: iv.toString('base64'),
        authTag,
        algorithm: 'AES-256-GCM',
        keyId,
      };
    } catch (error) {
      this.logger.error(`Error encrypting data: ${error.message}`, error.stack);
      throw new Error('Failed to encrypt data');
    }
  }

  /**
   * Decrypts data that was encrypted with encryptData
   * @param encryptedData The encrypted data with metadata
   * @param userId The user ID associated with the data
   * @returns The decrypted data
   */
  async decryptData(encryptedData: EncryptedData, userId: string): Promise<string> {
    try {
      // Get the data encryption key for this user
      const dek = await this.getUserDEK(userId, encryptedData.keyId);
      
      // Convert IV and auth tag from base64
      const iv = Buffer.from(encryptedData.iv, 'base64');
      const authTag = Buffer.from(encryptedData.authTag, 'base64');
      
      // Create decipher
      const decipher = createDecipheriv('aes-256-gcm', dek, iv);
      decipher.setAuthTag(authTag);
      
      // Decrypt the data
      let decrypted = decipher.update(encryptedData.encryptedData, 'base64', 'utf8');
      decrypted += decipher.final('utf8');
      
      return decrypted;
    } catch (error) {
      this.logger.error(`Error decrypting data: ${error.message}`, error.stack);
      throw new Error('Failed to decrypt data');
    }
  }

  /**
   * Encrypts a message for end-to-end encryption
   * This is a simplified version - in production, use a proper E2E library like Signal Protocol
   * @param message The message to encrypt
   * @param senderUserId The sender's user ID
   * @param recipientUserId The recipient's user ID
   * @returns Encrypted message with metadata
   */
  async encryptMessage(
    message: string, 
    senderUserId: string, 
    recipientUserId: string
  ): Promise<EncryptedData> {
    try {
      // In a real E2E implementation, we would:
      // 1. Get the recipient's public key
      // 2. Generate a one-time symmetric key
      // 3. Encrypt the message with the symmetric key
      // 4. Encrypt the symmetric key with the recipient's public key
      // 5. Return both the encrypted message and the encrypted key
      
      // For now, we'll use a simplified approach with the recipient's DEK
      const recipientDek = await this.getUserDEK(recipientUserId);
      
      // Generate a random IV
      const iv = randomBytes(12);
      
      // Create cipher
      const cipher = createCipheriv('aes-256-gcm', recipientDek, iv);
      
      // Encrypt the message
      let encrypted = cipher.update(message, 'utf8', 'base64');
      encrypted += cipher.final('base64');
      
      // Get the authentication tag
      const authTag = cipher.getAuthTag().toString('base64');
      
      // Get the key identifier
      const keyId = await this.getKeyIdentifier(recipientUserId);
      
      return {
        encryptedData: encrypted,
        iv: iv.toString('base64'),
        authTag,
        algorithm: 'AES-256-GCM',
        keyId,
      };
    } catch (error) {
      this.logger.error(`Error encrypting message: ${error.message}`, error.stack);
      throw new Error('Failed to encrypt message');
    }
  }

  /**
   * Decrypts a message that was encrypted with encryptMessage
   * @param encryptedData The encrypted message with metadata
   * @param userId The user ID of the recipient
   * @returns The decrypted message
   */
  async decryptMessage(encryptedData: EncryptedData, userId: string): Promise<string> {
    // For now, this is the same as decryptData
    // In a real E2E implementation, this would use the recipient's private key
    return this.decryptData(encryptedData, userId);
  }

  /**
   * Generates a new encryption key pair for a user
   * @param userId The user ID
   */
  async generateUserKeyPair(userId: string): Promise<void> {
    try {
      // In a real E2E implementation, this would generate an asymmetric key pair
      // For now, we'll just ensure the user has a DEK
      await this.getUserDEK(userId, undefined, true);
    } catch (error) {
      this.logger.error(`Error generating user key pair: ${error.message}`, error.stack);
      throw new Error('Failed to generate user key pair');
    }
  }

  /**
   * Rotates a user's encryption keys
   * @param userId The user ID
   */
  async rotateUserKeys(userId: string): Promise<void> {
    try {
      // Mark existing keys as inactive
      await this.keyRepository.update(
        { userId, active: true },
        { active: false, rotatedAt: new Date() }
      );
      
      // Generate new keys
      await this.getUserDEK(userId, undefined, true);
    } catch (error) {
      this.logger.error(`Error rotating user keys: ${error.message}`, error.stack);
      throw new Error('Failed to rotate user keys');
    }
  }

  /**
   * Gets or creates a data encryption key for a user
   * @param userId The user ID
   * @param keyId Optional specific key ID to retrieve
   * @param forceNew Force creation of a new key
   * @returns The data encryption key
   */
  private async getUserDEK(
    userId: string, 
    keyId?: string, 
    forceNew = false
  ): Promise<Buffer> {
    try {
      let keyEntity: EncryptionKeyEntity | undefined;
      
      if (!forceNew && keyId) {
        // Get a specific key by ID
        keyEntity = await this.keyRepository.findOne({ 
          where: { id: keyId, userId, keyType: 'DEK' } 
        });
      } else if (!forceNew) {
        // Get the active DEK for this user
        keyEntity = await this.keyRepository.findOne({ 
          where: { userId, keyType: 'DEK', active: true },
          order: { createdAt: 'DESC' }
        });
      }
      
      if (!keyEntity || forceNew) {
        // Generate a new DEK
        const newKey = randomBytes(32); // 256 bits
        
        // Encrypt the DEK with the master key
        const iv = randomBytes(12);
        const cipher = createCipheriv('aes-256-gcm', this.masterKey, iv);
        let encryptedKey = cipher.update(newKey.toString('hex'), 'utf8', 'base64');
        encryptedKey += cipher.final('base64');
        const authTag = cipher.getAuthTag().toString('base64');
        
        // Store the encrypted DEK
        keyEntity = this.keyRepository.create({
          userId,
          keyType: 'DEK',
          encryptedKey,
          iv: iv.toString('base64'),
          authTag,
          algorithm: 'AES-256-GCM',
          active: true,
          createdAt: new Date()
        });
        
        await this.keyRepository.save(keyEntity);
        return newKey;
      }
      
      // Decrypt the stored DEK
      const iv = Buffer.from(keyEntity.iv, 'base64');
      const authTag = Buffer.from(keyEntity.authTag, 'base64');
      const decipher = createDecipheriv('aes-256-gcm', this.masterKey, iv);
      decipher.setAuthTag(authTag);
      let decryptedKey = decipher.update(keyEntity.encryptedKey, 'base64', 'utf8');
      decryptedKey += decipher.final('utf8');
      
      return Buffer.from(decryptedKey, 'hex');
    } catch (error) {
      this.logger.error(`Error getting user DEK: ${error.message}`, error.stack);
      throw new Error('Failed to get user encryption key');
    }
  }

  /**
   * Gets the key identifier for a user's active DEK
   * @param userId The user ID
   * @returns The key identifier
   */
  private async getKeyIdentifier(userId: string): Promise<string> {
    const keyEntity = await this.keyRepository.findOne({ 
      where: { userId, keyType: 'DEK', active: true },
      order: { createdAt: 'DESC' }
    });
    
    if (!keyEntity) {
      throw new Error('No active encryption key found for user');
    }
    
    return keyEntity.id;
  }
}