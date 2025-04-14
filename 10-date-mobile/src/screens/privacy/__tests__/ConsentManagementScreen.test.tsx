import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import ConsentManagementScreen from '../ConsentManagementScreen';
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
  },
}));

// Mock the privacy API service
const mockPrivacyApi = {
  getConsentPreferences: jest.fn(),
  getConsentHistory: jest.fn(),
  updateConsentPreference: jest.fn(),
};

describe('ConsentManagementScreen', () => {
  const mockGoBack = jest.fn();
  
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup navigation mock
    (useNavigation as jest.Mock).mockReturnValue({
      goBack: mockGoBack,
    });
    
    // Setup API mock responses
    mockPrivacyApi.getConsentPreferences.mockResolvedValue([
      {
        id: 'consent-1',
        type: 'MARKETING',
        title: 'Marketing Communications',
        description: 'Allow us to send you marketing communications, including promotions, special offers, and newsletters.',
        status: true,
        updatedAt: '2025-04-10T10:30:00Z',
        policyVersion: '1.2',
      },
      {
        id: 'consent-2',
        type: 'ANALYTICS',
        title: 'Analytics & Usage Data',
        description: 'Allow us to collect and analyze data about how you use our service to improve user experience.',
        status: false,
        updatedAt: '2025-04-09T14:20:00Z',
        policyVersion: '1.2',
      },
      {
        id: 'consent-3',
        type: 'COMMUNICATIONS',
        title: 'Service Communications',
        description: 'Allow us to send you important service communications, such as security alerts and account updates.',
        status: true,
        updatedAt: '2025-04-06T11:30:00Z',
        policyVersion: '1.2',
        required: true,
      },
    ]);
    
    mockPrivacyApi.getConsentHistory.mockResolvedValue([
      {
        id: 'history-1',
        consentType: 'MARKETING',
        status: true,
        changedAt: '2025-04-10T10:30:00Z',
        policyVersion: '1.2',
        notes: 'Consent granted via Privacy Center',
      },
      {
        id: 'history-2',
        consentType: 'MARKETING',
        status: false,
        changedAt: '2025-04-05T14:20:00Z',
        policyVersion: '1.1',
        notes: 'Consent revoked via Privacy Center',
      },
    ]);
    
    mockPrivacyApi.updateConsentPreference.mockResolvedValue({
      id: 'consent-2',
      status: true,
      updatedAt: '2025-04-15T09:00:00Z',
    });
  });
  
  test('renders correctly with title and description', async () => {
    const { getByText } = render(<ConsentManagementScreen />);
    
    await waitFor(() => {
      expect(getByText('Consent Management')).toBeTruthy();
      expect(getByText(/Manage your privacy preferences and consent settings/i)).toBeTruthy();
    });
  });
  
  test('displays consent preferences when loaded', async () => {
    const { getByText } = render(<ConsentManagementScreen />);
    
    await waitFor(() => {
      expect(getByText('Marketing Communications')).toBeTruthy();
      expect(getByText('Analytics & Usage Data')).toBeTruthy();
      expect(getByText('Service Communications')).toBeTruthy();
      expect(getByText('Required')).toBeTruthy();
    });
  });
  
  test('toggles consent item expansion when clicked', async () => {
    const { getByText, queryByText } = render(<ConsentManagementScreen />);
    
    await waitFor(() => {
      expect(getByText('Marketing Communications')).toBeTruthy();
    });
    
    // Initially, description should not be visible
    expect(queryByText(/Allow us to send you marketing communications/i)).toBeNull();
    
    // Click to expand
    fireEvent.press(getByText('Marketing Communications'));
    
    // Description should now be visible
    await waitFor(() => {
      expect(getByText(/Allow us to send you marketing communications/i)).toBeTruthy();
    });
  });
  
  test('displays consent history when history button is clicked', async () => {
    const { getByText, getAllByTestId } = render(<ConsentManagementScreen />);
    
    await waitFor(() => {
      expect(getByText('Marketing Communications')).toBeTruthy();
    });
    
    // Find and click history button
    const historyButtons = getAllByTestId('history-button');
    fireEvent.press(historyButtons[0]);
    
    // Verify history modal is displayed
    await waitFor(() => {
      expect(getByText('Consent History')).toBeTruthy();
      expect(getByText('Marketing Communications')).toBeTruthy();
      expect(getByText('Enabled')).toBeTruthy();
      expect(getByText('Disabled')).toBeTruthy();
      expect(getByText('Consent granted via Privacy Center')).toBeTruthy();
    });
    
    // Close the modal
    fireEvent.press(getByText('Close'));
    
    // Verify modal is closed
    await waitFor(() => {
      expect(queryByText('Consent History')).toBeNull();
    });
  });
  
  test('toggles consent status when switch is clicked', async () => {
    const { getByText, getAllByTestId } = render(<ConsentManagementScreen />);
    
    await waitFor(() => {
      expect(getByText('Analytics & Usage Data')).toBeTruthy();
    });
    
    // Find the toggle switch for Analytics & Usage Data (initially off)
    const switches = getAllByTestId('consent-switch');
    const analyticsSwitch = switches[1]; // Second switch should be for Analytics
    
    // Toggle the switch
    fireEvent.press(analyticsSwitch);
    
    // Confirmation dialog should appear
    await waitFor(() => {
      expect(getByText('Confirm Consent Change')).toBeTruthy();
      expect(getByText(/Are you sure you want to enable consent for Analytics & Usage Data/i)).toBeTruthy();
    });
    
    // Confirm the change
    fireEvent.press(getByText('Confirm'));
    
    // Verify the API was called with correct parameters
    await waitFor(() => {
      expect(mockPrivacyApi.updateConsentPreference).toHaveBeenCalledWith('consent-2', true);
    });
    
    // Verify alert was shown
    expect(Alert.alert).toHaveBeenCalledWith(
      'Consent Updated',
      expect.stringContaining('Your consent preference for Analytics & Usage Data has been updated'),
      expect.anything()
    );
  });
  
  test('cannot toggle required consents', async () => {
    const { getByText, getAllByTestId } = render(<ConsentManagementScreen />);
    
    await waitFor(() => {
      expect(getByText('Service Communications')).toBeTruthy();
      expect(getByText('Required')).toBeTruthy();
    });
    
    // Find the toggle switch for Service Communications (required)
    const switches = getAllByTestId('consent-switch');
    const communicationsSwitch = switches[2]; // Third switch should be for Service Communications
    
    // Verify switch is disabled
    expect(communicationsSwitch.props.disabled).toBe(true);
    
    // Try to toggle the switch
    fireEvent.press(communicationsSwitch);
    
    // Alert should be shown
    expect(Alert.alert).toHaveBeenCalledWith(
      'Required Consent',
      'This consent is required for the service to function properly and cannot be disabled.',
      expect.anything()
    );
    
    // API should not be called
    expect(mockPrivacyApi.updateConsentPreference).not.toHaveBeenCalled();
  });
  
  test('handles error when updating consent fails', async () => {
    // Mock API to reject the update
    mockPrivacyApi.updateConsentPreference.mockRejectedValue(new Error('Update failed'));
    
    const { getByText, getAllByTestId } = render(<ConsentManagementScreen />);
    
    await waitFor(() => {
      expect(getByText('Analytics & Usage Data')).toBeTruthy();
    });
    
    // Find the toggle switch for Analytics & Usage Data
    const switches = getAllByTestId('consent-switch');
    const analyticsSwitch = switches[1];
    
    // Toggle the switch
    fireEvent.press(analyticsSwitch);
    
    // Confirm the change
    await waitFor(() => {
      expect(getByText('Confirm Consent Change')).toBeTruthy();
    });
    fireEvent.press(getByText('Confirm'));
    
    // Verify error alert was shown
    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith(
        'Error',
        'Failed to update consent preference. Please try again later.',
        expect.anything()
      );
    });
  });
  
  test('navigates back when back button is pressed', async () => {
    const { getByTestId } = render(<ConsentManagementScreen />);
    
    await waitFor(() => {
      expect(getByTestId('back-button')).toBeTruthy();
    });
    
    // Press back button
    fireEvent.press(getByTestId('back-button'));
    
    // Verify navigation.goBack was called
    expect(mockGoBack).toHaveBeenCalled();
  });
  
  test('uses biometric authentication for sensitive consents', async () => {
    const { getByText, getAllByTestId } = render(<ConsentManagementScreen />);
    
    // Mock the consent preferences to include a sensitive consent
    mockPrivacyApi.getConsentPreferences.mockResolvedValue([
      {
        id: 'consent-4',
        type: 'THIRD_PARTY',
        title: 'Third-Party Data Sharing',
        description: 'Allow us to share your data with trusted third-party partners.',
        status: false,
        updatedAt: '2025-04-08T09:15:00Z',
        policyVersion: '1.2',
      },
    ]);
    
    await waitFor(() => {
      expect(getByText('Third-Party Data Sharing')).toBeTruthy();
    });
    
    // Find the toggle switch
    const switches = getAllByTestId('consent-switch');
    
    // Toggle the switch
    fireEvent.press(switches[0]);
    
    // Confirm the change
    await waitFor(() => {
      expect(getByText('Confirm Consent Change')).toBeTruthy();
    });
    fireEvent.press(getByText('Confirm'));
    
    // Verify biometrics check was performed
    await waitFor(() => {
      expect(AuthService.isBiometricsAvailable).toHaveBeenCalled();
    });
  });
  
  test('has proper accessibility attributes', async () => {
    const { getByTestId, getAllByRole } = render(<ConsentManagementScreen />);
    
    await waitFor(() => {
      expect(getByTestId('back-button')).toBeTruthy();
    });
    
    // Check back button accessibility
    const backButton = getByTestId('back-button');
    expect(backButton.props.accessibilityLabel).toBe('Go back');
    expect(backButton.props.accessibilityRole).toBe('button');
    
    // Check switches accessibility
    const switches = getAllByRole('switch');
    switches.forEach(switchElem => {
      expect(switchElem.props.accessibilityLabel).toBeTruthy();
      expect(switchElem.props.accessibilityRole).toBe('switch');
    });
  });
});
