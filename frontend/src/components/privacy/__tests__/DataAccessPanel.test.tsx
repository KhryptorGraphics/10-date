import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import DataAccessPanel from '../DataAccessPanel';
import { PrivacyService } from '../../../services/privacy.service';

// Mock the privacy service
vi.mock('../../../services/privacy.service');
const mockedPrivacyService = PrivacyService as any;

describe('DataAccessPanel Component', () => {
  beforeEach(() => {
    // Reset mocks before each test
    vi.clearAllMocks();
    
    // Mock the exportData method
    mockedPrivacyService.exportData = vi.fn().mockResolvedValue({
      success: true,
      downloadUrl: 'http://example.com/data.zip'
    });
  });

  it('renders data access panel correctly', () => {
    render(<DataAccessPanel />);
    
    expect(screen.getByText(/data access/i)).toBeInTheDocument();
    expect(screen.getByText(/export your data/i)).toBeInTheDocument();
  });

  it('handles data export successfully', async () => {
    render(<DataAccessPanel />);
    
    const exportButton = screen.getByRole('button', { name: /export data/i });
    fireEvent.click(exportButton);

    await waitFor(() => {
      expect(mockedPrivacyService.exportData).toHaveBeenCalled();
    });
  });
});