import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { UserEntity } from '../../user/user.entity/user.entity';

@Entity('swipes')
export class SwipeEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  fromUserId: string;

  @Column({ type: 'uuid' })
  toUserId: string;

  @Column({
    type: 'enum',
    enum: ['like', 'dislike'],
  })
  direction: 'like' | 'dislike';

  @CreateDateColumn()
  createdAt: Date;

  @ManyToOne(() => UserEntity)
  @JoinColumn({ name: 'fromUserId' })
  fromUser: UserEntity;

  @ManyToOne(() => UserEntity)
  @JoinColumn({ name: 'toUserId' })
  toUser: UserEntity;
}
