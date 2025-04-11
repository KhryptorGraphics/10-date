import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditLogEntity } from '../entities/audit-log.entity';

/**
 * Action types for audit logging
 */
export enum AuditAction {
  VIEW = 'view',
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  EXPORT = 'export',
  LOGIN = 'login',
  LOGOUT = 'logout',
  FAILED_LOGIN = 'failed_login',
  ENCRYPT = 'encrypt',
  DECRYPT = 'decrypt',
}

/**
 * Resource types for audit logging
 */
export enum AuditResource {
  USER = 'user',
  PROFILE = 'profile',
  MESSAGE = 'message',
  MATCH = 'match',
  PAYMENT = 'payment',
  SUBSCRIPTION = 'subscription',
  ENCRYPTION_KEY = 'encryption_key',
}

/**
 * Query options for retrieving audit logs
 */
export interface AuditLogQueryOptions {
  userId?: string;
  resourceId?: string;
  resourceType?: AuditResource;
  action?: AuditAction;
  startDate?: Date;
  endDate?: Date;
  page?: number;
  limit?: number;
}

/**
 * Service for comprehensive audit logging
 * Required for HIPAA compliance
 */
@Injectable()
export class AuditLogService {
  private readonly logger = new Logger(AuditLogService.name);

  constructor(
    @InjectRepository(AuditLogEntity)
    private readonly auditLogRepository: Repository<AuditLogEntity>,
  ) {}

  /**
   * Log an action for audit purposes
   * @param userId ID of the user performing the action
   * @param action Action being performed
   * @param resourceType Type of resource being accessed
   * @param resourceId ID of the resource being accessed
   * @param metadata Additional metadata about the action
   */
  async log(
    userId: string,
    action: AuditAction,
    resourceType: AuditResource,
    resourceId: string,
    metadata: Record<string, any> = {},
  ): Promise<void> {
    try {
      const auditLog = this.auditLogRepository.create({
        userId,
        action,
        resourceType,
        resourceId,
        metadata,
        ipAddress: metadata.ipAddress || 'unknown',
        userAgent: metadata.userAgent || 'unknown',
        timestamp: new Date(),
      });

      await this.auditLogRepository.save(auditLog);
    } catch (error) {
      // Log error but don't throw - audit logging should not block operations
      this.logger.error(`Failed to create audit log: ${error.message}`, error.stack);
    }
  }

  /**
   * Get audit logs based on query options
   * @param options Query options
   * @returns Audit logs matching the query
   */
  async getAuditLogs(options: AuditLogQueryOptions): Promise<{
    logs: AuditLogEntity[];
    total: number;
  }> {
    try {
      const {
        userId,
        resourceId,
        resourceType,
        action,
        startDate,
        endDate,
        page = 1,
        limit = 20,
      } = options;

      // Build query
      const queryBuilder = this.auditLogRepository.createQueryBuilder('audit_log');

      // Apply filters
      if (userId) {
        queryBuilder.andWhere('audit_log.userId = :userId', { userId });
      }

      if (resourceId) {
        queryBuilder.andWhere('audit_log.resourceId = :resourceId', { resourceId });
      }

      if (resourceType) {
        queryBuilder.andWhere('audit_log.resourceType = :resourceType', { resourceType });
      }

      if (action) {
        queryBuilder.andWhere('audit_log.action = :action', { action });
      }

      if (startDate) {
        queryBuilder.andWhere('audit_log.timestamp >= :startDate', { startDate });
      }

      if (endDate) {
        queryBuilder.andWhere('audit_log.timestamp <= :endDate', { endDate });
      }

      // Add pagination
      queryBuilder
        .orderBy('audit_log.timestamp', 'DESC')
        .skip((page - 1) * limit)
        .take(limit);

      // Execute query
      const [logs, total] = await queryBuilder.getManyAndCount();

      return { logs, total };
    } catch (error) {
      this.logger.error(`Failed to retrieve audit logs: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Get audit logs for a specific user
   * @param userId User ID
   * @param options Additional query options
   * @returns Audit logs for the user
   */
  async getUserAuditLogs(
    userId: string,
    options: Omit<AuditLogQueryOptions, 'userId'> = {},
  ): Promise<{
    logs: AuditLogEntity[];
    total: number;
  }> {
    return this.getAuditLogs({ ...options, userId });
  }

  /**
   * Get audit logs for a specific resource
   * @param resourceType Resource type
   * @param resourceId Resource ID
   * @param options Additional query options
   * @returns Audit logs for the resource
   */
  async getResourceAuditLogs(
    resourceType: AuditResource,
    resourceId: string,
    options: Omit<AuditLogQueryOptions, 'resourceType' | 'resourceId'> = {},
  ): Promise<{
    logs: AuditLogEntity[];
    total: number;
  }> {
    return this.getAuditLogs({ ...options, resourceType, resourceId });
  }
}