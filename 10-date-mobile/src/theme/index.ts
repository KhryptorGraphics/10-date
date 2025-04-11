/**
 * Theme Configuration for 10-Date Mobile App
 * 
 * This file contains theme variables including colors, typography, spacing,
 * and other styling constants used throughout the app.
 */

// Color Palette
export const primaryColors = {
  primary: '#FF006E', // Main brand color
  secondary: '#3A86FF', // Secondary brand color
  accent: '#FB5607', // Accent color for highlights
  success: '#38B000', // Success messages and indicators
  error: '#D62828', // Error states and messages
  warning: '#FFBE0B', // Warning indicators
};

export const neutralColors = {
  white: '#FFFFFF',
  gray100: '#F8F9FA',
  gray200: '#E9ECEF',
  gray300: '#DEE2E6',
  gray400: '#CED4DA',
  gray500: '#ADB5BD',
  gray600: '#6C757D',
  gray700: '#495057',
  gray800: '#343A40',
  gray900: '#212529',
  black: '#000000',
};

// Typography
export const typography = {
  fontFamily: {
    regular: 'System',
    medium: 'System-Medium',
    bold: 'System-Bold',
  },
  fontSize: {
    xs: 12,
    sm: 14,
    md: 16,
    lg: 18,
    xl: 20,
    xxl: 24,
    xxxl: 30,
  },
  lineHeight: {
    xs: 16,
    sm: 20,
    md: 24,
    lg: 28,
    xl: 30,
    xxl: 34,
    xxxl: 40,
  },
  fontWeight: {
    regular: '400',
    medium: '500',
    bold: '700',
  },
};

// Spacing
export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
  xxxl: 64,
};

// Border Radius
export const borderRadius = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  round: 9999,
};

// Shadows
export const shadows = {
  sm: {
    shadowColor: neutralColors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.18,
    shadowRadius: 1,
    elevation: 1,
  },
  md: {
    shadowColor: neutralColors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
  },
  lg: {
    shadowColor: neutralColors.black,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 6,
    shadowOpacity: 0.23,
    elevation: 6,
  },
};

// Common component styles
export const inputs = {
  base: {
    height: 50,
    borderWidth: 1,
    borderColor: neutralColors.gray300,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    fontSize: typography.fontSize.md,
    color: neutralColors.gray800,
    backgroundColor: neutralColors.white,
  },
  error: {
    borderColor: primaryColors.error,
  },
  disabled: {
    backgroundColor: neutralColors.gray200,
    borderColor: neutralColors.gray400,
    color: neutralColors.gray600,
  },
};

export const buttons = {
  primary: {
    backgroundColor: primaryColors.primary,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    ...shadows.sm,
  },
  secondary: {
    backgroundColor: neutralColors.white,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: primaryColors.primary,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  disabled: {
    backgroundColor: neutralColors.gray400,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
  },
};

export default {
  primaryColors,
  neutralColors,
  typography,
  spacing,
  borderRadius,
  shadows,
  inputs,
  buttons,
};
