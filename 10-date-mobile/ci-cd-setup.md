# CI/CD Pipeline for 10-Date Mobile App

This document provides comprehensive instructions for setting up a CI/CD pipeline for the 10-Date mobile application. It details how to automate the build, test, and deployment processes using industry-standard tools and best practices.

## 1. CI/CD Infrastructure Overview

### CI/CD Platform Recommendations

For the 10-Date mobile app, we recommend using one of the following CI/CD platforms:

1. **GitHub Actions** - Ideal if you're already using GitHub for version control
2. **CircleCI** - Excellent mobile-specific features and macOS executor support
3. **Bitrise** - Purpose-built for mobile app CI/CD with intuitive workflows
4. **Azure DevOps** - Great choice for enterprise environments

### Technology Stack

- **Fastlane**: Automation tool for iOS and Android deployment processes
- **Detox**: End-to-end testing framework for React Native
- **Jest**: Unit and integration testing
- **ESLint/TypeScript**: Static code analysis
- **CodePush (AppCenter)**: OTA updates for production bugfixes

## 2. Fastlane Setup

Fastlane dramatically simplifies and automates the build and deployment processes for both iOS and Android.

### Installation

```bash
# Install Fastlane
gem install fastlane -NV

# Navigate to iOS folder
cd ios
fastlane init

# Navigate to Android folder
cd ../android
fastlane init
```

### iOS Fastlane Configuration

Create the following file structure in your project:

```
ios/
  fastlane/
    Appfile
    Fastfile
    Matchfile
```

#### Appfile

```ruby
# ios/fastlane/Appfile
app_identifier("com.khryptorgraphics.tendate") # Your bundle identifier
apple_id("developer@khryptorgraphics.com") # Your Apple ID email
team_id("ABC123XYZ") # Your Apple Developer team ID
```

#### Fastfile

```ruby
# ios/fastlane/Fastfile
default_platform(:ios)

platform :ios do
  desc "Build and upload a new beta to TestFlight"
  lane :beta do
    # Match ensures signing is correct (cert and profile)
    match(type: "appstore", readonly: true)
    
    # Increment build number based on TestFlight
    increment_build_number(
      build_number: latest_testflight_build_number + 1,
    )
    
    # Build the app
    build_app(
      scheme: "10Date",
      workspace: "10Date.xcworkspace",
      clean: true,
      export_method: "app-store",
      export_options: {
        provisioningProfiles: {
          "com.khryptorgraphics.tendate" => "match AppStore com.khryptorgraphics.tendate",
        }
      }
    )
    
    # Upload to TestFlight
    upload_to_testflight(
      skip_waiting_for_build_processing: true,
      apple_id: "1234567890" # Replace with your app's Apple ID
    )
    
    # Notify slack or other communication channel
    slack(message: "New iOS beta build uploaded to TestFlight!")
  end

  desc "Deploy a new version to the App Store"
  lane :release do
    # Match ensures signing is correct (cert and profile)
    match(type: "appstore", readonly: true)
    
    # Capture screenshots for App Store
    # Note: You'll need snapshot setup with proper UI tests 
    # snapshot
    
    # Update app metadata
    # deliver(
    #   skip_binary_upload: true,
    #   skip_screenshots: false,
    #   force: true
    # )
    
    # Build the app
    build_app(
      scheme: "10Date",
      workspace: "10Date.xcworkspace",
      clean: true,
      export_method: "app-store"
    )
    
    # Upload to App Store
    deliver(
      submit_for_review: true,
      automatic_release: false,
      force: true,
      skip_metadata: false,
      skip_screenshots: false
    )
    
    # Notify slack or other communication channel
    slack(message: "New iOS production release submitted for review!")
  end
end
```

#### Matchfile

```ruby
# ios/fastlane/Matchfile
git_url("https://github.com/khryptorgraphics/certificates.git")
storage_mode("git")
type("development") # The default type, can be: appstore, adhoc, enterprise or development

app_identifier(["com.khryptorgraphics.tendate"])
username("developer@khryptorgraphics.com") # Your Apple ID email
```

### Android Fastlane Configuration

Create the following file structure:

```
android/
  fastlane/
    Appfile
    Fastfile
```

#### Appfile

```ruby
# android/fastlane/Appfile
json_key_file("path/to/play-store-credentials.json") # Path to the json secret file downloaded from Google Play Console
package_name("com.khryptorgraphics.tendate") # Android package name
```

#### Fastfile

```ruby
# android/fastlane/Fastfile
default_platform(:android)

platform :android do
  desc "Build and upload a new internal testing release to Google Play"
  lane :beta do
    # Increment version code
    increment_version_code(
      gradle_file_path: "app/build.gradle",
    )
    
    # Build the release APK
    gradle(
      task: "clean assembleRelease",
      properties: {
        "android.injected.signing.store.file" => ENV["KEYSTORE_PATH"],
        "android.injected.signing.store.password" => ENV["STORE_PASSWORD"],
        "android.injected.signing.key.alias" => ENV["KEY_ALIAS"],
        "android.injected.signing.key.password" => ENV["KEY_PASSWORD"],
      }
    )
    
    # Upload to Play Store internal testing track
    upload_to_play_store(
      track: "internal",
      release_status: "completed",
      skip_upload_metadata: true,
      skip_upload_screenshots: true,
      skip_upload_images: true
    )
    
    # Notify slack or other communication channel
    slack(message: "New Android beta build uploaded to Google Play internal testing!")
  end
  
  desc "Deploy a new version to the Google Play Store"
  lane :release do
    # Update metadata and upload screenshots
    # supply(
    #   skip_upload_apk: true,
    #   skip_upload_aab: true,
    #   skip_upload_metadata: false,
    #   skip_upload_screenshots: false,
    #   skip_upload_images: false
    # )
    
    # Build the release bundle
    gradle(
      task: "clean bundleRelease",
      properties: {
        "android.injected.signing.store.file" => ENV["KEYSTORE_PATH"],
        "android.injected.signing.store.password" => ENV["STORE_PASSWORD"],
        "android.injected.signing.key.alias" => ENV["KEY_ALIAS"],
        "android.injected.signing.key.password" => ENV["KEY_PASSWORD"],
      }
    )
    
    # Upload to Play Store production track
    upload_to_play_store(
      track: "production",
      release_status: "completed"
    )
    
    # Notify slack or other communication channel
    slack(message: "New Android production release deployed to Google Play!")
  end
end
```

## 3. GitHub Actions Workflow Configuration

Create the following GitHub Actions workflow files:

### iOS Workflow

```yaml
# .github/workflows/ios-build.yml
name: iOS Build and Deploy

on:
  push:
    branches: [ main, develop ]
    paths:
      - 'ios/**'
      - '10-date-mobile/**'
      - 'package.json'
      - '.github/workflows/ios-build.yml'
  pull_request:
    branches: [ main, develop ]
    paths:
      - 'ios/**'
      - '10-date-mobile/**'
      - 'package.json'
  workflow_dispatch:
    inputs:
      lane:
        description: 'Fastlane lane to run (beta or release)'
        required: true
        default: 'beta'

jobs:
  build:
    name: Build iOS App
    runs-on: macos-latest
    steps:
      - name: Checkout code
        uses: actions/checkout@v3
        with:
          fetch-depth: 0
      
      - name: Set up Ruby
        uses: ruby/setup-ruby@v1
        with:
          ruby-version: '2.7'
          bundler-cache: true
      
      - name: Set up Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
      
      - name: Install dependencies
        run: |
          npm ci
          cd ios && pod install
      
      - name: Setup code signing
        env:
          MATCH_PASSWORD: ${{ secrets.MATCH_PASSWORD }}
          MATCH_GIT_BASIC_AUTHORIZATION: ${{ secrets.MATCH_GIT_BASIC_AUTHORIZATION }}
          FASTLANE_APPLE_APPLICATION_SPECIFIC_PASSWORD: ${{ secrets.FASTLANE_APPLE_APPLICATION_SPECIFIC_PASSWORD }}
          FASTLANE_PASSWORD: ${{ secrets.FASTLANE_PASSWORD }}
          FASTLANE_SESSION: ${{ secrets.FASTLANE_SESSION }}
        run: |
          cd ios
          bundle install
          bundle exec fastlane match development
          bundle exec fastlane match appstore
      
      - name: Run Fastlane
        env:
          MATCH_PASSWORD: ${{ secrets.MATCH_PASSWORD }}
          MATCH_GIT_BASIC_AUTHORIZATION: ${{ secrets.MATCH_GIT_BASIC_AUTHORIZATION }}
          FASTLANE_APPLE_APPLICATION_SPECIFIC_PASSWORD: ${{ secrets.FASTLANE_APPLE_APPLICATION_SPECIFIC_PASSWORD }}
          FASTLANE_PASSWORD: ${{ secrets.FASTLANE_PASSWORD }}
          FASTLANE_SESSION: ${{ secrets.FASTLANE_SESSION }}
        run: |
          cd ios
          if [ "${{ github.event_name }}" == "workflow_dispatch" ]; then
            bundle exec fastlane ${{ github.event.inputs.lane }}
          elif [ "${{ github.ref }}" == "refs/heads/main" ]; then
            bundle exec fastlane release
          else
            bundle exec fastlane beta
          fi
```

### Android Workflow

```yaml
# .github/workflows/android-build.yml
name: Android Build and Deploy

on:
  push:
    branches: [ main, develop ]
    paths:
      - 'android/**'
      - '10-date-mobile/**'
      - 'package.json'
      - '.github/workflows/android-build.yml'
  pull_request:
    branches: [ main, develop ]
    paths:
      - 'android/**'
      - '10-date-mobile/**'
      - 'package.json'
  workflow_dispatch:
    inputs:
      lane:
        description: 'Fastlane lane to run (beta or release)'
        required: true
        default: 'beta'

jobs:
  build:
    name: Build Android App
    runs-on: ubuntu-latest
    steps:
      - name: Checkout code
        uses: actions/checkout@v3
        with:
          fetch-depth: 0
      
      - name: Set up Ruby
        uses: ruby/setup-ruby@v1
        with:
          ruby-version: '2.7'
          bundler-cache: true
      
      - name: Set up Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Set up JDK 11
        uses: actions/setup-java@v3
        with:
          distribution: 'zulu'
          java-version: '11'
      
      - name: Setup Android keystore
        run: |
          echo "${{ secrets.ANDROID_KEYSTORE_BASE64 }}" > keystore.b64
          base64 -d keystore.b64 > android/app/keystore.jks
      
      - name: Run Fastlane
        env:
          KEYSTORE_PATH: ${{ github.workspace }}/android/app/keystore.jks
          STORE_PASSWORD: ${{ secrets.ANDROID_KEYSTORE_PASSWORD }}
          KEY_ALIAS: ${{ secrets.ANDROID_KEY_ALIAS }}
          KEY_PASSWORD: ${{ secrets.ANDROID_KEY_PASSWORD }}
          GOOGLE_PLAY_JSON_KEY: ${{ secrets.GOOGLE_PLAY_JSON_KEY }}
        run: |
          cd android
          echo $GOOGLE_PLAY_JSON_KEY > play-store-credentials.json
          bundle install
          if [ "${{ github.event_name }}" == "workflow_dispatch" ]; then
            bundle exec fastlane ${{ github.event.inputs.lane }}
          elif [ "${{ github.ref }}" == "refs/heads/main" ]; then
            bundle exec fastlane release
          else
            bundle exec fastlane beta
          fi
```

## 4. Code Push (App Center) Integration

Microsoft App Center allows you to deploy code updates directly to user devices without going through the app store review process (OTA updates).

### Setup

1. Install App Center CLI:

```bash
npm install -g appcenter-cli
```

2. Add CodePush to your React Native app:

```bash
npm install --save react-native-code-push
cd ios && pod install
```

3. Create apps in App Center:

```bash
# Log in to App Center
appcenter login

# Create iOS app
appcenter apps create -d "10-Date iOS" -o iOS -p React-Native

# Create Android app
appcenter apps create -d "10-Date Android" -o Android -p React-Native
```

4. Add CodePush deployment keys to your app:

```jsx
// App.tsx
import codePush from 'react-native-code-push';

const codePushOptions = {
  checkFrequency: codePush.CheckFrequency.ON_APP_START,
  installMode: codePush.InstallMode.IMMEDIATE
};

const App = () => {
  // Your app component
};

export default codePush(codePushOptions)(App);
```

5. Integrate with CI/CD:

```yaml
# Add this job to your GitHub Actions workflow
deploy-codepush:
  name: Deploy OTA Update via CodePush
  runs-on: ubuntu-latest
  needs: [build]
  if: github.ref == 'refs/heads/develop'
  steps:
    - name: Checkout code
      uses: actions/checkout@v3
    
    - name: Set up Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
    
    - name: Install dependencies
      run: npm ci
    
    - name: Install App Center CLI
      run: npm install -g appcenter-cli
    
    - name: Deploy to CodePush
      run: |
        appcenter login --token ${{ secrets.APPCENTER_TOKEN }}
        appcenter codepush release-react -a KhryptorGraphics/10-Date-iOS -d Staging
        appcenter codepush release-react -a KhryptorGraphics/10-Date-Android -d Staging
```

## 5. Testing Integration

Set up a testing job in your CI/CD pipeline:

```yaml
# Add this job to your GitHub Actions workflow
test:
  name: Run Tests
  runs-on: ubuntu-latest
  steps:
    - name: Checkout code
      uses: actions/checkout@v3
    
    - name: Set up Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
        cache: 'npm'
    
    - name: Install dependencies
      run: npm ci
    
    - name: Run ESLint
      run: npm run lint
    
    - name: Run TypeScript checks
      run: npm run typecheck
    
    - name: Run Jest tests
      run: npm test -- --coverage
    
    - name: Upload coverage report
      uses: codecov/codecov-action@v3
      with:
        token: ${{ secrets.CODECOV_TOKEN }}
```

## 6. Analytics & Crash Reporting Integration

Add the Firebase analytics setup to your CI/CD pipeline:

```yaml
# Add this to your build job in GitHub Actions
- name: Add Firebase configuration
  run: |
    echo "${{ secrets.FIREBASE_IOS_GOOGLE_SERVICES_INFO_PLIST_BASE64 }}" | base64 --decode > ios/10Date/GoogleService-Info.plist
    echo "${{ secrets.FIREBASE_ANDROID_GOOGLE_SERVICES_JSON_BASE64 }}" | base64 --decode > android/app/google-services.json
```

## 7. Environment-Specific Configurations

Set up environment-specific configurations:

```bash
# Create .env files for different environments
echo "API_URL=https://api.10-date.com/v1
SOCKET_URL=wss://socket.10-date.com
ENVIRONMENT=production" > .env.production

echo "API_URL=https://staging-api.10-date.com/v1
SOCKET_URL=wss://staging-socket.10-date.com
ENVIRONMENT=staging" > .env.staging

echo "API_URL=http://localhost:3000/v1
SOCKET_URL=ws://localhost:3001
ENVIRONMENT=development" > .env.development
```

Use different environment files in your CI/CD pipeline:

```yaml
# Add this to your build job in GitHub Actions
- name: Set up environment
  run: |
    if [ "${{ github.ref }}" == "refs/heads/main" ]; then
      cp .env.production .env
    elif [ "${{ github.ref }}" == "refs/heads/develop" ]; then
      cp .env.staging .env
    else
      cp .env.development .env
    fi
```

## 8. Security Considerations

Ensure proper security practices in your CI/CD pipeline:

1. **Secrets Management**:
   - Never store secrets in code or configuration files
   - Use GitHub Secrets for sensitive information
   - Rotate secrets periodically

2. **Dependencies Scanning**:
   ```yaml
   # Add this job to your GitHub Actions workflow
   security-scan:
     name: Security Scan
     runs-on: ubuntu-latest
     steps:
       - name: Checkout code
         uses: actions/checkout@v3
       
       - name: Run dependency vulnerability scan
         uses: snyk/actions/node@master
         with:
           args: --severity-threshold=high
         env:
           SNYK_TOKEN: ${{ secrets.SNYK_TOKEN }}
   ```

3. **Binary Signing Verification**:
   - Always verify that your app is properly signed during the CI/CD process

## 9. Deployment Strategy

Implement a proper branching and deployment strategy:

```
main             - Production releases (App Store/Google Play)
  |
develop          - Staging builds (TestFlight/Internal Testing)
  |
feature/xyz      - Feature development
  |
bugfix/xyz       - Bug fixes
```

## 10. Monitoring and Alerts

Set up Slack notifications for build status:

```yaml
# Add this step to your GitHub Actions workflow jobs
- name: Notify Slack
  if: always()
  uses: 8398a7/action-slack@v3
  with:
    status: ${{ job.status }}
    fields: repo,message,commit,author,action,eventName,ref,workflow
  env:
    SLACK_WEBHOOK_URL: ${{ secrets.SLACK_WEBHOOK_URL }}
```

## Best Practices

1. **Automate Everything**: Strive for "push button" deployments with minimal manual intervention.

2. **Versioning**: Implement automated versioning to ensure consistency across builds.

3. **Fast Feedback**: Configure CI to run lightweight tests early to provide quick feedback.

4. **Staged Deployments**: Deploy to internal testers, then beta testers, before releasing to production.

5. **Idempotent Builds**: Ensure builds are reproducible and identical given the same inputs.

6. **Feature Flags**: Use feature flags to deploy features that can be enabled/disabled without redeploying.

7. **Rollback Plan**: Always have a plan for rolling back deployments if issues are found.

8. **Performance Testing**: Include performance tests in your pipeline to catch regressions.

9. **Documentation**: Keep CI/CD documentation updated as part of the pipeline updates.

10. **Security Scanning**: Regularly scan dependencies and code for security vulnerabilities.

By following this CI/CD setup, you'll have a robust pipeline for building, testing, and deploying the 10-Date mobile application across iOS and Android platforms. This setup provides confidence in your release process and allows for rapid iteration while maintaining high quality.
