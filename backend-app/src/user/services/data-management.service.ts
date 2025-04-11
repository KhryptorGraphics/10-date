import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Connection } from 'typeorm';
import { UserEntity } from '../user.entity/user.entity';
import { DataExportEntity, ExportFormat, ExportStatus } from '../entities/data-export.entity';
import { EncryptionService } from '../../common/services/encryption.service';
import { AuditLogService, AuditAction, AuditResource } from '../../common/services/audit-log.service';
import { Request } from 'express';

/**
 * Options for data deletion
 */
export interface DeletionOptions {
  anonymize?: boolean; // If true, anonymize data instead of deleting
  deleteMessages?: boolean; // If true, delete messages
  deleteMatches?: boolean; // If true, delete matches
  deletePayments?: boolean; // If true, delete payment records
  deleteConsent?: boolean; // If true, delete consent records
}

/**
 * User data export format
 */
export interface UserDataExport {
  user: {
    id: string;
    email: string;
    name: string;
    createdAt: Date;
    // Other user fields
  };
  profile?: any;
  preferences?: any;
  matches?: any[];
  messages?: any[];
  payments?: any[];
  subscriptions?: any[];
  consentPreferences?: any[];
  exportDate: Date;
}

/**
 * Data categories for export
 */
export enum DataCategory {
  PROFILE = 'profile',
  PREFERENCES = 'preferences',
  MATCHES = 'matches',
  MESSAGES = 'messages',
  PAYMENTS = 'payments',
  SUBSCRIPTIONS = 'subscriptions',
  ACTIVITY = 'activity',
  CONSENT = 'consent',
}

/**
 * Options for data export
 */
export interface ExportOptions {
  categories?: Record<DataCategory, boolean>;
  format?: ExportFormat;
  includeDeleted?: boolean;
}

/**
 * Service for managing user data for GDPR compliance
 */
@Injectable()
export class DataManagementService {
  private readonly logger = new Logger(DataManagementService.name);

  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
    private readonly connection: Connection,
    private readonly encryptionService: EncryptionService,
    @InjectRepository(DataExportEntity)
    private readonly dataExportRepository: Repository<DataExportEntity>,
    private readonly auditLogService: AuditLogService,
  ) {}

  /**
   * Export all data for a user (GDPR right to data portability)
   * @param userId The user ID
   * @param options Export options
   * @returns All user data in a structured format
   */
  async exportUserData(userId: string, options?: ExportOptions): Promise<UserDataExport> {
    try {
      // Log the export request
      await this.auditLogService.log(
        userId,
        AuditAction.EXPORT,
        AuditResource.USER,
        userId,
        { action: 'Export user data', options }
      );
      
      // Get user data
      const user = await this.userRepository.findOne({ 
        where: { id: userId },
        relations: ['profile', 'preferences']
      });

      // Determine which categories to export
      const categories = options?.categories || {
        [DataCategory.PROFILE]: true,
        [DataCategory.PREFERENCES]: true,
        [DataCategory.MATCHES]: true,
        [DataCategory.MESSAGES]: true,
        [DataCategory.PAYMENTS]: true,
        [DataCategory.SUBSCRIPTIONS]: true,
        [DataCategory.ACTIVITY]: true,
        [DataCategory.CONSENT]: true,
      };
      
      if (!user) {
        throw new NotFoundException(`User with ID ${userId} not found`);
      }

      // Get matches if requested
      let matches = [];
      if (categories[DataCategory.MATCHES]) {
        matches = await this.connection.query(
          `SELECT * FROM matches WHERE user1_id = $1 OR user2_id = $1`,
          [userId]
        );
      }

      // Get messages with decryption if requested
      let messages = [];
      if (categories[DataCategory.MESSAGES]) {
        const encryptedMessages = await this.connection.query(
          `SELECT * FROM messages WHERE sender_id = $1 OR match_id IN 
           (SELECT id FROM matches WHERE user1_id = $1 OR user2_id = $1)`,
          [userId]
        );

        // Decrypt messages
        messages = await Promise.all(
          encryptedMessages.map(async (message: any) => {
            if (message.is_encrypted && message.encrypted_content) {
              try {
                const decryptedContent = await this.encryptionService.decryptData(
                  {
                    encryptedData: message.encrypted_content,
                    iv: message.iv,
                    authTag: message.auth_tag,
                    algorithm: message.algorithm || 'AES-256-GCM',
                    keyId: message.key_id,
                  },
                  userId
                );
                return { ...message, content: decryptedContent };
              } catch (error) {
                this.logger.error(`Failed to decrypt message ${message.id}: ${error.message}`);
                return { ...message, content: '[Encrypted content]' };
              }
            }
            return message;
          })
        );
      }

      // Get payments if requested
      let payments = [];
      if (categories[DataCategory.PAYMENTS]) {
        payments = await this.connection.query(
          `SELECT * FROM payments WHERE user_id = $1`,
          [userId]
        );
      }

      // Get subscriptions if requested
      let subscriptions = [];
      if (categories[DataCategory.SUBSCRIPTIONS]) {
        subscriptions = await this.connection.query(
          `SELECT * FROM subscriptions WHERE user_id = $1`,
          [userId]
        );
      }

      // Get consent preferences if requested
      let consentPreferences = [];
      if (categories[DataCategory.CONSENT]) {
        consentPreferences = await this.connection.query(
          `SELECT * FROM consent_preferences WHERE user_id = $1`,
          [userId]
        );
      }

      // Create export object
      const exportData: UserDataExport = {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          createdAt: user.createdAt,
          // Add other user fields as needed
        },
        profile: categories[DataCategory.PROFILE] ? user.profile : undefined,
        preferences: categories[DataCategory.PREFERENCES] ? user.preferences : undefined,
        matches: categories[DataCategory.MATCHES] ? matches : undefined,
        messages: categories[DataCategory.MESSAGES] ? messages : undefined,
        payments: categories[DataCategory.PAYMENTS] ? payments : undefined,
        subscriptions: categories[DataCategory.SUBSCRIPTIONS] ? subscriptions : undefined,
        consentPreferences: categories[DataCategory.CONSENT] ? consentPreferences : undefined,
        exportDate: new Date(),
      };

      return exportData;
    } catch (error) {
      this.logger.error(`Error exporting user data: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Create a data export request
   * @param userId User ID
   * @param options Export options
   * @param req Express request object
   * @returns Created export request
   */
  async createExportRequest(
    userId: string,
    options: ExportOptions = {},
    req?: Request
  ): Promise<DataExportEntity> {
    try {
      // Create export request
      const exportRequest = this.dataExportRepository.create({
        userId,
        format: options.format || ExportFormat.JSON,
        categories: options.categories || {
          [DataCategory.PROFILE]: true,
          [DataCategory.PREFERENCES]: true,
          [DataCategory.MATCHES]: true,
          [DataCategory.MESSAGES]: true,
          [DataCategory.PAYMENTS]: true,
          [DataCategory.SUBSCRIPTIONS]: true,
          [DataCategory.ACTIVITY]: true,
          [DataCategory.CONSENT]: true,
        },
        status: ExportStatus.PENDING,
        ipAddress: req?.ip,
        userAgent: req?.headers['user-agent'],
      });

      await this.dataExportRepository.save(exportRequest);

      // Log the export request
      await this.auditLogService.log(
        userId,
        AuditAction.CREATE,
        AuditResource.USER,
        userId,
        { 
          action: 'Create data export request', 
          exportId: exportRequest.id,
          format: exportRequest.format,
          categories: exportRequest.categories,
          ipAddress: req?.ip,
          userAgent: req?.headers['user-agent']
        }
      );

      return exportRequest;
    } catch (error) {
      this.logger.error(`Error creating export request: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Get all export requests for a user
   * @param userId User ID
   * @returns Array of export requests
   */
  async getExportRequests(userId: string): Promise<DataExportEntity[]> {
    try {
      return this.dataExportRepository.find({
        where: { userId },
        order: { createdAt: 'DESC' },
      });
    } catch (error) {
      this.logger.error(`Error getting export requests: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Get a specific export request
   * @param exportId Export request ID
   * @returns Export request or null if not found
   */
  async getExportRequest(exportId: string): Promise<DataExportEntity | null> {
    try {
      return this.dataExportRepository.findOne({
        where: { id: exportId },
      });
    } catch (error) {
      this.logger.error(`Error getting export request: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Process an export request
   * This would typically be called by a background job
   * @param exportId Export request ID
   */
  async processExportRequest(exportId: string): Promise<void> {
    const queryRunner = this.connection.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Get the export request
      const exportRequest = await this.dataExportRepository.findOne({
        where: { id: exportId },
      });

      if (!exportRequest) {
        throw new NotFoundException(`Export request with ID ${exportId} not found`);
      }

      // Update status to processing
      exportRequest.status = ExportStatus.PROCESSING;
      exportRequest.progress = 10;
      await this.dataExportRepository.save(exportRequest);

      // Export the data
      const userData = await this.exportUserData(exportRequest.userId, {
        categories: exportRequest.categories as Record<DataCategory, boolean>,
        format: exportRequest.format,
      });

      // Convert to the requested format
      let exportData: string;
      let mimeType: string;

      switch (exportRequest.format) {
        case ExportFormat.JSON:
          exportData = JSON.stringify(userData, null, 2);
          mimeType = 'application/json';
          break;
        case ExportFormat.CSV:
          // In a real implementation, you would convert the data to CSV
          exportData = this.convertToCSV(userData);
          mimeType = 'text/csv';
          break;
        case ExportFormat.PDF:
          // In a real implementation, you would generate a PDF
          exportData = JSON.stringify(userData, null, 2); // Placeholder
          mimeType = 'application/pdf';
          break;
        case ExportFormat.XML:
          // In a real implementation, you would convert the data to XML
          exportData = this.convertToXML(userData);
          mimeType = 'application/xml';
          break;
        default:
          exportData = JSON.stringify(userData, null, 2);
          mimeType = 'application/json';
      }

      // In a real implementation, you would save the file to a storage service
      // and generate a download URL
      const downloadUrl = `https://example.com/exports/${exportId}`;
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7); // Expire in 7 days

      // Update the export request
      exportRequest.status = ExportStatus.COMPLETED;
      exportRequest.progress = 100;
      exportRequest.completedAt = new Date();
      exportRequest.downloadUrl = downloadUrl;
      exportRequest.expiresAt = expiresAt;
      await this.dataExportRepository.save(exportRequest);

      // Log the completion
      await this.auditLogService.log(
        exportRequest.userId,
        AuditAction.UPDATE,
        AuditResource.USER,
        exportRequest.userId,
        { 
          action: 'Complete data export request', 
          exportId: exportRequest.id,
          format: exportRequest.format,
          downloadUrl: exportRequest.downloadUrl,
          expiresAt: exportRequest.expiresAt
        }
      );

      await queryRunner.commitTransaction();
    } catch (error) {
      await queryRunner.rollbackTransaction();
      
      // Update the export request to failed status
      try {
        const exportRequest = await this.dataExportRepository.findOne({
          where: { id: exportId },
        });
        
        if (exportRequest) {
          exportRequest.status = ExportStatus.FAILED;
          exportRequest.errorMessage = error.message;
          await this.dataExportRepository.save(exportRequest);
        }
      } catch (updateError) {
        this.logger.error(`Error updating failed export request: ${updateError.message}`, updateError.stack);
      }
      
      this.logger.error(`Error processing export request: ${error.message}`, error.stack);
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * Delete or anonymize user data (GDPR right to be forgotten)
   * @param userId The user ID
   * @param options Options for deletion
   */
  async deleteUserData(userId: string, options: DeletionOptions = {}): Promise<void> {
    const queryRunner = this.connection.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Log the deletion request
      await this.auditLogService.log(
        userId,
        AuditAction.DELETE,
        AuditResource.USER,
        userId,
        { action: 'Delete user data', options }
      );
      
      // Get user
      const user = await this.userRepository.findOne({ where: { id: userId } });
      if (!user) {
        throw new NotFoundException(`User with ID ${userId} not found`);
      }

      // Delete or anonymize based on options
      if (options.anonymize) {
        // Anonymize user data
        await queryRunner.manager.update(
          UserEntity,
          { id: userId },
          {
            email: `anonymized-${Date.now()}@example.com`,
            name: 'Anonymized User',
            passwordHash: null,
            oauthGoogleId: null,
            oauthFacebookId: null,
            oauthAppleId: null,
            // Add other fields to anonymize
          }
        );

        // Anonymize profile data if exists
        await queryRunner.query(
          `UPDATE profiles SET 
           bio = 'This user has been anonymized', 
           photos = NULL,
           occupation = NULL,
           education = NULL
           WHERE user_id = $1`,
          [userId]
        );
      } else {
        // Delete user data completely
        
        // Delete messages if requested
        if (options.deleteMessages) {
          await queryRunner.query(
            `DELETE FROM messages WHERE sender_id = $1 OR match_id IN 
             (SELECT id FROM matches WHERE user1_id = $1 OR user2_id = $1)`,
            [userId]
          );
        }

        // Delete matches if requested
        if (options.deleteMatches) {
          await queryRunner.query(
            `DELETE FROM matches WHERE user1_id = $1 OR user2_id = $1`,
            [userId]
          );
        }

        // Delete payments if requested
        if (options.deletePayments) {
          await queryRunner.query(
            `DELETE FROM payments WHERE user_id = $1`,
            [userId]
          );
        }

        // Delete profile
        await queryRunner.query(
          `DELETE FROM profiles WHERE user_id = $1`,
          [userId]
        );

        // Delete preferences
        await queryRunner.query(
          `DELETE FROM match_preferences WHERE user_id = $1`,
          [userId]
        );

        // Delete subscriptions
        await queryRunner.query(
          `DELETE FROM subscriptions WHERE user_id = $1`,
          [userId]
        );

        // Delete consent preferences if requested
        if (options.deleteConsent) {
          await queryRunner.query(
            `DELETE FROM consent_preferences WHERE user_id = $1`,
            [userId]
          );
          
          await queryRunner.query(
            `DELETE FROM consent_history WHERE user_id = $1`,
            [userId]
          );
        }
        
        // Delete encryption keys
        await queryRunner.query(
          `DELETE FROM encryption_keys WHERE user_id = $1`,
          [userId]
        );

        // Finally, delete the user
        await queryRunner.manager.delete(UserEntity, { id: userId });
      }

      // Commit transaction
      await queryRunner.commitTransaction();
    } catch (error) {
      // Rollback transaction on error
      await queryRunner.rollbackTransaction();
      this.logger.error(`Error deleting user data: ${error.message}`, error.stack);
      throw error;
    } finally {
      // Release query runner
      await queryRunner.release();
    }
  }
  
  /**
   * Helper method to convert data to CSV format
   * @param data The data to convert
   * @returns CSV string
   */
  private convertToCSV(data: any): string {
    // In a real implementation, you would convert the data to CSV
    // This is a simplified placeholder
    return 'csv,data,placeholder';
  }
  
  /**
   * Helper method to convert data to XML format
   * @param data The data to convert
   * @returns XML string
   */
  private convertToXML(data: any): string {
    // In a real implementation, you would convert the data to XML
    // This is a simplified placeholder
    return '<xml><data>placeholder</data></xml>';
  }
}