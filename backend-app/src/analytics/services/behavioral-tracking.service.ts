import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserEntity } from '../../user/user.entity/user.entity';
import { SwipeEntity } from '../../matching/match.entity/swipe.entity';
import { SwipeDataEntity } from '../../matching/match.entity/swipe-data.entity';

@Injectable()
export class BehavioralTrackingService {
  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepo: Repository<UserEntity>,
    @InjectRepository(SwipeEntity)
    private readonly swipeRepo: Repository<SwipeEntity>,
    @InjectRepository(SwipeDataEntity)
    private readonly swipeDataRepo: Repository<SwipeDataEntity>,
  ) {}
  
  async trackSwipeEvent(
    userId: string, 
    targetUserId: string, 
    direction: 'like' | 'dislike',
    metadata: {
      swipeTime: number;
      profileViewDuration: number;
      viewedSections?: string[];
    }
  ): Promise<void> {
    // Find the swipe record
    const swipe = await this.swipeRepo.findOne({
      where: { fromUserId: userId, toUserId: targetUserId }
    });
    
    if (!swipe) return;
    
    // Save detailed swipe data
    const swipeData = this.swipeDataRepo.create({
      swipeId: swipe.id,
      swipeTime: metadata.swipeTime,
      profileViewDuration: metadata.profileViewDuration,
      viewedSections: metadata.viewedSections || [],
      timestamp: new Date(),
    });
    await this.swipeDataRepo.save(swipeData);
    
    // Update user's behavioral data
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) return;
    
    const behavioralData = user.behavioralData || {
      averageSwipeTime: 0,
      swipeCount: 0,
      likeCount: 0,
      dislikeCount: 0,
      swipeRatio: 0,
      activeHours: new Array(24).fill(0),
      responseRate: 0,
      profileViewDuration: 0
    };
    
    // Calculate new average swipe time
    const currentAvg = behavioralData.averageSwipeTime || 0;
    const currentCount = behavioralData.swipeCount || 0;
    const newAvg = ((currentAvg * currentCount) + metadata.swipeTime) / (currentCount + 1);
    
    // Update swipe ratio
    const likeCount = behavioralData.likeCount || 0;
    const dislikeCount = behavioralData.dislikeCount || 0;
    const newLikeCount = direction === 'like' ? likeCount + 1 : likeCount;
    const newDislikeCount = direction === 'dislike' ? dislikeCount + 1 : dislikeCount;
    const newSwipeRatio = (newLikeCount + newDislikeCount) > 0 
      ? newLikeCount / (newLikeCount + newDislikeCount) 
      : 0;
    
    // Update active hours (when user is swiping)
    const currentHour = new Date().getHours();
    const activeHours = [...(behavioralData.activeHours || new Array(24).fill(0))];
    activeHours[currentHour] = (activeHours[currentHour] || 0) + 1;
    
    // Update user's behavioral data
    await this.userRepo.update(userId, {
      behavioralData: {
        ...behavioralData,
        averageSwipeTime: newAvg,
        swipeCount: currentCount + 1,
        likeCount: newLikeCount,
        dislikeCount: newDislikeCount,
        swipeRatio: newSwipeRatio,
        activeHours,
        profileViewDuration: metadata.profileViewDuration
      }
    });
  }
  
  async updateImplicitPreferences(userId: string): Promise<void> {
    // Get user's swipe history
    const swipes = await this.swipeRepo.find({
      where: { fromUserId: userId },
      relations: ['toUser', 'toUser.interests'],
    });
    
    // Split by direction
    const likes = swipes.filter(swipe => swipe.direction === 'like');
    const dislikes = swipes.filter(swipe => swipe.direction === 'dislike');
    
    // Skip if not enough data
    if (likes.length < 5) return;
    
    // Analyze age preferences
    const likedAges = likes.map(swipe => swipe.toUser?.age).filter(Boolean) as number[];
    if (likedAges.length === 0) return;
    
    const avgLikedAge = likedAges.reduce((sum, age) => sum + age, 0) / likedAges.length;
    const minLikedAge = Math.min(...likedAges);
    const maxLikedAge = Math.max(...likedAges);
    
    // Analyze interest preferences
    const interestCounts: Record<string, number> = {};
    likes.forEach(swipe => {
      if (swipe.toUser?.interests) {
        swipe.toUser.interests.forEach(interest => {
          interestCounts[interest.id] = (interestCounts[interest.id] || 0) + 1;
        });
      }
    });
    
    // Get user to update
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) return;
    
    const implicitPreferences = user.implicitPreferences || {};
    
    // Update implicit preferences
    await this.userRepo.update(userId, {
      implicitPreferences: {
        ...implicitPreferences,
        agePreference: {
          min: minLikedAge,
          max: maxLikedAge,
          avg: avgLikedAge,
          weight: 0.7 // Confidence level
        },
        interestFactors: interestCounts
      }
    });
  }
  
  // For analyzing message patterns to improve matching
  async updateMessageEngagementMetrics(userId: string): Promise<void> {
    // This would analyze messaging patterns
    // For future implementation
  }
}
