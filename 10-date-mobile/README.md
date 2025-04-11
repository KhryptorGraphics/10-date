# 10-Date Mobile App

A cross-platform mobile dating application built with React Native.

## Features

- User authentication with biometric support
- Profile creation and management
- Location-based matching
- Real-time chat with end-to-end encryption
- AI-powered matchmaking algorithm
- Premium subscription tiers
- Push notifications

## Getting Started

### Prerequisites

- Node.js (v18 or later)
- npm or yarn
- React Native CLI
- Android Studio (for Android development)
- Xcode (for iOS development)

### Installation

1. Clone the repository:
```bash
git clone https://github.com/KhryptorGraphics/10-date.git
cd 10-date/10-date-mobile
```

2. Install dependencies:
```bash
npm install
# or
yarn install
```

3. Install iOS dependencies (macOS only):
```bash
cd ios && pod install && cd ..
```

4. Configure environment variables:
Create a `.env` file in the root of the project with the following variables:
```
API_URL=https://api.10-date.com/v1
STRIPE_PUBLISHABLE_KEY=your_stripe_key
GOOGLE_MAPS_API_KEY=your_maps_key
```

### Running the App

#### iOS
```bash
npm run ios
# or
yarn ios
```

#### Android
```bash
npm run android
# or
yarn android
```

## Project Structure

```
src/
├── assets/           # Images, fonts, and other static assets
├── components/       # Reusable components
├── navigation/       # Navigation configuration
├── screens/          # Screen components
├── services/         # API and third-party service integration
├── store/            # Redux store and slices
├── theme/            # Theme configuration
├── types/            # TypeScript type definitions
└── utils/            # Utility functions
```

## Tech Stack

- React Native
- TypeScript
- Redux Toolkit
- React Navigation
- Socket.IO Client
- TensorFlow.js
- React Native Keychain (for secure storage)
- React Native TouchID (for biometric authentication)

## License

This project is proprietary software owned by KhryptorGraphics.
