import { MigrationInterface, QueryRunner } from 'typeorm';
import { AuditAction, AuditResource } from '../common/services/audit-log.service';

/**
 * Migration to create the audit_logs table
 * This is required for HIPAA compliance
 */
export class CreateAuditLogsTable1713496200000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create enum types for audit actions and resources
    await queryRunner.query(`
      CREATE TYPE audit_action AS ENUM (
        'view', 'create', 'update', 'delete', 'export', 
        'login', 'logout', 'failed_login', 'encrypt', 'decrypt'
      )
    `);

    await queryRunner.query(`
      CREATE TYPE audit_resource AS ENUM (
        'user', 'profile', 'message', 'match', 
        'payment', 'subscription', 'encryption_key'
      )
    `);

    // Create audit_logs table
    await queryRunner.query(`
      CREATE TABLE audit_logs (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        user_id UUID NOT NULL,
        action audit_action NOT NULL,
        resource_type audit_resource NOT NULL,
        resource_id UUID NOT NULL,
        metadata JSONB NOT NULL DEFAULT '{}',
        ip_address VARCHAR(255) NOT NULL,
        user_agent TEXT NOT NULL,
        timestamp TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `);

    // Add indexes for faster queries
    await queryRunner.query(`
      CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id)
    `);

    await queryRunner.query(`
      CREATE INDEX idx_audit_logs_action ON audit_logs(action)
    `);

    await queryRunner.query(`
      CREATE INDEX idx_audit_logs_resource_type ON audit_logs(resource_type)
    `);

    await queryRunner.query(`
      CREATE INDEX idx_audit_logs_resource_id ON audit_logs(resource_id)
    `);

    await queryRunner.query(`
      CREATE INDEX idx_audit_logs_timestamp ON audit_logs(timestamp)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop indexes
    await queryRunner.query(`
      DROP INDEX IF EXISTS idx_audit_logs_user_id
    `);

    await queryRunner.query(`
      DROP INDEX IF EXISTS idx_audit_logs_action
    `);

    await queryRunner.query(`
      DROP INDEX IF EXISTS idx_audit_logs_resource_type
    `);

    await queryRunner.query(`
      DROP INDEX IF EXISTS idx_audit_logs_resource_id
    `);

    await queryRunner.query(`
      DROP INDEX IF EXISTS idx_audit_logs_timestamp
    `);

    // Drop table
    await queryRunner.query(`
      DROP TABLE IF EXISTS audit_logs
    `);

    // Drop enum types
    await queryRunner.query(`
      DROP TYPE IF EXISTS audit_action
    `);

    await queryRunner.query(`
      DROP TYPE IF EXISTS audit_resource
    `);
  }
}