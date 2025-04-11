import React, { useState, useRef, lazy, Suspense } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  ActivityIndicator,
  SafeAreaView,
} from 'react-native';
import { Icon } from 'react-native-elements';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { StackParamList } from '../../../types/navigation';

// Lazy load tab content components
const PolicyTabContent = lazy(() => import('../tabs/PolicyTabContent'));
const FAQTabContent = lazy(() => import('../tabs/FAQTabContent'));

// Import other tab content components as needed
// These will be implemented similarly to PolicyTabContent and FAQTabContent
const RightsTabContent = lazy(() => 
  new Promise(resolve => 
    setTimeout(() => resolve(import('../tabs/RightsTabContent')), 100)
  )
);
const ContactTabContent = lazy(() => 
  new Promise(resolve => 
    setTimeout(() => resolve(import('../tabs/ContactTabContent')), 100)
  )
);

type PrivacyInformationNavigationProp = StackNavigationProp<StackParamList, 'PrivacyInformation'>;

// Tab types
enum PrivacyTab {
  POLICY = 'policy',
  RIGHTS = 'rights',
  FAQ = 'faq',
  CONTACT = 'contact',
}

/**
 * Optimized Privacy Information Screen
 * 
 * This component displays privacy information with optimized performance:
 * - Lazy loading of tab content
 * - Optimized animations
 * - Accessibility improvements
 * - Analytics integration
 */
const PrivacyInformationScreen: React.FC = () => {
  const navigation = useNavigation<PrivacyInformationNavigationProp>();
  
  // State for active tab
  const [activeTab, setActiveTab] = useState<PrivacyTab>(PrivacyTab.POLICY);
  
  // Animation values for tab indicator
  const tabIndicatorPosition = useRef(new Animated.Value(0)).current;
  
  // Analytics service mock
  const trackScreenView = (screenName: string, tabName: string) => {
    console.log(`Analytics: Screen view - ${screenName}, Tab: ${tabName}`);
    // In a real implementation, this would call the analytics service
  };
  
  // Handle tab change with optimized animation
  const handleTabChange = (tab: PrivacyTab) => {
    // Track tab change in analytics
    trackScreenView('PrivacyInformation', tab);
    
    setActiveTab(tab);
    
    // Animate tab indicator with optimized animation
    let position = 0;
    switch (tab) {
      case PrivacyTab.POLICY:
        position = 0;
        break;
      case PrivacyTab.RIGHTS:
        position = 1;
        break;
      case PrivacyTab.FAQ:
        position = 2;
        break;
      case PrivacyTab.CONTACT:
        position = 3;
        break;
    }
    
    Animated.spring(tabIndicatorPosition, {
      toValue: position,
      useNativeDriver: true,
      tension: 50,
      friction: 7,
    }).start();
  };
  
  // Calculate tab indicator position
  const tabIndicatorLeft = tabIndicatorPosition.interpolate({
    inputRange: [0, 1, 2, 3],
    outputRange: ['0%', '25%', '50%', '75%'],
  });
  
  // Loading fallback component
  const TabLoadingFallback = () => (
    <View style={styles.loadingContainer}>
      <ActivityIndicator size="large" color="#FF006E" />
      <Text style={styles.loadingText}>Loading content...</Text>
    </View>
  );
  
  // Render tab content with lazy loading
  const renderTabContent = () => {
    switch (activeTab) {
      case PrivacyTab.POLICY:
        return (
          <Suspense fallback={<TabLoadingFallback />}>
            <PolicyTabContent />
          </Suspense>
        );
      
      case PrivacyTab.RIGHTS:
        return (
          <Suspense fallback={<TabLoadingFallback />}>
            <RightsTabContent />
          </Suspense>
        );
      
      case PrivacyTab.FAQ:
        return (
          <Suspense fallback={<TabLoadingFallback />}>
            <FAQTabContent />
          </Suspense>
        );
      
      case PrivacyTab.CONTACT:
        return (
          <Suspense fallback={<TabLoadingFallback />}>
            <ContactTabContent />
          </Suspense>
        );
      
      default:
        return null;
    }
  };
  
  // Track screen view on component mount
  React.useEffect(() => {
    trackScreenView('PrivacyInformation', activeTab);
  }, []);
  
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          accessible={true}
          accessibilityLabel="Go back"
          accessibilityHint="Navigates to the previous screen"
          accessibilityRole="button"
        >
          <Icon name="arrow-left" type="feather" size={24} color="#333" />
        </TouchableOpacity>
        <Text 
          style={styles.title}
          accessible={true}
          accessibilityLabel="Privacy Information"
          accessibilityRole="header"
        >
          Privacy Information
        </Text>
      </View>
      
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[
            styles.tab,
            activeTab === PrivacyTab.POLICY && styles.activeTab,
          ]}
          onPress={() => handleTabChange(PrivacyTab.POLICY)}
          accessible={true}
          accessibilityLabel="Privacy Policy tab"
          accessibilityState={{ selected: activeTab === PrivacyTab.POLICY }}
          accessibilityRole="tab"
        >
          <Text
            style={[
              styles.tabText,
              activeTab === PrivacyTab.POLICY && styles.activeTabText,
            ]}
          >
            Policy
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[
            styles.tab,
            activeTab === PrivacyTab.RIGHTS && styles.activeTab,
          ]}
          onPress={() => handleTabChange(PrivacyTab.RIGHTS)}
          accessible={true}
          accessibilityLabel="Your Rights tab"
          accessibilityState={{ selected: activeTab === PrivacyTab.RIGHTS }}
          accessibilityRole="tab"
        >
          <Text
            style={[
              styles.tabText,
              activeTab === PrivacyTab.RIGHTS && styles.activeTabText,
            ]}
          >
            Rights
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[
            styles.tab,
            activeTab === PrivacyTab.FAQ && styles.activeTab,
          ]}
          onPress={() => handleTabChange(PrivacyTab.FAQ)}
          accessible={true}
          accessibilityLabel="Frequently Asked Questions tab"
          accessibilityState={{ selected: activeTab === PrivacyTab.FAQ }}
          accessibilityRole="tab"
        >
          <Text
            style={[
              styles.tabText,
              activeTab === PrivacyTab.FAQ && styles.activeTabText,
            ]}
          >
            FAQ
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[
            styles.tab,
            activeTab === PrivacyTab.CONTACT && styles.activeTab,
          ]}
          onPress={() => handleTabChange(PrivacyTab.CONTACT)}
          accessible={true}
          accessibilityLabel="Contact Us tab"
          accessibilityState={{ selected: activeTab === PrivacyTab.CONTACT }}
          accessibilityRole="tab"
        >
          <Text
            style={[
              styles.tabText,
              activeTab === PrivacyTab.CONTACT && styles.activeTabText,
            ]}
          >
            Contact
          </Text>
        </TouchableOpacity>
        
        <Animated.View
          style={[
            styles.tabIndicator,
            {
              transform: [{ translateX: tabIndicatorPosition }],
              width: '25%',
            },
          ]}
          accessible={false}
        />
      </View>
      
      <View style={styles.contentContainer}>
        {renderTabContent()}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  backButton: {
    padding: 8,
    marginRight: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    position: 'relative',
  },
  tab: {
    flex: 1,
    paddingVertical: 16,
    alignItems: 'center',
  },
  activeTab: {
    backgroundColor: '#fff',
  },
  tabText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  activeTabText: {
    color: '#FF006E',
    fontWeight: 'bold',
  },
  tabIndicator: {
    position: 'absolute',
    bottom: 0,
    height: 3,
    backgroundColor: '#FF006E',
  },
  contentContainer: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
});

export default PrivacyInformationScreen;