import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('swipe_data')
export class SwipeDataEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;
  
  @Column()
  swipeId: string;
  
  @Column()
  swipeTime: number; // Time spent before swiping (ms)
  
  @Column()
  profileViewDuration: number; // Time spent viewing profile (ms)
  
  @Column('json', { nullable: true })
  viewedSections: string[]; // Profile sections viewed
  
  @Column()
  timestamp: Date;
}
