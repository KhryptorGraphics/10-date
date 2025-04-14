import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import DataAccessScreen from '../DataAccessScreen';
import { Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';

// Mock the navigation hook
jest.mock('@react-navigation/native', () => ({
  useNavigation: jest.fn(),
}));

// Mock the Alert module
jest.spyOn(Alert, 'alert').mockImplementation((title, message, buttons) => {
  // Simulate clicking the OK button if it exists
  if (buttons && buttons.length > 0) {
    const okButton = buttons.find(button => button.text === 'OK');
    if (okButton && okButton.onPress) {
      okButton.onPress();
    }
  }
});

// Mock the privacy API service
const mockPrivacyApi = {
  getDataCategories: jest.fn(),
  getExportHistory: jest.fn(),
  requestDataExport: jest.fn(),
};

// Mock implementation of the privacy API
jest.mock('../../../services/privacy.service', () => ({
  default: {
    getDataCategories: (...args) => mockPrivacyApi.getDataCategories(...args),
    getExportHistory: (...args) => mockPrivacyApi.getExportHistory(...args),
    requestDataExport: (...args) => mockPrivacyApi.requestDataExport(...args),
  },
}));

describe('DataAccessScreen', () => {
  const mockGoBack = jest.fn();
  
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup navigation mock
    (useNavigation as jest.Mock).mockReturnValue({
      goBack: mockGoBack,
    });
    
    // Setup API mock responses
    mockPrivacyApi.getDataCategories.mockResolvedValue([
      { id: 'profile', name: 'Profile Information', description: 'Your basic profile information', selected: true },
      { id: 'messages', name: 'Messages', description: 'Your message history', selected: false },
      { id: 'matches', name: 'Matches', description: 'Your match history', selected: false },
    ]);
    
    mockPrivacyApi.getExportHistory.mockResolvedValue([
      { id: '1', requestDate: '2025-04-10T10:30:00Z', status: 'completed', format: 'JSON', categories: ['profile', 'messages'] },
      { id: '2', requestDate: '2025-04-05T14:20:00Z', status: 'completed', format: 'CSV', categories: ['profile'] },
    ]);
    
    mockPrivacyApi.requestDataExport.mockResolvedValue({ 
      id: '3', 
      requestDate: '2025-04-15T09:00:00Z', 
      status: 'pending', 
      format: 'JSON', 
      categories: ['profile', 'messages', 'matches'] 
    });
  });
  
  test('renders correctly with title and description', async () => {
    const { getByText } = render(<DataAccessScreen />);
    
    await waitFor(() => {
      expect(getByText('Data Access & Export')).toBeTruthy();
      expect(getByText('Access and download your personal data')).toBeTruthy();
    });
  });
  
  test('displays data categories when loaded', async () => {
    const { getByText } = render(<DataAccessScreen />);
    
    await waitFor(() => {
      expect(getByText('Profile Information')).toBeTruthy();
      expect(getByText('Messages')).toBeTruthy();
      expect(getByText('Matches')).toBeTruthy();
      expect(getByText('Your basic profile information')).toBeTruthy();
    });
  });
  
  test('displays export history when loaded', async () => {
    const { getByText, getAllByText } = render(<DataAccessScreen />);
    
    await waitFor(() => {
      expect(getByText('Export History')).toBeTruthy();
      expect(getAllByText('Completed').length).toBe(2);
      expect(getByText('JSON')).toBeTruthy();
      expect(getByText('CSV')).toBeTruthy();
    });
  });
  
  test('allows selecting data categories', async () => {
    const { getByText, getByTestId } = render(<DataAccessScreen />);
    
    await waitFor(() => {
      expect(getByText('Profile Information')).toBeTruthy();
    });
    
    // Find and toggle checkboxes
    const messagesCheckbox = getByTestId('checkbox-messages');
    const matchesCheckbox = getByTestId('checkbox-matches');
    
    fireEvent.press(messagesCheckbox);
    fireEvent.press(matchesCheckbox);
    
    // Verify checkboxes are toggled
    expect(messagesCheckbox.props.accessibilityState.checked).toBe(true);
    expect(matchesCheckbox.props.accessibilityState.checked).toBe(true);
  });
  
  test('allows selecting export format', async () => {
    const { getByText, getByTestId } = render(<DataAccessScreen />);
    
    await waitFor(() => {
      expect(getByText('Export Format')).toBeTruthy();
    });
    
    // Find and toggle radio buttons
    const csvRadio = getByTestId('radio-CSV');
    
    fireEvent.press(csvRadio);
    
    // Verify radio button is selected
    expect(csvRadio.props.accessibilityState.checked).toBe(true);
  });
  
  test('submits data export request with selected options', async () => {
    const { getByText, getByTestId } = render(<DataAccessScreen />);
    
    await waitFor(() => {
      expect(getByText('Profile Information')).toBeTruthy();
    });
    
    // Select data categories
    const messagesCheckbox = getByTestId('checkbox-messages');
    const matchesCheckbox = getByTestId('checkbox-matches');
    fireEvent.press(messagesCheckbox);
    fireEvent.press(matchesCheckbox);
    
    // Select export format
    const csvRadio = getByTestId('radio-CSV');
    fireEvent.press(csvRadio);
    
    // Submit the form
    const requestButton = getByText('Request Data Export');
    fireEvent.press(requestButton);
    
    // Verify the API was called with correct parameters
    await waitFor(() => {
      expect(mockPrivacyApi.requestDataExport).toHaveBeenCalledWith({
        categories: ['profile', 'messages', 'matches'],
        format: 'CSV',
      });
    });
    
    // Verify alert was shown
    expect(Alert.alert).toHaveBeenCalledWith(
      'Request Submitted',
      expect.stringContaining('Your data export request has been submitted'),
      expect.anything()
    );
  });
  
  test('handles error when export request fails', async () => {
    // Mock API to reject the request
    mockPrivacyApi.requestDataExport.mockRejectedValue(new Error('Export failed'));
    
    const { getByText } = render(<DataAccessScreen />);
    
    await waitFor(() => {
      expect(getByText('Profile Information')).toBeTruthy();
    });
    
    // Submit the form
    const requestButton = getByText('Request Data Export');
    fireEvent.press(requestButton);
    
    // Verify error alert was shown
    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith(
        'Error',
        expect.stringContaining('Failed to submit data export request'),
        expect.anything()
      );
    });
  });
  
  test('navigates back when back button is pressed', async () => {
    const { getByTestId } = render(<DataAccessScreen />);
    
    await waitFor(() => {
      expect(getByTestId('back-button')).toBeTruthy();
    });
    
    // Press back button
    fireEvent.press(getByTestId('back-button'));
    
    // Verify navigation.goBack was called
    expect(mockGoBack).toHaveBeenCalled();
  });
  
  test('displays empty state when no export history', async () => {
    // Mock empty export history
    mockPrivacyApi.getExportHistory.mockResolvedValue([]);
    
    const { getByText } = render(<DataAccessScreen />);
    
    await waitFor(() => {
      expect(getByText('Export History')).toBeTruthy();
      expect(getByText("You haven't requested any data exports yet.")).toBeTruthy();
    });
  });
  
  test('has proper accessibility attributes', async () => {
    const { getByTestId, getAllByRole } = render(<DataAccessScreen />);
    
    await waitFor(() => {
      expect(getByTestId('back-button')).toBeTruthy();
    });
    
    // Check back button accessibility
    const backButton = getByTestId('back-button');
    expect(backButton.props.accessibilityLabel).toBe('Go back');
    expect(backButton.props.accessibilityRole).toBe('button');
    
    // Check checkboxes accessibility
    const checkboxes = getAllByRole('checkbox');
    checkboxes.forEach(checkbox => {
      expect(checkbox.props.accessibilityLabel).toBeTruthy();
      expect(checkbox.props.accessibilityRole).toBe('checkbox');
    });
    
    // Check radio buttons accessibility
    const radioButtons = getAllByRole('radio');
    radioButtons.forEach(radio => {
      expect(radio.props.accessibilityLabel).toBeTruthy();
      expect(radio.props.accessibilityRole).toBe('radio');
    });
  });
});
