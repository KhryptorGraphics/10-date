import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import AccountManagementScreen from '../AccountManagementScreen';
import { Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import AuthService from '../../../services/auth.service';

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

// Mock the TouchID module
jest.mock('react-native-touch-id', () => ({
  authenticate: jest.fn().mockResolvedValue(true),
  isSupported: jest.fn().mockResolvedValue(true),
}));

// Mock the AuthService
jest.mock('../../../services/auth.service', () => ({
  default: {
    isBiometricsAvailable: jest.fn().mockResolvedValue(true),
    validatePassword: jest.fn().mockResolvedValue(true),
    logout: jest.fn().mockResolvedValue(undefined),
  },
}));

// Mock the privacy API service
const mockPrivacyApi = {
  getAccountInfo: jest.fn(),
  getAccountActivity: jest.fn(),
  deleteAccount: jest.fn(),
  anonymizeAccount: jest.fn(),
};

describe('AccountManagementScreen', () => {
  const mockGoBack = jest.fn();
  const mockNavigate = jest.fn();
  const mockReset = jest.fn();
  
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup navigation mock
    (useNavigation as jest.Mock).mockReturnValue({
      goBack: mockGoBack,
      navigate: mockNavigate,
      reset: mockReset,
    });
    
    // Setup API mock responses
    mockPrivacyApi.getAccountInfo.mockResolvedValue({
      id: 'user-123',
      email: 'user@example.com',
      username: 'testuser',
      createdAt: '2024-01-15T10:30:00Z',
      lastLogin: '2025-04-10T14:20:00Z',
      accountStatus: 'active',
      subscriptionStatus: 'premium',
      subscriptionExpiry: '2025-12-31T23:59:59Z',
      dataRetentionPeriod: 90,
    });
    
    mockPrivacyApi.getAccountActivity.mockResolvedValue([
      {
        id: 'activity-1',
        type: 'LOGIN',
        timestamp: '2025-04-10T14:20:00Z',
        ipAddress: '192.168.1.1',
        deviceInfo: 'Chrome on Windows',
        location: 'San Francisco, CA',
      },
      {
        id: 'activity-2',
        type: 'PROFILE_UPDATE',
        timestamp: '2025-04-05T09:15:00Z',
        ipAddress: '192.168.1.1',
        deviceInfo: 'Chrome on Windows',
        location: 'San Francisco, CA',
      },
    ]);
    
    mockPrivacyApi.deleteAccount.mockResolvedValue({ success: true });
    mockPrivacyApi.anonymizeAccount.mockResolvedValue({ success: true });
  });
  
  test('renders correctly with title and description', async () => {
    const { getByText } = render(<AccountManagementScreen />);
    
    await waitFor(() => {
      expect(getByText('Account Management')).toBeTruthy();
      expect(getByText(/Manage your account settings and data retention preferences/i)).toBeTruthy();
    });
  });
  
  test('displays account information when loaded', async () => {
    const { getByText } = render(<AccountManagementScreen />);
    
    await waitFor(() => {
      expect(getByText('Account Information')).toBeTruthy();
      expect(getByText('user@example.com')).toBeTruthy();
      expect(getByText('testuser')).toBeTruthy();
      expect(getByText('Active')).toBeTruthy();
      expect(getByText('Premium')).toBeTruthy();
    });
  });
  
  test('displays account activity when loaded', async () => {
    const { getByText } = render(<AccountManagementScreen />);
    
    await waitFor(() => {
      expect(getByText('Recent Account Activity')).toBeTruthy();
      expect(getByText('Login')).toBeTruthy();
      expect(getByText('Profile Update')).toBeTruthy();
      expect(getByText('Chrome on Windows')).toBeTruthy();
      expect(getByText('San Francisco, CA')).toBeTruthy();
    });
  });
  
  test('opens delete account modal when delete button is clicked', async () => {
    const { getByText } = render(<AccountManagementScreen />);
    
    await waitFor(() => {
      expect(getByText('Delete Account')).toBeTruthy();
    });
    
    // Click delete account button
    fireEvent.press(getByText('Delete Account'));
    
    // Verify delete modal is displayed
    await waitFor(() => {
      expect(getByText('Delete Account')).toBeTruthy();
      expect(getByText(/This action is permanent and cannot be undone/i)).toBeTruthy();
      expect(getByText('Password')).toBeTruthy();
    });
    
    // Close the modal
    fireEvent.press(getByText('Cancel'));
    
    // Verify modal is closed
    await waitFor(() => {
      expect(getByText('Delete Account')).toBeTruthy(); // The button should still be visible
      expect(getByText(/Manage your account settings/i)).toBeTruthy(); // The description should be visible again
    });
  });
  
  test('opens anonymize account modal when anonymize button is clicked', async () => {
    const { getByText } = render(<AccountManagementScreen />);
    
    await waitFor(() => {
      expect(getByText('Anonymize Account')).toBeTruthy();
    });
    
    // Click anonymize account button
    fireEvent.press(getByText('Anonymize Account'));
    
    // Verify anonymize modal is displayed
    await waitFor(() => {
      expect(getByText('Anonymize Account')).toBeTruthy();
      expect(getByText(/Your personal information will be anonymized/i)).toBeTruthy();
      expect(getByText('Password')).toBeTruthy();
    });
    
    // Close the modal
    fireEvent.press(getByText('Cancel'));
    
    // Verify modal is closed
    await waitFor(() => {
      expect(getByText('Anonymize Account')).toBeTruthy(); // The button should still be visible
      expect(getByText(/Manage your account settings/i)).toBeTruthy(); // The description should be visible again
    });
  });
  
  test('deletes account when confirmed with valid password', async () => {
    const { getByText, getByPlaceholderText, getAllByTestId } = render(<AccountManagementScreen />);
    
    await waitFor(() => {
      expect(getByText('Delete Account')).toBeTruthy();
    });
    
    // Click delete account button
    fireEvent.press(getByText('Delete Account'));
    
    // Enter password
    const passwordInput = getByPlaceholderText('Enter your password');
    fireEvent.changeText(passwordInput, 'correctPassword');
    
    // Select data deletion options
    const checkboxes = getAllByTestId(/checkbox-/);
    fireEvent.press(checkboxes[0]); // Messages
    fireEvent.press(checkboxes[1]); // Matches
    
    // Confirm deletion
    fireEvent.press(getByText('Delete My Account'));
    
    // Verify password validation was called
    await waitFor(() => {
      expect(AuthService.validatePassword).toHaveBeenCalledWith('correctPassword');
    });
    
    // Verify delete account was called with correct parameters
    await waitFor(() => {
      expect(mockPrivacyApi.deleteAccount).toHaveBeenCalledWith({
        deleteMessages: true,
        deleteMatches: true,
        deletePaymentHistory: false,
        deleteActivityLogs: false,
      });
    });
    
    // Verify logout was called
    expect(AuthService.logout).toHaveBeenCalled();
    
    // Verify navigation reset was called
    expect(mockReset).toHaveBeenCalled();
  });
  
  test('shows error when password is invalid during account deletion', async () => {
    // Mock password validation to fail
    AuthService.validatePassword = jest.fn().mockResolvedValue(false);
    
    const { getByText, getByPlaceholderText } = render(<AccountManagementScreen />);
    
    await waitFor(() => {
      expect(getByText('Delete Account')).toBeTruthy();
    });
    
    // Click delete account button
    fireEvent.press(getByText('Delete Account'));
    
    // Enter password
    const passwordInput = getByPlaceholderText('Enter your password');
    fireEvent.changeText(passwordInput, 'wrongPassword');
    
    // Confirm deletion
    fireEvent.press(getByText('Delete My Account'));
    
    // Verify error alert was shown
    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith(
        'Authentication Failed',
        'Incorrect password. Please try again.',
        expect.anything()
      );
    });
    
    // Verify delete account was not called
    expect(mockPrivacyApi.deleteAccount).not.toHaveBeenCalled();
  });
  
  test('anonymizes account when confirmed with valid password', async () => {
    const { getByText, getByPlaceholderText } = render(<AccountManagementScreen />);
    
    await waitFor(() => {
      expect(getByText('Anonymize Account')).toBeTruthy();
    });
    
    // Click anonymize account button
    fireEvent.press(getByText('Anonymize Account'));
    
    // Enter password
    const passwordInput = getByPlaceholderText('Enter your password');
    fireEvent.changeText(passwordInput, 'correctPassword');
    
    // Confirm anonymization
    fireEvent.press(getByText('Anonymize My Account'));
    
    // Verify password validation was called
    await waitFor(() => {
      expect(AuthService.validatePassword).toHaveBeenCalledWith('correctPassword');
    });
    
    // Verify anonymize account was called
    await waitFor(() => {
      expect(mockPrivacyApi.anonymizeAccount).toHaveBeenCalled();
    });
    
    // Verify success alert was shown
    expect(Alert.alert).toHaveBeenCalledWith(
      'Account Anonymized',
      expect.stringContaining('Your account has been successfully anonymized'),
      expect.anything()
    );
  });
  
  test('handles error when account deletion fails', async () => {
    // Mock API to reject the deletion
    mockPrivacyApi.deleteAccount.mockRejectedValue(new Error('Deletion failed'));
    
    const { getByText, getByPlaceholderText } = render(<AccountManagementScreen />);
    
    await waitFor(() => {
      expect(getByText('Delete Account')).toBeTruthy();
    });
    
    // Click delete account button
    fireEvent.press(getByText('Delete Account'));
    
    // Enter password
    const passwordInput = getByPlaceholderText('Enter your password');
    fireEvent.changeText(passwordInput, 'correctPassword');
    
    // Confirm deletion
    fireEvent.press(getByText('Delete My Account'));
    
    // Verify error alert was shown
    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith(
        'Error',
        'Failed to delete account. Please try again later.',
        expect.anything()
      );
    });
  });
  
  test('navigates back when back button is pressed', async () => {
    const { getByTestId } = render(<AccountManagementScreen />);
    
    await waitFor(() => {
      expect(getByTestId('back-button')).toBeTruthy();
    });
    
    // Press back button
    fireEvent.press(getByTestId('back-button'));
    
    // Verify navigation.goBack was called
    expect(mockGoBack).toHaveBeenCalled();
  });
  
  test('has proper accessibility attributes', async () => {
    const { getByTestId, getAllByRole } = render(<AccountManagementScreen />);
    
    await waitFor(() => {
      expect(getByTestId('back-button')).toBeTruthy();
    });
    
    // Check back button accessibility
    const backButton = getByTestId('back-button');
    expect(backButton.props.accessibilityLabel).toBe('Go back');
    expect(backButton.props.accessibilityRole).toBe('button');
    
    // Check buttons accessibility
    const buttons = getAllByRole('button');
    buttons.forEach(button => {
      expect(button.props.accessibilityLabel).toBeTruthy();
      expect(button.props.accessibilityRole).toBe('button');
    });
  });
});
