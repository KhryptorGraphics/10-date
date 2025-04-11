import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { UserEntity } from '../../user/user.entity/user.entity';

@Entity('matches')
export class MatchEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  user1Id: string;

  @Column({ type: 'uuid' })
  user2Id: string;

  @CreateDateColumn()
  createdAt: Date;

  @Column({ default: true })
  active: boolean;

  @ManyToOne(() => UserEntity)
  @JoinColumn({ name: 'user1Id' })
  user1: UserEntity;

  @ManyToOne(() => UserEntity)
  @JoinColumn({ name: 'user2Id' })
  user2: UserEntity;
}
