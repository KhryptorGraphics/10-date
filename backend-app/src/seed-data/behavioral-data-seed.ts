import { UserEntity } from '../user/user.entity/user.entity';
import { Connection } from 'typeorm';
import { SwipeDataEntity } from '../matching/match.entity/swipe-data.entity';
import { Logger } from '@nestjs/common';

/**
 * Seeds behavioral data for testing the AI-powered matching algorithm.
 * This creates sample swipe data records with behavioral tracking information.
 */
export async function seedBehavioralData(connection: Connection): Promise<void> {
  const logger = new Logger('BehavioralDataSeed');
  
  // Check if data already exists
  const swipeDataCount = await connection
    .getRepository(SwipeDataEntity)
    .count();
  
  if (swipeDataCount > 0) {
    logger.log('Behavioral data already seeded - skipping');
    return;
  }
  
  logger.log('Starting to seed behavioral data...');
  
  // Get users to create behavioral data for
  const users = await connection
    .getRepository(UserEntity)
    .find({ take: 50 }); // Limit to 50 users for testing
  
  if (users.length < 10) {
    logger.warn('Not enough users found to seed behavioral data. Skipping.');
    return;
  }
  
  // Create arrays to hold our sample data
  const swipeData: SwipeDataEntity[] = [];
  
  // Create behavioral data with different patterns
  for (let i = 0; i < users.length; i++) {
    const user = users[i];
    
    // For each user, create swipe data for multiple other users (avoiding self-swipes)
    for (let j = 0; j < 20; j++) {
      const targetUserIndex = (i + j + 1) % users.length;
      const targetUser = users[targetUserIndex];
      
      if (targetUser.id === user.id) continue;
      
      // Create a model of this user's behavior based on their index
      const userBehaviorType = i % 5; // 5 behavior types
      
      // Swipe direction varies based on user behavior type
      let direction: 'left' | 'right';
      let swipeTime: number;
      let profileViewDuration: number;
      let viewedSections: string;
      
      switch (userBehaviorType) {
        case 0: // Quick decider - swipes fast with little viewing time
          direction = Math.random() > 0.3 ? 'left' : 'right'; // 30% right swipes
          swipeTime = Math.floor(Math.random() * 500) + 200; // 200-700ms
          profileViewDuration = Math.floor(Math.random() * 2000) + 1000; // 1-3 seconds
          viewedSections = 'photo'; // Mostly just looks at photos
          break;
          
        case 1: // Careful reader - takes time to read profiles
          direction = Math.random() > 0.5 ? 'left' : 'right'; // 50% right swipes
          swipeTime = Math.floor(Math.random() * 1000) + 500; // 500-1500ms
          profileViewDuration = Math.floor(Math.random() * 10000) + 8000; // 8-18 seconds
          viewedSections = 'photo,bio,interests'; // Looks at everything
          break;
          
        case 2: // Photo focused - only cares about photos
          direction = Math.random() > 0.4 ? 'left' : 'right'; // 60% right swipes
          swipeTime = Math.floor(Math.random() * 800) + 300; // 300-1100ms
          profileViewDuration = Math.floor(Math.random() * 5000) + 2000; // 2-7 seconds
          viewedSections = 'photo,photo_gallery'; // Looks at multiple photos
          break;
          
        case 3: // Interest matcher - focuses on shared interests
          // More likely to swipe right if their user ID is even (arbitrary distinction)
          direction = parseInt(targetUser.id.substring(0, 1), 16) % 2 === 0 ? 'right' : 'left';
          swipeTime = Math.floor(Math.random() * 1200) + 400; // 400-1600ms
          profileViewDuration = Math.floor(Math.random() * 7000) + 4000; // 4-11 seconds
          viewedSections = 'photo,interests'; // Focuses on interests
          break;
          
        case 4: // Impulsive swiper - swipes very quickly
          direction = Math.random() > 0.7 ? 'right' : 'left'; // 30% right swipes
          swipeTime = Math.floor(Math.random() * 300) + 100; // 100-400ms
          profileViewDuration = Math.floor(Math.random() * 1500) + 500; // 0.5-2 seconds
          viewedSections = 'photo'; // Just glances at the photo
          break;
          
        default:
          direction = Math.random() > 0.5 ? 'left' : 'right';
          swipeTime = Math.floor(Math.random() * 1000) + 300;
          profileViewDuration = Math.floor(Math.random() * 5000) + 1000;
          viewedSections = 'photo,bio';
      }
      
      // Create the swipe data entity
      const swipeDataEntity = new SwipeDataEntity();
      swipeDataEntity.user = user;
      swipeDataEntity.targetUser = targetUser;
      swipeDataEntity.direction = direction;
      swipeDataEntity.swipeTime = swipeTime;
      swipeDataEntity.profileViewDuration = profileViewDuration;
      swipeDataEntity.viewedSections = viewedSections;
      
      swipeData.push(swipeDataEntity);
    }
  }
  
  // Save all the data in a single transaction
  const queryRunner = connection.createQueryRunner();
  await queryRunner.connect();
  await queryRunner.startTransaction();
  
  try {
    await queryRunner.manager.save(swipeData);
    await queryRunner.commitTransaction();
    logger.log(`Successfully seeded ${swipeData.length} swipe data records for behavioral analysis.`);
  } catch (err) {
    await queryRunner.rollbackTransaction();
    logger.error('Failed to seed behavioral data', err);
    throw err;
  } finally {
    await queryRunner.release();
  }
}
