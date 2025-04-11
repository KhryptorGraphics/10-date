import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  Linking,
  TextInput,
  FlatList,
  Animated,
} from 'react-native';
import {
  Card,
  Button,
  Icon,
  Divider,
  ListItem,
  SearchBar,
} from 'react-native-elements';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { StackParamList } from '../../types/navigation';

type PrivacyInformationNavigationProp = StackNavigationProp<StackParamList, 'PrivacyInformation'>;

// Tab types
enum PrivacyTab {
  POLICY = 'policy',
  RIGHTS = 'rights',
  FAQ = 'faq',
  CONTACT = 'contact',
}

// FAQ item interface
interface FAQItem {
  id: string;
  question: string;
  answer: string;
  tags: string[];
}

// Mock FAQ data
const faqData: FAQItem[] = [
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
];

/**
 * Privacy Information Screen
 * Provides educational content about privacy
 */
const PrivacyInformationScreen: React.FC = () => {
  const navigation = useNavigation<PrivacyInformationNavigationProp>();
  
  // State for active tab
  const [activeTab, setActiveTab] = useState<PrivacyTab>(PrivacyTab.POLICY);
  
  // State for FAQ search
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filteredFAQs, setFilteredFAQs] = useState<FAQItem[]>(faqData);
  
  // Animation values for tab indicator
  const tabIndicatorPosition = useRef(new Animated.Value(0)).current;
  
  // Handle tab change
  const handleTabChange = (tab: PrivacyTab) => {
    setActiveTab(tab);
    
    // Animate tab indicator
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
      useNativeDriver: false,
    }).start();
  };
  
  // Handle FAQ search
  const handleSearch = (text: string) => {
    setSearchQuery(text);
    
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
  };
  
  // Open email client
  const openEmail = () => {
    Linking.openURL('mailto:privacy@10date.com?subject=Privacy%20Inquiry');
  };
  
  // Render tab content
  const renderTabContent = () => {
    switch (activeTab) {
      case PrivacyTab.POLICY:
        return (
          <ScrollView style={styles.tabContent}>
            <Text style={styles.sectionTitle}>Privacy Policy</Text>
            <Text style={styles.lastUpdated}>Last Updated: April 1, 2025</Text>
            
            <Text style={styles.policyText}>
              This Privacy Policy describes how 10-Date ("we," "us," or "our") collects, uses, and shares your personal information when you use our mobile application and related services (collectively, the "Services").
            </Text>
            
            <Text style={styles.policyHeading}>1. Information We Collect</Text>
            <Text style={styles.policyText}>
              We collect various types of information from and about users of our Services, including:
            </Text>
            <Text style={styles.policyBullet}>• Personal Information: Name, email address, phone number, date of birth, gender, sexual orientation, photos, and other information you provide in your profile.</Text>
            <Text style={styles.policyBullet}>• Location Information: With your consent, we collect your precise or approximate location to provide location-based services.</Text>
            <Text style={styles.policyBullet}>• Usage Information: Information about how you use our Services, including your interactions with other users, features you use, and content you view.</Text>
            <Text style={styles.policyBullet}>• Device Information: Information about your device, such as IP address, device ID, device type, operating system, and browser type.</Text>
            <Text style={styles.policyBullet}>• Communications: Information you provide when you communicate with us or other users through our Services.</Text>
            
            <Text style={styles.policyHeading}>2. How We Use Your Information</Text>
            <Text style={styles.policyText}>
              We use the information we collect to:
            </Text>
            <Text style={styles.policyBullet}>• Provide, maintain, and improve our Services</Text>
            <Text style={styles.policyBullet}>• Match you with potential partners based on your preferences and location</Text>
            <Text style={styles.policyBullet}>• Personalize your experience and provide content and features relevant to you</Text>
            <Text style={styles.policyBullet}>• Communicate with you about our Services, including updates, promotions, and support</Text>
            <Text style={styles.policyBullet}>• Ensure the safety, security, and integrity of our Services</Text>
            <Text style={styles.policyBullet}>• Comply with legal obligations and enforce our terms and policies</Text>
            
            <Text style={styles.policyHeading}>3. How We Share Your Information</Text>
            <Text style={styles.policyText}>
              We may share your information with:
            </Text>
            <Text style={styles.policyBullet}>• Other users, as necessary to provide our Services</Text>
            <Text style={styles.policyBullet}>• Service providers who perform services on our behalf</Text>
            <Text style={styles.policyBullet}>• Business partners and affiliates who help us provide and improve our Services</Text>
            <Text style={styles.policyBullet}>• Law enforcement or other third parties, when required by law or to protect our rights</Text>
            
            <Text style={styles.policyHeading}>4. Your Choices and Rights</Text>
            <Text style={styles.policyText}>
              You have various choices and rights regarding your personal information, including:
            </Text>
            <Text style={styles.policyBullet}>• Accessing, correcting, or deleting your information</Text>
            <Text style={styles.policyBullet}>• Opting out of marketing communications</Text>
            <Text style={styles.policyBullet}>• Controlling location sharing and other privacy settings</Text>
            <Text style={styles.policyBullet}>• Requesting a copy of your personal information</Text>
            <Text style={styles.policyBullet}>• Withdrawing consent for certain processing activities</Text>
            
            <Text style={styles.policyText}>
              You can exercise most of these rights through the Privacy Center in our app. For more information, please contact us at privacy@10date.com.
            </Text>
            
            <Text style={styles.policyHeading}>5. Data Security</Text>
            <Text style={styles.policyText}>
              We implement appropriate technical and organizational measures to protect your personal information from unauthorized access, disclosure, alteration, and destruction. However, no method of transmission over the Internet or electronic storage is 100% secure, so we cannot guarantee absolute security.
            </Text>
            
            <Text style={styles.policyHeading}>6. International Data Transfers</Text>
            <Text style={styles.policyText}>
              Your information may be transferred to, and processed in, countries other than the country in which you reside. These countries may have data protection laws that are different from the laws of your country. We take appropriate safeguards to ensure that your personal information remains protected in accordance with this Privacy Policy.
            </Text>
            
            <Text style={styles.policyHeading}>7. Changes to This Privacy Policy</Text>
            <Text style={styles.policyText}>
              We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the "Last Updated" date. You are advised to review this Privacy Policy periodically for any changes.
            </Text>
            
            <Text style={styles.policyHeading}>8. Contact Us</Text>
            <Text style={styles.policyText}>
              If you have any questions about this Privacy Policy, please contact our Data Protection Officer at privacy@10date.com.
            </Text>
          </ScrollView>
        );
      
      case PrivacyTab.RIGHTS:
        return (
          <ScrollView style={styles.tabContent}>
            <Text style={styles.sectionTitle}>Your Privacy Rights</Text>
            
            <Text style={styles.rightsText}>
              As a 10-Date user, you have various privacy rights regarding your personal data. These rights may vary depending on your location and applicable data protection laws.
            </Text>
            
            <Card containerStyle={styles.rightsCard}>
              <Card.Title style={styles.rightsCardTitle}>Right to Access</Card.Title>
              <Card.Divider />
              <Text style={styles.rightsCardText}>
                You have the right to access and view the personal data we hold about you. You can access most of your data through the Data Access section in the Privacy Center.
              </Text>
              <Button
                title="Go to Data Access"
                type="outline"
                buttonStyle={styles.rightsButton}
                titleStyle={styles.rightsButtonText}
                onPress={() => navigation.navigate('DataAccess')}
              />
            </Card>
            
            <Card containerStyle={styles.rightsCard}>
              <Card.Title style={styles.rightsCardTitle}>Right to Rectification</Card.Title>
              <Card.Divider />
              <Text style={styles.rightsCardText}>
                You have the right to correct inaccurate or incomplete personal data. You can update most of your profile information directly in the app.
              </Text>
              <Button
                title="Edit Profile"
                type="outline"
                buttonStyle={styles.rightsButton}
                titleStyle={styles.rightsButtonText}
                onPress={() => navigation.navigate('EditProfile' as any)}
              />
            </Card>
            
            <Card containerStyle={styles.rightsCard}>
              <Card.Title style={styles.rightsCardTitle}>Right to Erasure</Card.Title>
              <Card.Divider />
              <Text style={styles.rightsCardText}>
                You have the right to request the deletion of your personal data. You can delete your account and associated data through the Account Management section in the Privacy Center.
              </Text>
              <Button
                title="Go to Account Management"
                type="outline"
                buttonStyle={styles.rightsButton}
                titleStyle={styles.rightsButtonText}
                onPress={() => navigation.navigate('AccountManagement')}
              />
            </Card>
            
            <Card containerStyle={styles.rightsCard}>
              <Card.Title style={styles.rightsCardTitle}>Right to Data Portability</Card.Title>
              <Card.Divider />
              <Text style={styles.rightsCardText}>
                You have the right to receive your personal data in a structured, commonly used, and machine-readable format. You can export your data through the Data Access section in the Privacy Center.
              </Text>
              <Button
                title="Go to Data Access"
                type="outline"
                buttonStyle={styles.rightsButton}
                titleStyle={styles.rightsButtonText}
                onPress={() => navigation.navigate('DataAccess')}
              />
            </Card>
            
            <Card containerStyle={styles.rightsCard}>
              <Card.Title style={styles.rightsCardTitle}>Right to Object</Card.Title>
              <Card.Divider />
              <Text style={styles.rightsCardText}>
                You have the right to object to the processing of your personal data for certain purposes, such as direct marketing. You can manage your consent preferences through the Consent Management section in the Privacy Center.
              </Text>
              <Button
                title="Go to Consent Management"
                type="outline"
                buttonStyle={styles.rightsButton}
                titleStyle={styles.rightsButtonText}
                onPress={() => navigation.navigate('ConsentManagement')}
              />
            </Card>
            
            <Card containerStyle={styles.rightsCard}>
              <Card.Title style={styles.rightsCardTitle}>Right to Restrict Processing</Card.Title>
              <Card.Divider />
              <Text style={styles.rightsCardText}>
                You have the right to request the restriction of processing of your personal data in certain circumstances. You can manage your consent preferences through the Consent Management section in the Privacy Center.
              </Text>
              <Button
                title="Go to Consent Management"
                type="outline"
                buttonStyle={styles.rightsButton}
                titleStyle={styles.rightsButtonText}
                onPress={() => navigation.navigate('ConsentManagement')}
              />
            </Card>
            
            <Card containerStyle={styles.rightsCard}>
              <Card.Title style={styles.rightsCardTitle}>Right to Withdraw Consent</Card.Title>
              <Card.Divider />
              <Text style={styles.rightsCardText}>
                You have the right to withdraw your consent at any time for data processing activities based on consent. You can manage your consent preferences through the Consent Management section in the Privacy Center.
              </Text>
              <Button
                title="Go to Consent Management"
                type="outline"
                buttonStyle={styles.rightsButton}
                titleStyle={styles.rightsButtonText}
                onPress={() => navigation.navigate('ConsentManagement')}
              />
            </Card>
            
            <Card containerStyle={styles.rightsCard}>
              <Card.Title style={styles.rightsCardTitle}>Right to Lodge a Complaint</Card.Title>
              <Card.Divider />
              <Text style={styles.rightsCardText}>
                You have the right to lodge a complaint with a supervisory authority if you believe that our processing of your personal data infringes data protection laws. We encourage you to contact us first so we can address your concerns.
              </Text>
              <Button
                title="Contact Us"
                type="outline"
                buttonStyle={styles.rightsButton}
                titleStyle={styles.rightsButtonText}
                onPress={() => handleTabChange(PrivacyTab.CONTACT)}
              />
            </Card>
          </ScrollView>
        );
      
      case PrivacyTab.FAQ:
        return (
          <View style={styles.tabContent}>
            <SearchBar
              placeholder="Search FAQs..."
              onChangeText={handleSearch}
              value={searchQuery}
              containerStyle={styles.searchContainer}
              inputContainerStyle={styles.searchInputContainer}
              lightTheme
              round
            />
            
            {filteredFAQs.length === 0 ? (
              <View style={styles.emptyResultsContainer}>
                <Icon name="search" type="feather" size={48} color="#ccc" />
                <Text style={styles.emptyResultsText}>
                  No results found for "{searchQuery}"
                </Text>
                <Text style={styles.emptyResultsSubtext}>
                  Try using different keywords or browse all FAQs
                </Text>
                <Button
                  title="Clear Search"
                  type="clear"
                  onPress={() => handleSearch('')}
                  titleStyle={{ color: '#FF006E' }}
                />
              </View>
            ) : (
              <FlatList
                data={filteredFAQs}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                  <ListItem
                    containerStyle={styles.faqItem}
                    bottomDivider
                  >
                    <ListItem.Content>
                      <ListItem.Title style={styles.faqQuestion}>
                        {item.question}
                      </ListItem.Title>
                      <ListItem.Subtitle style={styles.faqAnswer}>
                        {item.answer}
                      </ListItem.Subtitle>
                      <View style={styles.tagContainer}>
                        {item.tags.map((tag, index) => (
                          <View key={index} style={styles.tag}>
                            <Text style={styles.tagText}>{tag}</Text>
                          </View>
