/**
 * Subscription related types for the 10-Date application
 */

/**
 * Available subscription tiers
 */
export enum SubscriptionTier {
  FREE = 'FREE',       // Default free tier
  BASIC = 'BASIC',     // Basic paid tier
  PREMIUM = 'PREMIUM', // Premium tier with most features
  VIP = 'VIP'          // VIP tier with all features
}

/**
 * Subscription period/interval
 */
export enum SubscriptionPeriod {
  MONTHLY = 'MONTHLY',
  QUARTERLY = 'QUARTERLY',
  YEARLY = 'YEARLY'
}

/**
 * Pricing information for a subscription plan
 */
export interface SubscriptionPrice {
  amount: number;
  currency: string;
  period: SubscriptionPeriod;
  discountPercent?: number;
}

/**
 * Features included in a subscription tier
 */
export interface SubscriptionFeatures {
  unlimited_swipes: boolean;
  see_who_liked_you: boolean;
  super_likes: number;
  profile_boosts: number;
  rewind_last_swipe: boolean;
  advanced_filters: boolean;
  enhanced_profile: boolean;
  ad_free: boolean;
  increased_visibility: boolean;
  video_chat: boolean;
  travel_mode: boolean;
}

/**
 * Subscription plan details
 */
export interface SubscriptionPlan {
  id: string;
  tier: SubscriptionTier;
  name: string;
  description: string;
  features: SubscriptionFeatures;
  pricing: SubscriptionPrice[];
  popular?: boolean;
}

/**
 * User's active subscription
 */
export interface UserSubscription {
  id: string;
  tier: SubscriptionTier;
  startDate: string;
  endDate: string;
  autoRenew: boolean;
  paymentMethod: string;
  price: SubscriptionPrice;
  features: SubscriptionFeatures;
}

/**
 * Available in-app purchase products from App Store/Google Play
 */
export interface IAPProduct {
  productId: string;
  title: string;
  description: string;
  price: number;
  currency: string;
  localizedPrice: string;
  subscriptionPeriod?: SubscriptionPeriod;
  tier: SubscriptionTier;
}
