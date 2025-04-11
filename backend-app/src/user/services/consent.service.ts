import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConsentPreferenceEntity, ConsentType } from '../entities/consent-preference.entity';
import { ConsentHistoryEntity } from '../entities/consent-history.entity';
import { AuditLogService, AuditAction, AuditResource } from '../../common/services/audit-log.service';
import { Request } from 'express';

/**
 * Interface for consent update request
 */
export interface ConsentUpdateRequest {
  status: boolean;
  policyVersion?: string;
  notes?: string;
}

/**
 * Service for managing user consent preferences
 * Required for GDPR compliance
 */
@Injectable()
export class ConsentService {
  private readonly logger = new Logger(ConsentService.name);

  constructor(
    @InjectRepository(ConsentPreferenceEntity)
    private readonly consentPreferenceRepository: Repository<ConsentPreferenceEntity>,
    @InjectRepository(ConsentHistoryEntity)
    private readonly consentHistoryRepository: Repository<ConsentHistoryEntity>,
    private readonly auditLogService: AuditLogService,
  ) {}

  /**
   * Get all consent preferences for a user
   * @param userId User ID
   * @returns Array of consent preferences
   */
  async getAllConsentPreferences(userId: string): Promise<ConsentPreferenceEntity[]> {
    try {
      const preferences = await this.consentPreferenceRepository.find({
        where: { userId },
      });

      // Log the access
      await this.auditLogService.log(
        userId,
        AuditAction.VIEW,
        AuditResource.USER,
        userId,
        { action: 'View all consent preferences' }
      );

      return preferences;
    } catch (error) {
      this.logger.error(`Error getting consent preferences: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Get a specific consent preference for a user
   * @param userId User ID
   * @param consentType Type of consent
   * @returns Consent preference or null if not found
   */
  async getConsentPreference(
    userId: string,
    consentType: ConsentType
  ): Promise<ConsentPreferenceEntity | null> {
    try {
      const preference = await this.consentPreferenceRepository.findOne({
        where: { userId, consentType },
      });

      // Log the access
      await this.auditLogService.log(
        userId,
        AuditAction.VIEW,
        AuditResource.USER,
        userId,
        { action: 'View specific consent preference', consentType }
      );

      return preference;
    } catch (error) {
      this.logger.error(`Error getting consent preference: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Update a consent preference for a user
   * @param userId User ID
   * @param consentType Type of consent
   * @param updateRequest Update request data
   * @param req Express request object for IP and user agent
   * @returns Updated consent preference
   */
  async updateConsentPreference(
    userId: string,
    consentType: ConsentType,
    updateRequest: ConsentUpdateRequest,
    req?: Request
  ): Promise<ConsentPreferenceEntity> {
    try {
      // Get existing preference or create a new one
      let preference = await this.consentPreferenceRepository.findOne({
        where: { userId, consentType },
      });

      const isNewPreference = !preference;

      if (!preference) {
        preference = this.consentPreferenceRepository.create({
          userId,
          consentType,
          status: false, // Default to false for new preferences
        });
      }

      // Update the preference
      preference.status = updateRequest.status;
      
      if (updateRequest.policyVersion) {
        preference.policyVersion = updateRequest.policyVersion;
      }

      // Save the updated preference
      await this.consentPreferenceRepository.save(preference);

      // Create a history record
      const history = this.consentHistoryRepository.create({
        userId,
        consentType,
        status: updateRequest.status,
        policyVersion: updateRequest.policyVersion,
        notes: updateRequest.notes,
        ipAddress: req?.ip,
        userAgent: req?.headers['user-agent'],
      });

      await this.consentHistoryRepository.save(history);

      // Log the update
      await this.auditLogService.log(
        userId,
        isNewPreference ? AuditAction.CREATE : AuditAction.UPDATE,
        AuditResource.USER,
        userId,
        { 
          action: isNewPreference ? 'Create consent preference' : 'Update consent preference', 
          consentType,
          newStatus: updateRequest.status,
          ipAddress: req?.ip,
          userAgent: req?.headers['user-agent']
        }
      );

      return preference;
    } catch (error) {
      this.logger.error(`Error updating consent preference: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Get consent history for a user
   * @param userId User ID
   * @param consentType Optional consent type to filter by
   * @returns Array of consent history records
   */
  async getConsentHistory(
    userId: string,
    consentType?: ConsentType
  ): Promise<ConsentHistoryEntity[]> {
    try {
      const queryBuilder = this.consentHistoryRepository
        .createQueryBuilder('history')
        .where('history.userId = :userId', { userId })
        .orderBy('history.changedAt', 'DESC');

      if (consentType) {
        queryBuilder.andWhere('history.consentType = :consentType', { consentType });
      }

      const history = await queryBuilder.getMany();

      // Log the access
      await this.auditLogService.log(
        userId,
        AuditAction.VIEW,
        AuditResource.USER,
        userId,
        { action: 'View consent history', consentType }
      );

      return history;
    } catch (error) {
      this.logger.error(`Error getting consent history: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Initialize default consent preferences for a new user
   * @param userId User ID
   */
  async initializeDefaultConsent(userId: string): Promise<void> {
    try {
      // Create default preferences for all consent types
      const defaultPreferences = Object.values(ConsentType).map(consentType => ({
        userId,
        consentType,
        status: false, // Default to opt-out for all consent types
      }));

      await this.consentPreferenceRepository.save(defaultPreferences);

      // Create history records for each default preference
      const historyRecords = defaultPreferences.map(pref => ({
        userId: pref.userId,
        consentType: pref.consentType,
        status: pref.status,
        notes: 'Default preference set during account creation',
      }));

      await this.consentHistoryRepository.save(historyRecords);

      // Log the initialization
      await this.auditLogService.log(
        userId,
        AuditAction.CREATE,
        AuditResource.USER,
        userId,
        { action: 'Initialize default consent preferences' }
      );
    } catch (error) {
      this.logger.error(`Error initializing default consent: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Check if a user has given consent for a specific type
   * @param userId User ID
   * @param consentType Type of consent
   * @returns True if consent is given, false otherwise
   */
  async hasConsent(userId: string, consentType: ConsentType): Promise<boolean> {
    try {
      const preference = await this.consentPreferenceRepository.findOne({
        where: { userId, consentType },
      });

      return preference?.status || false;
    } catch (error) {
      this.logger.error(`Error checking consent: ${error.message}`, error.stack);
      throw error;
    }
  }
}