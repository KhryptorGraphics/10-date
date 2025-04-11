# Privacy Center Testing Guide

This guide outlines the process for testing the Privacy Center implementation in the 10-Date mobile app. It includes instructions for setting up the testing environment, running tests on iOS and Android devices, and conducting usability testing with test users.

## Prerequisites

Before testing, ensure you have the following:

1. Node.js and npm installed
2. React Native CLI installed globally (`npm install -g react-native-cli`)
3. Xcode (for iOS testing)
4. Android Studio (for Android testing)
5. Physical or virtual devices for testing
6. All dependencies installed (run `./privacy-center-setup.sh`)

## Setting Up the Testing Environment

1. Clone the repository and navigate to the project directory:
   ```bash
   git clone https://github.com/your-org/10-date-mobile.git
   cd 10-date-mobile
   ```

2. Install dependencies and set up the Privacy Center:
   ```bash
   npm install
   chmod +x privacy-center-setup.sh
   ./privacy-center-setup.sh
   ```

3. Set up the environment for iOS:
   ```bash
   cd ios
   pod install
   cd ..
   ```

## Running Automated Tests

The Privacy Center implementation includes unit and integration tests to ensure functionality works as expected.

### Running Unit Tests

```bash
npm test
```

To run tests for specific components:

```bash
npm test -- -t "PrivacyCenterScreen"
```

### Running Integration Tests

Integration tests require a running emulator or connected device:

```bash
npm run test:e2e
```

## Manual Testing on Devices

### Testing on iOS

1. Start the Metro bundler:
   ```bash
   npm start
   ```

2. In a new terminal, run the app on an iOS simulator:
   ```bash
   npm run ios
   ```

   To run on a specific simulator:
   ```bash
   npm run ios -- --simulator="iPhone 14 Pro"
   ```

   To run on a physical device, open the project in Xcode:
   ```bash
   open ios/TenDateMobile.xcworkspace
   ```
   Then select your device and click Run.

### Testing on Android

1. Start the Metro bundler (if not already running):
   ```bash
   npm start
   ```

2. In a new terminal, run the app on an Android emulator or connected device:
   ```bash
   npm run android
   ```

   To run on a specific emulator:
   ```bash
   npm run android -- --deviceId="emulator-5554"
   ```

## Testing Checklist

### Privacy Center Main Screen

- [ ] Verify all cards are displayed correctly
- [ ] Verify navigation to each section works
- [ ] Test responsiveness on different screen sizes

### Data Access Screen

- [ ] Verify data category selection works
- [ ] Test export format selection
- [ ] Test request data export functionality
- [ ] Verify export history list displays correctly
- [ ] Test share functionality for completed exports

### Consent Management Screen

- [ ] Verify consent toggles work correctly
- [ ] Test confirmation dialogs
- [ ] Verify biometric authentication for sensitive consents
- [ ] Test history viewing functionality

### Account Management Screen

- [ ] Test option selection (anonymize vs. delete)
- [ ] Verify data selection checkboxes work
- [ ] Test reason selection and feedback collection
- [ ] Verify multi-step confirmation process
- [ ] Test biometric authentication

### Privacy Information Screen

- [ ] Verify tab navigation works
- [ ] Test privacy policy viewer
- [ ] Verify rights information and links
- [ ] Test FAQ search functionality
- [ ] Verify contact information

## Usability Testing with Test Users

### Test User Profiles

Create test user profiles with different characteristics:

1. **New User**: First-time user with no prior experience
2. **Regular User**: User who has been using the app for a while
3. **Privacy-Conscious User**: User who is concerned about privacy
4. **Technical User**: User with technical background
5. **Non-Technical User**: User with limited technical knowledge

### Test Scenarios

For each test user, create scenarios to test:

1. **Data Export**: Ask users to export their data in different formats
2. **Consent Management**: Ask users to update their consent preferences
3. **Account Management**: Ask users to simulate account deletion (without actually deleting)
4. **Privacy Information**: Ask users to find specific information in the privacy policy

### Usability Testing Process

1. **Preparation**:
   - Set up test devices with the app installed
   - Prepare test accounts with sample data
   - Create a testing script with tasks for users to complete

2. **Testing Session**:
   - Introduce the user to the app and explain the purpose of testing
   - Ask the user to complete the tasks in the script
   - Observe and take notes on user behavior and feedback
   - Record any issues or confusion encountered

3. **Post-Testing**:
   - Conduct a brief interview to gather additional feedback
   - Ask users to rate the usability of each feature on a scale of 1-5
   - Collect suggestions for improvement

### Metrics to Measure

- **Task Completion Rate**: Percentage of users who successfully complete each task
- **Time on Task**: Time taken to complete each task
- **Error Rate**: Number of errors made during task completion
- **Satisfaction Rating**: User ratings for each feature
- **System Usability Scale (SUS)**: Standard usability questionnaire

## Common Issues and Troubleshooting

### TypeScript Errors

If you encounter TypeScript errors related to missing declarations:

1. Ensure all dependencies are installed:
   ```bash
   npm install
   ```

2. Run the setup script to create declaration files:
   ```bash
   ./privacy-center-setup.sh
   ```

3. If errors persist, try cleaning the cache:
   ```bash
   npm run clean
   ```

### iOS Build Issues

If you encounter issues building for iOS:

1. Ensure CocoaPods is installed and up to date:
   ```bash
   gem install cocoapods
   ```

2. Clean the build:
   ```bash
   cd ios
   pod deintegrate
   pod install
   cd ..
   ```

### Android Build Issues

If you encounter issues building for Android:

1. Check that your Android SDK is properly configured
2. Clean the build:
   ```bash
   cd android
   ./gradlew clean
   cd ..
   ```

## Reporting Issues

When reporting issues, include the following information:

1. Device type and OS version
2. Steps to reproduce the issue
3. Expected behavior
4. Actual behavior
5. Screenshots or videos (if applicable)
6. Error messages (if any)

## Continuous Integration

The Privacy Center implementation is integrated with the CI/CD pipeline. Each pull request triggers automated tests to ensure code quality and functionality.

### CI Workflow

1. Code is pushed to a feature branch
2. CI system runs linting and unit tests
3. If tests pass, a test build is created for both iOS and Android
4. QA team can download and test the build
5. After approval, the code is merged to the main branch

## Deployment

After thorough testing, the Privacy Center can be deployed to production:

1. Merge the feature branch to the main branch
2. Create a new release version
3. Build production versions for iOS and Android
4. Submit to the App Store and Google Play Store

## Conclusion

Following this testing guide will ensure that the Privacy Center implementation is thoroughly tested and ready for production. Regular testing and feedback collection will help improve the user experience and ensure compliance with privacy regulations.