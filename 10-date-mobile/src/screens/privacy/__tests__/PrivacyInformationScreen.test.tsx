import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import PrivacyInformationScreen from '../optimized/PrivacyInformationScreen';
import { useNavigation } from '@react-navigation/native';

// Mock the navigation hook
jest.mock('@react-navigation/native', () => ({
  useNavigation: jest.fn(),
}));

// Mock the lazy-loaded tab content components
jest.mock('../tabs/PolicyTabContent', () => {
  return {
    __esModule: true,
    default: () => <div data-testid="policy-tab-content">Policy Tab Content</div>,
  };
});

jest.mock('../tabs/FAQTabContent', () => {
  return {
    __esModule: true,
    default: () => <div data-testid="faq-tab-content">FAQ Tab Content</div>,
  };
});

jest.mock('../tabs/RightsTabContent', () => {
  return {
    __esModule: true,
    default: () => <div data-testid="rights-tab-content">Rights Tab Content</div>,
  };
});

jest.mock('../tabs/ContactTabContent', () => {
  return {
    __esModule: true,
    default: () => <div data-testid="contact-tab-content">Contact Tab Content</div>,
  };
});

// Mock the analytics service
jest.mock('../../../services/privacy-analytics.service', () => ({
  default: {
    trackScreenView: jest.fn(),
  },
}));

describe('PrivacyInformationScreen', () => {
  const mockGoBack = jest.fn();
  
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup navigation mock
    (useNavigation as jest.Mock).mockReturnValue({
      goBack: mockGoBack,
    });
  });
  
  test('renders correctly with title and tabs', async () => {
    const { getByText } = render(<PrivacyInformationScreen />);
    
    await waitFor(() => {
      expect(getByText('Privacy Information')).toBeTruthy();
      expect(getByText('Policy')).toBeTruthy();
      expect(getByText('Rights')).toBeTruthy();
      expect(getByText('FAQ')).toBeTruthy();
      expect(getByText('Contact')).toBeTruthy();
    });
  });
  
  test('displays policy tab content by default', async () => {
    const { getByTestId } = render(<PrivacyInformationScreen />);
    
    // Wait for lazy-loaded content to appear
    await waitFor(() => {
      expect(getByTestId('policy-tab-content')).toBeTruthy();
    });
  });
  
  test('switches to rights tab when clicked', async () => {
    const { getByText, getByTestId } = render(<PrivacyInformationScreen />);
    
    // Click on Rights tab
    fireEvent.press(getByText('Rights'));
    
    // Wait for lazy-loaded content to appear
    await waitFor(() => {
      expect(getByTestId('rights-tab-content')).toBeTruthy();
    });
  });
  
  test('switches to FAQ tab when clicked', async () => {
    const { getByText, getByTestId } = render(<PrivacyInformationScreen />);
    
    // Click on FAQ tab
    fireEvent.press(getByText('FAQ'));
    
    // Wait for lazy-loaded content to appear
    await waitFor(() => {
      expect(getByTestId('faq-tab-content')).toBeTruthy();
    });
  });
  
  test('switches to contact tab when clicked', async () => {
    const { getByText, getByTestId } = render(<PrivacyInformationScreen />);
    
    // Click on Contact tab
    fireEvent.press(getByText('Contact'));
    
    // Wait for lazy-loaded content to appear
    await waitFor(() => {
      expect(getByTestId('contact-tab-content')).toBeTruthy();
    });
  });
  
  test('navigates back when back button is pressed', async () => {
    const { getByTestId } = render(<PrivacyInformationScreen />);
    
    await waitFor(() => {
      expect(getByTestId('back-button')).toBeTruthy();
    });
    
    // Press back button
    fireEvent.press(getByTestId('back-button'));
    
    // Verify navigation.goBack was called
    expect(mockGoBack).toHaveBeenCalled();
  });
  
  test('shows loading indicator when switching tabs', async () => {
    const { getByText, getByTestId } = render(<PrivacyInformationScreen />);
    
    // Click on FAQ tab
    fireEvent.press(getByText('FAQ'));
    
    // Loading indicator should be shown briefly
    expect(getByTestId('loading-container')).toBeTruthy();
    
    // Wait for content to load
    await waitFor(() => {
      expect(getByTestId('faq-tab-content')).toBeTruthy();
    });
  });
  
  test('has proper accessibility attributes', async () => {
    const { getByTestId, getAllByRole } = render(<PrivacyInformationScreen />);
    
    await waitFor(() => {
      expect(getByTestId('back-button')).toBeTruthy();
    });
    
    // Check back button accessibility
    const backButton = getByTestId('back-button');
    expect(backButton.props.accessibilityLabel).toBe('Go back');
    expect(backButton.props.accessibilityRole).toBe('button');
    
    // Check tabs accessibility
    const tabs = getAllByRole('tab');
    expect(tabs.length).toBe(4);
    
    // Check that the active tab has the correct accessibility state
    const activeTab = tabs[0]; // Policy tab should be active by default
    expect(activeTab.props.accessibilityState.selected).toBe(true);
  });
});
