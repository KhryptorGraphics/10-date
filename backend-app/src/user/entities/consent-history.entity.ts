import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { UserEntity } from '../user.entity/user.entity';
import { ConsentType } from './consent-preference.entity';

/**
 * Entity for tracking consent history
 * Required for GDPR compliance audit trail
 */
@Entity('consent_history')
export class ConsentHistoryEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  userId: string;

  @ManyToOne(() => UserEntity)
  @JoinColumn({ name: 'userId' })
  user: UserEntity;

  @Column({
    type: 'enum',
    enum: ConsentType,
  })
  consentType: ConsentType;

  @Column()
  status: boolean;

  @Column({ type: 'text', nullable: true })
  policyVersion: string;

  @CreateDateColumn()
  changedAt: Date;

  @Column({ nullable: true })
  ipAddress: string;

  @Column({ type: 'text', nullable: true })
  userAgent: string;

  @Column({ type: 'text', nullable: true })
  notes: string;
}