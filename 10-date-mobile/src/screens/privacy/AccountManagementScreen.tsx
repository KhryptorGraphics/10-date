import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import {
  Card,
  Button,
  Icon,
  CheckBox,
  Divider,
  Overlay,
  ButtonGroup,
} from 'react-native-elements';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { StackParamList } from '../../types/navigation';
import TouchID from 'react-native-touch-id';
import AuthService from '../../services/auth.service';

// Mock API service - replace with actual implementation
const privacyApi = {
  deleteAccount: async (options: {
    anonymize: boolean;
    deleteMessages: boolean;
    deleteMatches: boolean;
    deletePayments: boolean;
    deleteConsent: boolean;
    reason: string;
    feedback?: string;
  }) => {
    // Simulate API call
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({ success: true });
      }, 2000);
    });
  },
};

// Account deletion reasons
enum DeletionReason {
  FOUND_PARTNER = 'found_partner',
  NOT_ENOUGH_MATCHES = 'not_enough_matches',
  POOR_EXPERIENCE = 'poor_experience',
  PRIVACY_CONCERNS = 'privacy_concerns',
  TAKING_BREAK = 'taking_break',
  OTHER = 'other',
}

type AccountManagementNavigationProp = StackNavigationProp<StackParamList, 'AccountManagement'>;

/**
 * Account Management Screen
 * Allows users to delete or anonymize their account
 */
const AccountManagementScreen: React.FC = () => {
  const navigation = useNavigation<AccountManagementNavigationProp>();
  
  // State for account deletion options
  const [anonymize, setAnonymize] = useState<boolean>(false);
  const [deleteMessages, setDeleteMessages] = useState<boolean>(true);
  const [deleteMatches, setDeleteMatches] = useState<boolean>(true);
  const [deletePayments, setDeletePayments] = useState<boolean>(false);
  const [deleteConsent, setDeleteConsent] = useState<boolean>(false);
  
  // State for deletion reason
  const [selectedReason, setSelectedReason] = useState<DeletionReason | null>(null);
  const [otherReason, setOtherReason] = useState<string>('');
  const [feedback, setFeedback] = useState<string>('');
  
  // State for confirmation steps
  const [confirmationStep, setConfirmationStep] = useState<number>(1);
  const [confirmationModalVisible, setConfirmationModalVisible] = useState<boolean>(false);
  const [processingDeletion, setProcessingDeletion] = useState<boolean>(false);
  
  // Handle account deletion option selection
  const handleAnonymizeToggle = () => {
    setAnonymize(!anonymize);
  };
  
  // Handle data deletion option selection
  const handleDataDeletionToggle = (option: 'messages' | 'matches' | 'payments' | 'consent') => {
    switch (option) {
      case 'messages':
        setDeleteMessages(!deleteMessages);
        break;
      case 'matches':
        setDeleteMatches(!deleteMatches);
        break;
      case 'payments':
        setDeletePayments(!deletePayments);
        break;
      case 'consent':
        setDeleteConsent(!deleteConsent);
        break;
    }
  };
  
  // Handle reason selection
  const handleReasonSelect = (reason: DeletionReason) => {
    setSelectedReason(reason);
  };
  
  // Start account deletion process
  const startAccountDeletion = () => {
    // Validate inputs
    if (!selectedReason) {
      Alert.alert('Error', 'Please select a reason for deleting your account.');
      return;
    }
    
    if (selectedReason === DeletionReason.OTHER && !otherReason.trim()) {
      Alert.alert('Error', 'Please provide a reason for deleting your account.');
      return;
    }
    
    // Show confirmation modal
    setConfirmationModalVisible(true);
  };
  
  // Cancel account deletion
  const cancelAccountDeletion = () => {
    setConfirmationModalVisible(false);
    setConfirmationStep(1);
  };
  
  // Proceed to next confirmation step
  const nextConfirmationStep = () => {
    setConfirmationStep(confirmationStep + 1);
  };
  
  // Go back to previous confirmation step
  const prevConfirmationStep = () => {
    setConfirmationStep(confirmationStep - 1);
  };
  
  // Confirm account deletion with biometric authentication
  const confirmAccountDeletion = async () => {
    try {
      // Check if biometrics is available
      const biometricsAvailable = await AuthService.isBiometricsAvailable();
      
      if (biometricsAvailable) {
        try {
          // Configure authentication prompt
          const authConfig = {
            title: 'Confirm Account Deletion', 
            color: '#FF006E',
            sensorErrorDescription: 'Authentication failed'
          };
          
          // Trigger biometric authentication
          await TouchID.authenticate('Please authenticate to confirm account deletion', authConfig);
          
          // Proceed with account deletion
          await processAccountDeletion();
        } catch (error) {
          // Authentication failed
          Alert.alert(
            'Authentication Failed',
            'Biometric authentication is required to delete your account. Please try again.',
            [{ text: 'OK' }]
          );
        }
      } else {
        // If biometrics is not available, proceed with account deletion
        await processAccountDeletion();
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to authenticate. Please try again later.');
      console.error('Error during authentication:', error);
    }
  };
  
  // Process account deletion
  const processAccountDeletion = async () => {
    try {
      setProcessingDeletion(true);
      
      // Get the reason text
      const reasonText = selectedReason === DeletionReason.OTHER
        ? otherReason
        : getDeletionReasonText(selectedReason!);
      
      // Delete account
      await privacyApi.deleteAccount({
        anonymize,
        deleteMessages,
        deleteMatches,
        deletePayments,
        deleteConsent,
        reason: reasonText,
        feedback: feedback.trim() || undefined,
      });
      
      // Close modal
      setConfirmationModalVisible(false);
      
      // Show success message
      Alert.alert(
        anonymize ? 'Account Anonymized' : 'Account Deleted',
        anonymize
          ? 'Your account has been anonymized. Your personal information has been removed, but your activity history remains as anonymized data.'
          : 'Your account has been deleted. Thank you for using 10-Date.',
        [
          {
            text: 'OK',
            onPress: () => {
              // Log out and navigate to login screen
              AuthService.logout().then(() => {
                navigation.reset({
                  index: 0,
                  routes: [{ name: 'Login' as any }],
                });
              });
            },
          },
        ]
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to process your request. Please try again later.');
      console.error('Error during account deletion:', error);
    } finally {
      setProcessingDeletion(false);
    }
  };
  
  // Get text representation of deletion reason
  const getDeletionReasonText = (reason: DeletionReason): string => {
    switch (reason) {
      case DeletionReason.FOUND_PARTNER:
        return 'I found a partner';
      case DeletionReason.NOT_ENOUGH_MATCHES:
        return 'Not enough matches';
      case DeletionReason.POOR_EXPERIENCE:
        return 'Poor experience with the app';
      case DeletionReason.PRIVACY_CONCERNS:
        return 'Privacy concerns';
      case DeletionReason.TAKING_BREAK:
        return 'Taking a break from dating';
      case DeletionReason.OTHER:
        return otherReason;
      default:
        return '';
    }
  };
  
  // Render confirmation step content
  const renderConfirmationStep = () => {
    switch (confirmationStep) {
      case 1:
        return (
          <View>
            <Text style={styles.modalTitle}>Confirm Account {anonymize ? 'Anonymization' : 'Deletion'}</Text>
            
            <Text style={styles.modalText}>
              {anonymize
                ? 'You are about to anonymize your account. This will remove your personal information but keep your activity history as anonymized data.'
                : 'You are about to delete your account. This action cannot be undone and all selected data will be permanently deleted.'}
            </Text>
            
            <View style={styles.modalOptions}>
              <Text style={styles.modalOptionTitle}>Selected Options:</Text>
              <Text style={styles.modalOption}>
                • Account will be {anonymize ? 'anonymized' : 'deleted'}
              </Text>
              {deleteMessages && (
                <Text style={styles.modalOption}>• Messages will be deleted</Text>
              )}
              {deleteMatches && (
                <Text style={styles.modalOption}>• Matches will be deleted</Text>
              )}
              {deletePayments && (
                <Text style={styles.modalOption}>• Payment history will be deleted</Text>
              )}
              {deleteConsent && (
                <Text style={styles.modalOption}>• Consent history will be deleted</Text>
              )}
            </View>
            
            <View style={styles.modalButtons}>
              <Button
                title="Cancel"
                type="outline"
                buttonStyle={styles.modalCancelButton}
                titleStyle={styles.modalCancelButtonText}
                onPress={cancelAccountDeletion}
              />
              <Button
                title="Next"
                buttonStyle={styles.modalConfirmButton}
                titleStyle={styles.modalConfirmButtonText}
                onPress={nextConfirmationStep}
              />
            </View>
          </View>
        );
      
      case 2:
        return (
          <View>
            <Text style={styles.modalTitle}>Final Confirmation</Text>
            
            <Text style={styles.modalText}>
              Are you absolutely sure you want to {anonymize ? 'anonymize' : 'delete'} your account?
            </Text>
            
            <Text style={styles.modalWarning}>
              {anonymize
                ? 'This will remove your personal information but keep your activity history as anonymized data.'
                : 'This action cannot be undone and all selected data will be permanently deleted.'}
            </Text>
            
            <View style={styles.modalButtons}>
              <Button
                title="Back"
                type="outline"
                buttonStyle={styles.modalBackButton}
                titleStyle={styles.modalBackButtonText}
                onPress={prevConfirmationStep}
              />
              <Button
                title="Confirm"
                buttonStyle={styles.modalConfirmButton}
                titleStyle={styles.modalConfirmButtonText}
                loading={processingDeletion}
                disabled={processingDeletion}
                onPress={confirmAccountDeletion}
              />
            </View>
          </View>
        );
      
      default:
        return null;
    }
  };
  
  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoidingContainer}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.header}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => navigation.goBack()}
            >
              <Icon name="arrow-left" type="feather" size={24} color="#333" />
            </TouchableOpacity>
            <Text style={styles.title}>Account Management</Text>
          </View>
          
          <Text style={styles.subtitle}>
            Manage your account data and deletion options. Please read the information carefully before proceeding.
          </Text>
          
          <Card containerStyle={styles.card}>
            <Card.Title style={styles.cardTitle}>Account Deletion Options</Card.Title>
            <Card.Divider />
            
            <View style={styles.optionContainer}>
              <CheckBox
                title="Anonymize my account instead of deleting it"
                checked={anonymize}
                onPress={handleAnonymizeToggle}
                containerStyle={styles.checkboxContainer}
                textStyle={styles.checkboxText}
                checkedColor="#FF006E"
              />
              
              <Text style={styles.optionDescription}>
                Anonymization will remove your personal information but keep your activity history as anonymized data, which helps us improve our service.
              </Text>
            </View>
            
            <Text style={styles.sectionTitle}>Data Deletion Options</Text>
            
            <View style={styles.optionContainer}>
              <CheckBox
                title="Delete my messages"
                checked={deleteMessages}
                onPress={() => handleDataDeletionToggle('messages')}
                containerStyle={styles.checkboxContainer}
                textStyle={styles.checkboxText}
                checkedColor="#FF006E"
              />
            </View>
            
            <View style={styles.optionContainer}>
              <CheckBox
                title="Delete my matches"
                checked={deleteMatches}
                onPress={() => handleDataDeletionToggle('matches')}
                containerStyle={styles.checkboxContainer}
                textStyle={styles.checkboxText}
                checkedColor="#FF006E"
              />
            </View>
            
            <View style={styles.optionContainer}>
              <CheckBox
                title="Delete my payment history"
                checked={deletePayments}
                onPress={() => handleDataDeletionToggle('payments')}
                containerStyle={styles.checkboxContainer}
                textStyle={styles.checkboxText}
                checkedColor="#FF006E"
              />
              
              <Text style={styles.optionDescription}>
                Note: This will not affect your payment records with your payment provider.
              </Text>
            </View>
            
            <View style={styles.optionContainer}>
              <CheckBox
                title="Delete my consent history"
                checked={deleteConsent}
                onPress={() => handleDataDeletionToggle('consent')}
                containerStyle={styles.checkboxContainer}
                textStyle={styles.checkboxText}
                checkedColor="#FF006E"
              />
            </View>
          </Card>
          
          <Card containerStyle={styles.card}>
            <Card.Title style={styles.cardTitle}>Reason for Leaving</Card.Title>
            <Card.Divider />
            
            <Text style={styles.reasonText}>
              Please let us know why you're leaving. This helps us improve our service.
            </Text>
            
            <View style={styles.reasonsContainer}>
              <TouchableOpacity
                style={[
                  styles.reasonOption,
                  selectedReason === DeletionReason.FOUND_PARTNER && styles.selectedReasonOption,
                ]}
                onPress={() => handleReasonSelect(DeletionReason.FOUND_PARTNER)}
              >
                <Text
                  style={[
                    styles.reasonOptionText,
                    selectedReason === DeletionReason.FOUND_PARTNER && styles.selectedReasonOptionText,
                  ]}
                >
                  I found a partner
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[
                  styles.reasonOption,
                  selectedReason === DeletionReason.NOT_ENOUGH_MATCHES && styles.selectedReasonOption,
                ]}
                onPress={() => handleReasonSelect(DeletionReason.NOT_ENOUGH_MATCHES)}
              >
                <Text
                  style={[
                    styles.reasonOptionText,
                    selectedReason === DeletionReason.NOT_ENOUGH_MATCHES && styles.selectedReasonOptionText,
                  ]}
                >
                  Not enough matches
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[
                  styles.reasonOption,
                  selectedReason === DeletionReason.POOR_EXPERIENCE && styles.selectedReasonOption,
                ]}
                onPress={() => handleReasonSelect(DeletionReason.POOR_EXPERIENCE)}
              >
                <Text
                  style={[
                    styles.reasonOptionText,
                    selectedReason === DeletionReason.POOR_EXPERIENCE && styles.selectedReasonOptionText,
                  ]}
                >
                  Poor experience with the app
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[
                  styles.reasonOption,
                  selectedReason === DeletionReason.PRIVACY_CONCERNS && styles.selectedReasonOption,
                ]}
                onPress={() => handleReasonSelect(DeletionReason.PRIVACY_CONCERNS)}
              >
                <Text
                  style={[
                    styles.reasonOptionText,
                    selectedReason === DeletionReason.PRIVACY_CONCERNS && styles.selectedReasonOptionText,
                  ]}
                >
                  Privacy concerns
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[
                  styles.reasonOption,
                  selectedReason === DeletionReason.TAKING_BREAK && styles.selectedReasonOption,
                ]}
                onPress={() => handleReasonSelect(DeletionReason.TAKING_BREAK)}
              >
                <Text
                  style={[
                    styles.reasonOptionText,
                    selectedReason === DeletionReason.TAKING_BREAK && styles.selectedReasonOptionText,
                  ]}
                >
                  Taking a break from dating
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[
                  styles.reasonOption,
                  selectedReason === DeletionReason.OTHER && styles.selectedReasonOption,
                ]}
                onPress={() => handleReasonSelect(DeletionReason.OTHER)}
              >
                <Text
                  style={[
                    styles.reasonOptionText,
                    selectedReason === DeletionReason.OTHER && styles.selectedReasonOptionText,
                  ]}
                >
                  Other reason
                </Text>
              </TouchableOpacity>
            </View>
            
            {selectedReason === DeletionReason.OTHER && (
              <TextInput
                style={styles.otherReasonInput}
                placeholder="Please specify your reason"
                value={otherReason}
                onChangeText={setOtherReason}
                multiline
                numberOfLines={3}
              />
            )}
            
            <Text style={styles.feedbackLabel}>Additional feedback (optional):</Text>
            <TextInput
              style={styles.feedbackInput}
              placeholder="Tell us how we could improve"
              value={feedback}
              onChangeText={setFeedback}
              multiline
              numberOfLines={4}
            />
          </Card>
          
          <View style={styles.actionContainer}>
            <Button
              title={anonymize ? "Anonymize My Account" : "Delete My Account"}
              buttonStyle={[styles.deleteButton, anonymize && styles.anonymizeButton]}
              titleStyle={styles.deleteButtonText}
              icon={
                <Icon
                  name={anonymize ? "user-x" : "trash-2"}
                  type="feather"
                  color="#fff"
                  size={18}
                  style={styles.buttonIcon}
                />
              }
              onPress={startAccountDeletion}
            />
          </View>
          
          <View style={styles.footer}>
            <Text style={styles.footerText}>
              {anonymize
                ? 'Anonymizing your account will remove your personal information but keep your activity history as anonymized data.'
                : 'Deleting your account will permanently remove your profile and all selected data from our servers.'}
            </Text>
            <Text style={styles.footerText}>
              This action cannot be undone. Please make sure you want to proceed.
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
      
      {/* Confirmation Modal */}
      <Overlay
        isVisible={confirmationModalVisible}
        onBackdropPress={processingDeletion ? undefined : cancelAccountDeletion}
        overlayStyle={styles.modalContainer}
      >
        {renderConfirmationStep()}
      </Overlay>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  keyboardAvoidingContainer: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 30,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
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
  cardTitle: {
    fontSize: 18,
    color: '#333',
    textAlign: 'left',
    marginBottom: 8,
  },
  optionContainer: {
    marginBottom: 12,
  },
  checkboxContainer: {
    backgroundColor: 'transparent',
    borderWidth: 0,
    marginLeft: 0,
    marginRight: 0,
    marginVertical: 4,
    padding: 0,
  },
  checkboxText: {
    fontWeight: 'normal',
    fontSize: 16,
  },
  optionDescription: {
    fontSize: 14,
    color: '#666',
    marginLeft: 30,
    marginTop: -5,
    marginBottom: 8,
    fontStyle: 'italic',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 16,
    marginBottom: 12,
  },
  reasonText: {
    fontSize: 14,
    color: '#555',
    marginBottom: 16,
  },
  reasonsContainer: {
    marginBottom: 16,
  },
  reasonOption: {
    padding: 12,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    marginBottom: 8,
  },
  selectedReasonOption: {
    borderColor: '#FF006E',
    backgroundColor: 'rgba(255, 0, 110, 0.05)',
  },
  reasonOptionText: {
    fontSize: 16,
    color: '#333',
  },
  selectedReasonOptionText: {
    color: '#FF006E',
    fontWeight: '500',
  },
  otherReasonInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 16,
    textAlignVertical: 'top',
  },
  feedbackLabel: {
    fontSize: 16,
    color: '#333',
    marginBottom: 8,
  },
  feedbackInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    textAlignVertical: 'top',
  },
  actionContainer: {
    marginVertical: 16,
  },
  deleteButton: {
    backgroundColor: '#F44336',
    borderRadius: 8,
    paddingVertical: 12,
  },
  anonymizeButton: {
    backgroundColor: '#FF9800',
  },
  deleteButtonText: {
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
    marginBottom: 8,
    fontStyle: 'italic',
  },
  modalContainer: {
    width: '90%',
    padding: 20,
    borderRadius: 10,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
    textAlign: 'center',
  },
  modalText: {
    fontSize: 16,
    color: '#555',
    marginBottom: 16,
    textAlign: 'center',
  },
  modalWarning: {
    fontSize: 16,
    color: '#F44336',
    marginBottom: 20,
    textAlign: 'center',
    fontWeight: '500',
  },
  modalOptions: {
    backgroundColor: '#f9f9f9',
    padding: 16,
    borderRadius: 8,
    marginBottom: 20,
  },
  modalOptionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  modalOption: {
    fontSize: 14,
    color: '#555',
    marginBottom: 4,
    lineHeight: 20,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  modalCancelButton: {
    borderColor: '#ccc',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 20,
    marginRight: 8,
  },
  modalCancelButtonText: {
    color: '#666',
  },
  modalBackButton: {
    borderColor: '#ccc',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 20,
    marginRight: 8,
  },
  modalBackButtonText: {
    color: '#666',
  },
  modalConfirmButton: {
    backgroundColor: '#FF006E',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 20,
  },
  modalConfirmButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});

export default AccountManagementScreen;