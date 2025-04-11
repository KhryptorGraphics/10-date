import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Migration to add encryption fields to the messages table
 * This is required for GDPR and HIPAA compliance
 */
export class AddEncryptionToMessages1713496000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add new columns for encrypted content
    await queryRunner.query(`
      ALTER TABLE messages
      ADD COLUMN encrypted_content TEXT NULL,
      ADD COLUMN iv TEXT NULL,
      ADD COLUMN auth_tag TEXT NULL,
      ADD COLUMN algorithm VARCHAR(255) NULL,
      ADD COLUMN key_id VARCHAR(255) NULL,
      ADD COLUMN is_encrypted BOOLEAN NOT NULL DEFAULT FALSE
    `);

    // Add index for faster queries
    await queryRunner.query(`
      CREATE INDEX idx_messages_is_encrypted ON messages(is_encrypted)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Remove index
    await queryRunner.query(`
      DROP INDEX IF EXISTS idx_messages_is_encrypted
    `);

    // Remove columns
    await queryRunner.query(`
      ALTER TABLE messages
      DROP COLUMN IF EXISTS encrypted_content,
      DROP COLUMN IF EXISTS iv,
      DROP COLUMN IF EXISTS auth_tag,
      DROP COLUMN IF EXISTS algorithm,
      DROP COLUMN IF EXISTS key_id,
      DROP COLUMN IF EXISTS is_encrypted
    `);
  }
}