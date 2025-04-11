/**
 * Navigation Configuration for 10-Date Mobile App
 * 
 * This file defines the navigation structure for the app,
 * including authentication flow, main tabs, and nested screens.
 */

import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useSelector, useDispatch } from 'react-redux';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { ActivityIndicator, View } from 'react-native';

// Import the auth service
import AuthService from '../services/auth.service';

// Authentication Context
import { AuthContext } from '../contexts/AuthContext';

// Types
import { RootState } from '../store';
import { StackParamList, TabParamList, AuthParamList } from '../types/navigation';

// Import screens (to be implemented)
// Auth Screens
const LoginScreen = () => <View />;
const RegisterScreen = () => <View />;
const ForgotPasswordScreen = () => <View />;
const OnboardingScreen = () => <View />;
const BiometricSetupScreen = () => <View />;

// Tab Screens
const DiscoverScreen = () => <View />;
const MatchesScreen = () => <View />;
const ChatListScreen = () => <View />;
const ProfileScreen = () => <View />;

// Other Screens
const ChatDetailScreen = () => <View />;
const UserDetailScreen = () => <View />;
const SettingsScreen = () => <View />;
const SubscriptionScreen = () => <View />;
const MatchPreferencesScreen = () => <View />;
const EditProfileScreen = () => <View />;

// Create navigators
const Stack = createStackNavigator<StackParamList>();
const Tab = createBottomTabNavigator<TabParamList>();
const AuthStack = createStackNavigator<AuthParamList>();

// Authentication Stack Navigator
const AuthNavigator = () => {
  return (
    <AuthStack.Navigator
      screenOptions={{
        headerShown: false,
        cardStyle: { backgroundColor: '#FFFFFF' }
      }}
    >
      <AuthStack.Screen name="Login" component={LoginScreen} />
      <AuthStack.Screen name="Register" component={RegisterScreen} />
      <AuthStack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
      <AuthStack.Screen name="Onboarding" component={OnboardingScreen} />
      <AuthStack.Screen name="BiometricSetup" component={BiometricSetupScreen} />
    </AuthStack.Navigator>
  );
};

// Home Tab Navigator
const HomeTabNavigator = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName = 'home';
          
          if (route.name === 'Discover') {
            iconName = focused ? 'cards' : 'cards-outline';
          } else if (route.name === 'Matches') {
            iconName = focused ? 'heart' : 'heart-outline';
          } else if (route.name === 'Chats') {
            iconName = focused ? 'chat' : 'chat-outline';
          } else if (route.name === 'Profile') {
            iconName = focused ? 'account' : 'account-outline';
          }
          
          return <Icon name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#FF006E',
        tabBarInactiveTintColor: 'gray',
        tabBarLabelStyle: {
          fontWeight: '500',
          fontSize: 12
        },
        headerShown: false
      })}
    >
      <Tab.Screen name="Discover" component={DiscoverScreen} />
      <Tab.Screen name="Matches" component={MatchesScreen} />
      <Tab.Screen name="Chats" component={ChatListScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
};

// Main Stack Navigator (after authentication)
const MainNavigator = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false
      }}
    >
      <Stack.Screen name="HomeTabs" component={HomeTabNavigator} />
      <Stack.Screen name="ChatDetail" component={ChatDetailScreen} />
      <Stack.Screen name="UserDetail" component={UserDetailScreen} />
      <Stack.Screen name="Settings" component={SettingsScreen} />
      <Stack.Screen name="Subscription" component={SubscriptionScreen} />
      <Stack.Screen name="MatchPreferences" component={MatchPreferencesScreen} />
      <Stack.Screen name="EditProfile" component={EditProfileScreen} />
    </Stack.Navigator>
  );
};

// Main App Navigation Container
export const AppNavigator = () => {
  // Replace with actual Redux state once implemented
  const [isLoading, setIsLoading] = useState(true);
  const [userToken, setUserToken] = useState<string | null>(null);

  // Check for existing authentication token
  useEffect(() => {
    const bootstrapAsync = async () => {
      let token = null;
      
      try {
        // Check for existing token in secure storage
        token = await AuthService.getAccessToken();
        
        // Verify if token is valid
        if (token && !AuthService.isTokenExpired(token)) {
          setUserToken(token);
        }
      } catch (e) {
        // Token restoration failed
        console.error('Failed to restore token:', e);
      } finally {
        setIsLoading(false);
      }
    };
    
    bootstrapAsync();
  }, []);

  // Auth context provides authentication methods to all components
  const authContext = React.useMemo(() => ({
    signIn: async (email: string, password: string) => {
      try {
        const tokens = await AuthService.login({ email, password });
        setUserToken(tokens.accessToken);
        return { success: true };
      } catch (error) {
        return { 
          success: false, 
          error: error instanceof Error ? error.message : 'Unknown error' 
        };
      }
    },
    signUp: async (data: any) => {
      try {
        const tokens = await AuthService.register(data);
        setUserToken(tokens.accessToken);
        return { success: true };
      } catch (error) {
        return { 
          success: false, 
          error: error instanceof Error ? error.message : 'Unknown error' 
        };
      }
    },
    signOut: async () => {
      try {
        await AuthService.logout();
        setUserToken(null);
      } catch (error) {
        console.error('Sign out error:', error);
      }
    },
    resetPassword: async (email: string) => {
      try {
        await AuthService.requestPasswordReset(email);
        return { success: true };
      } catch (error) {
        return { 
          success: false, 
          error: error instanceof Error ? error.message : 'Unknown error' 
        };
      }
    },
    authenticateWithBiometrics: async () => {
      try {
        const tokens = await AuthService.authenticateWithBiometrics();
        if (tokens) {
          setUserToken(tokens.accessToken);
          return { success: true };
        }
        return { success: false, error: 'Biometric authentication failed' };
      } catch (error) {
        return { 
          success: false, 
          error: error instanceof Error ? error.message : 'Unknown error' 
        };
      }
    }
  }), []);

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#FF006E" />
      </View>
    );
  }

  return (
    <AuthContext.Provider value={authContext}>
      <NavigationContainer>
        {userToken ? <MainNavigator /> : <AuthNavigator />}
      </NavigationContainer>
    </AuthContext.Provider>
  );
};

export default AppNavigator;
