import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
  Modal,
  FlatList,
} from 'react-native';
import {
  Card,
  Button,
  Icon,
  Switch,
  Divider,
  ListItem,
  Overlay,
} from 'react-native-elements';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { StackParamList } from '../../types/navigation';
import TouchID from 'react-native-touch-id';
import AuthService from '../../services/auth.service';

// Mock API service - replace with actual implementation
const privacyApi = {
  getConsentPreferences: async () => {
    // Simulate API call
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve([
          {
            id: 'data-processing',
            type: 'DATA_PROCESSING',
            title: 'Data Processing',
            description: 'Allow us to process your personal data to provide and improve our services.',
            required: true,
            status: true,
            lastUpdated: '2025-03-15T10:30:00Z',
          },
          {
            id: 'marketing',
            type: 'MARKETING',
            title: 'Marketing Communications',
            description: 'Receive personalized offers, updates, and promotional content via email and push notifications.',
            required: false,
            status: true,
            lastUpdated: '2025-03-15T10:30:00Z',
          },
          {
            id: 'location',
            type: 'LOCATION',
            title: 'Location Services',
            description: 'Allow us to use your location data to provide location-based matches and features.',
            required: false,
            status: true,
            lastUpdated: '2025-03-15T10:30:00Z',
          },
          {
            id: 'third-party',
            type: 'THIRD_PARTY',
            title: 'Third-Party Data Sharing',
            description: 'Allow us to share your data with trusted third-party partners to enhance your experience.',
            required: false,
            status: false,
            lastUpdated: '2025-03-15T10:30:00Z',
          },
          {
            id: 'analytics',
            type: 'ANALYTICS',
            title: 'Analytics & Research',
            description: 'Allow us to use your data for analytics, research, and service improvement purposes.',
            required: false,
            status: true,
            lastUpdated: '2025-03-15T10:30:00Z',
          },
          {
            id: 'behavioral',
            type: 'BEHAVIORAL',
            title: 'Behavioral Profiling',
            description: 'Allow us to analyze your behavior and preferences to improve matching algorithms.',
            required: false,
            status: true,
            lastUpdated: '2025-03-15T10:30:00Z',
          },
        ]);
      }, 800);
    });
  },
  updateConsentPreference: async (consentId: string, status: boolean) => {
    // Simulate API call
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          id: consentId,
          status,
          lastUpdated: new Date().toISOString(),
        });
      }, 1000);
    });
  },
  getConsentHistory: async (consentId: string) => {
    // Simulate API call
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve([
          {
            id: 'history-1',
            consentId,
            status: true,
            timestamp: '2025-03-15T10:30:00Z',
            source: 'user',
            notes: 'Initial consent during registration',
          },
          {
            id: 'history-2',
            consentId,
            status: false,
            timestamp: '2025-03-20T14:45:00Z',
            source: 'user',
            notes: 'User opted out via privacy center',
          },
          {
            id: 'history-3',
            consentId,
            status: true,
            timestamp: '2025-04-05T09:15:00Z',
            source: 'user',
            notes: 'User opted back in via privacy center',
          },
        ]);
      }, 800);
    });
  },
};

// Consent preference interface
interface ConsentPreference {
  id: string;
  type: string;
  title: string;
  description: string;
  required: boolean;
  status: boolean;
  lastUpdated: string;
}

// Consent history entry interface
interface ConsentHistoryEntry {
  id: string;
  consentId: string;
  status: boolean;
  timestamp: string;
  source: string;
  notes?: string;
}

type ConsentManagementNavigationProp = StackNavigationProp<StackParamList, 'ConsentManagement'>;

/**
 * Consent Management Screen
 * Allows users to manage their consent preferences
 */
const ConsentManagementScreen: React.FC = () => {
  const navigation = useNavigation<ConsentManagementNavigationProp>();
  
  // State for consent preferences
  const [consentPreferences, setConsentPreferences] = useState<ConsentPreference[]>([]);
  
  // State for consent history
  const [consentHistory, setConsentHistory] = useState<ConsentHistoryEntry[]>([]);
  
  // State for selected consent (for history modal)
  const [selectedConsent, setSelectedConsent] = useState<ConsentPreference | null>(null);
  
  // State for confirmation modal
  const [confirmationModalVisible, setConfirmationModalVisible] = useState<boolean>(false);
  const [pendingConsentChange, setPendingConsentChange] = useState<{id: string, status: boolean} | null>(null);
  
  // State for history modal
  const [historyModalVisible, setHistoryModalVisible] = useState<boolean>(false);
  
  // Loading and refreshing states
  const [loading, setLoading] = useState<boolean>(false);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [updatingConsent, setUpdatingConsent] = useState<string | null>(null);
  const [loadingHistory, setLoadingHistory] = useState<boolean>(false);
  
  // Fetch consent preferences on component mount
  useEffect(() => {
    fetchConsentPreferences();
  }, []);
  
  // Fetch consent preferences from API
  const fetchConsentPreferences = async () => {
    try {
      setLoading(true);
      const preferences = await privacyApi.getConsentPreferences() as ConsentPreference[];
      setConsentPreferences(preferences);
    } catch (error) {
      Alert.alert('Error', 'Failed to fetch consent preferences. Please try again later.');
      console.error('Error fetching consent preferences:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };
  
  // Handle refresh
  const onRefresh = () => {
    setRefreshing(true);
    fetchConsentPreferences();
  };
  
  // Handle consent toggle
  const handleConsentToggle = (consent: ConsentPreference) => {
    // Cannot toggle required consents
    if (consent.required) {
      Alert.alert(
        'Required Consent',
        'This consent is required for the service to function and cannot be disabled.',
        [{ text: 'OK' }]
      );
      return;
    }
    
    // Set pending consent change and show confirmation modal
    setPendingConsentChange({
      id: consent.id,
      status: !consent.status,
    });
    setSelectedConsent(consent);
    setConfirmationModalVisible(true);
  };
  
  // Confirm consent change
  const confirmConsentChange = async () => {
    if (!pendingConsentChange) return;
    
    try {
      setUpdatingConsent(pendingConsentChange.id);
      setConfirmationModalVisible(false);
      
      // For sensitive consents, use biometric authentication if available
      if (selectedConsent?.type === 'THIRD_PARTY' || selectedConsent?.type === 'BEHAVIORAL') {
        const biometricsAvailable = await AuthService.isBiometricsAvailable();
        
        if (biometricsAvailable) {
          try {
            // Configure authentication prompt
            const authConfig = {
              title: 'Authenticate to Change Consent', 
              color: '#FF006E',
              sensorErrorDescription: 'Authentication failed'
            };
            
            // Trigger biometric authentication
            await TouchID.authenticate('Please authenticate to confirm consent change', authConfig);
          } catch (error) {
            // Authentication failed
            Alert.alert('Authentication Failed', 'Biometric authentication is required to change this consent preference.');
            setUpdatingConsent(null);
            return;
          }
        }
      }
      
      // Update consent preference
      await privacyApi.updateConsentPreference(
        pendingConsentChange.id,
        pendingConsentChange.status
      );
      
      // Update local state
      setConsentPreferences(prevPreferences =>
        prevPreferences.map(pref =>
          pref.id === pendingConsentChange.id
            ? { ...pref, status: pendingConsentChange.status, lastUpdated: new Date().toISOString() }
            : pref
        )
      );
      
      // Show success message
      Alert.alert(
        'Consent Updated',
        `Your consent preference has been updated.`,
        [{ text: 'OK' }]
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to update consent preference. Please try again later.');
      console.error('Error updating consent preference:', error);
    } finally {
      setUpdatingConsent(null);
      setPendingConsentChange(null);
    }
  };
  
  // Cancel consent change
  const cancelConsentChange = () => {
    setConfirmationModalVisible(false);
    setPendingConsentChange(null);
    setSelectedConsent(null);
  };
  
  // View consent history
  const viewConsentHistory = async (consent: ConsentPreference) => {
    try {
      setSelectedConsent(consent);
      setLoadingHistory(true);
      
      // Fetch consent history
      const history = await privacyApi.getConsentHistory(consent.id) as ConsentHistoryEntry[];
      setConsentHistory(history);
      
      // Show history modal
      setHistoryModalVisible(true);
    } catch (error) {
      Alert.alert('Error', 'Failed to fetch consent history. Please try again later.');
      console.error('Error fetching consent history:', error);
    } finally {
      setLoadingHistory(false);
    }
  };
  
  // Close history modal
  const closeHistoryModal = () => {
    setHistoryModalVisible(false);
    setSelectedConsent(null);
    setConsentHistory([]);
  };
  
  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };
  
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Icon name="arrow-left" type="feather" size={24} color="#333" />
          </TouchableOpacity>
          <Text style={styles.title}>Consent Management</Text>
        </View>
        
        <Text style={styles.subtitle}>
          Manage how your data is used and processed. You can review and update your consent preferences at any time.
        </Text>
        
        {loading && !refreshing ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#FF006E" />
          </View>
        ) : consentPreferences.length === 0 ? (
          <Card containerStyle={styles.card}>
            <Text style={styles.emptyText}>
              No consent preferences found.
            </Text>
          </Card>
        ) : (
          <View>
            {consentPreferences.map((consent) => (
              <Card key={consent.id} containerStyle={styles.card}>
                <View style={styles.consentHeader}>
                  <Text style={styles.consentTitle}>{consent.title}</Text>
                  {consent.required && (
                    <View style={styles.requiredBadge}>
                      <Text style={styles.requiredBadgeText}>Required</Text>
                    </View>
                  )}
                </View>
                
                <Text style={styles.consentDescription}>
                  {consent.description}
                </Text>
                
                <View style={styles.consentControls}>
                  <View style={styles.switchContainer}>
                    <Text style={styles.switchLabel}>
                      {consent.status ? 'Enabled' : 'Disabled'}
                    </Text>
                    <Switch
                      value={consent.status}
                      onValueChange={() => handleConsentToggle(consent)}
                      disabled={consent.required || updatingConsent === consent.id}
                      trackColor={{ false: '#ccc', true: '#FF006E' }}
                      thumbColor={consent.status ? '#fff' : '#f4f3f4'}
                    />
                  </View>
                  
                  <TouchableOpacity
                    style={styles.historyButton}
                    onPress={() => viewConsentHistory(consent)}
                    disabled={loadingHistory}
                  >
                    <Icon name="clock" type="feather" size={16} color="#666" />
                    <Text style={styles.historyButtonText}>History</Text>
                  </TouchableOpacity>
                </View>
                
                <Text style={styles.lastUpdatedText}>
                  Last updated: {formatDate(consent.lastUpdated)}
                </Text>
                
                {updatingConsent === consent.id && (
                  <View style={styles.updatingOverlay}>
                    <ActivityIndicator size="small" color="#FF006E" />
                    <Text style={styles.updatingText}>Updating...</Text>
                  </View>
                )}
              </Card>
            ))}
          </View>
        )}
        
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Your privacy is important to us. We only use your data as described in our Privacy Policy and according to your consent preferences.
          </Text>
          <Text style={styles.footerText}>
            Some consents are required for the service to function properly and cannot be disabled.
          </Text>
        </View>
      </ScrollView>
      
      {/* Confirmation Modal */}
      <Overlay
        isVisible={confirmationModalVisible}
        onBackdropPress={cancelConsentChange}
        overlayStyle={styles.modalContainer}
      >
        <View>
          <Text style={styles.modalTitle}>Confirm Consent Change</Text>
          
          <Text style={styles.modalText}>
            Are you sure you want to {pendingConsentChange?.status ? 'enable' : 'disable'} the following consent?
          </Text>
          
          {selectedConsent && (
            <View style={styles.modalConsentInfo}>
              <Text style={styles.modalConsentTitle}>{selectedConsent.title}</Text>
              <Text style={styles.modalConsentDescription}>{selectedConsent.description}</Text>
            </View>
          )}
          
          <View style={styles.modalButtons}>
            <Button
              title="Cancel"
              type="outline"
              buttonStyle={styles.modalCancelButton}
              titleStyle={styles.modalCancelButtonText}
              onPress={cancelConsentChange}
            />
            <Button
              title="Confirm"
              buttonStyle={styles.modalConfirmButton}
              titleStyle={styles.modalConfirmButtonText}
              onPress={confirmConsentChange}
            />
          </View>
        </View>
      </Overlay>
      
      {/* History Modal */}
      <Overlay
        isVisible={historyModalVisible}
        onBackdropPress={closeHistoryModal}
        overlayStyle={styles.historyModalContainer}
      >
        <View style={styles.historyModalContent}>
          <View style={styles.historyModalHeader}>
            <Text style={styles.historyModalTitle}>Consent History</Text>
            <TouchableOpacity onPress={closeHistoryModal}>
              <Icon name="x" type="feather" size={24} color="#333" />
            </TouchableOpacity>
          </View>
          
          {selectedConsent && (
            <Text style={styles.historyModalSubtitle}>{selectedConsent.title}</Text>
          )}
          
          {loadingHistory ? (
            <View style={styles.historyLoadingContainer}>
              <ActivityIndicator size="large" color="#FF006E" />
            </View>
          ) : consentHistory.length === 0 ? (
            <Text style={styles.historyEmptyText}>No history available.</Text>
          ) : (
            <FlatList
              data={consentHistory.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <View style={styles.historyItem}>
                  <View style={styles.historyItemHeader}>
                    <Text style={styles.historyItemDate}>{formatDate(item.timestamp)}</Text>
                    <View style={[
                      styles.historyItemStatus,
                      { backgroundColor: item.status ? '#4CAF50' : '#F44336' }
                    ]}>
                      <Text style={styles.historyItemStatusText}>
                        {item.status ? 'Enabled' : 'Disabled'}
                      </Text>
                    </View>
                  </View>
                  
                  <Text style={styles.historyItemSource}>
                    Source: {item.source === 'user' ? 'You' : 'System'}
                  </Text>
                  
                  {item.notes && (
                    <Text style={styles.historyItemNotes}>{item.notes}</Text>
                  )}
                </View>
              )}
              ItemSeparatorComponent={() => <Divider style={styles.historyDivider} />}
              contentContainerStyle={styles.historyList}
            />
          )}
        </View>
      </Overlay>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
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
  loadingContainer: {
    padding: 30,
    alignItems: 'center',
  },
  emptyText: {
    textAlign: 'center',
    fontSize: 16,
    color: '#666',
    padding: 20,
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
    position: 'relative',
  },
  consentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  consentTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
  },
  requiredBadge: {
    backgroundColor: '#FF9800',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    marginLeft: 8,
  },
  requiredBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  consentDescription: {
    fontSize: 14,
    color: '#555',
    marginBottom: 16,
    lineHeight: 20,
  },
  consentControls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  switchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  switchLabel: {
    fontSize: 14,
    color: '#666',
    marginRight: 8,
  },
  historyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
  },
  historyButtonText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 4,
  },
  lastUpdatedText: {
    fontSize: 12,
    color: '#999',
    fontStyle: 'italic',
  },
  updatingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 10,
    flexDirection: 'row',
  },
  updatingText: {
    marginLeft: 8,
    fontSize: 16,
    color: '#FF006E',
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
  modalConsentInfo: {
    backgroundColor: '#f9f9f9',
    padding: 16,
    borderRadius: 8,
    marginBottom: 20,
  },
  modalConsentTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  modalConsentDescription: {
    fontSize: 14,
    color: '#555',
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
  historyModalContainer: {
    width: '90%',
    maxHeight: '80%',
    padding: 0,
    borderRadius: 10,
    overflow: 'hidden',
  },
  historyModalContent: {
    flex: 1,
  },
  historyModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  historyModalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  historyModalSubtitle: {
    fontSize: 16,
    color: '#666',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  historyLoadingContainer: {
    padding: 30,
    alignItems: 'center',
  },
  historyEmptyText: {
    textAlign: 'center',
    fontSize: 16,
    color: '#666',
    padding: 20,
  },
  historyList: {
    padding: 16,
  },
  historyItem: {
    paddingVertical: 12,
  },
  historyItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  historyItemDate: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
  },
  historyItemStatus: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  historyItemStatusText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  historyItemSource: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  historyItemNotes: {
    fontSize: 14,
    color: '#555',
    fontStyle: 'italic',
  },
  historyDivider: {
    marginVertical: 8,
  },
});

export default ConsentManagementScreen;