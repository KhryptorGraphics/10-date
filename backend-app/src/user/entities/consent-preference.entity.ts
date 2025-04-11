import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { UserEntity } from '../user.entity/user.entity';

/**
 * Enum for consent types
 */
export enum ConsentType {
  MARKETING = 'marketing',
  ANALYTICS = 'analytics',
  THIRD_PARTY = 'third_party',
  PROFILING = 'profiling',
  COMMUNICATIONS = 'communications',
  LOCATION = 'location',
  BIOMETRIC = 'biometric',
}

/**
 * Entity for storing user consent preferences
 * Required for GDPR compliance
 */
@Entity('consent_preferences')
export class ConsentPreferenceEntity {
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

  @Column({ default: false })
  status: boolean;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'text', nullable: true })
  policyVersion: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}