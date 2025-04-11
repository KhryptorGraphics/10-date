import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Not, In } from 'typeorm';
import { SwipeEntity } from './match.entity/swipe.entity';
import { MatchEntity } from './match.entity/match.entity';
import { UserEntity } from '../user/user.entity/user.entity';

@Injectable()
export class MatchingService {
  constructor(
    @InjectRepository(SwipeEntity)
    private readonly swipeRepo: Repository<SwipeEntity>,
    @InjectRepository(MatchEntity)
    private readonly matchRepo: Repository<MatchEntity>,
    @InjectRepository(UserEntity)
    private readonly userRepo: Repository<UserEntity>,
  ) {}

  async swipe(userId: string, targetUserId: string, direction: 'like' | 'dislike') {
    // Save the swipe
    const swipe = this.swipeRepo.create({
      fromUserId: userId,
      toUserId: targetUserId,
      direction,
    });
    await this.swipeRepo.save(swipe);

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
    // Get current user
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) return [];

    // Get users who haven't been swiped on yet
    const swipedUserIds = (await this.swipeRepo.find({
      where: { fromUserId: userId },
      select: ['toUserId'],
    })).map(swipe => swipe.toUserId);

    // Add current user to excluded list
    swipedUserIds.push(userId);

    // Find users not in the swiped list - simple recommendation for now
    const recommendedUsers = await this.userRepo.find({
      where: { id: Not(In(swipedUserIds)) },
      take: 10, // Limit to 10 recommendations
    });

    return recommendedUsers.map(user => ({
      userId: user.id,
      name: user.name,
      age: user.age,
      bio: user.bio,
    }));
  }
}
