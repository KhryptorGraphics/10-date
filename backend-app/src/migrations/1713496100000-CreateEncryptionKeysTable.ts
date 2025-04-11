import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Migration to create the encryption_keys table
 * This table stores encrypted keys for HIPAA-compliant data encryption
 */
export class CreateEncryptionKeysTable1713496100000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create encryption_keys table
    await queryRunner.query(`
      CREATE TABLE encryption_keys (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        user_id UUID NOT NULL,
        key_type VARCHAR(10) NOT NULL,
        encrypted_key TEXT NOT NULL,
        iv TEXT NOT NULL,
        auth_tag TEXT NOT NULL,
        algorithm VARCHAR(255) NOT NULL,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        rotated_at TIMESTAMP NULL,
        active BOOLEAN NOT NULL DEFAULT TRUE
      )
    `);

    // Add indexes for faster queries
    await queryRunner.query(`
      CREATE INDEX idx_encryption_keys_user_id ON encryption_keys(user_id)
    `);

    await queryRunner.query(`
      CREATE INDEX idx_encryption_keys_active ON encryption_keys(active)
    `);

    await queryRunner.query(`
      CREATE INDEX idx_encryption_keys_key_type ON encryption_keys(key_type)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Remove indexes
    await queryRunner.query(`
      DROP INDEX IF EXISTS idx_encryption_keys_user_id
    `);

    await queryRunner.query(`
      DROP INDEX IF EXISTS idx_encryption_keys_active
    `);

    await queryRunner.query(`
      DROP INDEX IF EXISTS idx_encryption_keys_key_type
    `);

    // Drop table
    await queryRunner.query(`
      DROP TABLE IF EXISTS encryption_keys
    `);
  }
}