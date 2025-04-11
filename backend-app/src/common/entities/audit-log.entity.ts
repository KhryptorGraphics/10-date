import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, Index } from 'typeorm';
import { AuditAction, AuditResource } from '../services/audit-log.service';

/**
 * Entity for storing audit logs
 * Required for HIPAA compliance
 */
@Entity('audit_logs')
export class AuditLogEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  @Index()
  userId: string;

  @Column({
    type: 'enum',
    enum: AuditAction,
  })
  @Index()
  action: AuditAction;

  @Column({
    type: 'enum',
    enum: AuditResource,
  })
  @Index()
  resourceType: AuditResource;

  @Column({ type: 'uuid' })
  @Index()
  resourceId: string;

  @Column({ type: 'jsonb', default: '{}' })
  metadata: Record<string, any>;

  @Column()
  ipAddress: string;

  @Column()
  userAgent: string;

  @CreateDateColumn()
  @Index()
  timestamp: Date;
}