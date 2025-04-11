import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import PrivacyCenterScreen from '../../../src/screens/privacy/PrivacyCenterScreen';

// Mock the navigation
const mockNavigate = jest.fn();
jest.mock('@react-navigation/native', () => {
  const actualNav = jest.requireActual('@react-navigation/native');
  return {
    ...actualNav,
    useNavigation: () => ({
      navigate: mockNavigate,
    }),
  };
});

// Mock the Stack Navigator
const Stack = createStackNavigator();
const MockNavigator = () => (
  <NavigationContainer>
    <Stack.Navigator>
      <Stack.Screen name="PrivacyCenter" component={PrivacyCenterScreen} />
    </Stack.Navigator>
  </NavigationContainer>
);

describe('PrivacyCenterScreen', () => {
  beforeEach(() => {
    mockNavigate.mockClear();
  });

  it('renders correctly', () => {
    const { getByText } = render(<MockNavigator />);
    
    // Check if the title is rendered
    expect(getByText('Privacy Center')).toBeTruthy();
    
    // Check if all card titles are rendered
    expect(getByText('Data Access & Export')).toBeTruthy();
    expect(getByText('Consent Management')).toBeTruthy();
    expect(getByText('Account Management')).toBeTruthy();
    expect(getByText('Privacy Information')).toBeTruthy();
  });

  it('navigates to DataAccess screen when Data Access button is pressed', () => {
    const { getByText } = render(<MockNavigator />);
    
    // Find and press the Data Access button
    const dataAccessButton = getByText('Manage Data');
    fireEvent.press(dataAccessButton);
    
    // Check if navigation was called with the correct screen
    expect(mockNavigate).toHaveBeenCalledWith('DataAccess');
  });

  it('navigates to ConsentManagement screen when Consent Management button is pressed', () => {
    const { getByText } = render(<MockNavigator />);
    
    // Find and press the Consent Management button
    const consentButton = getByText('Manage Consent');
    fireEvent.press(consentButton);
    
    // Check if navigation was called with the correct screen
    expect(mockNavigate).toHaveBeenCalledWith('ConsentManagement');
  });

  it('navigates to AccountManagement screen when Account Management button is pressed', () => {
    const { getByText } = render(<MockNavigator />);
    
    // Find and press the Account Management button
    const accountButton = getByText('Manage Account');
    fireEvent.press(accountButton);
    
    // Check if navigation was called with the correct screen
    expect(mockNavigate).toHaveBeenCalledWith('AccountManagement');
  });

  it('navigates to PrivacyInformation screen when Privacy Information button is pressed', () => {
    const { getByText } = render(<MockNavigator />);
    
    // Find and press the Privacy Information button
    const infoButton = getByText('View Information');
    fireEvent.press(infoButton);
    
    // Check if navigation was called with the correct screen
    expect(mockNavigate).toHaveBeenCalledWith('PrivacyInformation');
  });
});