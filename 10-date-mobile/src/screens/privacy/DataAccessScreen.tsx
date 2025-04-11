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
  Share,
  Platform,
} from 'react-native';
import {
  Card,
  Button,
  Icon,
  CheckBox,
  Divider,
  ListItem,
  Overlay,
  ButtonGroup,
} from 'react-native-elements';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { StackParamList } from '../../types/navigation';
import { EncryptionService } from '../../services/encryption.service';

// Mock API service - replace with actual implementation
const privacyApi = {
  requestDataExport: async (categories: Record<string, boolean>, format: string) => {
    // Simulate API call
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          id: 'export-' + Math.random().toString(36).substr(2, 9),
          status: 'pending',
          format,
          createdAt: new Date().toISOString(),
        });
      }, 1000);
    });
  },
  getExportRequests: async () => {
    // Simulate API call
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve([
          {
            id: 'export-abc123',
            status: 'completed',
            format: 'json',
            createdAt: '2025-04-10T10:30:00Z',
            completedAt: '2025-04-10T10:35:00Z',
            downloadUrl: 'https://example.com/exports/export-abc123',
          },
          {
            id: 'export-def456',
            status: 'processing',
            format: 'csv',
            createdAt: '2025-04-11T09:15:00Z',
            progress: 60,
          },
          {
            id: 'export-ghi789',
            status: 'failed',
            format: 'pdf',
            createdAt: '2025-04-09T14:20:00Z',
            errorMessage: 'Failed to generate PDF',
          },
        ]);
      }, 800);
    });
  },
};

// Data categories
enum DataCategory {
  PROFILE = 'profile',
  PREFERENCES = 'preferences',
  MATCHES = 'matches',
  MESSAGES = 'messages',
  PAYMENTS = 'payments',
  SUBSCRIPTIONS = 'subscriptions',
  ACTIVITY = 'activity',
  CONSENT = 'consent',
}

// Export formats
enum ExportFormat {
  JSON = 'json',
  CSV = 'csv',
  PDF = 'pdf',
  XML = 'xml',
}

// Export request status
enum ExportStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
  EXPIRED = 'expired',
}

// Export request interface
interface ExportRequest {
  id: string;
  status: ExportStatus;
  format: ExportFormat;
  createdAt: string;
  completedAt?: string;
  downloadUrl?: string;
  expiresAt?: string;
  progress?: number;
  errorMessage?: string;
}

type DataAccessNavigationProp = StackNavigationProp<StackParamList, 'DataAccess'>;

/**
 * Data Access Screen
 * Allows users to request and download their data
 */
const DataAccessScreen: React.FC = () => {
  const navigation = useNavigation<DataAccessNavigationProp>();
  
  // State for selected data categories
  const [selectedCategories, setSelectedCategories] = useState<Record<DataCategory, boolean>>({
    [DataCategory.PROFILE]: true,
    [DataCategory.PREFERENCES]: true,
    [DataCategory.MATCHES]: true,
    [DataCategory.MESSAGES]: true,
    [DataCategory.PAYMENTS]: true,
    [DataCategory.SUBSCRIPTIONS]: true,
    [DataCategory.ACTIVITY]: true,
    [DataCategory.CONSENT]: true,
  });
  
  // State for export format
  const [exportFormat, setExportFormat] = useState<ExportFormat>(ExportFormat.JSON);
  
  // State for export requests
  const [exportRequests, setExportRequests] = useState<ExportRequest[]>([]);
  
  // Loading and refreshing states
  const [loading, setLoading] = useState<boolean>(false);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [requestingExport, setRequestingExport] = useState<boolean>(false);
  
  // Fetch export requests on component mount
  useEffect(() => {
    fetchExportRequests();
  }, []);
  
  // Handle category selection change
  const handleCategoryChange = (category: DataCategory) => {
    setSelectedCategories({
      ...selectedCategories,
      [category]: !selectedCategories[category],
    });
  };
  
  // Handle export format change
  const handleFormatChange = (index: number) => {
    const formats = Object.values(ExportFormat);
    setExportFormat(formats[index]);
  };
  
  // Fetch export requests from API
  const fetchExportRequests = async () => {
    try {
      setLoading(true);
      const requests = await privacyApi.getExportRequests() as ExportRequest[];
      setExportRequests(requests);
    } catch (error) {
      Alert.alert('Error', 'Failed to fetch export requests. Please try again later.');
      console.error('Error fetching export requests:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };
  
  // Handle refresh
  const onRefresh = () => {
    setRefreshing(true);
    fetchExportRequests();
  };
  
  // Request data export
  const requestDataExport = async () => {
    try {
      // Check if at least one category is selected
      const hasSelectedCategory = Object.values(selectedCategories).some(selected => selected);
      if (!hasSelectedCategory) {
        Alert.alert('Error', 'Please select at least one data category to export.');
        return;
      }
      
      setRequestingExport(true);
      
      // Request export
      await privacyApi.requestDataExport(selectedCategories, exportFormat);
      
      // Show success message
      Alert.alert(
        'Export Requested',
        'Your data export request has been submitted. You will be notified when it is ready for download.',
        [{ text: 'OK' }]
      );
      
      // Refresh export requests
      fetchExportRequests();
    } catch (error) {
      Alert.alert('Error', 'Failed to request data export. Please try again later.');
      console.error('Error requesting data export:', error);
    } finally {
      setRequestingExport(false);
    }
  };
  
  // Share export
  const shareExport = async (exportUrl: string) => {
    try {
      // In a real app, you would download the file first
      // For this example, we'll just share the URL
      await Share.share({
        message: 'Here is my exported data from 10-Date',
        url: exportUrl,
        title: 'My 10-Date Data Export',
      });
    } catch (error) {
      Alert.alert('Error', 'Failed to share export. Please try again later.');
      console.error('Error sharing export:', error);
    }
  };
  
  // Get status color
  const getStatusColor = (status: ExportStatus) => {
    switch (status) {
      case ExportStatus.COMPLETED:
        return '#4CAF50'; // Green
      case ExportStatus.PROCESSING:
        return '#2196F3'; // Blue
      case ExportStatus.PENDING:
        return '#FF9800'; // Orange
      case ExportStatus.FAILED:
        return '#F44336'; // Red
      case ExportStatus.EXPIRED:
        return '#9E9E9E'; // Gray
      default:
        return '#9E9E9E';
    }
  };
  
  // Format date
  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleString();
  };
  
  // Get category display name
  const getCategoryDisplayName = (category: DataCategory) => {
    switch (category) {
      case DataCategory.PROFILE:
        return 'Profile Information';
      case DataCategory.PREFERENCES:
        return 'Preferences';
      case DataCategory.MATCHES:
        return 'Matches';
      case DataCategory.MESSAGES:
        return 'Messages';
      case DataCategory.PAYMENTS:
        return 'Payment History';
      case DataCategory.SUBSCRIPTIONS:
        return 'Subscriptions';
      case DataCategory.ACTIVITY:
        return 'Activity History';
      case DataCategory.CONSENT:
        return 'Consent Preferences';
      default:
        return category;
    }
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
          <Text style={styles.title}>Data Access & Export</Text>
        </View>
        
        <Text style={styles.subtitle}>
          You can export your personal data in various formats. Select the categories you want to include.
        </Text>
        
        <Card containerStyle={styles.card}>
          <Card.Title style={styles.cardTitle}>Select Data Categories</Card.Title>
          <Card.Divider />
          
          <View style={styles.categoriesContainer}>
            {Object.values(DataCategory).map((category) => (
              <CheckBox
                key={category}
                title={getCategoryDisplayName(category)}
                checked={selectedCategories[category]}
                onPress={() => handleCategoryChange(category)}
                containerStyle={styles.checkboxContainer}
                textStyle={styles.checkboxText}
                checkedColor="#FF006E"
              />
            ))}
          </View>
          
          <Text style={styles.sectionTitle}>Export Format</Text>
          
          <ButtonGroup
            buttons={Object.values(ExportFormat).map(format => format.toUpperCase())}
            selectedIndex={Object.values(ExportFormat).indexOf(exportFormat)}
            onPress={handleFormatChange}
            containerStyle={styles.buttonGroup}
            selectedButtonStyle={styles.selectedFormatButton}
            selectedTextStyle={styles.selectedFormatText}
          />
          
          <Button
            title="Request Data Export"
            onPress={requestDataExport}
            loading={requestingExport}
            disabled={requestingExport}
            buttonStyle={styles.exportButton}
            titleStyle={styles.buttonTitle}
            icon={
              <Icon
                name="download"
                type="feather"
                color="#fff"
                size={18}
                style={styles.buttonIcon}
              />
            }
          />
        </Card>
        
        <Text style={styles.sectionTitle}>Export History</Text>
        
        {loading && !refreshing ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#FF006E" />
          </View>
        ) : exportRequests.length === 0 ? (
          <Card containerStyle={styles.card}>
            <Text style={styles.emptyText}>
              You haven't requested any data exports yet.
            </Text>
          </Card>
        ) : (
          <Card containerStyle={styles.card}>
            {exportRequests.map((request, index) => (
              <React.Fragment key={request.id}>
                {index > 0 && <Divider style={styles.divider} />}
                <ListItem containerStyle={styles.listItem}>
                  <ListItem.Content>
                    <View style={styles.exportHeader}>
                      <View style={styles.exportInfo}>
                        <Text style={styles.exportDate}>
                          {formatDate(request.createdAt)}
                        </Text>
                        <View style={styles.statusContainer}>
                          <View
                            style={[
                              styles.statusDot,
                              { backgroundColor: getStatusColor(request.status) },
                            ]}
                          />
                          <Text style={styles.statusText}>
                            {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                          </Text>
                        </View>
                      </View>
                      <Text style={styles.formatBadge}>
                        {request.format.toUpperCase()}
                      </Text>
                    </View>
                    
                    {request.status === ExportStatus.PROCESSING && request.progress !== undefined && (
                      <View style={styles.progressContainer}>
                        <View 
                          style={[
                            styles.progressBar, 
                            { width: `${request.progress}%` }
                          ]} 
                        />
                        <Text style={styles.progressText}>{request.progress}%</Text>
                      </View>
                    )}
                    
                    {request.status === ExportStatus.FAILED && request.errorMessage && (
                      <Text style={styles.errorText}>{request.errorMessage}</Text>
                    )}
                    
                    {request.status === ExportStatus.COMPLETED && request.downloadUrl && (
                      <View style={styles.actionButtons}>
                        <Button
                          title="Download"
                          type="outline"
                          buttonStyle={styles.downloadButton}
                          titleStyle={styles.downloadButtonText}
                          icon={
                            <Icon
                              name="download"
                              type="feather"
                              color="#FF006E"
                              size={16}
                              style={styles.buttonIcon}
                            />
                          }
                          onPress={() => {
                            // In a real app, you would download the file
                            Alert.alert('Download', 'Downloading export...');
                          }}
                        />
                        <Button
                          title="Share"
                          type="outline"
                          buttonStyle={styles.shareButton}
                          titleStyle={styles.shareButtonText}
                          icon={
                            <Icon
                              name="share"
                              type="feather"
                              color="#2196F3"
                              size={16}
                              style={styles.buttonIcon}
                            />
                          }
                          onPress={() => shareExport(request.downloadUrl!)}
                        />
                      </View>
                    )}
                    
                    {request.completedAt && (
                      <Text style={styles.completedText}>
                        Completed: {formatDate(request.completedAt)}
                      </Text>
                    )}
                    
                    {request.expiresAt && (
                      <Text style={styles.expiresText}>
                        Available until: {formatDate(request.expiresAt)}
                      </Text>
                    )}
                  </ListItem.Content>
                </ListItem>
              </React.Fragment>
            ))}
          </Card>
        )}
        
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Data exports may take a few minutes to process. You will be able to download your data once the processing is complete.
          </Text>
          <Text style={styles.footerText}>
            Export files are available for download for 7 days after creation.
          </Text>
        </View>
      </ScrollView>
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
  categoriesContainer: {
    marginBottom: 16,
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
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 16,
    marginBottom: 12,
  },
  buttonGroup: {
    marginBottom: 20,
    borderRadius: 8,
    borderColor: '#ddd',
  },
  selectedFormatButton: {
    backgroundColor: '#FF006E',
  },
  selectedFormatText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  exportButton: {
    backgroundColor: '#FF006E',
    borderRadius: 8,
    paddingVertical: 12,
  },
  buttonTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  buttonIcon: {
    marginRight: 8,
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
  listItem: {
    padding: 0,
    backgroundColor: 'transparent',
  },
  divider: {
    marginVertical: 12,
  },
  exportHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  exportInfo: {
    flex: 1,
  },
  exportDate: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 6,
  },
  statusText: {
    fontSize: 14,
    color: '#666',
  },
  formatBadge: {
    backgroundColor: '#eee',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    fontSize: 12,
    fontWeight: 'bold',
    color: '#555',
  },
  progressContainer: {
    height: 20,
    backgroundColor: '#eee',
    borderRadius: 10,
    marginVertical: 8,
    overflow: 'hidden',
    position: 'relative',
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#2196F3',
    borderRadius: 10,
  },
  progressText: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    textAlign: 'center',
    textAlignVertical: 'center',
    fontSize: 12,
    fontWeight: 'bold',
    color: '#fff',
  },
  errorText: {
    color: '#F44336',
    marginTop: 8,
    fontSize: 14,
  },
  actionButtons: {
    flexDirection: 'row',
    marginTop: 12,
  },
  downloadButton: {
    borderColor: '#FF006E',
    borderRadius: 8,
    marginRight: 8,
  },
  downloadButtonText: {
    color: '#FF006E',
  },
  shareButton: {
    borderColor: '#2196F3',
    borderRadius: 8,
  },
  shareButtonText: {
    color: '#2196F3',
  },
  completedText: {
    fontSize: 14,
    color: '#666',
    marginTop: 8,
  },
  expiresText: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
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
});

export default DataAccessScreen;