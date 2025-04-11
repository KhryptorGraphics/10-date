import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('users')
export class UserEntity {
  @Column({ default: 'user' })
  role: 'user' | 'admin';
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  email: string;

  @Column()
  passwordHash: string;

  @Column({ nullable: true })
  oauthGoogleId: string;

  @Column({ nullable: true })
  oauthFacebookId: string;

  @Column({ nullable: true })
  oauthAppleId: string;

  @Column()
  name: string;

  @Column()
  age: number;

  @Column('json', { nullable: true })
  location: any;

  @Column({ type: 'text', nullable: true })
  bio: string;

  @Column('json', { nullable: true })
  preferences: any;

  @Column({ default: 'free' })
  subscriptionStatus: string;

  @Column({ default: false })
  verificationStatus: boolean;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;
}
