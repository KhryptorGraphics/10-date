/**
 * UpgradePrompt Component
 * 
 * A component that displays a prompt for users to upgrade their subscription
 * when they attempt to access premium features without the required tier.
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { SubscriptionTier } from '../types/subscription';

interface UpgradePromptProps {
  tier: SubscriptionTier;
}

/**
 * Displays an upgrade prompt when users try to access premium features
 * without the required subscription tier.
 */
const UpgradePrompt: React.FC<UpgradePromptProps> = ({ tier }) => {
  // Function to handle the upgrade button press
  const handleUpgrade = () => {
    // This would navigate to the subscription screen
    // Navigation will be implemented later
    console.log(`Upgrading to ${tier} tier`);
  };

  // Get tier-specific messaging
  const getTierMessage = () => {
    switch (tier) {
      case SubscriptionTier.BASIC:
        return {
          title: 'Basic Tier Required',
          description: 'Upgrade to our Basic plan to unlock this feature and more!',
          price: 'Starting at $4.99/month',
          features: ['Unlimited swipes', 'Basic matching algorithm', 'Standard support']
        };
      case SubscriptionTier.PREMIUM:
        return {
          title: 'Premium Tier Required',
          description: 'Upgrade to our Premium plan to access this exclusive feature!',
          price: 'Starting at $9.99/month',
          features: [
            'Unlimited swipes',
            'See who liked you',
            'Rewind last swipe',
            '5 Super Likes per day',
            '1 Profile Boost per month'
          ]
        };
      case SubscriptionTier.VIP:
        return {
          title: 'VIP Tier Required',
          description: 'Upgrade to our VIP tier for our most exclusive features!',
          price: 'Starting at $19.99/month',
          features: [
            'All Premium features',
            'Unlimited Super Likes',
            '3 Profile Boosts per month',
            'Incognito mode',
            'VIP badge'
          ]
        };
      default:
        return {
          title: 'Subscription Required',
          description: 'Please upgrade your subscription to use this feature.',
          price: 'See pricing options',
          features: []
        };
    }
  };

  const tierMessage = getTierMessage();

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.title}>{tierMessage.title}</Text>
        <Text style={styles.description}>{tierMessage.description}</Text>
        
        <View style={styles.priceContainer}>
          <Text style={styles.price}>{tierMessage.price}</Text>
        </View>
        
        <View style={styles.featuresContainer}>
          <Text style={styles.featuresTitle}>Included Features:</Text>
          {tierMessage.features.map((feature, index) => (
            <Text key={index} style={styles.featureItem}>• {feature}</Text>
          ))}
        </View>
        
        <TouchableOpacity style={styles.button} onPress={handleUpgrade}>
          <Text style={styles.buttonText}>Upgrade Now</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: 'rgba(0,0,0,0.05)'
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    width: '100%',
    maxWidth: 400,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#FF006E',
    marginBottom: 10,
    textAlign: 'center',
  },
  description: {
    fontSize: 16,
    color: '#333',
    marginBottom: 20,
    textAlign: 'center',
  },
  priceContainer: {
    backgroundColor: '#F5F5F5',
    padding: 10,
    borderRadius: 5,
    marginBottom: 20,
  },
  price: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
  },
  featuresContainer: {
    marginBottom: 20,
  },
  featuresTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#333',
  },
  featureItem: {
    fontSize: 14,
    color: '#555',
    marginBottom: 5,
    paddingLeft: 5,
  },
  button: {
    backgroundColor: '#FF006E',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default UpgradePrompt;
