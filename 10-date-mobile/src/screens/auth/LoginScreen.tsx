/**
 * Login Screen Component
 * 
 * Provides user authentication with email/password, social logins,
 * and biometric authentication options.
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Image,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { useAuth } from '../../contexts/AuthContext';
import AuthService from '../../services/auth.service';
import { useAppDispatch } from '../../store';
import { setCredentials, authStart, authFailed } from '../../store/slices/authSlice';
import { LoginScreenProps } from '../../types/navigation';
import { primaryColors, spacing, typography } from '../../theme';

const LoginScreen: React.FC<LoginScreenProps> = ({ navigation }) => {
  // State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showBiometrics, setShowBiometrics] = useState(false);
  
  // Hooks
  const { signIn, authenticateWithBiometrics } = useAuth();
  const dispatch = useAppDispatch();
  
  // Check if biometric authentication is available
  useEffect(() => {
    const checkBiometricAvailability = async () => {
      try {
        const isAvailable = await AuthService.isBiometricsAvailable();
        setShowBiometrics(isAvailable);
      } catch (error) {
        console.error('Error checking biometric availability:', error);
        setShowBiometrics(false);
      }
    };
    
    checkBiometricAvailability();
  }, []);
  
  // Handle email/password login
  const handleLogin = async () => {
    // Validate inputs
    if (!email.trim() || !password.trim()) {
      Alert.alert('Error', 'Please enter your email and password');
      return;
    }
    
    // Start login process
    setIsLoading(true);
    dispatch(authStart());
    
    try {
      // Attempt to sign in
      const result = await signIn(email, password);
      
      if (result.success) {
        // Login successful
        // Note: token and user data should be handled in the AuthContext signIn method
      } else {
        // Login failed
        dispatch(authFailed(result.error || 'Login failed'));
        Alert.alert('Login Failed', result.error || 'Invalid credentials. Please try again.');
      }
    } catch (error) {
      // Handle errors
      const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
      dispatch(authFailed(errorMessage));
      Alert.alert('Login Error', errorMessage);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Handle biometric authentication
  const handleBiometricAuth = async () => {
    setIsLoading(true);
    
    try {
      const result = await authenticateWithBiometrics();
      
      if (!result.success) {
        Alert.alert('Authentication Failed', result.error || 'Biometric authentication failed');
      }
      // If successful, navigation is handled in the auth context
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Biometric authentication failed';
      Alert.alert('Authentication Error', errorMessage);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Navigation handlers
  const navigateToRegister = () => navigation.navigate('Register');
  const navigateToForgotPassword = () => navigation.navigate('ForgotPassword');
  
  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 0}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.logoContainer}>
          <Image
            source={require('../../assets/logo.png')}
            style={styles.logo}
            resizeMode="contain"
          />
          <Text style={styles.appName}>10Date</Text>
          <Text style={styles.tagline}>Find your perfect match</Text>
        </View>
        
        <View style={styles.formContainer}>
          <TextInput
            style={styles.input}
            placeholder="Email"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            editable={!isLoading}
          />
          
          <TextInput
            style={styles.input}
            placeholder="Password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoCapitalize="none"
            autoCorrect={false}
            editable={!isLoading}
          />
          
          <TouchableOpacity
            style={styles.loginButton}
            onPress={handleLogin}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <Text style={styles.loginButtonText}>Sign In</Text>
            )}
          </TouchableOpacity>
          
          {showBiometrics && (
            <TouchableOpacity
              style={styles.biometricButton}
              onPress={handleBiometricAuth}
              disabled={isLoading}
            >
              <Text style={styles.biometricButtonText}>Sign In with Biometrics</Text>
            </TouchableOpacity>
          )}
          
          <TouchableOpacity
            style={styles.forgotPasswordLink}
            onPress={navigateToForgotPassword}
            disabled={isLoading}
          >
            <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
          </TouchableOpacity>
        </View>
        
        <View style={styles.socialLoginContainer}>
          <Text style={styles.socialLoginText}>Or sign in with</Text>
          
          <View style={styles.socialButtons}>
            <TouchableOpacity style={[styles.socialButton, styles.googleButton]}>
              <Text style={styles.socialButtonText}>Google</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={[styles.socialButton, styles.facebookButton]}>
              <Text style={styles.socialButtonText}>Facebook</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={[styles.socialButton, styles.appleButton]}>
              <Text style={styles.socialButtonText}>Apple</Text>
            </TouchableOpacity>
          </View>
        </View>
        
        <View style={styles.registerContainer}>
          <Text style={styles.registerText}>Don't have an account? </Text>
          <TouchableOpacity onPress={navigateToRegister} disabled={isLoading}>
            <Text style={styles.registerLink}>Sign Up</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollContainer: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingVertical: 30,
    justifyContent: 'center',
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logo: {
    width: 100,
    height: 100,
    marginBottom: 10,
  },
  appName: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FF006E',
    marginBottom: 5,
  },
  tagline: {
    fontSize: 16,
    color: '#666666',
  },
  formContainer: {
    marginBottom: 30,
  },
  input: {
    height: 50,
    borderWidth: 1,
    borderColor: '#DDDDDD',
    borderRadius: 8,
    paddingHorizontal: 15,
    marginBottom: 15,
    fontSize: 16,
  },
  loginButton: {
    height: 50,
    backgroundColor: '#FF006E',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
  },
  loginButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  biometricButton: {
    height: 50,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#FF006E',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
  },
  biometricButtonText: {
    color: '#FF006E',
    fontSize: 16,
    fontWeight: 'bold',
  },
  forgotPasswordLink: {
    alignSelf: 'center',
  },
  forgotPasswordText: {
    color: '#666666',
    fontSize: 14,
  },
  socialLoginContainer: {
    alignItems: 'center',
    marginBottom: 30,
  },
  socialLoginText: {
    color: '#666666',
    fontSize: 14,
    marginBottom: 15,
  },
  socialButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  socialButton: {
    flex: 1,
    height: 40,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 5,
  },
  googleButton: {
    backgroundColor: '#DB4437',
  },
  facebookButton: {
    backgroundColor: '#4267B2',
  },
  appleButton: {
    backgroundColor: '#000000',
  },
  socialButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  registerContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  registerText: {
    color: '#666666',
    fontSize: 14,
  },
  registerLink: {
    color: '#FF006E',
    fontSize: 14,
    fontWeight: 'bold',
  },
});

export default LoginScreen;
