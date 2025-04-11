import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Not, In } from 'typeorm';
import { SwipeEntity } from './match.entity/swipe.entity';
import { MatchEntity } from './match.entity/match.entity';
import { UserEntity } from '../user/user.entity/user.entity';
import { MatchingFactorsService } from './services/matching-factors.service';
import { BehavioralTrackingService } from '../analytics/services/behavioral-tracking.service';

@Injectable()
export class MatchingService {
  constructor(
    @InjectRepository(SwipeEntity)
    private readonly swipeRepo: Repository<SwipeEntity>,
    @InjectRepository(MatchEntity)
    private readonly matchRepo: Repository<MatchEntity>,
    @InjectRepository(UserEntity)
    private readonly userRepo: Repository<UserEntity>,
    private readonly matchingFactorsService: MatchingFactorsService,
    private readonly behavioralTrackingService: BehavioralTrackingService,
  ) {}

  async swipe(
    userId: string, 
    targetUserId: string, 
    direction: 'like' | 'dislike',
    metadata?: {
      swipeTime: number;
      profileViewDuration: number;
      viewedSections?: string[];
    }
  ) {
    // Save the swipe
    const swipe = this.swipeRepo.create({
      fromUserId: userId,
      toUserId: targetUserId,
      direction,
    });
    await this.swipeRepo.save(swipe);

    // Track behavioral data if metadata is provided
    if (metadata) {
      await this.behavioralTrackingService.trackSwipeEvent(
        userId, 
        targetUserId, 
        direction, 
        metadata
      );
      
      // Periodically update implicit preferences
      // Don't do this on every swipe to reduce DB load
      const shouldUpdate = Math.random() < 0.2; // 20% chance
      if (shouldUpdate) {
        this.behavioralTrackingService.updateImplicitPreferences(userId)
          .catch(err => console.error('Failed to update implicit preferences:', err));
      }
    }

    // If this was a 'like', check if there's a mutual like
    if (direction === 'like') {
      // Check if target user has already liked this user
      const mutualLike = await this.swipeRepo.findOne({
        where: {
          fromUserId: targetUserId,
          toUserId: userId,
          direction: 'like',
        },
      });

      // If there's a mutual like, create a match
      if (mutualLike) {
        const match = this.matchRepo.create({
          user1Id: userId,
          user2Id: targetUserId,
        });
        await this.matchRepo.save(match);
        return { 
          message: `User ${userId} swiped ${direction} on ${targetUserId}`,
          match: true,
          matchId: match.id
        };
      }
    }

    return { 
      message: `User ${userId} swiped ${direction} on ${targetUserId}`,
      match: false
    };
  }

  async getMatches(userId: string) {
    // Find all matches where userId is either user1Id or user2Id
    const matches = await this.matchRepo.find({
      where: [
        { user1Id: userId, active: true },
        { user2Id: userId, active: true }
      ],
      relations: ['user1', 'user2'],
    });

    // Format the response to return the other user in each match
    return matches.map(match => {
      const otherUserId = match.user1Id === userId ? match.user2Id : match.user1Id;
      const otherUser = match.user1Id === userId ? match.user2 : match.user1;
      return {
        matchId: match.id,
        userId: otherUserId,
        name: otherUser.name,
        createdAt: match.createdAt
      };
    });
  }

  async getRecommendations(userId: string) {
    // Get current user with interests
    const user = await this.userRepo.findOne({ 
      where: { id: userId },
      relations: ['interests']
    });
    if (!user) return [];

    // Get users who haven't been swiped on yet
    const swipedUserIds = (await this.swipeRepo.find({
      where: { fromUserId: userId },
      select: ['toUserId'],
    })).map(swipe => swipe.toUserId);

    // Add current user to excluded list
    swipedUserIds.push(userId);

    // Find potential matches not in the swiped list
    const potentialMatches = await this.userRepo.find({
      where: { id: Not(In(swipedUserIds)) },
      relations: ['interests'],
    });
    
    // Enhance recommendations with compatibility scoring
    const enhancedRecommendations = await Promise.all(
      potentialMatches.map(async match => {
        // Calculate compatibility score
        const compatibilityScore = await this.matchingFactorsService.calculateOverallCompatibility(
          user, 
          match
        );
        
        // Calculate common interests for display
        let commonInterests: string[] = [];
        if (user.interests && match.interests) {
          const userInterestIds = user.interests.map(i => i.id);
          commonInterests = match.interests
            .filter(i => userInterestIds.includes(i.id))
            .map(i => i.name);
        }
        
        return {
          userId: match.id,
          name: match.name,
          age: match.age,
          bio: match.bio,
          compatibilityScore: Math.round(compatibilityScore * 100), // Convert to percentage
          commonInterests
        };
      })
    );
    
    // Sort by compatibility score (highest first) and return top matches
    return enhancedRecommendations
      .sort((a, b) => b.compatibilityScore - a.compatibilityScore)
      .slice(0, 10); // Limit to 10 recommendations
  }
  
  async getMatchFactors(userId: string, targetUserId: string) {
    // Get both users with their interests
    const user = await this.userRepo.findOne({
      where: { id: userId },
      relations: ['interests']
    });
    
    const targetUser = await this.userRepo.findOne({
      where: { id: targetUserId },
      relations: ['interests']
    });
    
    if (!user || !targetUser) {
      return { error: 'One or both users not found' };
    }
    
    // Calculate compatibility factors
    const interestScore = await this.matchingFactorsService.calculateInterestCompatibility(user, targetUser);
    const demographicScore = this.matchingFactorsService.calculateDemographicCompatibility(user, targetUser);
    const locationScore = this.matchingFactorsService.calculateLocationCompatibility(user, targetUser);
    
    // Calculate overall score
    const overallScore = await this.matchingFactorsService.calculateOverallCompatibility(user, targetUser);
    
    // Get common interests
    let commonInterests: string[] = [];
    if (user.interests && targetUser.interests) {
      const userInterestIds = user.interests.map(i => i.id);
      commonInterests = targetUser.interests
        .filter(i => userInterestIds.includes(i.id))
        .map(i => i.name);
    }
    
    return {
      overallCompatibility: Math.round(overallScore * 100),
      factors: {
        interests: {
          score: Math.round(interestScore * 100),
          common: commonInterests
        },
        demographics: {
          score: Math.round(demographicScore * 100)
        },
        location: {
          score: Math.round(locationScore * 100)
        }
      }
    };
  }
}
