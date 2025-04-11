/**
 * Registration Screen Component
 * 
 * Handles user registration with multi-step form process, validation,
 * and secure credential management.
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useAuth } from '../../contexts/AuthContext';
import { useAppDispatch } from '../../store';
import { authStart, authFailed } from '../../store/slices/authSlice';
import { RegisterScreenProps } from '../../types/navigation';
import { primaryColors, neutralColors, spacing, typography } from '../../theme';

// MultiStep Registration Progress Indicator
const ProgressIndicator = ({ currentStep, totalSteps }: { currentStep: number; totalSteps: number }) => {
  return (
    <View style={styles.progressContainer}>
      {Array.from({ length: totalSteps }).map((_, index) => (
        <View
          key={index}
          style={[
            styles.progressDot,
            {
              backgroundColor:
                index < currentStep ? primaryColors.primary : neutralColors.gray300,
            },
          ]}
        />
      ))}
    </View>
  );
};

// Registration form steps
enum RegistrationStep {
  ACCOUNT_INFO = 0,
  PERSONAL_INFO = 1,
  PHOTOS = 2,
  INTERESTS = 3,
}

const RegisterScreen: React.FC<RegisterScreenProps> = ({ navigation }) => {
  // Form state
  const [currentStep, setCurrentStep] = useState<RegistrationStep>(
    RegistrationStep.ACCOUNT_INFO
  );
  const [isLoading, setIsLoading] = useState(false);
  
  // Account info
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  // Personal info
  const [name, setName] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [gender, setGender] = useState('');
  
  // Photos - just placeholders for now
  const [photos, setPhotos] = useState<string[]>([]);
  
  // Interests - just placeholders for now
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  const availableInterests = [
    'Travel', 'Fitness', 'Music', 'Food', 'Art', 
    'Reading', 'Movies', 'Photography', 'Technology', 'Sports'
  ];
  
  // Hooks
  const { signUp } = useAuth();
  const dispatch = useAppDispatch();
  
  // Form validation
  const validateAccountInfo = () => {
    if (!email.trim()) {
      Alert.alert('Error', 'Please enter your email');
      return false;
    }
    
    if (!/\S+@\S+\.\S+/.test(email)) {
      Alert.alert('Error', 'Please enter a valid email address');
      return false;
    }
    
    if (!password.trim()) {
      Alert.alert('Error', 'Please enter a password');
      return false;
    }
    
    if (password.length < 8) {
      Alert.alert('Error', 'Password must be at least 8 characters long');
      return false;
    }
    
    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return false;
    }
    
    return true;
  };
  
  const validatePersonalInfo = () => {
    if (!name.trim()) {
      Alert.alert('Error', 'Please enter your name');
      return false;
    }
    
    if (!birthDate.trim()) {
      Alert.alert('Error', 'Please enter your date of birth');
      return false;
    }
    
    // Simple date validation - would be more robust in production
    if (!/^\d{2}\/\d{2}\/\d{4}$/.test(birthDate)) {
      Alert.alert('Error', 'Please enter a valid date in MM/DD/YYYY format');
      return false;
    }
    
    if (!gender) {
      Alert.alert('Error', 'Please select your gender');
      return false;
    }
    
    return true;
  };
  
  // Handle next button press
  const handleNext = () => {
    switch (currentStep) {
      case RegistrationStep.ACCOUNT_INFO:
        if (validateAccountInfo()) {
          setCurrentStep(RegistrationStep.PERSONAL_INFO);
        }
        break;
      case RegistrationStep.PERSONAL_INFO:
        if (validatePersonalInfo()) {
          setCurrentStep(RegistrationStep.PHOTOS);
        }
        break;
      case RegistrationStep.PHOTOS:
        // In a real app, we'd validate photos here
        setCurrentStep(RegistrationStep.INTERESTS);
        break;
      default:
        break;
    }
  };
  
  // Handle back button press
  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    } else {
      navigation.goBack();
    }
  };
  
  // Handle registration completion
  const handleRegister = async () => {
    // Combine all form data
    const userData = {
      email,
      password,
      name,
      birthDate,
      gender,
      photos,
      interests: selectedInterests,
    };
    
    setIsLoading(true);
    dispatch(authStart());
    
    try {
      const result = await signUp(userData);
      
      if (result.success) {
        // Registration successful
        // AuthContext will handle token storage and navigation
      } else {
        dispatch(authFailed(result.error || 'Registration failed'));
        Alert.alert('Registration Failed', result.error || 'Please try again.');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
      dispatch(authFailed(errorMessage));
      Alert.alert('Registration Error', errorMessage);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Toggle interest selection
  const toggleInterest = (interest: string) => {
    if (selectedInterests.includes(interest)) {
      setSelectedInterests(selectedInterests.filter(i => i !== interest));
    } else {
      setSelectedInterests([...selectedInterests, interest]);
    }
  };
  
  // Navigation to login screen
  const navigateToLogin = () => {
    navigation.navigate('Login');
  };
  
  // Render account info step
  const renderAccountInfo = () => (
    <View style={styles.formContainer}>
      <Text style={styles.stepTitle}>Create Your Account</Text>
      
      <TextInput
        style={styles.input}
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
        autoCorrect={false}
      />
      
      <TextInput
        style={styles.input}
        placeholder="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        autoCapitalize="none"
        autoCorrect={false}
      />
      
      <TextInput
        style={styles.input}
        placeholder="Confirm Password"
        value={confirmPassword}
        onChangeText={setConfirmPassword}
        secureTextEntry
        autoCapitalize="none"
        autoCorrect={false}
      />
      
      <TouchableOpacity style={styles.nextButton} onPress={handleNext}>
        <Text style={styles.buttonText}>Next</Text>
      </TouchableOpacity>
      
      <TouchableOpacity style={styles.backButton} onPress={handleBack}>
        <Text style={styles.backButtonText}>Back to Login</Text>
      </TouchableOpacity>
    </View>
  );
  
  // Render personal info step
  const renderPersonalInfo = () => (
    <View style={styles.formContainer}>
      <Text style={styles.stepTitle}>Tell Us About Yourself</Text>
      
      <TextInput
        style={styles.input}
        placeholder="Full Name"
        value={name}
        onChangeText={setName}
        autoCapitalize="words"
      />
      
      <TextInput
        style={styles.input}
        placeholder="Date of Birth (MM/DD/YYYY)"
        value={birthDate}
        onChangeText={setBirthDate}
        keyboardType="numeric"
      />
      
      <Text style={styles.label}>Gender</Text>
      <View style={styles.optionsContainer}>
        <TouchableOpacity
          style={[
            styles.optionButton,
            gender === 'male' && styles.optionButtonSelected,
          ]}
          onPress={() => setGender('male')}
        >
          <Text
            style={[
              styles.optionText,
              gender === 'male' && styles.optionTextSelected,
            ]}
          >
            Male
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[
            styles.optionButton,
            gender === 'female' && styles.optionButtonSelected,
          ]}
          onPress={() => setGender('female')}
        >
          <Text
            style={[
              styles.optionText,
              gender === 'female' && styles.optionTextSelected,
            ]}
          >
            Female
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[
            styles.optionButton,
            gender === 'other' && styles.optionButtonSelected,
          ]}
          onPress={() => setGender('other')}
        >
          <Text
            style={[
              styles.optionText,
              gender === 'other' && styles.optionTextSelected,
            ]}
          >
            Other
          </Text>
        </TouchableOpacity>
      </View>
      
      <View style={styles.buttonRow}>
        <TouchableOpacity
          style={[styles.backButton, styles.inlineButton]}
          onPress={handleBack}
        >
          <Text style={styles.backButtonText}>Back</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.nextButton, styles.inlineButton]}
          onPress={handleNext}
        >
          <Text style={styles.buttonText}>Next</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
  
  // Render photos step
  const renderPhotos = () => (
    <View style={styles.formContainer}>
      <Text style={styles.stepTitle}>Add Your Photos</Text>
      <Text style={styles.description}>
        Add at least one photo to create your profile. You can add more later.
      </Text>
      
      <View style={styles.photoGrid}>
        {/* Placeholder for photo picker grid */}
        <TouchableOpacity style={styles.photoPlaceholder}>
          <Text style={styles.photoPlaceholderText}>+</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.photoPlaceholder}>
          <Text style={styles.photoPlaceholderText}>+</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.photoPlaceholder}>
          <Text style={styles.photoPlaceholderText}>+</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.photoPlaceholder}>
          <Text style={styles.photoPlaceholderText}>+</Text>
        </TouchableOpacity>
      </View>
      
      <Text style={styles.note}>
        Photos must be of yourself and should not contain nudity or offensive content.
      </Text>
      
      <View style={styles.buttonRow}>
        <TouchableOpacity
          style={[styles.backButton, styles.inlineButton]}
          onPress={handleBack}
        >
          <Text style={styles.backButtonText}>Back</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.nextButton, styles.inlineButton]}
          onPress={handleNext}
        >
          <Text style={styles.buttonText}>Next</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
  
  // Render interests step
  const renderInterests = () => (
    <View style={styles.formContainer}>
      <Text style={styles.stepTitle}>Select Your Interests</Text>
      <Text style={styles.description}>
        Choose at least 3 interests to help us find your perfect matches.
      </Text>
      
      <View style={styles.interestsGrid}>
        {availableInterests.map((interest) => (
          <TouchableOpacity
            key={interest}
            style={[
              styles.interestButton,
              selectedInterests.includes(interest) && styles.interestButtonSelected,
            ]}
            onPress={() => toggleInterest(interest)}
          >
            <Text
              style={[
                styles.interestText,
                selectedInterests.includes(interest) && styles.interestTextSelected,
              ]}
            >
              {interest}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
      
      <View style={styles.termsContainer}>
        <TouchableOpacity style={styles.checkbox}>
          {/* Checkbox UI would go here */}
        </TouchableOpacity>
        <Text style={styles.termsText}>
          I agree to the <Text style={styles.link}>Terms of Service</Text> and{' '}
          <Text style={styles.link}>Privacy Policy</Text>
        </Text>
      </View>
      
      <TouchableOpacity
        style={styles.registerButton}
        onPress={handleRegister}
        disabled={isLoading || selectedInterests.length < 3}
      >
        {isLoading ? (
          <ActivityIndicator color="#FFFFFF" size="small" />
        ) : (
          <Text style={styles.buttonText}>Create Account</Text>
        )}
      </TouchableOpacity>
      
      <TouchableOpacity style={styles.backButton} onPress={handleBack}>
        <Text style={styles.backButtonText}>Back</Text>
      </TouchableOpacity>
    </View>
  );
  
  // Render current step
  const renderCurrentStep = () => {
    switch (currentStep) {
      case RegistrationStep.ACCOUNT_INFO:
        return renderAccountInfo();
      case RegistrationStep.PERSONAL_INFO:
        return renderPersonalInfo();
      case RegistrationStep.PHOTOS:
        return renderPhotos();
      case RegistrationStep.INTERESTS:
        return renderInterests();
      default:
        return null;
    }
  };
  
  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 0}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <ProgressIndicator
          currentStep={currentStep + 1}
          totalSteps={Object.keys(RegistrationStep).length / 2}
        />
        
        {renderCurrentStep()}
        
        <View style={styles.loginContainer}>
          <Text style={styles.loginText}>Already have an account? </Text>
          <TouchableOpacity onPress={navigateToLogin}>
            <Text style={styles.loginLink}>Log In</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: neutralColors.white,
  },
  scrollContainer: {
    flexGrow: 1,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xl,
  },
  progressContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginVertical: spacing.lg,
  },
  progressDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginHorizontal: 5,
  },
  formContainer: {
    marginBottom: spacing.xl,
  },
  stepTitle: {
    fontSize: typography.fontSize.xxl,
    fontWeight: typography.fontWeight.bold,
    color: neutralColors.gray900,
    marginBottom: spacing.md,
    textAlign: 'center',
  },
  description: {
    fontSize: typography.fontSize.md,
    color: neutralColors.gray700,
    marginBottom: spacing.lg,
    textAlign: 'center',
  },
  input: {
    height: 50,
    borderWidth: 1,
    borderColor: neutralColors.gray300,
    borderRadius: 8,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.md,
    fontSize: typography.fontSize.md,
  },
  label: {
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.medium,
    color: neutralColors.gray700,
    marginBottom: spacing.sm,
  },
  optionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.lg,
  },
  optionButton: {
    flex: 1,
    height: 45,
    borderWidth: 1,
    borderColor: neutralColors.gray300,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 5,
  },
  optionButtonSelected: {
    borderColor: primaryColors.primary,
    backgroundColor: 'rgba(255, 0, 110, 0.05)',
  },
  optionText: {
    fontSize: typography.fontSize.md,
    color: neutralColors.gray700,
  },
  optionTextSelected: {
    color: primaryColors.primary,
    fontWeight: typography.fontWeight.medium,
  },
  photoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginVertical: spacing.md,
  },
  photoPlaceholder: {
    width: '48%',
    aspectRatio: 1,
    backgroundColor: neutralColors.gray200,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  photoPlaceholderText: {
    fontSize: 30,
    color: neutralColors.gray500,
  },
  interestsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginVertical: spacing.md,
  },
  interestButton: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderWidth: 1,
    borderColor: neutralColors.gray300,
    borderRadius: 25,
    marginRight: spacing.sm,
    marginBottom: spacing.sm,
  },
  interestButtonSelected: {
    backgroundColor: primaryColors.primary,
    borderColor: primaryColors.primary,
  },
  interestText: {
    fontSize: typography.fontSize.sm,
    color: neutralColors.gray700,
  },
  interestTextSelected: {
    color: neutralColors.white,
  },
  note: {
    fontSize: typography.fontSize.sm,
    color: neutralColors.gray600,
    marginVertical: spacing.md,
    textAlign: 'center',
  },
  termsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: spacing.lg,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderWidth: 1,
    borderColor: neutralColors.gray400,
    borderRadius: 4,
    marginRight: spacing.sm,
  },
  termsText: {
    flex: 1,
    fontSize: typography.fontSize.sm,
    color: neutralColors.gray700,
  },
  link: {
    color: primaryColors.primary,
    fontWeight: typography.fontWeight.medium,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.md,
  },
  inlineButton: {
    flex: 0.48,
  },
  nextButton: {
    height: 50,
    backgroundColor: primaryColors.primary,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: spacing.md,
  },
  backButton: {
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: spacing.sm,
  },
  registerButton: {
    height: 50,
    backgroundColor: primaryColors.primary,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: spacing.md,
  },
  buttonText: {
    color: neutralColors.white,
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.bold,
  },
  backButtonText: {
    color: neutralColors.gray700,
    fontSize: typography.fontSize.md,
  },
  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: spacing.md,
  },
  loginText: {
    color: neutralColors.gray700,
    fontSize: typography.fontSize.md,
  },
  loginLink: {
    color: primaryColors.primary,
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.medium,
  },
});

export default RegisterScreen;
