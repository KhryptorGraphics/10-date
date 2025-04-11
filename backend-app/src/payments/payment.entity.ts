import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity()
export class Payment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  userId: string;

  @Column()
  plan: string;

  @Column()
  status: string;

  @Column('decimal', { precision: 10, scale: 2 })
  amount: number;

  @Column({ type: 'timestamptz' })
  paymentDate: Date;

  @Column({ type: 'jsonb', nullable: true })
  paymentInfo: any;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;
}
