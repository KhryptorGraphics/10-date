import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import AccountManagementPanel from '../AccountManagementPanel';
import { PrivacyService } from '../../../services/privacy.service';
import { AuthService } from '../../../services/auth.service';

// Mock the privacy service and auth service
vi.mock('../../../services/privacy.service');
vi.mock('../../../services/auth.service');
const mockedPrivacyService = PrivacyService as vi.Mocked<typeof PrivacyService>;
const mockedAuthService = AuthService as vi.Mocked<typeof AuthService>;

describe('AccountManagementPanel Component', () => {
  beforeEach(() => {
    // Reset mocks before each test
    vi.clearAllMocks();
    
    // Mock the getAccountInfo method
    mockedPrivacyService.getAccountInfo.mockResolvedValue({
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
    
    // Mock the getAccountActivity method
    mockedPrivacyService.getAccountActivity.mockResolvedValue([
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
    
    // Mock the deleteAccount method
    mockedPrivacyService.deleteAccount.mockResolvedValue({ success: true });
    
    // Mock the anonymizeAccount method
    mockedPrivacyService.anonymizeAccount.mockResolvedValue({ success: true });
    
    // Mock the auth service methods
    mockedAuthService.validatePassword.mockResolvedValue(true);
    mockedAuthService.logout.mockResolvedValue(undefined);
  });
  
  test('renders the component with correct title and description', () => {
    render(<AccountManagementPanel />);
    
    expect(screen.getByText('Account Management')).toBeInTheDocument();
    expect(screen.getByText(/Manage your account settings and data retention preferences/i)).toBeInTheDocument();
  });
  
  test('loads and displays account information', async () => {
    render(<AccountManagementPanel />);
    
    // Wait for account info to load
    await waitFor(() => {
      expect(screen.getByText('Account Information')).toBeInTheDocument();
    });
    
    // Verify account details are displayed
    expect(screen.getByText('user@example.com')).toBeInTheDocument();
    expect(screen.getByText('testuser')).toBeInTheDocument();
    expect(screen.getByText('Active')).toBeInTheDocument();
    expect(screen.getByText('Premium')).toBeInTheDocument();
    
    // Verify dates are formatted correctly
    expect(screen.getByText(/January 15, 2024/i)).toBeInTheDocument();
    expect(screen.getByText(/April 10, 2025/i)).toBeInTheDocument();
    expect(screen.getByText(/December 31, 2025/i)).toBeInTheDocument();
  });
  
  test('loads and displays account activity', async () => {
    render(<AccountManagementPanel />);
    
    // Wait for account activity to load
    await waitFor(() => {
      expect(screen.getByText('Recent Account Activity')).toBeInTheDocument();
    });
    
    // Verify activity items are displayed
    expect(screen.getByText('Login')).toBeInTheDocument();
    expect(screen.getByText('Profile Update')).toBeInTheDocument();
    expect(screen.getByText('Chrome on Windows')).toBeInTheDocument();
    expect(screen.getByText('San Francisco, CA')).toBeInTheDocument();
  });
  
  test('opens delete account modal when delete button is clicked', async () => {
    render(<AccountManagementPanel />);
    
    // Wait for component to load
    await waitFor(() => {
      expect(screen.getByText('Account Information')).toBeInTheDocument();
    });
    
    // Find and click delete account button
    const deleteButton = screen.getByText('Delete Account');
    fireEvent.click(deleteButton);
    
    // Verify delete modal is displayed
    await waitFor(() => {
      expect(screen.getByText('Delete Account')).toBeInTheDocument();
      expect(screen.getByText(/This action is permanent and cannot be undone/i)).toBeInTheDocument();
    });
    
    // Close the modal
    const cancelButton = screen.getByText('Cancel');
    fireEvent.click(cancelButton);
    
    // Verify modal is closed
    await waitFor(() => {
      expect(screen.queryByText(/This action is permanent and cannot be undone/i)).not.toBeInTheDocument();
    });
  });
  
  test('opens anonymize account modal when anonymize button is clicked', async () => {
    render(<AccountManagementPanel />);
    
    // Wait for component to load
    await waitFor(() => {
      expect(screen.getByText('Account Information')).toBeInTheDocument();
    });
    
    // Find and click anonymize account button
    const anonymizeButton = screen.getByText('Anonymize Account');
    fireEvent.click(anonymizeButton);
    
    // Verify anonymize modal is displayed
    await waitFor(() => {
      expect(screen.getByText('Anonymize Account')).toBeInTheDocument();
      expect(screen.getByText(/Your personal information will be anonymized/i)).toBeInTheDocument();
    });
    
    // Close the modal
    const cancelButton = screen.getByText('Cancel');
    fireEvent.click(cancelButton);
    
    // Verify modal is closed
    await waitFor(() => {
      expect(screen.queryByText(/Your personal information will be anonymized/i)).not.toBeInTheDocument();
    });
  });
  
  test('deletes account when confirmed with valid password', async () => {
    render(<AccountManagementPanel />);
    
    // Wait for component to load
    await waitFor(() => {
      expect(screen.getByText('Account Information')).toBeInTheDocument();
    });
    
    // Open delete account modal
    const deleteButton = screen.getByText('Delete Account');
    fireEvent.click(deleteButton);
    
    // Enter password
    const passwordInput = screen.getByLabelText('Password');
    fireEvent.change(passwordInput, { target: { value: 'correctPassword' } });
    
    // Select data deletion options
    const messageCheckbox = screen.getByLabelText('Messages');
    const matchesCheckbox = screen.getByLabelText('Matches');
    fireEvent.click(messageCheckbox);
    fireEvent.click(matchesCheckbox);
    
    // Confirm deletion
    const confirmButton = screen.getByText('Delete My Account');
    fireEvent.click(confirmButton);
    
    // Verify password validation was called
    await waitFor(() => {
      expect(mockedAuthService.validatePassword).toHaveBeenCalledWith('correctPassword');
    });
    
    // Verify delete account was called with correct parameters
    await waitFor(() => {
      expect(mockedPrivacyService.deleteAccount).toHaveBeenCalledWith({
        deleteMessages: true,
        deleteMatches: true,
        deletePaymentHistory: false,
        deleteActivityLogs: false,
      });
    });
    
    // Verify logout was called
    expect(mockedAuthService.logout).toHaveBeenCalled();
    
    // Verify success message is displayed
    await waitFor(() => {
      expect(screen.getByText(/Your account has been successfully deleted/i)).toBeInTheDocument();
    });
  });
  
  test('shows error when password is invalid during account deletion', async () => {
    // Mock password validation to fail
    mockedAuthService.validatePassword.mockResolvedValue(false);
    
    render(<AccountManagementPanel />);
    
    // Wait for component to load
    await waitFor(() => {
      expect(screen.getByText('Account Information')).toBeInTheDocument();
    });
    
    // Open delete account modal
    const deleteButton = screen.getByText('Delete Account');
    fireEvent.click(deleteButton);
    
    // Enter password
    const passwordInput = screen.getByLabelText('Password');
    fireEvent.change(passwordInput, { target: { value: 'wrongPassword' } });
    
    // Confirm deletion
    const confirmButton = screen.getByText('Delete My Account');
    fireEvent.click(confirmButton);
    
    // Verify error message is displayed
    await waitFor(() => {
      expect(screen.getByText(/Incorrect password/i)).toBeInTheDocument();
    });
    
    // Verify delete account was not called
    expect(mockedPrivacyService.deleteAccount).not.toHaveBeenCalled();
  });
  
  test('anonymizes account when confirmed with valid password', async () => {
    render(<AccountManagementPanel />);
    
    // Wait for component to load
    await waitFor(() => {
      expect(screen.getByText('Account Information')).toBeInTheDocument();
    });
    
    // Open anonymize account modal
    const anonymizeButton = screen.getByText('Anonymize Account');
    fireEvent.click(anonymizeButton);
    
    // Enter password
    const passwordInput = screen.getByLabelText('Password');
    fireEvent.change(passwordInput, { target: { value: 'correctPassword' } });
    
    // Confirm anonymization
    const confirmButton = screen.getByText('Anonymize My Account');
    fireEvent.click(confirmButton);
    
    // Verify password validation was called
    await waitFor(() => {
      expect(mockedAuthService.validatePassword).toHaveBeenCalledWith('correctPassword');
    });
    
    // Verify anonymize account was called
    await waitFor(() => {
      expect(mockedPrivacyService.anonymizeAccount).toHaveBeenCalled();
    });
    
    // Verify success message is displayed
    await waitFor(() => {
      expect(screen.getByText(/Your account has been successfully anonymized/i)).toBeInTheDocument();
    });
  });
  
  test('displays error message when account deletion fails', async () => {
    // Mock the service to reject the deletion
    mockedPrivacyService.deleteAccount.mockRejectedValue(new Error('Deletion failed'));
    
    render(<AccountManagementPanel />);
    
    // Wait for component to load
    await waitFor(() => {
      expect(screen.getByText('Account Information')).toBeInTheDocument();
    });
    
    // Open delete account modal
    const deleteButton = screen.getByText('Delete Account');
    fireEvent.click(deleteButton);
    
    // Enter password
    const passwordInput = screen.getByLabelText('Password');
    fireEvent.change(passwordInput, { target: { value: 'correctPassword' } });
    
    // Confirm deletion
    const confirmButton = screen.getByText('Delete My Account');
    fireEvent.click(confirmButton);
    
    // Verify error message is displayed
    await waitFor(() => {
      expect(screen.getByText(/Failed to delete account/i)).toBeInTheDocument();
    });
  });
  
  test('meets accessibility requirements', async () => {
    const { container } = render(<AccountManagementPanel />);
    
    // Wait for component to load
    await waitFor(() => {
      expect(screen.getByText('Account Information')).toBeInTheDocument();
    });
    
    // Check that all interactive elements have accessible names
    const interactiveElements = container.querySelectorAll('button, input, a');
    interactiveElements.forEach(element => {
      expect(element).toHaveAccessibleName();
    });
    
    // Check that buttons have proper roles
    const buttons = screen.getAllByRole('button');
    expect(buttons.length).toBeGreaterThan(0);
    
    // Check that delete and anonymize buttons have appropriate aria attributes
    const deleteButton = screen.getByText('Delete Account');
    expect(deleteButton).toHaveAttribute('aria-label', 'Delete Account');
    
    const anonymizeButton = screen.getByText('Anonymize Account');
    expect(anonymizeButton).toHaveAttribute('aria-label', 'Anonymize Account');
  });
});
