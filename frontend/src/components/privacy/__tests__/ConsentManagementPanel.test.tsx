import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import ConsentManagementPanel from '../ConsentManagementPanel';
import { PrivacyService } from '../../../services/privacy.service';

// Mock the privacy service
vi.mock('../../../services/privacy.service');
const mockedPrivacyService = PrivacyService as any;

describe('ConsentManagementPanel Component', () => {
  beforeEach(() => {
    // Reset mocks before each test
    vi.clearAllMocks();
    
    // Mock the getConsentPreferences method
    mockedPrivacyService.getConsentPreferences.mockResolvedValue([
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
    
    // Mock the getConsentHistory method
    mockedPrivacyService.getConsentHistory.mockResolvedValue([
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
    
    // Mock the updateConsentPreference method
    mockedPrivacyService.updateConsentPreference.mockResolvedValue({
      id: 'consent-2',
      status: true,
      updatedAt: '2025-04-15T09:00:00Z',
    });
  });
  
  test('renders the component with correct title and description', () => {
    render(<ConsentManagementPanel />);
    
    expect(screen.getByText('Consent Management')).toBeInTheDocument();
    expect(screen.getByText(/Manage your privacy preferences and consent settings/i)).toBeInTheDocument();
  });
  
  test('loads and displays consent preferences', async () => {
    render(<ConsentManagementPanel />);
    
    // Wait for consent preferences to load
    await waitFor(() => {
      expect(screen.getByText('Marketing Communications')).toBeInTheDocument();
      expect(screen.getByText('Analytics & Usage Data')).toBeInTheDocument();
      expect(screen.getByText('Service Communications')).toBeInTheDocument();
    });
    
    // Verify descriptions are displayed
    expect(screen.getByText(/Allow us to send you marketing communications/i)).toBeInTheDocument();
    expect(screen.getByText(/Allow us to collect and analyze data/i)).toBeInTheDocument();
    expect(screen.getByText(/Allow us to send you important service communications/i)).toBeInTheDocument();
    
    // Verify required badge is displayed
    expect(screen.getByText('Required')).toBeInTheDocument();
  });
  
  test('toggles consent expansion when clicked', async () => {
    render(<ConsentManagementPanel />);
    
    // Wait for consent preferences to load
    await waitFor(() => {
      expect(screen.getByText('Marketing Communications')).toBeInTheDocument();
    });
    
    // Initially, descriptions should not be visible
    const marketingDescription = screen.queryByText(/Allow us to send you marketing communications/i);
    expect(marketingDescription).not.toBeVisible();
    
    // Click to expand
    fireEvent.click(screen.getByText('Marketing Communications'));
    
    // Description should now be visible
    await waitFor(() => {
      expect(screen.getByText(/Allow us to send you marketing communications/i)).toBeVisible();
    });
    
    // Click again to collapse
    fireEvent.click(screen.getByText('Marketing Communications'));
    
    // Description should be hidden again
    await waitFor(() => {
      expect(screen.queryByText(/Allow us to send you marketing communications/i)).not.toBeVisible();
    });
  });
  
  test('displays consent history when history button is clicked', async () => {
    render(<ConsentManagementPanel />);
    
    // Wait for consent preferences to load
    await waitFor(() => {
      expect(screen.getByText('Marketing Communications')).toBeInTheDocument();
    });
    
    // Find and click history button for Marketing Communications
    const historyButtons = screen.getAllByLabelText('View consent history');
    fireEvent.click(historyButtons[0]);
    
    // Wait for history modal to appear
    await waitFor(() => {
      expect(screen.getByText('Consent History')).toBeInTheDocument();
      expect(screen.getByText('Marketing Communications')).toBeInTheDocument();
    });
    
    // Verify history items are displayed
    expect(screen.getByText('Consent granted via Privacy Center')).toBeInTheDocument();
    expect(screen.getByText('Consent revoked via Privacy Center')).toBeInTheDocument();
    
    // Close the modal
    fireEvent.click(screen.getByText('Close'));
    
    // Verify modal is closed
    await waitFor(() => {
      expect(screen.queryByText('Consent History')).not.toBeInTheDocument();
    });
  });
  
  test('toggles consent status when switch is clicked', async () => {
    render(<ConsentManagementPanel />);
    
    // Wait for consent preferences to load
    await waitFor(() => {
      expect(screen.getByText('Analytics & Usage Data')).toBeInTheDocument();
    });
    
    // Find the toggle switch for Analytics & Usage Data (initially off)
    const analyticsSwitches = screen.getAllByRole('switch');
    const analyticsSwitch = analyticsSwitches[1]; // Second switch should be for Analytics
    
    // Verify initial state
    expect(analyticsSwitch).not.toBeChecked();
    
    // Toggle the switch
    fireEvent.click(analyticsSwitch);
    
    // Confirmation dialog should appear
    await waitFor(() => {
      expect(screen.getByText('Confirm Consent Change')).toBeInTheDocument();
      expect(screen.getByText(/Are you sure you want to enable consent for Analytics & Usage Data/i)).toBeInTheDocument();
    });
    
    // Confirm the change
    fireEvent.click(screen.getByText('Confirm'));
    
    // Verify the service was called with correct parameters
    await waitFor(() => {
      expect(mockedPrivacyService.updateConsentPreference).toHaveBeenCalledWith('consent-2', true);
    });
    
    // Verify switch is now checked
    await waitFor(() => {
      expect(analyticsSwitch).toBeChecked();
    });
  });
  
  test('cannot toggle required consents', async () => {
    render(<ConsentManagementPanel />);
    
    // Wait for consent preferences to load
    await waitFor(() => {
      expect(screen.getByText('Service Communications')).toBeInTheDocument();
    });
    
    // Find the toggle switch for Service Communications (required)
    const communicationsSwitches = screen.getAllByRole('switch');
    const communicationsSwitch = communicationsSwitches[2]; // Third switch should be for Service Communications
    
    // Verify initial state
    expect(communicationsSwitch).toBeChecked();
    expect(communicationsSwitch).toBeDisabled();
    
    // Try to toggle the switch (should not trigger any action)
    fireEvent.click(communicationsSwitch);
    
    // Confirmation dialog should not appear
    expect(screen.queryByText('Confirm Consent Change')).not.toBeInTheDocument();
    
    // Service should not be called
    expect(mockedPrivacyService.updateConsentPreference).not.toHaveBeenCalled();
  });
  
  test('displays error message when update fails', async () => {
    // Mock the service to reject the update
    mockedPrivacyService.updateConsentPreference.mockRejectedValue(new Error('Update failed'));
    
    render(<ConsentManagementPanel />);
    
    // Wait for consent preferences to load
    await waitFor(() => {
      expect(screen.getByText('Analytics & Usage Data')).toBeInTheDocument();
    });
    
    // Find the toggle switch for Analytics & Usage Data
    const analyticsSwitches = screen.getAllByRole('switch');
    const analyticsSwitch = analyticsSwitches[1];
    
    // Toggle the switch
    fireEvent.click(analyticsSwitch);
    
    // Confirm the change
    await waitFor(() => {
      expect(screen.getByText('Confirm Consent Change')).toBeInTheDocument();
    });
    fireEvent.click(screen.getByText('Confirm'));
    
    // Verify error message is displayed
    await waitFor(() => {
      expect(screen.getByText(/Failed to update consent preference/i)).toBeInTheDocument();
    });
  });
  
  test('meets accessibility requirements', async () => {
    const { container } = render(<ConsentManagementPanel />);
    
    // Wait for component to load
    await waitFor(() => {
      expect(screen.getByText('Marketing Communications')).toBeInTheDocument();
    });
    
    // Check that all interactive elements have accessible names
    const interactiveElements = container.querySelectorAll('button, input[type="checkbox"], a');
    interactiveElements.forEach(element => {
      expect(element).toHaveAccessibleName();
    });
    
    // Check that switches have proper roles
    const switches = screen.getAllByRole('switch');
    expect(switches.length).toBe(3);
    
    // Check that required consent is properly labeled as disabled
    const requiredSwitch = switches[2];
    expect(requiredSwitch).toHaveAttribute('aria-disabled', 'true');
  });
});
