#!/bin/bash

# Script to set up the Privacy Center implementation for 10-Date mobile app

echo "Setting up Privacy Center for 10-Date mobile app..."

# Install missing dependencies
echo "Installing missing dependencies..."
npm install --save react-native-elements @rneui/themed @rneui/base

# Install dev dependencies for testing
echo "Installing dev dependencies for testing..."
npm install --save-dev @testing-library/react-native @testing-library/jest-native jest-expo

# Create privacy screens directory if it doesn't exist
mkdir -p src/screens/privacy

echo "Dependencies installed successfully!"
echo "TypeScript types will be updated automatically."

# Fix TypeScript errors
echo "Updating TypeScript configuration..."

# Create a declaration file for missing type definitions
cat > src/types/declarations.d.ts << EOL
// Declaration file for modules without type definitions

declare module 'react-native-elements' {
  export * from '@rneui/themed';
  export * from '@rneui/base';
}

declare module 'react-native-touch-id' {
  export interface TouchIDOptions {
    title?: string;
    color?: string;
    fallbackLabel?: string;
    unifiedErrors?: boolean;
    passcodeFallback?: boolean;
    sensorErrorDescription?: string;
  }

  export default {
    authenticate(reason: string, options?: TouchIDOptions): Promise<true>,
    isSupported(): Promise<string | boolean>,
  };
}
EOL

echo "TypeScript declarations created!"

# Create a test directory for Privacy Center components
mkdir -p __tests__/screens/privacy

echo "Setup complete! You can now run the app on iOS or Android."
echo "To run on iOS: npm run ios"
echo "To run on Android: npm run android"
echo "To run tests: npm test"