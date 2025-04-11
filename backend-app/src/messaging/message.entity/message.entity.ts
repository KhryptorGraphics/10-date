import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { UserEntity } from '../../user/user.entity/user.entity';
import { MatchEntity } from '../../matching/match.entity/match.entity';
import { EncryptedData } from '../../common/services/encryption.service';

@Entity('messages')
export class MessageEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  senderId: string;

  @Column({ type: 'uuid' })
  matchId: string;

  @Column({ type: 'text', nullable: true })
  content: string;

  @Column({ type: 'text', nullable: true })
  encryptedContent: string;

  @Column({ type: 'text', nullable: true })
  iv: string;

  @Column({ type: 'text', nullable: true })
  authTag: string;

  @Column({ nullable: true })
  algorithm: string;

  @Column({ nullable: true })
  keyId: string;

  @Column({ default: false })
  isEncrypted: boolean;

  @Column({ default: false })
  read: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @ManyToOne(() => UserEntity)
  @JoinColumn({ name: 'senderId' })
  sender: UserEntity;

  @ManyToOne(() => MatchEntity)
  @JoinColumn({ name: 'matchId' })
  match: MatchEntity;
}
