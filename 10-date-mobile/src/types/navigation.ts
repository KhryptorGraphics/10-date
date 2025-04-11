/**
 * Navigation Type Definitions for 10-Date Mobile App
 * 
 * This file contains TypeScript types for the app's navigation structure,
 * defining route parameters and screen props.
 */

import { RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';

// Auth Stack Param List
export type AuthParamList = {
  Login: undefined;
  Register: undefined;
  ForgotPassword: undefined;
  Onboarding: undefined;
  BiometricSetup: undefined;
};

// Tab Navigator Param List
export type TabParamList = {
  Discover: undefined;
  Matches: undefined;
  Chats: undefined;
  Profile: undefined;
};

// Main Stack Param List
export type StackParamList = {
  HomeTabs: undefined;
  ChatDetail: { matchId: string; userName: string };
  UserDetail: { userId: string };
  Settings: undefined;
  Subscription: undefined;
  MatchPreferences: undefined;
  EditProfile: undefined;
  // Privacy Center screens
  PrivacyCenter: undefined;
  DataAccess: undefined;
  ConsentManagement: undefined;
  AccountManagement: undefined;
  PrivacyInformation: undefined;
};

// Navigation Props for Auth Screens
export type AuthNavigationProp<T extends keyof AuthParamList> = 
  StackNavigationProp<AuthParamList, T>;

export type AuthRouteProp<T extends keyof AuthParamList> = 
  RouteProp<AuthParamList, T>;

// Navigation Props for Tab Screens
export type TabNavigationProp<T extends keyof TabParamList> = 
  BottomTabNavigationProp<TabParamList, T>;

export type TabRouteProp<T extends keyof TabParamList> = 
  RouteProp<TabParamList, T>;

// Navigation Props for Stack Screens
export type StackNavigationProp<T extends keyof StackParamList> = 
  StackNavigationProp<StackParamList, T>;

export type StackRouteProp<T extends keyof StackParamList> = 
  RouteProp<StackParamList, T>;

// Screen Props types for each screen
export type LoginScreenProps = {
  navigation: AuthNavigationProp<'Login'>;
  route: AuthRouteProp<'Login'>;
};

export type RegisterScreenProps = {
  navigation: AuthNavigationProp<'Register'>;
  route: AuthRouteProp<'Register'>;
};

export type ForgotPasswordScreenProps = {
  navigation: AuthNavigationProp<'ForgotPassword'>;
  route: AuthRouteProp<'ForgotPassword'>;
};

export type OnboardingScreenProps = {
  navigation: AuthNavigationProp<'Onboarding'>;
  route: AuthRouteProp<'Onboarding'>;
};

export type BiometricSetupScreenProps = {
  navigation: AuthNavigationProp<'BiometricSetup'>;
  route: AuthRouteProp<'BiometricSetup'>;
};

export type DiscoverScreenProps = {
  navigation: TabNavigationProp<'Discover'>;
  route: TabRouteProp<'Discover'>;
};

export type MatchesScreenProps = {
  navigation: TabNavigationProp<'Matches'>;
  route: TabRouteProp<'Matches'>;
};

export type ChatsScreenProps = {
  navigation: TabNavigationProp<'Chats'>;
  route: TabRouteProp<'Chats'>;
};

export type ProfileScreenProps = {
  navigation: TabNavigationProp<'Profile'>;
  route: TabRouteProp<'Profile'>;
};

export type ChatDetailScreenProps = {
  navigation: StackNavigationProp<'ChatDetail'>;
  route: StackRouteProp<'ChatDetail'>;
};

export type UserDetailScreenProps = {
  navigation: StackNavigationProp<'UserDetail'>;
  route: StackRouteProp<'UserDetail'>;
};

export type SettingsScreenProps = {
  navigation: StackNavigationProp<'Settings'>;
  route: StackRouteProp<'Settings'>;
};

export type SubscriptionScreenProps = {
  navigation: StackNavigationProp<'Subscription'>;
  route: StackRouteProp<'Subscription'>;
};

export type MatchPreferencesScreenProps = {
  navigation: StackNavigationProp<'MatchPreferences'>;
  route: StackRouteProp<'MatchPreferences'>;
};

export type EditProfileScreenProps = {
  navigation: StackNavigationProp<'EditProfile'>;
  route: StackRouteProp<'EditProfile'>;
};

// Privacy Center Screen Props
export type PrivacyCenterScreenProps = {
  navigation: StackNavigationProp<'PrivacyCenter'>;
  route: StackRouteProp<'PrivacyCenter'>;
};

export type DataAccessScreenProps = {
  navigation: StackNavigationProp<'DataAccess'>;
  route: StackRouteProp<'DataAccess'>;
};

export type ConsentManagementScreenProps = {
  navigation: StackNavigationProp<'ConsentManagement'>;
  route: StackRouteProp<'ConsentManagement'>;
};

export type AccountManagementScreenProps = {
  navigation: StackNavigationProp<'AccountManagement'>;
  route: StackRouteProp<'AccountManagement'>;
};

export type PrivacyInformationScreenProps = {
  navigation: StackNavigationProp<'PrivacyInformation'>;
  route: StackRouteProp<'PrivacyInformation'>;
};
