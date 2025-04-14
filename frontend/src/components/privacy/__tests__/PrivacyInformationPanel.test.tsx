import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import PrivacyInformationPanel from '../PrivacyInformationPanel';
import { PrivacyService } from '../../../services/privacy.service';

// Mock the privacy service
jest.mock('../../../services/privacy.service');
const mockedPrivacyService = PrivacyService as jest.Mocked<typeof PrivacyService>;

describe('PrivacyInformationPanel Component', () => {
  beforeEach(() => {
    // Reset mocks before each test
    jest.clearAllMocks();
    
    // Mock the getPrivacyPolicy method
    mockedPrivacyService.getPrivacyPolicy.mockResolvedValue({
      title: 'Privacy Policy',
      lastUpdated: '2025-04-01T00:00:00Z',
      sections: [
        {
          id: 'section-1',
          title: '1. Information We Collect',
          content: 'We collect various types of information from and about users of our Services...',
        },
        {
          id: 'section-2',
          title: '2. How We Use Your Information',
          content: 'We use the information we collect to provide, maintain, and improve our Services...',
        },
      ],
    });
    
    // Mock the getPrivacyFAQs method
    mockedPrivacyService.getPrivacyFAQs.mockResolvedValue([
      {
        id: 'faq-1',
        question: 'What personal data does 10-Date collect?',
        answer: '10-Date collects various types of personal data, including profile information...',
        tags: ['data', 'collection', 'personal'],
      },
      {
        id: 'faq-2',
        question: 'How does 10-Date use my data?',
        answer: '10-Date uses your data to provide and improve our services, personalize your experience...',
        tags: ['data', 'usage', 'purpose'],
      },
    ]);
    
    // Mock the getUserRights method
    mockedPrivacyService.getUserRights.mockResolvedValue([
      {
        id: 'right-1',
        title: 'Right to Access',
        description: 'You have the right to access and view the personal data we hold about you...',
      },
      {
        id: 'right-2',
        title: 'Right to Rectification',
        description: 'You have the right to correct inaccurate or incomplete personal data...',
      },
    ]);
    
    // Mock the getContactInfo method
    mockedPrivacyService.getContactInfo.mockResolvedValue({
      email: 'privacy@10date.com',
      phone: '+1 (555) 123-4567',
      address: '123 Privacy Street, San Francisco, CA 94105, United States',
      dpo: 'Jane Smith',
    });
  });
  
  test('renders the component with correct title and description', () => {
    render(<PrivacyInformationPanel />);
    
    expect(screen.getByText('Privacy Information')).toBeInTheDocument();
    expect(screen.getByText(/Learn about our privacy practices/i)).toBeInTheDocument();
  });
  
  test('renders tabs with correct labels', () => {
    render(<PrivacyInformationPanel />);
    
    expect(screen.getByText('Privacy Policy')).toBeInTheDocument();
    expect(screen.getByText('Your Rights')).toBeInTheDocument();
    expect(screen.getByText('FAQ')).toBeInTheDocument();
    expect(screen.getByText('Contact')).toBeInTheDocument();
  });
  
  test('displays privacy policy content by default', async () => {
    render(<PrivacyInformationPanel />);
    
    // Wait for privacy policy to load
    await waitFor(() => {
      expect(screen.getByText('Privacy Policy')).toBeInTheDocument();
      expect(screen.getByText('Last Updated: April 1, 2025')).toBeInTheDocument();
    });
    
    // Verify policy sections are displayed
    expect(screen.getByText('1. Information We Collect')).toBeInTheDocument();
    expect(screen.getByText('2. How We Use Your Information')).toBeInTheDocument();
  });
  
  test('switches to Your Rights tab when clicked', async () => {
    render(<PrivacyInformationPanel />);
    
    // Wait for component to load
    await waitFor(() => {
      expect(screen.getByText('Privacy Policy')).toBeInTheDocument();
    });
    
    // Click on Your Rights tab
    fireEvent.click(screen.getByText('Your Rights'));
    
    // Verify rights content is displayed
    await waitFor(() => {
      expect(screen.getByText('Your Privacy Rights')).toBeInTheDocument();
      expect(screen.getByText('Right to Access')).toBeInTheDocument();
      expect(screen.getByText('Right to Rectification')).toBeInTheDocument();
    });
  });
  
  test('switches to FAQ tab when clicked', async () => {
    render(<PrivacyInformationPanel />);
    
    // Wait for component to load
    await waitFor(() => {
      expect(screen.getByText('Privacy Policy')).toBeInTheDocument();
    });
    
    // Click on FAQ tab
    fireEvent.click(screen.getByText('FAQ'));
    
    // Verify FAQ content is displayed
    await waitFor(() => {
      expect(screen.getByText('Frequently Asked Questions')).toBeInTheDocument();
      expect(screen.getByText('What personal data does 10-Date collect?')).toBeInTheDocument();
      expect(screen.getByText('How does 10-Date use my data?')).toBeInTheDocument();
    });
  });
  
  test('switches to Contact tab when clicked', async () => {
    render(<PrivacyInformationPanel />);
    
    // Wait for component to load
    await waitFor(() => {
      expect(screen.getByText('Privacy Policy')).toBeInTheDocument();
    });
    
    // Click on Contact tab
    fireEvent.click(screen.getByText('Contact'));
    
    // Verify contact content is displayed
    await waitFor(() => {
      expect(screen.getByText('Contact Us')).toBeInTheDocument();
      expect(screen.getByText('privacy@10date.com')).toBeInTheDocument();
      expect(screen.getByText('+1 (555) 123-4567')).toBeInTheDocument();
    });
  });
  
  test('expands FAQ items when clicked', async () => {
    render(<PrivacyInformationPanel />);
    
    // Wait for component to load
    await waitFor(() => {
      expect(screen.getByText('Privacy Policy')).toBeInTheDocument();
    });
    
    // Switch to FAQ tab
    fireEvent.click(screen.getByText('FAQ'));
    
    // Wait for FAQ content to load
    await waitFor(() => {
      expect(screen.getByText('What personal data does 10-Date collect?')).toBeInTheDocument();
    });
    
    // Initially, answer should not be visible
    const answer = screen.queryByText(/10-Date collects various types of personal data/i);
    expect(answer).not.toBeVisible();
    
    // Click on FAQ item to expand
    fireEvent.click(screen.getByText('What personal data does 10-Date collect?'));
    
    // Answer should now be visible
    await waitFor(() => {
      expect(screen.getByText(/10-Date collects various types of personal data/i)).toBeVisible();
    });
  });
  
  test('allows searching FAQs', async () => {
    render(<PrivacyInformationPanel />);
    
    // Wait for component to load
    await waitFor(() => {
      expect(screen.getByText('Privacy Policy')).toBeInTheDocument();
    });
    
    // Switch to FAQ tab
    fireEvent.click(screen.getByText('FAQ'));
    
    // Wait for FAQ content to load
    await waitFor(() => {
      expect(screen.getByText('What personal data does 10-Date collect?')).toBeInTheDocument();
    });
    
    // Find search input
    const searchInput = screen.getByPlaceholderText('Search FAQs...');
    
    // Enter search query
    fireEvent.change(searchInput, { target: { value: 'usage' } });
    
    // Wait for search results
    await waitFor(() => {
      // Should show the FAQ about usage
      expect(screen.getByText('How does 10-Date use my data?')).toBeInTheDocument();
      // Should not show the FAQ about collection
      expect(screen.queryByText('What personal data does 10-Date collect?')).not.toBeInTheDocument();
    });
    
    // Clear search
    fireEvent.change(searchInput, { target: { value: '' } });
    
    // All FAQs should be visible again
    await waitFor(() => {
      expect(screen.getByText('What personal data does 10-Date collect?')).toBeInTheDocument();
      expect(screen.getByText('How does 10-Date use my data?')).toBeInTheDocument();
    });
  });
  
  test('displays contact form in Contact tab', async () => {
    render(<PrivacyInformationPanel />);
    
    // Wait for component to load
    await waitFor(() => {
      expect(screen.getByText('Privacy Policy')).toBeInTheDocument();
    });
    
    // Switch to Contact tab
    fireEvent.click(screen.getByText('Contact'));
    
    // Verify contact form is displayed
    await waitFor(() => {
      expect(screen.getByText('Send a Message')).toBeInTheDocument();
      expect(screen.getByLabelText('Your Name')).toBeInTheDocument();
      expect(screen.getByLabelText('Your Email')).toBeInTheDocument();
      expect(screen.getByLabelText('Subject')).toBeInTheDocument();
      expect(screen.getByLabelText('Message')).toBeInTheDocument();
      expect(screen.getByText('Send Message')).toBeInTheDocument();
    });
  });
  
  test('handles errors when loading privacy policy', async () => {
    // Mock the service to reject the request
    mockedPrivacyService.getPrivacyPolicy.mockRejectedValue(new Error('Failed to load policy'));
    
    render(<PrivacyInformationPanel />);
    
    // Verify error message is displayed
    await waitFor(() => {
      expect(screen.getByText(/Failed to load privacy policy/i)).toBeInTheDocument();
    });
  });
  
  test('meets accessibility requirements', async () => {
    const { container } = render(<PrivacyInformationPanel />);
    
    // Wait for component to load
    await waitFor(() => {
      expect(screen.getByText('Privacy Policy')).toBeInTheDocument();
    });
    
    // Check that all tabs have proper roles
    const tabs = screen.getAllByRole('tab');
    expect(tabs.length).toBe(4);
    
    // Check that the active tab has the correct aria-selected state
    const activeTab = screen.getByRole('tab', { selected: true });
    expect(activeTab).toHaveTextContent('Privacy Policy');
    
    // Check that all interactive elements have accessible names
    const interactiveElements = container.querySelectorAll('button, a, [role="tab"]');
    interactiveElements.forEach(element => {
      expect(element).toHaveAccessibleName();
    });
    
    // Check that tab panel has correct role
    const tabPanel = container.querySelector('[role="tabpanel"]');
    expect(tabPanel).toBeInTheDocument();
  });
});
