import { Entity, PrimaryGeneratedColumn, Column, ManyToMany, JoinTable } from 'typeorm';
import { InterestEntity } from './interest.entity';

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

  // New fields for AI matching
  @Column('json', { nullable: true })
  behavioralData: {
    averageSwipeTime?: number;
    swipeCount?: number;
    likeCount?: number;
    dislikeCount?: number;
    swipeRatio?: number;
    activeHours?: number[];
    responseRate?: number;
    profileViewDuration?: number;
  };

  @Column('json', { nullable: true })
  implicitPreferences: {
    agePreference?: { min: number; max: number; avg: number; weight: number };
    distancePreference?: { max: number; weight: number };
    interestFactors?: { [interestId: string]: number };
    personalityFactors?: { [trait: string]: number };
  };
  
  // Relationship with interests
  @ManyToMany(() => InterestEntity)
  @JoinTable({
    name: 'user_interests',
    joinColumn: { name: 'user_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'interest_id', referencedColumnName: 'id' }
  })
  interests: InterestEntity[];
}
