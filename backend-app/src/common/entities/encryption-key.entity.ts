import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

/**
 * Entity for storing encryption keys
 * Keys are stored encrypted with the master key for security
 */
@Entity('encryption_keys')
export class EncryptionKeyEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;
  
  @Column({ type: 'uuid' })
  userId: string;
  
  @Column()
  keyType: 'DEK' | 'KEK' | 'AUTH';
  
  @Column({ type: 'text' })
  encryptedKey: string; // Key encrypted with master key
  
  @Column({ type: 'text' })
  iv: string;
  
  @Column({ type: 'text' })
  authTag: string;
  
  @Column()
  algorithm: string;
  
  @CreateDateColumn()
  createdAt: Date;
  
  @Column({ nullable: true, type: 'timestamp' })
  rotatedAt: Date;
  
  @Column({ default: true })
  active: boolean;
}