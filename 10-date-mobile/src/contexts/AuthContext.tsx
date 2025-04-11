/**
 * Authentication Context for 10-Date Mobile App
 * 
 * This context provides authentication state and methods to components throughout the app.
 * It manages user authentication, sign in/out, and token handling.
 */

import React, { createContext, useContext } from 'react';

// Authentication response types
export interface AuthResponse {
  success: boolean;
  error?: string;
}

// Authentication context interface
export interface AuthContextType {
  signIn: (email: string, password: string) => Promise<AuthResponse>;
  signUp: (data: any) => Promise<AuthResponse>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<AuthResponse>;
  authenticateWithBiometrics: () => Promise<AuthResponse>;
}

// Create the authentication context with default values
export const AuthContext = createContext<AuthContextType>({
  signIn: async () => ({ success: false, error: 'Not implemented' }),
  signUp: async () => ({ success: false, error: 'Not implemented' }),
  signOut: async () => {},
  resetPassword: async () => ({ success: false, error: 'Not implemented' }),
  authenticateWithBiometrics: async () => ({ success: false, error: 'Not implemented' })
});

// Hook for easy access to auth context
export const useAuth = () => useContext(AuthContext);

// Provider component for wrapping the app
export const AuthProvider: React.FC<{children: React.ReactNode}> = ({ children }) => {
  // Auth state and methods are implemented in the navigation file
  // This is just a passthrough provider for the context
  return (
    <AuthContext.Provider value={useContext(AuthContext)}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthProvider;
