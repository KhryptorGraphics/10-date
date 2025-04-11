import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserEntity } from '../../user/user.entity/user.entity';
import { InterestEntity } from '../../user/user.entity/interest.entity';

@Injectable()
export class MatchingFactorsService {
  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepo: Repository<UserEntity>,
    @InjectRepository(InterestEntity)
    private readonly interestRepo: Repository<InterestEntity>,
  ) {}

  async calculateInterestCompatibility(
    user1: UserEntity, 
    user2: UserEntity
  ): Promise<number> {
    // Load interests if not already loaded
    if (!user1.interests) {
      user1 = await this.userRepo.findOne({
        where: { id: user1.id },
        relations: ['interests']
      });
    }
    
    if (!user2.interests) {
      user2 = await this.userRepo.findOne({
        where: { id: user2.id },
        relations: ['interests']
      });
    }
    
    // Handle cases where users might not have interests
    if (!user1.interests || !user2.interests) {
      return 0.5; // Neutral score if interests aren't available
    }
    
    // Get interest IDs for both users
    const user1InterestIds = user1.interests.map(interest => interest.id);
    const user2InterestIds = user2.interests.map(interest => interest.id);
    
    // Calculate Jaccard similarity (intersection / union)
    const intersection = user1InterestIds.filter(id => user2InterestIds.includes(id));
    const union = new Set([...user1InterestIds, ...user2InterestIds]);
    
    // If no interests, return neutral score
    if (union.size === 0) return 0.5;
    
    // Return similarity score (0-1)
    return intersection.length / union.size;
  }
  
  calculateDemographicCompatibility(
    user1: UserEntity, 
    user2: UserEntity
  ): number {
    // Get age preferences from user1
    const agePreference = user1.preferences?.ageRange || { min: 18, max: 99 };
    
    // Check if user2's age is within user1's preference
    const isAgeCompatible = user2.age >= agePreference.min && user2.age <= agePreference.max;
    
    // Get gender preference
    const genderPreference = user1.preferences?.genderPreference || 'any';
    
    // Check gender compatibility (simplified)
    const isGenderCompatible = 
      genderPreference === 'any' || 
      genderPreference === user2?.preferences?.gender;
    
    // Calculate demographic score (equal weighting)
    return (isAgeCompatible ? 0.5 : 0) + (isGenderCompatible ? 0.5 : 0);
  }
  
  calculateLocationCompatibility(
    user1: UserEntity, 
    user2: UserEntity
  ): number {
    // Skip if either user has no location data
    if (!user1.location || !user2.location) return 0.5;
    
    // Calculate distance using haversine formula
    const distance = this.calculateHaversineDistance(
      user1.location.latitude, user1.location.longitude,
      user2.location.latitude, user2.location.longitude
    );
    
    // Get max distance from preferences (default to 100 km)
    const maxDistance = user1.preferences?.maxDistance || 100;
    
    // Return normalized score (1.0 for closest, 0.0 for furthest)
    return Math.max(0, 1 - (distance / maxDistance));
  }
  
  private calculateHaversineDistance(
    lat1: number, lon1: number, 
    lat2: number, lon2: number
  ): number {
    // Radius of the Earth in kilometers
    const R = 6371;
    
    // Convert latitude and longitude from degrees to radians
    const dLat = this.deg2rad(lat2 - lat1);
    const dLon = this.deg2rad(lon2 - lon1);
    
    // Haversine formula
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(this.deg2rad(lat1)) * Math.cos(this.deg2rad(lat2)) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const distance = R * c; // Distance in kilometers
    
    return distance;
  }
  
  private deg2rad(deg: number): number {
    return deg * (Math.PI/180);
  }
  
  /**
   * Calculate overall compatibility score based on multiple factors
   */
  async calculateOverallCompatibility(
    user1: UserEntity, 
    user2: UserEntity
  ): Promise<number> {
    // Calculate individual scores
    const interestScore = await this.calculateInterestCompatibility(user1, user2);
    const demographicScore = this.calculateDemographicCompatibility(user1, user2);
    const locationScore = this.calculateLocationCompatibility(user1, user2);
    
    // Calculate behavioral compatibility if data exists
    let behavioralScore = 0.5; // Default neutral score
    
    // Apply weights to each factor (can be adjusted)
    const weights = {
      interest: 0.4,
      demographic: 0.3,
      location: 0.2, 
      behavioral: 0.1
    };
    
    // Calculate weighted score
    return (
      (interestScore * weights.interest) + 
      (demographicScore * weights.demographic) + 
      (locationScore * weights.location) + 
      (behavioralScore * weights.behavioral)
    );
  }
}
