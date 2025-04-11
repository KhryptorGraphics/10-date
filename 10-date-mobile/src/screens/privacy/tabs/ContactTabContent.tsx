import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Linking,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { Card, Button, Icon, Input } from 'react-native-elements';
import { createButtonAccessibilityProps, createHeaderAccessibilityProps } from '../../../utils/accessibility';
import privacyAnalyticsService from '../../../services/privacy-analytics.service';

/**
 * ContactTabContent Component
 * 
 * This component displays contact information and a contact form for privacy-related inquiries.
 * It includes accessibility features and analytics tracking.
 */
const ContactTabContent: React.FC = () => {
  // Form state
  const [name, setName] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [subject, setSubject] = useState<string>('');
  const [message, setMessage] = useState<string>('');
  const [category, setCategory] = useState<string>('general');
  
  // UI state
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [formErrors, setFormErrors] = useState<{
    name?: string;
    email?: string;
    subject?: string;
    message?: string;
  }>({});
  
  // Track screen view
  React.useEffect(() => {
    privacyAnalyticsService.trackScreenView('PrivacyInformation', 'Contact');
  }, []);
  
  // Validate email format
  const isValidEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };
  
  // Validate form
  const validateForm = (): boolean => {
    const errors: {
      name?: string;
      email?: string;
      subject?: string;
      message?: string;
    } = {};
    
    if (!name.trim()) {
      errors.name = 'Name is required';
    }
    
    if (!email.trim()) {
      errors.email = 'Email is required';
    } else if (!isValidEmail(email)) {
      errors.email = 'Please enter a valid email address';
    }
    
    if (!subject.trim()) {
      errors.subject = 'Subject is required';
    }
    
    if (!message.trim()) {
      errors.message = 'Message is required';
    } else if (message.length < 10) {
      errors.message = 'Message must be at least 10 characters long';
    }
    
    setFormErrors(errors);
    
    return Object.keys(errors).length === 0;
  };
  
  // Handle form submission
  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }
    
    setSubmitting(true);
    
    try {
      // In a real app, this would send the form data to a backend API
      // For this example, we'll simulate an API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Track form submission in analytics
      privacyAnalyticsService.trackScreenView('PrivacyContact', 'FormSubmitted');
      
      // Reset form
      setName('');
      setEmail('');
      setSubject('');
      setMessage('');
      setCategory('general');
      
      // Show success message
      Alert.alert(
        'Message Sent',
        'Thank you for your message. Our Data Protection Officer will respond to your inquiry as soon as possible.',
        [{ text: 'OK' }]
      );
    } catch (error) {
      Alert.alert(
        'Error',
        'Failed to send your message. Please try again later.',
        [{ text: 'OK' }]
      );
      console.error('Error sending contact form:', error);
    } finally {
      setSubmitting(false);
    }
  };
  
  // Open email client
  const openEmail = () => {
    Linking.openURL('mailto:privacy@10date.com?subject=Privacy%20Inquiry');
  };
  
  // Open phone dialer
  const openPhone = () => {
    Linking.openURL('tel:+15551234567');
  };
  
  // Open maps app
  const openMaps = () => {
    const address = '123 Privacy Street, San Francisco, CA 94105';
    const encodedAddress = encodeURIComponent(address);
    
    if (Platform.OS === 'ios') {
      Linking.openURL(`maps://?q=${encodedAddress}`);
    } else {
      Linking.openURL(`geo:0,0?q=${encodedAddress}`);
    }
  };
  
  return (
    <ScrollView 
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      {...createHeaderAccessibilityProps('Contact Us')}
    >
      <Text style={styles.title}>Contact Us</Text>
      
      <Text style={styles.subtitle}>
        If you have any questions, concerns, or requests regarding your privacy or this Privacy Policy, 
        please contact our Data Protection Officer using the information below.
      </Text>
      
      <Card containerStyle={styles.card}>
        <View style={styles.contactMethod}>
          <Icon name="mail" type="feather" size={24} color="#FF006E" />
          <View style={styles.contactInfo}>
            <Text style={styles.contactLabel}>Email</Text>
            <Text style={styles.contactValue}>privacy@10date.com</Text>
          </View>
          <Button
            icon={<Icon name="external-link" type="feather" size={16} color="#FF006E" />}
            type="clear"
            onPress={openEmail}
            {...createButtonAccessibilityProps(
              'Send email to privacy at 10 date dot com',
              'Opens your email client'
            )}
          />
        </View>
        
        <View style={styles.divider} />
        
        <View style={styles.contactMethod}>
          <Icon name="map-pin" type="feather" size={24} color="#FF006E" />
          <View style={styles.contactInfo}>
            <Text style={styles.contactLabel}>Address</Text>
            <Text style={styles.contactValue}>
              10-Date Inc.{'\n'}
              123 Privacy Street{'\n'}
              San Francisco, CA 94105{'\n'}
              United States
            </Text>
          </View>
          <Button
            icon={<Icon name="external-link" type="feather" size={16} color="#FF006E" />}
            type="clear"
            onPress={openMaps}
            {...createButtonAccessibilityProps(
              'Open address in maps',
              'Opens your maps application'
            )}
          />
        </View>
        
        <View style={styles.divider} />
        
        <View style={styles.contactMethod}>
          <Icon name="phone" type="feather" size={24} color="#FF006E" />
          <View style={styles.contactInfo}>
            <Text style={styles.contactLabel}>Phone</Text>
            <Text style={styles.contactValue}>+1 (555) 123-4567</Text>
          </View>
          <Button
            icon={<Icon name="external-link" type="feather" size={16} color="#FF006E" />}
            type="clear"
            onPress={openPhone}
            {...createButtonAccessibilityProps(
              'Call phone number',
              'Opens your phone dialer'
            )}
          />
        </View>
      </Card>
      
      <Card containerStyle={styles.card}>
        <Text style={styles.formTitle}>Send a Message</Text>
        
        <Input
          placeholder="Your Name"
          value={name}
          onChangeText={setName}
          leftIcon={<Icon name="user" type="feather" size={18} color="#999" />}
          containerStyle={styles.inputContainer}
          errorMessage={formErrors.name}
          disabled={submitting}
          accessibilityLabel="Your Name"
          accessibilityHint="Enter your full name"
        />
        
        <Input
          placeholder="Your Email"
          value={email}
          onChangeText={setEmail}
          leftIcon={<Icon name="mail" type="feather" size={18} color="#999" />}
          containerStyle={styles.inputContainer}
          keyboardType="email-address"
          autoCapitalize="none"
          errorMessage={formErrors.email}
          disabled={submitting}
          accessibilityLabel="Your Email"
          accessibilityHint="Enter your email address"
        />
        
        <Input
          placeholder="Subject"
          value={subject}
          onChangeText={setSubject}
          leftIcon={<Icon name="edit-2" type="feather" size={18} color="#999" />}
          containerStyle={styles.inputContainer}
          errorMessage={formErrors.subject}
          disabled={submitting}
          accessibilityLabel="Subject"
          accessibilityHint="Enter the subject of your message"
        />
        
        <Text style={styles.selectLabel}>Category</Text>
        <View style={styles.categoryContainer}>
          {['general', 'data-request', 'consent', 'complaint'].map((cat) => (
            <TouchableOpacity
              key={cat}
              style={[
                styles.categoryOption,
                category === cat && styles.selectedCategory,
              ]}
              onPress={() => setCategory(cat)}
              disabled={submitting}
              {...createButtonAccessibilityProps(
                `Category ${cat.replace('-', ' ')}`,
                `Select ${cat.replace('-', ' ')} as the category`,
                submitting
              )}
            >
              <Text
                style={[
                  styles.categoryText,
                  category === cat && styles.selectedCategoryText,
                ]}
              >
                {cat.charAt(0).toUpperCase() + cat.slice(1).replace('-', ' ')}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        
        <Text style={styles.messageLabel}>Message</Text>
        <View style={styles.textAreaContainer}>
          <TextInput
            style={styles.textArea}
            placeholder="Type your message here..."
            value={message}
            onChangeText={setMessage}
            multiline
            numberOfLines={6}
            textAlignVertical="top"
            editable={!submitting}
            accessibilityLabel="Message"
            accessibilityHint="Enter your message"
          />
          {formErrors.message && (
            <Text style={styles.errorText}>{formErrors.message}</Text>
          )}
        </View>
        
        <Button
          title="Send Message"
          onPress={handleSubmit}
          loading={submitting}
          disabled={submitting}
          buttonStyle={styles.submitButton}
          titleStyle={styles.submitButtonText}
          icon={
            <Icon
              name="send"
              type="feather"
              color="#fff"
              size={18}
              style={styles.buttonIcon}
            />
          }
          {...createButtonAccessibilityProps(
            'Send Message',
            'Submit your message to our Data Protection Officer',
            submitting
          )}
        />
      </Card>
      
      <View style={styles.footer}>
        <Text style={styles.footerText}>
          We will respond to your inquiry as soon as possible, typically within 30 days. 
          If you are not satisfied with our response, you have the right to lodge a complaint with a supervisory authority.
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
  contactMethod: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  contactInfo: {
    flex: 1,
    marginLeft: 16,
  },
  contactLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  contactValue: {
    fontSize: 16,
    color: '#333',
  },
  divider: {
    height: 1,
    backgroundColor: '#eee',
    marginVertical: 8,
  },
  formTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  inputContainer: {
    marginBottom: 8,
  },
  selectLabel: {
    fontSize: 16,
    color: '#86939e',
    fontWeight: 'bold',
    marginLeft: 10,
    marginBottom: 8,
  },
  categoryContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 16,
  },
  categoryOption: {
    backgroundColor: '#f0f0f0',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginRight: 8,
    marginBottom: 8,
  },
  selectedCategory: {
    backgroundColor: '#FF006E',
  },
  categoryText: {
    color: '#666',
    fontSize: 14,
  },
  selectedCategoryText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  messageLabel: {
    fontSize: 16,
    color: '#86939e',
    fontWeight: 'bold',
    marginLeft: 10,
    marginBottom: 8,
  },
  textAreaContainer: {
    marginBottom: 16,
  },
  textArea: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    minHeight: 120,
  },
  errorText: {
    color: '#FF0000',
    fontSize: 12,
    marginTop: 4,
    marginLeft: 10,
  },
  submitButton: {
    backgroundColor: '#FF006E',
    borderRadius: 8,
    paddingVertical: 12,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  buttonIcon: {
    marginRight: 8,
  },
  footer: {
    marginTop: 8,
    marginBottom: 16,
  },
  footerText: {
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
    textAlign: 'center',
  },
});

export default ContactTabContent;