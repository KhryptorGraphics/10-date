import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { Card, Button, Icon } from 'react-native-elements';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { StackParamList } from '../../../types/navigation';
import { createButtonAccessibilityProps, createHeaderAccessibilityProps } from '../../../utils/accessibility';
import privacyAnalyticsService from '../../../services/privacy-analytics.service';

type RightsNavigationProp = StackNavigationProp<StackParamList>;

// Rights data interface
interface PrivacyRight {
  id: string;
  title: string;
  description: string;
  relatedScreen?: keyof StackParamList;
  learnMoreUrl?: string;
  expanded?: boolean;
}

/**
 * RightsTabContent Component
 * 
 * This component displays information about user privacy rights with optimized rendering
 * and accessibility features.
 */
const RightsTabContent: React.FC = () => {
  const navigation = useNavigation<RightsNavigationProp>();
  
  // Track screen view
  React.useEffect(() => {
    privacyAnalyticsService.trackScreenView('PrivacyInformation', 'Rights');
  }, []);
  
  // Privacy rights data
  const [rights, setRights] = useState<PrivacyRight[]>([
    {
      id: 'right-access',
      title: 'Right to Access',
      description: 'You have the right to access and view the personal data we hold about you. You can access most of your data through the Data Access section in the Privacy Center.',
      relatedScreen: 'DataAccess',
    },
    {
      id: 'right-rectification',
      title: 'Right to Rectification',
      description: 'You have the right to correct inaccurate or incomplete personal data. You can update most of your profile information directly in the app.',
      relatedScreen: 'EditProfile',
    },
    {
      id: 'right-erasure',
      title: 'Right to Erasure',
      description: 'You have the right to request the deletion of your personal data. You can delete your account and associated data through the Account Management section in the Privacy Center.',
      relatedScreen: 'AccountManagement',
    },
    {
      id: 'right-portability',
      title: 'Right to Data Portability',
      description: 'You have the right to receive your personal data in a structured, commonly used, and machine-readable format. You can export your data through the Data Access section in the Privacy Center.',
      relatedScreen: 'DataAccess',
    },
    {
      id: 'right-object',
      title: 'Right to Object',
      description: 'You have the right to object to the processing of your personal data for certain purposes, such as direct marketing. You can manage your consent preferences through the Consent Management section in the Privacy Center.',
      relatedScreen: 'ConsentManagement',
    },
    {
      id: 'right-restrict',
      title: 'Right to Restrict Processing',
      description: 'You have the right to request the restriction of processing of your personal data in certain circumstances. You can manage your consent preferences through the Consent Management section in the Privacy Center.',
      relatedScreen: 'ConsentManagement',
    },
    {
      id: 'right-withdraw',
      title: 'Right to Withdraw Consent',
      description: 'You have the right to withdraw your consent at any time for data processing activities based on consent. You can manage your consent preferences through the Consent Management section in the Privacy Center.',
      relatedScreen: 'ConsentManagement',
    },
    {
      id: 'right-complaint',
      title: 'Right to Lodge a Complaint',
      description: 'You have the right to lodge a complaint with a supervisory authority if you believe that our processing of your personal data infringes data protection laws. We encourage you to contact us first so we can address your concerns.',
      relatedScreen: 'Contact',
    },
  ]);
  
  // Toggle right expansion
  const toggleExpand = (id: string) => {
    setRights(
      rights.map((right) =>
        right.id === id ? { ...right, expanded: !right.expanded } : right
      )
    );
    
    // Track expansion in analytics
    const right = rights.find(r => r.id === id);
    if (right) {
      privacyAnalyticsService.trackScreenView('PrivacyRight', right.title);
    }
  };
  
  // Navigate to related screen
  const navigateToRelatedScreen = (screenName?: keyof StackParamList) => {
    if (screenName) {
      navigation.navigate(screenName);
    }
  };
  
  return (
    <ScrollView 
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      {...createHeaderAccessibilityProps('Your Privacy Rights')}
    >
      <Text style={styles.title}>Your Privacy Rights</Text>
      
      <Text style={styles.subtitle}>
        As a 10-Date user, you have various privacy rights regarding your personal data. 
        These rights may vary depending on your location and applicable data protection laws.
      </Text>
      
      {rights.map((right) => (
        <Card 
          key={right.id} 
          containerStyle={styles.card}
        >
          <TouchableOpacity
            onPress={() => toggleExpand(right.id)}
            {...createButtonAccessibilityProps(
              `${right.title}, ${right.expanded ? 'expanded' : 'collapsed'}`,
              'Double tap to expand or collapse this section'
            )}
          >
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>{right.title}</Text>
              <Icon
                name={right.expanded ? 'chevron-up' : 'chevron-down'}
                type="feather"
                size={20}
                color="#666"
              />
            </View>
          </TouchableOpacity>
          
          {right.expanded && (
            <View style={styles.cardContent}>
              <Text style={styles.cardDescription}>{right.description}</Text>
              
              {right.relatedScreen && (
                <Button
                  title={`Go to ${right.relatedScreen.replace(/([A-Z])/g, ' $1').trim()}`}
                  type="outline"
                  buttonStyle={styles.actionButton}
                  titleStyle={styles.actionButtonText}
                  icon={
                    <Icon
                      name="arrow-right"
                      type="feather"
                      size={16}
                      color="#FF006E"
                      style={styles.buttonIcon}
                    />
                  }
                  iconRight
                  onPress={() => navigateToRelatedScreen(right.relatedScreen)}
                  {...createButtonAccessibilityProps(
                    `Go to ${right.relatedScreen.replace(/([A-Z])/g, ' $1').trim()}`,
                    `Navigate to the ${right.relatedScreen.replace(/([A-Z])/g, ' $1').trim()} screen`
                  )}
                />
              )}
              
              {right.learnMoreUrl && (
                <Button
                  title="Learn More"
                  type="clear"
                  buttonStyle={styles.learnMoreButton}
                  titleStyle={styles.learnMoreButtonText}
                  icon={
                    <Icon
                      name="external-link"
                      type="feather"
                      size={16}
                      color="#2196F3"
                      style={styles.buttonIcon}
                    />
                  }
                  iconRight
                  onPress={() => {
                    // In a real app, this would open the URL
                    console.log('Open URL:', right.learnMoreUrl);
                  }}
                  {...createButtonAccessibilityProps(
                    'Learn More',
                    'Opens external resource with more information'
                  )}
                />
              )}
            </View>
          )}
        </Card>
      ))}
      
      <View style={styles.footer}>
        <Text style={styles.footerText}>
          For more information about your privacy rights, please refer to our Privacy Policy or contact our Data Protection Officer.
        </Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 30,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 20,
    lineHeight: 22,
  },
  card: {
    borderRadius: 10,
    marginBottom: 16,
    padding: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
  },
  cardContent: {
    marginTop: 12,
  },
  cardDescription: {
    fontSize: 16,
    color: '#555',
    marginBottom: 16,
    lineHeight: 22,
  },
  actionButton: {
    borderColor: '#FF006E',
    borderRadius: 8,
    marginBottom: 8,
  },
  actionButtonText: {
    color: '#FF006E',
  },
  learnMoreButton: {
    padding: 0,
    marginTop: 8,
  },
  learnMoreButtonText: {
    color: '#2196F3',
  },
  buttonIcon: {
    marginLeft: 8,
  },
  footer: {
    marginTop: 16,
  },
  footerText: {
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
    textAlign: 'center',
  },
});

export default RightsTabContent;