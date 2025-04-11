import { Module, Global } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { EncryptionService } from './services/encryption.service';
import { EncryptionKeyEntity } from './entities/encryption-key.entity';
import { AuditLogService } from './services/audit-log.service';
import { AuditLogEntity } from './entities/audit-log.entity';

/**
 * Common module providing shared services and utilities
 * This module is marked as global so its providers can be used throughout the application
 */
@Global()
@Module({
  imports: [
    TypeOrmModule.forFeature([EncryptionKeyEntity, AuditLogEntity]),
    ConfigModule,
  ],
  providers: [EncryptionService, AuditLogService],
  exports: [EncryptionService, AuditLogService],
})
export class CommonModule {}