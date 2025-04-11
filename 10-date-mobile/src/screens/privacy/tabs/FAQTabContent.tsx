import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { SearchBar, ListItem } from 'react-native-elements';
import { debounce } from 'lodash';

// FAQ item interface
interface FAQItem {
  id: string;
  question: string;
  answer: string;
  tags: string[];
  expanded?: boolean;
}

/**
 * FAQTabContent Component
 * 
 * This component displays FAQ items with search functionality and optimized rendering.
 * It uses FlatList with performance optimizations for smooth scrolling and interaction.
 */
const FAQTabContent: React.FC = () => {
  // State for FAQ data
  const [faqData, setFaqData] = useState<FAQItem[]>([]);
  // State for filtered FAQ data
  const [filteredFAQs, setFilteredFAQs] = useState<FAQItem[]>([]);
  // State for search query
  const [searchQuery, setSearchQuery] = useState<string>('');
  // State for loading status
  const [loading, setLoading] = useState<boolean>(true);
  // State for error
  const [error, setError] = useState<string | null>(null);

  // Mock API function to fetch FAQ data
  const fetchFAQData = async (): Promise<FAQItem[]> => {
    // Simulate API call
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve([
          {
            id: 'faq-1',
            question: 'What personal data does 10-Date collect?',
            answer: '10-Date collects various types of personal data, including profile information (name, age, gender, photos), location data, device information, usage data, and communication content. We only collect data that is necessary to provide and improve our services.',
            tags: ['data', 'collection', 'personal'],
          },
          {
            id: 'faq-2',
            question: 'How does 10-Date use my data?',
            answer: '10-Date uses your data to provide and improve our services, personalize your experience, match you with potential partners, communicate with you, ensure safety and security, and comply with legal obligations. We only use your data as described in our Privacy Policy and according to your consent preferences.',
            tags: ['data', 'usage', 'purpose'],
          },
          {
            id: 'faq-3',
            question: 'Does 10-Date share my data with third parties?',
            answer: '10-Date may share your data with service providers, partners, and affiliates who help us provide and improve our services. We only share data that is necessary for these purposes and require all third parties to respect your privacy and comply with applicable data protection laws. You can control third-party data sharing in your consent preferences.',
            tags: ['data', 'sharing', 'third-party'],
          },
          {
            id: 'faq-4',
            question: 'How can I access or export my data?',
            answer: 'You can access and export your data through the Data Access section in the Privacy Center. You can select which categories of data to include and choose from various export formats. Your data export will be processed and made available for download within 48 hours.',
            tags: ['data', 'access', 'export'],
          },
          {
            id: 'faq-5',
            question: 'How can I delete my account?',
            answer: 'You can delete your account through the Account Management section in the Privacy Center. You can choose to anonymize your account instead of deleting it, and select which data to delete. Account deletion is permanent and cannot be undone.',
            tags: ['account', 'deletion', 'anonymization'],
          },
          {
            id: 'faq-6',
            question: 'What are my privacy rights?',
            answer: 'As a user, you have various privacy rights, including the right to access, correct, delete, and export your data, the right to withdraw consent, the right to object to processing, and the right to lodge a complaint with a supervisory authority. You can exercise most of these rights through the Privacy Center.',
            tags: ['rights', 'privacy', 'gdpr', 'ccpa'],
          },
          {
            id: 'faq-7',
            question: 'How does 10-Date protect my data?',
            answer: '10-Date implements various technical and organizational measures to protect your data, including encryption, access controls, regular security assessments, and employee training. We continuously review and improve our security practices to ensure the highest level of protection for your data.',
            tags: ['security', 'protection', 'encryption'],
          },
          {
            id: 'faq-8',
            question: 'How long does 10-Date keep my data?',
            answer: '10-Date keeps your data for as long as necessary to provide our services and comply with legal obligations. The specific retention period depends on the type of data and the purpose for which it is processed. You can request deletion of your data at any time through the Privacy Center.',
            tags: ['retention', 'storage', 'period'],
          },
          {
            id: 'faq-9',
            question: 'What happens to my data if I delete my account?',
            answer: 'When you delete your account, your personal information is permanently removed from our systems. Depending on your choices during the deletion process, your messages, matches, payment history, and consent history may also be deleted. Some data may be retained for legal compliance purposes.',
            tags: ['deletion', 'account', 'removal'],
          },
          {
            id: 'faq-10',
            question: 'How can I contact 10-Date about privacy concerns?',
            answer: 'You can contact our Data Protection Officer at privacy@10date.com or through the Contact section in the Privacy Center. We take all privacy concerns seriously and will respond to your inquiry as soon as possible.',
            tags: ['contact', 'support', 'help'],
          },
          {
            id: 'faq-11',
            question: 'What is the difference between account deletion and anonymization?',
            answer: 'Account deletion permanently removes your account and selected data from our systems. Anonymization removes your personal information but keeps your activity history as anonymized data, which helps us improve our service without identifying you personally.',
            tags: ['deletion', 'anonymization', 'difference'],
          },
          {
            id: 'faq-12',
            question: 'Can I revoke my consent for data processing?',
            answer: 'Yes, you can revoke your consent for data processing at any time through the Consent Management section in the Privacy Center. Note that revoking consent may affect your ability to use certain features of the app.',
            tags: ['consent', 'revoke', 'processing'],
          },
          {
            id: 'faq-13',
            question: 'How do I report a privacy violation?',
            answer: 'If you believe there has been a violation of your privacy rights, please contact our Data Protection Officer at privacy@10date.com. Include details about the alleged violation, and we will investigate promptly.',
            tags: ['violation', 'report', 'rights'],
          },
          {
            id: 'faq-14',
            question: 'Does 10-Date use cookies or similar technologies?',
            answer: 'Yes, 10-Date uses cookies and similar technologies to enhance your experience, understand app usage, and personalize content. You can manage your preferences related to these technologies through your device settings.',
            tags: ['cookies', 'tracking', 'technologies'],
          },
          {
            id: 'faq-15',
            question: 'How does 10-Date handle data breaches?',
            answer: 'In the event of a data breach, 10-Date will notify affected users and relevant authorities as required by law. We will provide information about the breach, potential impacts, and steps we are taking to address the situation.',
            tags: ['breach', 'notification', 'security'],
          },
        ]);
      }, 800);
    });
  };

  // Load FAQ data on component mount
  useEffect(() => {
    const loadFAQData = async () => {
      try {
        setLoading(true);
        const data = await fetchFAQData();
        setFaqData(data);
        setFilteredFAQs(data);
        setError(null);
      } catch (err) {
        setError('Failed to load FAQ data. Please try again later.');
        console.error('Error loading FAQ data:', err);
      } finally {
        setLoading(false);
      }
    };

    loadFAQData();
  }, []);

  // Debounced search function
  const debouncedSearch = useCallback(
    debounce((text: string) => {
      if (!text.trim()) {
        setFilteredFAQs(faqData);
        return;
      }

      const query = text.toLowerCase();
      const filtered = faqData.filter(
        (item) =>
          item.question.toLowerCase().includes(query) ||
          item.answer.toLowerCase().includes(query) ||
          item.tags.some((tag) => tag.toLowerCase().includes(query))
      );

      setFilteredFAQs(filtered);
    }, 300),
    [faqData]
  );

  // Handle search input change
  const handleSearch = (text: string) => {
    setSearchQuery(text);
    debouncedSearch(text);
  };

  // Toggle FAQ item expansion
  const toggleExpand = (id: string) => {
    setFilteredFAQs(
      filteredFAQs.map((item) =>
        item.id === id ? { ...item, expanded: !item.expanded } : item
      )
    );
  };

  // Render FAQ item
  const renderFAQItem = useCallback(
    ({ item }: { item: FAQItem }) => (
      <ListItem
        containerStyle={styles.faqItem}
        onPress={() => toggleExpand(item.id)}
        accessible={true}
        accessibilityLabel={`FAQ: ${item.question}`}
        accessibilityHint={item.expanded ? "Double tap to collapse" : "Double tap to expand"}
        accessibilityRole="button"
      >
        <ListItem.Content>
          <ListItem.Title style={styles.faqQuestion}>
            {item.question}
          </ListItem.Title>
          
          {item.expanded && (
            <>
              <ListItem.Subtitle style={styles.faqAnswer}>
                {item.answer}
              </ListItem.Subtitle>
              
              <View style={styles.tagContainer}>
                {item.tags.map((tag, index) => (
                  <View key={index} style={styles.tag}>
                    <Text style={styles.tagText}>{tag}</Text>
                  </View>
                ))}
              </View>
            </>
          )}
          
          <TouchableOpacity 
            style={styles.expandButton}
            onPress={() => toggleExpand(item.id)}
            accessible={true}
            accessibilityLabel={item.expanded ? "Collapse" : "Expand"}
            accessibilityRole="button"
          >
            <Text style={styles.expandButtonText}>
              {item.expanded ? 'Show Less' : 'Show More'}
            </Text>
          </TouchableOpacity>
        </ListItem.Content>
      </ListItem>
    ),
    [filteredFAQs]
  );

  // Extract key for FlatList
  const keyExtractor = useCallback((item: FAQItem) => item.id, []);

  // Render empty state
  const renderEmptyState = () => {
    if (loading) {
      return (
        <View style={styles.emptyContainer}>
          <ActivityIndicator size="large" color="#FF006E" />
          <Text style={styles.emptyText}>Loading FAQs...</Text>
        </View>
      );
    }

    if (error) {
      return (
        <View style={styles.emptyContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      );
    }

    if (searchQuery && filteredFAQs.length === 0) {
      return (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>
            No results found for "{searchQuery}"
          </Text>
          <Text style={styles.emptySubtext}>
            Try using different keywords or browse all FAQs
          </Text>
          <TouchableOpacity
            style={styles.clearButton}
            onPress={() => handleSearch('')}
            accessible={true}
            accessibilityLabel="Clear search"
            accessibilityRole="button"
          >
            <Text style={styles.clearButtonText}>Clear Search</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return null;
  };

  return (
    <View style={styles.container}>
      <SearchBar
        placeholder="Search FAQs..."
        onChangeText={handleSearch}
        value={searchQuery}
        containerStyle={styles.searchContainer}
        inputContainerStyle={styles.searchInputContainer}
        lightTheme
        round
        accessible={true}
        accessibilityLabel="Search FAQs"
        accessibilityHint="Enter keywords to search frequently asked questions"
        accessibilityRole="search"
      />
      
      {renderEmptyState() || (
        <FlatList
          data={filteredFAQs}
          renderItem={renderFAQItem}
          keyExtractor={keyExtractor}
          contentContainerStyle={styles.listContainer}
          initialNumToRender={5}
          maxToRenderPerBatch={10}
          windowSize={5}
          removeClippedSubviews={true}
          keyboardShouldPersistTaps="handled"
          accessible={true}
          accessibilityLabel="List of frequently asked questions"
          accessibilityRole="list"
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  searchContainer: {
    backgroundColor: 'transparent',
    borderTopWidth: 0,
    borderBottomWidth: 0,
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  searchInputContainer: {
    backgroundColor: '#fff',
    borderRadius: 8,
  },
  listContainer: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  faqItem: {
    borderRadius: 8,
    marginBottom: 8,
    backgroundColor: '#fff',
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  faqQuestion: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  faqAnswer: {
    fontSize: 14,
    color: '#555',
    marginBottom: 16,
    lineHeight: 20,
  },
  tagContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 8,
  },
  tag: {
    backgroundColor: '#f0f0f0',
    borderRadius: 16,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginRight: 8,
    marginBottom: 4,
  },
  tagText: {
    fontSize: 12,
    color: '#666',
  },
  expandButton: {
    alignSelf: 'flex-start',
  },
  expandButtonText: {
    color: '#FF006E',
    fontSize: 14,
    fontWeight: '500',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
    textAlign: 'center',
  },
  errorText: {
    fontSize: 16,
    color: '#F44336',
    textAlign: 'center',
  },
  clearButton: {
    padding: 8,
  },
  clearButtonText: {
    color: '#FF006E',
    fontSize: 16,
    fontWeight: '500',
  },
});

export default FAQTabContent;