/**
 * Subscription Screen
 * 
 * Displays available subscription plans with features and pricing.
 * Handles subscription purchase flow through in-app purchases.
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Image,
  Platform,
} from 'react-native';
import { useAppSelector, useAppDispatch } from '../../store';
import { 
  useFetchSubscriptionPlansQuery,
  usePurchaseSubscriptionMutation
} from '../../store/api';
import { SubscriptionScreenProps } from '../../types/navigation';
import { SubscriptionPlan } from '../../types/subscription';
import { primaryColors, neutralColors, spacing, typography, shadows } from '../../theme';
import { Ionicons } from '@expo/vector-icons';

// Feature check component
const FeatureItem = ({ text, included }: { text: string, included: boolean }) => (
  <View style={styles.featureItem}>
    <Ionicons
      name={included ? 'checkmark-circle' : 'close-circle'}
      size={20}
      color={included ? primaryColors.success : neutralColors.gray400}
      style={styles.featureIcon}
    />
    <Text style={[
      styles.featureText,
      !included && styles.featureTextDisabled
    ]}>
      {text}
    </Text>
  </View>
);

const SubscriptionScreen: React.FC<SubscriptionScreenProps> = ({ navigation }) => {
  // State
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [isProcessingPurchase, setIsProcessingPurchase] = useState(false);
  
  // Get Redux state
  const { user, isAuthenticated } = useAppSelector(state => state.auth);
  const dispatch = useAppDispatch();
  
  // Fetch subscription plans
  const { 
    data: subscriptionPlans,
    isLoading: isLoadingPlans,
    isError: isErrorFetchingPlans,
    refetch: refetchPlans
  } = useFetchSubscriptionPlansQuery();
  
  // Purchase subscription mutation
  const [
    purchaseSubscription,
    { isLoading: isPurchasing, isError: isPurchaseError }
  ] = usePurchaseSubscriptionMutation();
  
  // Set navigation options
  useEffect(() => {
    navigation.setOptions({
      headerTitle: 'Premium Subscription',
    });
  }, [navigation]);
  
  // Handle plan selection
  const handleSelectPlan = (planId: string) => {
    setSelectedPlan(planId);
  };
  
  // Handle subscription purchase
  const handlePurchase = async () => {
    if (!selectedPlan) {
      Alert.alert('Error', 'Please select a subscription plan');
      return;
    }
    
    if (!isAuthenticated) {
      Alert.alert(
        'Login Required',
        'You need to be logged in to purchase a subscription',
        [
          { text: 'Cancel', style: 'cancel' },
          { 
            text: 'Log In', 
            onPress: () => navigation.navigate('Login', { returnTo: 'Subscription' }) 
          }
        ]
      );
      return;
    }
    
    try {
      setIsProcessingPurchase(true);
      
      const result = await purchaseSubscription({
        planId: selectedPlan,
        userId: user?.id || '',
        platform: Platform.OS,
      }).unwrap();
      
      if (result.success) {
        Alert.alert(
          'Subscription Successful',
          'Thank you for subscribing to 10-Date Premium!',
          [{ text: 'OK', onPress: () => navigation.navigate('Profile') }]
        );
      } else {
        Alert.alert('Error', result.message || 'Failed to purchase subscription');
      }
    } catch (error) {
      console.error('Purchase error:', error);
      Alert.alert(
        'Purchase Failed', 
        'Unable to complete your purchase. Please try again later.'
      );
    } finally {
      setIsProcessingPurchase(false);
    }
  };
  
  // Render loading state
  if (isLoadingPlans) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={primaryColors.primary} />
        <Text style={styles.loadingText}>Loading subscription plans...</Text>
      </View>
    );
  }
  
  // Render error state
  if (isErrorFetchingPlans) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="alert-circle" size={70} color={primaryColors.error} />
        <Text style={styles.errorTitle}>Couldn't Load Plans</Text>
        <Text style={styles.errorText}>
          We're having trouble loading subscription plans. Please try again later.
        </Text>
        <TouchableOpacity style={styles.retryButton} onPress={refetchPlans}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }
  
  // Find the current subscription if user has one
  const currentSubscription = user?.subscription?.planId || null;
  
  return (
    <ScrollView style={styles.container}>
      {/* Header section */}
      <View style={styles.headerSection}>
        <Text style={styles.headerTitle}>Upgrade to Premium</Text>
        <Text style={styles.headerDescription}>
          Unlock all premium features and enhance your dating experience.
        </Text>
        
        <Image
          source={require('../../assets/premium-banner.png')}
          style={styles.headerImage}
          resizeMode="contain"
        />
      </View>
      
      {/* Plans section */}
      <View style={styles.plansContainer}>
        {subscriptionPlans?.map((plan) => {
          const isCurrentPlan = currentSubscription === plan.id;
          const isSelected = selectedPlan === plan.id;
          
          return (
            <TouchableOpacity
              key={plan.id}
              style={[
                styles.planCard,
                isSelected && styles.selectedPlanCard,
                isCurrentPlan && styles.currentPlanCard,
              ]}
              onPress={() => handleSelectPlan(plan.id)}
              disabled={isCurrentPlan}
            >
              {plan.isPopular && (
                <View style={styles.popularBadge}>
                  <Text style={styles.popularBadgeText}>POPULAR</Text>
                </View>
              )}
              
              <Text style={styles.planTitle}>{plan.name}</Text>
              <Text style={styles.planPrice}>
                ${plan.price.toFixed(2)}
                <Text style={styles.planPeriod}>/{plan.billingPeriod}</Text>
              </Text>
              
              {isCurrentPlan && (
                <View style={styles.currentPlanBadge}>
                  <Text style={styles.currentPlanText}>CURRENT PLAN</Text>
                </View>
              )}
              
              <View style={styles.planFeaturesContainer}>
                {plan.features.map((feature, index) => (
                  <FeatureItem 
                    key={index} 
                    text={feature.name} 
                    included={feature.included} 
                  />
                ))}
              </View>
              
              {!isCurrentPlan && (
                <TouchableOpacity
                  style={[
                    styles.selectButton,
                    isSelected && styles.selectedButton,
                  ]}
                  onPress={() => handleSelectPlan(plan.id)}
                >
                  <Text style={[
                    styles.selectButtonText,
                    isSelected && styles.selectedButtonText,
                  ]}>
                    {isSelected ? 'Selected' : 'Select'}
                  </Text>
                </TouchableOpacity>
              )}
            </TouchableOpacity>
          );
        })}
      </View>
      
      {/* Benefits section */}
      <View style={styles.benefitsSection}>
        <Text style={styles.sectionTitle}>Premium Benefits</Text>
        
        <View style={styles.benefitItem}>
          <Ionicons name="infinite" size={24} color={primaryColors.primary} />
          <View style={styles.benefitTextContainer}>
            <Text style={styles.benefitTitle}>Unlimited Swipes</Text>
            <Text style={styles.benefitDescription}>
              Never run out of potential matches with unlimited swipes
            </Text>
          </View>
        </View>
        
        <View style={styles.benefitItem}>
          <Ionicons name="eye" size={24} color={primaryColors.primary} />
          <View style={styles.benefitTextContainer}>
            <Text style={styles.benefitTitle}>See Who Liked You</Text>
            <Text style={styles.benefitDescription}>
              View profiles of people who have already liked you
            </Text>
          </View>
        </View>
        
        <View style={styles.benefitItem}>
          <Ionicons name="star" size={24} color={primaryColors.primary} />
          <View style={styles.benefitTextContainer}>
            <Text style={styles.benefitTitle}>Super Likes</Text>
            <Text style={styles.benefitDescription}>
              Stand out from the crowd with Super Likes
            </Text>
          </View>
        </View>
        
        <View style={styles.benefitItem}>
          <Ionicons name="rocket" size={24} color={primaryColors.primary} />
          <View style={styles.benefitTextContainer}>
            <Text style={styles.benefitTitle}>Profile Boost</Text>
            <Text style={styles.benefitDescription}>
              Get seen by more people with regularly scheduled profile boosts
            </Text>
          </View>
        </View>
      </View>
      
      {/* Purchase button */}
      <View style={styles.purchaseContainer}>
        <TouchableOpacity
          style={[
            styles.purchaseButton,
            (!selectedPlan || isProcessingPurchase) && styles.disabledButton,
            currentSubscription && styles.disabledButton,
          ]}
          onPress={handlePurchase}
          disabled={!selectedPlan || isProcessingPurchase || !!currentSubscription}
        >
          {isProcessingPurchase ? (
            <ActivityIndicator size="small" color={neutralColors.white} />
          ) : (
            <Text style={styles.purchaseButtonText}>
              {currentSubscription 
                ? 'Already Subscribed' 
                : 'Subscribe Now'}
            </Text>
          )}
        </TouchableOpacity>
        
        <Text style={styles.termsText}>
          By subscribing, you agree to our{' '}
          <Text style={styles.termsLink}>Terms of Service</Text> and{' '}
          <Text style={styles.termsLink}>Privacy Policy</Text>. Subscriptions automatically renew unless auto-renew is turned off at least 24 hours before the end of the current period.
        </Text>
      </View>
      
      {/* Restore purchases button */}
      <TouchableOpacity style={styles.restoreContainer}>
        <Text style={styles.restoreText}>Restore Purchases</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: neutralColors.white,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  loadingText: {
    marginTop: spacing.md,
    fontSize: typography.fontSize.md,
    color: neutralColors.gray700,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  errorTitle: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    color: neutralColors.gray900,
    marginTop: spacing.md,
    marginBottom: spacing.sm,
  },
  errorText: {
    fontSize: typography.fontSize.md,
    color: neutralColors.gray700,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  retryButton: {
    backgroundColor: primaryColors.primary,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.xl,
    borderRadius: 25,
  },
  retryButtonText: {
    color: neutralColors.white,
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.medium,
  },
  headerSection: {
    padding: spacing.lg,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: neutralColors.gray200,
  },
  headerTitle: {
    fontSize: typography.fontSize.xxl,
    fontWeight: typography.fontWeight.bold,
    color: neutralColors.gray900,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  headerDescription: {
    fontSize: typography.fontSize.md,
    color: neutralColors.gray700,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  headerImage: {
    width: '100%',
    height: 180,
    marginVertical: spacing.md,
  },
  plansContainer: {
    padding: spacing.lg,
  },
  planCard: {
    backgroundColor: neutralColors.white,
    borderRadius: 12,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    ...shadows.md,
    borderWidth: 1,
    borderColor: neutralColors.gray200,
  },
  selectedPlanCard: {
    borderColor: primaryColors.primary,
    borderWidth: 2,
  },
  currentPlanCard: {
    borderColor: primaryColors.success,
    borderWidth: 2,
    opacity: 0.8,
  },
  popularBadge: {
    position: 'absolute',
    top: -10,
    right: spacing.lg,
    backgroundColor: primaryColors.secondary,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs / 2,
    borderRadius: 12,
  },
  popularBadgeText: {
    color: neutralColors.white,
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.bold,
  },
  currentPlanBadge: {
    backgroundColor: primaryColors.success,
    padding: spacing.xs,
    borderRadius: 4,
    alignSelf: 'flex-start',
    marginTop: spacing.sm,
  },
  currentPlanText: {
    color: neutralColors.white,
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.bold,
  },
  planTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: neutralColors.gray900,
    marginBottom: spacing.xs,
  },
  planPrice: {
    fontSize: typography.fontSize.xxl,
    fontWeight: typography.fontWeight.bold,
    color: primaryColors.primary,
    marginBottom: spacing.md,
  },
  planPeriod: {
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.regular,
    color: neutralColors.gray700,
  },
  planFeaturesContainer: {
    marginBottom: spacing.md,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  featureIcon: {
    marginRight: spacing.sm,
  },
  featureText: {
    fontSize: typography.fontSize.md,
    color: neutralColors.gray800,
  },
  featureTextDisabled: {
    color: neutralColors.gray500,
  },
  selectButton: {
    borderWidth: 1,
    borderColor: primaryColors.primary,
    borderRadius: 25,
    paddingVertical: spacing.sm,
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  selectedButton: {
    backgroundColor: primaryColors.primary,
  },
  selectButtonText: {
    color: primaryColors.primary,
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.medium,
  },
  selectedButtonText: {
    color: neutralColors.white,
  },
  benefitsSection: {
    padding: spacing.lg,
    backgroundColor: neutralColors.gray100,
  },
  sectionTitle: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    color: neutralColors.gray900,
    marginBottom: spacing.lg,
  },
  benefitItem: {
    flexDirection: 'row',
    marginBottom: spacing.md,
  },
  benefitTextContainer: {
    marginLeft: spacing.md,
    flex: 1,
  },
  benefitTitle: {
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.bold,
    color: neutralColors.gray900,
    marginBottom: spacing.xs / 2,
  },
  benefitDescription: {
    fontSize: typography.fontSize.sm,
    color: neutralColors.gray700,
  },
  purchaseContainer: {
    padding: spacing.lg,
    alignItems: 'center',
  },
  purchaseButton: {
    backgroundColor: primaryColors.primary,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    borderRadius: 25,
    width: '100%',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  disabledButton: {
    backgroundColor: neutralColors.gray400,
  },
  purchaseButtonText: {
    color: neutralColors.white,
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.bold,
  },
  termsText: {
    fontSize: typography.fontSize.xs,
    color: neutralColors.gray600,
    textAlign: 'center',
    marginHorizontal: spacing.md,
  },
  termsLink: {
    color: primaryColors.primary,
  },
  restoreContainer: {
    alignItems: 'center',
    paddingVertical: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: neutralColors.gray200,
  },
  restoreText: {
    color: primaryColors.primary,
    fontSize: typography.fontSize.md,
  },
});

export default SubscriptionScreen;
