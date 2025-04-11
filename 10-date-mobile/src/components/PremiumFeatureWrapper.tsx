/**
 * Premium Feature Access Control Higher-Order Component
 * 
 * This component wraps other components to restrict access based on subscription tier.
 * If the user doesn't have the required subscription level, it shows an upgrade prompt.
 */

import React, { ComponentType } from 'react';
import { useSelector } from 'react-redux';
import { View, StyleSheet } from 'react-native';

import { SubscriptionTier } from '../types/subscription';
import UpgradePrompt from './UpgradePrompt';

// Types for the HOC props
interface PremiumFeatureProps {
  requiredTier: SubscriptionTier;
  fallback?: React.ReactNode;
}

// Types for Redux state (to be defined in the store)
interface RootState {
  user: {
    subscription?: {
      tier: SubscriptionTier;
    };
  };
}

/**
 * Higher-Order Component that restricts access to premium features
 * based on the user's subscription tier
 * 
 * @param Component The component to wrap
 * @param options Configuration options including required tier and fallback UI
 * @returns A wrapped component that checks subscription access
 */
export const withPremiumAccess = <P extends object>(
  Component: ComponentType<P>,
  { requiredTier, fallback }: PremiumFeatureProps
) => {
  // Return a new component that checks subscription status
  return (props: P) => {
    // Get user's subscription from Redux store
    const userSubscription = useSelector((state: RootState) => state.user.subscription);
    
    // Check if user has required subscription level
    const hasAccess = (
      // VIP tier has access to everything
      userSubscription?.tier === SubscriptionTier.VIP ||
      // Premium tier has access to Basic and Premium features
      (userSubscription?.tier === SubscriptionTier.PREMIUM && 
        requiredTier !== SubscriptionTier.VIP) ||
      // Basic tier only has access to Basic features
      (userSubscription?.tier === SubscriptionTier.BASIC && 
        requiredTier === SubscriptionTier.BASIC)
    );
    
    // Either render the requested component or the fallback UI
    if (hasAccess) {
      return <Component {...props} />;
    }
    
    // If no custom fallback is provided, use the default UpgradePrompt
    if (fallback) {
      return <>{fallback}</>;
    }
    
    return (
      <View style={styles.container}>
        <UpgradePrompt tier={requiredTier} />
      </View>
    );
  };
};

// Styles
const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
});

export default withPremiumAccess;
