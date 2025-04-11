import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity()
export class Notification {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  userId: string;

  @Column()
  type: string;

  @Column('jsonb')
  content: any;

  @Column()
  status: string;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;
}
