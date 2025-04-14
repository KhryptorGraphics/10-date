import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import DataAccessPanel from '../DataAccessPanel';
import { PrivacyService } from '../../../services/privacy.service';

// Mock the privacy service
jest.mock('../../../services/privacy.service');
const mockedPrivacyService = PrivacyService as jest.Mocked<typeof PrivacyService>;

describe('DataAccessPanel Component', () => {
  beforeEach(() => {
    // Reset mocks before each test
    jest.clearAllMocks();
    
    // Mock the getDataCategories method
    mockedPrivacyService.getDataCategories.mockResolvedValue([
      { id: 'profile', name: 'Profile Information', description: 'Your basic profile information', selected: true },
      { id: 'messages', name: 'Messages', description: 'Your message history', selected: false },
      { id: 'matches', name: 'Matches', description: 'Your match history', selected: false },
    ]);
    
    // Mock the getExportHistory method
    mockedPrivacyService.getExportHistory.mockResolvedValue([
      { id: '1', requestDate: '2025-04-10T10:30:00Z', status: 'completed', format: 'JSON', categories: ['profile', 'messages'] },
      { id: '2', requestDate: '2025-04-05T14:20:00Z', status: 'completed', format: 'CSV', categories: ['profile'] },
    ]);
    
    // Mock the requestDataExport method
    mockedPrivacyService.requestDataExport.mockResolvedValue({ 
      id: '3', 
      requestDate: '2025-04-15T09:00:00Z', 
      status: 'pending', 
      format: 'JSON', 
      categories: ['profile', 'messages', 'matches'] 
    });
  });
  
  test('renders the component with correct title and description', () => {
    render(<DataAccessPanel />);
    
    expect(screen.getByText('Data Access & Export')).toBeInTheDocument();
    expect(screen.getByText(/Access and download your personal data/i)).toBeInTheDocument();
  });
  
  test('loads and displays data categories', async () => {
    render(<DataAccessPanel />);
    
    // Wait for data categories to load
    await waitFor(() => {
      expect(screen.getByText('Profile Information')).toBeInTheDocument();
      expect(screen.getByText('Messages')).toBeInTheDocument();
      expect(screen.getByText('Matches')).toBeInTheDocument();
    });
    
    // Verify descriptions are displayed
    expect(screen.getByText('Your basic profile information')).toBeInTheDocument();
    expect(screen.getByText('Your message history')).toBeInTheDocument();
    expect(screen.getByText('Your match history')).toBeInTheDocument();
  });
  
  test('loads and displays export history', async () => {
    render(<DataAccessPanel />);
    
    // Wait for export history to load
    await waitFor(() => {
      expect(screen.getByText('Export History')).toBeInTheDocument();
    });
    
    // Verify export history items are displayed
    const dateRegex1 = /April 10, 2025/i;
    const dateRegex2 = /April 5, 2025/i;
    
    expect(screen.getByText(dateRegex1)).toBeInTheDocument();
    expect(screen.getByText(dateRegex2)).toBeInTheDocument();
    expect(screen.getAllByText('Completed').length).toBe(2);
    expect(screen.getByText('JSON')).toBeInTheDocument();
    expect(screen.getByText('CSV')).toBeInTheDocument();
  });
  
  test('allows selecting and deselecting data categories', async () => {
    render(<DataAccessPanel />);
    
    // Wait for data categories to load
    await waitFor(() => {
      expect(screen.getByText('Profile Information')).toBeInTheDocument();
    });
    
    // Find checkboxes
    const profileCheckbox = screen.getByLabelText('Profile Information');
    const messagesCheckbox = screen.getByLabelText('Messages');
    const matchesCheckbox = screen.getByLabelText('Matches');
    
    // Verify initial state
    expect(profileCheckbox).toBeChecked();
    expect(messagesCheckbox).not.toBeChecked();
    expect(matchesCheckbox).not.toBeChecked();
    
    // Toggle checkboxes
    fireEvent.click(profileCheckbox);
    fireEvent.click(messagesCheckbox);
    
    // Verify updated state
    expect(profileCheckbox).not.toBeChecked();
    expect(messagesCheckbox).toBeChecked();
    expect(matchesCheckbox).not.toBeChecked();
  });
  
  test('allows selecting export format', async () => {
    render(<DataAccessPanel />);
    
    // Wait for component to load
    await waitFor(() => {
      expect(screen.getByText('Export Format')).toBeInTheDocument();
    });
    
    // Find format radio buttons
    const jsonRadio = screen.getByLabelText('JSON');
    const csvRadio = screen.getByLabelText('CSV');
    const pdfRadio = screen.getByLabelText('PDF');
    
    // Verify initial state (JSON should be default)
    expect(jsonRadio).toBeChecked();
    expect(csvRadio).not.toBeChecked();
    expect(pdfRadio).not.toBeChecked();
    
    // Select CSV format
    fireEvent.click(csvRadio);
    
    // Verify updated state
    expect(jsonRadio).not.toBeChecked();
    expect(csvRadio).toBeChecked();
    expect(pdfRadio).not.toBeChecked();
  });
  
  test('submits data export request with selected options', async () => {
    render(<DataAccessPanel />);
    
    // Wait for component to load
    await waitFor(() => {
      expect(screen.getByText('Profile Information')).toBeInTheDocument();
    });
    
    // Select data categories
    const messagesCheckbox = screen.getByLabelText('Messages');
    const matchesCheckbox = screen.getByLabelText('Matches');
    fireEvent.click(messagesCheckbox);
    fireEvent.click(matchesCheckbox);
    
    // Select export format
    const csvRadio = screen.getByLabelText('CSV');
    fireEvent.click(csvRadio);
    
    // Submit the form
    const requestButton = screen.getByText('Request Data Export');
    fireEvent.click(requestButton);
    
    // Verify the service was called with correct parameters
    await waitFor(() => {
      expect(mockedPrivacyService.requestDataExport).toHaveBeenCalledWith({
        categories: ['profile', 'messages', 'matches'],
        format: 'CSV',
      });
    });
    
    // Verify success message is displayed
    await waitFor(() => {
      expect(screen.getByText(/Your data export request has been submitted/i)).toBeInTheDocument();
    });
  });
  
  test('displays error message when export request fails', async () => {
    // Mock the service to reject the request
    mockedPrivacyService.requestDataExport.mockRejectedValue(new Error('Export failed'));
    
    render(<DataAccessPanel />);
    
    // Wait for component to load
    await waitFor(() => {
      expect(screen.getByText('Profile Information')).toBeInTheDocument();
    });
    
    // Submit the form
    const requestButton = screen.getByText('Request Data Export');
    fireEvent.click(requestButton);
    
    // Verify error message is displayed
    await waitFor(() => {
      expect(screen.getByText(/Failed to submit data export request/i)).toBeInTheDocument();
    });
  });
  
  test('handles empty export history', async () => {
    // Mock empty export history
    mockedPrivacyService.getExportHistory.mockResolvedValue([]);
    
    render(<DataAccessPanel />);
    
    // Wait for export history to load
    await waitFor(() => {
      expect(screen.getByText('Export History')).toBeInTheDocument();
    });
    
    // Verify empty state message
    expect(screen.getByText(/You haven't requested any data exports yet/i)).toBeInTheDocument();
  });
  
  test('meets accessibility requirements', async () => {
    const { container } = render(<DataAccessPanel />);
    
    // Wait for component to load
    await waitFor(() => {
      expect(screen.getByText('Profile Information')).toBeInTheDocument();
    });
    
    // Check that all interactive elements have accessible names
    const interactiveElements = container.querySelectorAll('button, input, a');
    interactiveElements.forEach(element => {
      expect(element).toHaveAccessibleName();
    });
    
    // Check that form elements have proper labels
    const formElements = container.querySelectorAll('input[type="checkbox"], input[type="radio"]');
    formElements.forEach(element => {
      expect(element).toHaveAccessibleName();
    });
  });
});
