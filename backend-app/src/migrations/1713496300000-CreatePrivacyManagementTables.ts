import { MigrationInterface, QueryRunner } from 'typeorm';
import { ConsentType } from '../user/entities/consent-preference.entity';
import { ExportStatus, ExportFormat } from '../user/entities/data-export.entity';

/**
 * Migration to create tables for privacy management
 * This includes consent preferences, consent history, and data exports
 */
export class CreatePrivacyManagementTables1713496300000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create enum types
    await queryRunner.query(`
      CREATE TYPE consent_type AS ENUM (
        '${ConsentType.MARKETING}', 
        '${ConsentType.ANALYTICS}', 
        '${ConsentType.THIRD_PARTY}',
        '${ConsentType.PROFILING}',
        '${ConsentType.COMMUNICATIONS}',
        '${ConsentType.LOCATION}',
        '${ConsentType.BIOMETRIC}'
      )
    `);

    await queryRunner.query(`
      CREATE TYPE export_status AS ENUM (
        '${ExportStatus.PENDING}', 
        '${ExportStatus.PROCESSING}', 
        '${ExportStatus.COMPLETED}',
        '${ExportStatus.FAILED}',
        '${ExportStatus.EXPIRED}'
      )
    `);

    await queryRunner.query(`
      CREATE TYPE export_format AS ENUM (
        '${ExportFormat.JSON}', 
        '${ExportFormat.CSV}', 
        '${ExportFormat.PDF}',
        '${ExportFormat.XML}'
      )
    `);

    // Create consent_preferences table
    await queryRunner.query(`
      CREATE TABLE consent_preferences (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        consent_type consent_type NOT NULL,
        status BOOLEAN NOT NULL DEFAULT FALSE,
        description TEXT,
        policy_version TEXT,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
        UNIQUE(user_id, consent_type)
      )
    `);

    // Create consent_history table
    await queryRunner.query(`
      CREATE TABLE consent_history (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        consent_type consent_type NOT NULL,
        status BOOLEAN NOT NULL,
        policy_version TEXT,
        changed_at TIMESTAMP NOT NULL DEFAULT NOW(),
        ip_address VARCHAR(255),
        user_agent TEXT,
        notes TEXT
      )
    `);

    // Create data_exports table
    await queryRunner.query(`
      CREATE TABLE data_exports (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        status export_status NOT NULL DEFAULT '${ExportStatus.PENDING}',
        format export_format NOT NULL DEFAULT '${ExportFormat.JSON}',
        categories JSONB NOT NULL DEFAULT '{}',
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        completed_at TIMESTAMP,
        download_url TEXT,
        expires_at TIMESTAMP,
        error_message TEXT,
        progress INTEGER NOT NULL DEFAULT 0,
        ip_address VARCHAR(255),
        user_agent TEXT
      )
    `);

    // Add indexes for faster queries
    await queryRunner.query(`
      CREATE INDEX idx_consent_preferences_user_id ON consent_preferences(user_id)
    `);

    await queryRunner.query(`
      CREATE INDEX idx_consent_history_user_id ON consent_history(user_id)
    `);

    await queryRunner.query(`
      CREATE INDEX idx_consent_history_changed_at ON consent_history(changed_at)
    `);

    await queryRunner.query(`
      CREATE INDEX idx_data_exports_user_id ON data_exports(user_id)
    `);

    await queryRunner.query(`
      CREATE INDEX idx_data_exports_status ON data_exports(status)
    `);

    await queryRunner.query(`
      CREATE INDEX idx_data_exports_created_at ON data_exports(created_at)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop indexes
    await queryRunner.query(`DROP INDEX IF EXISTS idx_consent_preferences_user_id`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_consent_history_user_id`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_consent_history_changed_at`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_data_exports_user_id`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_data_exports_status`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_data_exports_created_at`);

    // Drop tables
    await queryRunner.query(`DROP TABLE IF EXISTS data_exports`);
    await queryRunner.query(`DROP TABLE IF EXISTS consent_history`);
    await queryRunner.query(`DROP TABLE IF EXISTS consent_preferences`);

    // Drop enum types
    await queryRunner.query(`DROP TYPE IF EXISTS export_format`);
    await queryRunner.query(`DROP TYPE IF EXISTS export_status`);
    await queryRunner.query(`DROP TYPE IF EXISTS consent_type`);
  }
}