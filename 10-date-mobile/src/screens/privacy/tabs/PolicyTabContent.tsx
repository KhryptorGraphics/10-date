import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
} from 'react-native';

/**
 * PolicyTabContent Component
 * 
 * This component displays the Privacy Policy content with lazy loading and pagination.
 * It improves performance by loading content in chunks rather than all at once.
 */
const PolicyTabContent: React.FC = () => {
  // State for loading status
  const [loading, setLoading] = useState<boolean>(true);
  // State for policy sections
  const [sections, setSections] = useState<Array<{title: string, content: string}>>([]);
  // State for current page
  const [currentPage, setCurrentPage] = useState<number>(1);
  // State for total pages
  const [totalPages, setTotalPages] = useState<number>(1);
  // State for error
  const [error, setError] = useState<string | null>(null);

  // Mock API function to fetch policy content
  const fetchPolicyContent = async (page: number): Promise<{
    sections: Array<{title: string, content: string}>,
    totalPages: number
  }> => {
    // Simulate API call
    return new Promise((resolve) => {
      setTimeout(() => {
        // Mock data based on page number
        if (page === 1) {
          resolve({
            sections: [
              {
                title: '1. Information We Collect',
                content: 'We collect various types of information from and about users of our Services, including:\n\n• Personal Information: Name, email address, phone number, date of birth, gender, sexual orientation, photos, and other information you provide in your profile.\n\n• Location Information: With your consent, we collect your precise or approximate location to provide location-based services.\n\n• Usage Information: Information about how you use our Services, including your interactions with other users, features you use, and content you view.\n\n• Device Information: Information about your device, such as IP address, device ID, device type, operating system, and browser type.\n\n• Communications: Information you provide when you communicate with us or other users through our Services.'
              },
              {
                title: '2. How We Use Your Information',
                content: 'We use the information we collect to:\n\n• Provide, maintain, and improve our Services\n\n• Match you with potential partners based on your preferences and location\n\n• Personalize your experience and provide content and features relevant to you\n\n• Communicate with you about our Services, including updates, promotions, and support\n\n• Ensure the safety, security, and integrity of our Services\n\n• Comply with legal obligations and enforce our terms and policies'
              }
            ],
            totalPages: 3
          });
        } else if (page === 2) {
          resolve({
            sections: [
              {
                title: '3. How We Share Your Information',
                content: 'We may share your information with:\n\n• Other users, as necessary to provide our Services\n\n• Service providers who perform services on our behalf\n\n• Business partners and affiliates who help us provide and improve our Services\n\n• Law enforcement or other third parties, when required by law or to protect our rights'
              },
              {
                title: '4. Your Choices and Rights',
                content: 'You have various choices and rights regarding your personal information, including:\n\n• Accessing, correcting, or deleting your information\n\n• Opting out of marketing communications\n\n• Controlling location sharing and other privacy settings\n\n• Requesting a copy of your personal information\n\n• Withdrawing consent for certain processing activities\n\nYou can exercise most of these rights through the Privacy Center in our app. For more information, please contact us at privacy@10date.com.'
              }
            ],
            totalPages: 3
          });
        } else if (page === 3) {
          resolve({
            sections: [
              {
                title: '5. Data Security',
                content: 'We implement appropriate technical and organizational measures to protect your personal information from unauthorized access, disclosure, alteration, and destruction. However, no method of transmission over the Internet or electronic storage is 100% secure, so we cannot guarantee absolute security.'
              },
              {
                title: '6. International Data Transfers',
                content: 'Your information may be transferred to, and processed in, countries other than the country in which you reside. These countries may have data protection laws that are different from the laws of your country. We take appropriate safeguards to ensure that your personal information remains protected in accordance with this Privacy Policy.'
              },
              {
                title: '7. Changes to This Privacy Policy',
                content: 'We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the "Last Updated" date. You are advised to review this Privacy Policy periodically for any changes.'
              },
              {
                title: '8. Contact Us',
                content: 'If you have any questions about this Privacy Policy, please contact our Data Protection Officer at privacy@10date.com.'
              }
            ],
            totalPages: 3
          });
        } else {
          resolve({
            sections: [],
            totalPages: 3
          });
        }
      }, 500); // Simulate network delay
    });
  };

  // Load policy content on component mount and when page changes
  useEffect(() => {
    const loadContent = async () => {
      try {
        setLoading(true);
        const data = await fetchPolicyContent(currentPage);
        setSections(prevSections => 
          currentPage === 1 ? data.sections : [...prevSections, ...data.sections]
        );
        setTotalPages(data.totalPages);
        setError(null);
      } catch (err) {
        setError('Failed to load privacy policy content. Please try again later.');
        console.error('Error loading policy content:', err);
      } finally {
        setLoading(false);
      }
    };

    loadContent();
  }, [currentPage]);

  // Handle load more
  const handleLoadMore = () => {
    if (currentPage < totalPages && !loading) {
      setCurrentPage(currentPage + 1);
    }
  };

  // Render loading indicator
  if (loading && currentPage === 1) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FF006E" />
        <Text style={styles.loadingText}>Loading Privacy Policy...</Text>
      </View>
    );
  }

  // Render error message
  if (error && sections.length === 0) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  return (
    <ScrollView 
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      onScroll={({ nativeEvent }) => {
        // Check if user has scrolled to the bottom
        const { layoutMeasurement, contentOffset, contentSize } = nativeEvent;
        const paddingToBottom = 20;
        const isCloseToBottom = layoutMeasurement.height + contentOffset.y >= 
          contentSize.height - paddingToBottom;
        
        if (isCloseToBottom && !loading && currentPage < totalPages) {
          handleLoadMore();
        }
      }}
      scrollEventThrottle={400} // Throttle scroll events
    >
      <Text style={styles.title}>Privacy Policy</Text>
      <Text style={styles.lastUpdated}>Last Updated: April 1, 2025</Text>
      
      <Text style={styles.introText}>
        This Privacy Policy describes how 10-Date ("we," "us," or "our") collects, uses, and shares your personal information when you use our mobile application and related services (collectively, the "Services").
      </Text>
      
      {sections.map((section, index) => (
        <View key={`section-${index}`} style={styles.section}>
          <Text style={styles.sectionTitle}>{section.title}</Text>
          <Text style={styles.sectionContent}>{section.content}</Text>
        </View>
      ))}
      
      {loading && currentPage > 1 && (
        <View style={styles.loadingMoreContainer}>
          <ActivityIndicator size="small" color="#FF006E" />
          <Text style={styles.loadingMoreText}>Loading more...</Text>
        </View>
      )}
      
      {currentPage < totalPages && !loading && (
        <Text 
          style={styles.loadMoreButton}
          onPress={handleLoadMore}
        >
          Load More
        </Text>
      )}
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: '#F44336',
    textAlign: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  lastUpdated: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
    fontStyle: 'italic',
  },
  introText: {
    fontSize: 16,
    color: '#333',
    marginBottom: 24,
    lineHeight: 24,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  sectionContent: {
    fontSize: 16,
    color: '#333',
    lineHeight: 24,
  },
  loadingMoreContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  loadingMoreText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#666',
  },
  loadMoreButton: {
    textAlign: 'center',
    color: '#FF006E',
    fontSize: 16,
    fontWeight: '600',
    padding: 12,
    marginTop: 8,
  },
});

export default PolicyTabContent;