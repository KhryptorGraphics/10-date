# Accessibility Guidelines for 10-Date Mobile App

This document provides comprehensive guidelines for implementing and maintaining accessibility features in the 10-Date mobile application. Following these guidelines ensures that our app is usable by people with various disabilities and complies with accessibility standards.

## Table of Contents

1. [Introduction](#introduction)
2. [Accessibility Standards](#accessibility-standards)
3. [Key Principles](#key-principles)
4. [Implementation Guidelines](#implementation-guidelines)
   - [Screen Reader Support](#screen-reader-support)
   - [Keyboard Navigation](#keyboard-navigation)
   - [Touch Targets](#touch-targets)
   - [Color and Contrast](#color-and-contrast)
   - [Text and Typography](#text-and-typography)
   - [Motion and Animation](#motion-and-animation)
   - [Form Controls](#form-controls)
5. [Testing](#testing)
6. [Accessibility Utilities](#accessibility-utilities)
7. [Best Practices](#best-practices)
8. [Resources](#resources)

## Introduction

Accessibility is a core value at 10-Date. We are committed to creating an inclusive dating platform that everyone can use, regardless of their abilities. This document provides guidelines and best practices for implementing accessibility features in the 10-Date mobile app.

## Accessibility Standards

Our app aims to comply with the following accessibility standards:

- **WCAG 2.1 Level AA**: Web Content Accessibility Guidelines
- **iOS Accessibility Guidelines**: Apple's guidelines for accessible iOS apps
- **Android Accessibility Guidelines**: Google's guidelines for accessible Android apps

## Key Principles

Our accessibility approach is based on the following principles:

1. **Perceivable**: Information and user interface components must be presentable to users in ways they can perceive.
2. **Operable**: User interface components and navigation must be operable.
3. **Understandable**: Information and the operation of the user interface must be understandable.
4. **Robust**: Content must be robust enough to be interpreted reliably by a wide variety of user agents, including assistive technologies.

## Implementation Guidelines

### Screen Reader Support

Screen readers are essential assistive technologies for users with visual impairments. To ensure screen reader compatibility:

#### Component Labeling

- Use the `accessibilityLabel` prop to provide descriptive labels for all UI elements.
- Labels should be concise but descriptive, explaining what the element is or does.
- Use the `accessibilityHint` prop to provide additional context when needed.

```typescript
// Good example
<TouchableOpacity
  accessibilityLabel="Edit profile"
  accessibilityHint="Double tap to edit your profile information"
  onPress={handleEditProfile}
>
  <Icon name="edit" />
</TouchableOpacity>

// Bad example
<TouchableOpacity onPress={handleEditProfile}>
  <Icon name="edit" />
</TouchableOpacity>
```

#### Role Assignment

- Use the `accessibilityRole` prop to specify the role of UI elements.
- Choose the appropriate role that matches the element's function.

```typescript
// Good example
<TouchableOpacity
  accessibilityRole="button"
  accessibilityLabel="Send message"
  onPress={sendMessage}
>
  <Text>Send</Text>
</TouchableOpacity>

// Bad example
<TouchableOpacity onPress={sendMessage}>
  <Text>Send</Text>
</TouchableOpacity>
```

#### State Communication

- Use the `accessibilityState` prop to communicate the state of UI elements.
- Include states like `checked`, `disabled`, `selected`, and `expanded`.

```typescript
// Good example
<Switch
  value={isEnabled}
  accessibilityLabel={`Notifications ${isEnabled ? 'enabled' : 'disabled'}`}
  accessibilityState={{ checked: isEnabled }}
  onValueChange={toggleNotifications}
/>

// Bad example
<Switch
  value={isEnabled}
  onValueChange={toggleNotifications}
/>
```

#### Focus Management

- Ensure logical focus order that follows the visual layout.
- Implement custom focus management for complex interactions.
- Ensure all interactive elements can receive focus.

### Keyboard Navigation

While mobile apps primarily use touch, many users rely on external keyboards or switch controls:

- Ensure all interactive elements can be accessed and activated using keyboard navigation.
- Implement keyboard shortcuts for common actions where appropriate.
- Provide visual focus indicators for keyboard navigation.

### Touch Targets

Touch targets should be large enough for users with motor impairments:

- Make touch targets at least 44x44 points (iOS) or 48x48 dp (Android).
- Ensure sufficient spacing between touch targets to prevent accidental taps.
- Use the `getMinimumTouchTargetSize()` utility function to get the recommended size.

```typescript
import { getMinimumTouchTargetSize } from '../utils/accessibility';

const { width, height } = getMinimumTouchTargetSize();

const styles = StyleSheet.create({
  button: {
    width: width,
    height: height,
    // Other styles...
  },
});
```

### Color and Contrast

Proper color contrast is essential for users with visual impairments:

- Maintain a minimum contrast ratio of 4.5:1 for normal text and 3:1 for large text.
- Don't rely solely on color to convey information; use additional indicators.
- Support high contrast mode using the `isHighContrastEnabled()` utility function.

```typescript
import { isHighContrastEnabled } from '../utils/accessibility';

const MyComponent = () => {
  const [highContrast, setHighContrast] = useState(false);
  
  useEffect(() => {
    const checkHighContrast = async () => {
      const enabled = await isHighContrastEnabled();
      setHighContrast(enabled);
    };
    
    checkHighContrast();
  }, []);
  
  return (
    <View style={highContrast ? styles.highContrastContainer : styles.container}>
      {/* Component content */}
    </View>
  );
};
```

### Text and Typography

Text should be readable for all users:

- Use a minimum font size of 16 points for body text.
- Support dynamic type (iOS) and font scaling (Android).
- Use the `getFontScale()` utility function to adjust text size based on user preferences.

```typescript
import { getFontScale } from '../utils/accessibility';

const MyComponent = () => {
  const fontScale = getFontScale();
  
  const styles = StyleSheet.create({
    text: {
      fontSize: 16 * fontScale,
      // Other styles...
    },
  });
  
  return (
    <Text style={styles.text}>Hello, world!</Text>
  );
};
```

### Motion and Animation

Some users are sensitive to motion and animation:

- Provide options to reduce or disable animations.
- Respect the user's "Reduce Motion" setting using the `isReducedMotionEnabled()` utility function.
- Keep animations subtle and purposeful.

```typescript
import { isReducedMotionEnabled, getAccessibleAnimationDuration } from '../utils/accessibility';

const MyComponent = () => {
  const [reducedMotion, setReducedMotion] = useState(false);
  const [animationDuration, setAnimationDuration] = useState(300);
  
  useEffect(() => {
    const checkReducedMotion = async () => {
      const enabled = await isReducedMotionEnabled();
      setReducedMotion(enabled);
      
      const duration = await getAccessibleAnimationDuration(300);
      setAnimationDuration(duration);
    };
    
    checkReducedMotion();
  }, []);
  
  return (
    <Animated.View
      style={{
        transform: [{
          translateY: animation.interpolate({
            inputRange: [0, 1],
            outputRange: [0, reducedMotion ? 0 : 100],
          }),
        }],
      }}
    >
      {/* Component content */}
    </Animated.View>
  );
};
```

### Form Controls

Forms should be accessible to all users:

- Provide clear labels for all form fields.
- Group related form elements using appropriate containers.
- Provide clear error messages and validation feedback.
- Ensure form controls have appropriate touch target sizes.

```typescript
// Good example
<View>
  <Text style={styles.label}>Email</Text>
  <TextInput
    style={styles.input}
    value={email}
    onChangeText={setEmail}
    keyboardType="email-address"
    accessibilityLabel="Email address"
    accessibilityHint="Enter your email address"
  />
  {emailError && (
    <Text style={styles.error} accessibilityRole="alert">
      {emailError}
    </Text>
  )}
</View>

// Bad example
<View>
  <TextInput
    placeholder="Email"
    value={email}
    onChangeText={setEmail}
  />
</View>
```

## Testing

Regular accessibility testing is essential to ensure our app remains accessible:

### Manual Testing

- Test with VoiceOver (iOS) and TalkBack (Android) screen readers.
- Test with different font sizes and display settings.
- Test with high contrast mode.
- Test with reduced motion settings.
- Test with keyboard navigation.

### Automated Testing

- Use the Accessibility Inspector in Xcode for iOS.
- Use the Accessibility Scanner for Android.
- Implement accessibility tests in your test suite.

```typescript
// Example Jest test for accessibility
describe('Button Accessibility', () => {
  it('has proper accessibility props', () => {
    const { getByText } = render(<Button label="Submit" />);
    const button = getByText('Submit');
    
    expect(button.props.accessibilityLabel).toBeDefined();
    expect(button.props.accessibilityRole).toBe('button');
  });
});
```

## Accessibility Utilities

The 10-Date app includes a set of accessibility utilities to help implement accessible components:

### Available Utilities

- `createButtonAccessibilityProps`: Creates accessibility props for buttons.
- `createToggleAccessibilityProps`: Creates accessibility props for toggles/switches.
- `createTabAccessibilityProps`: Creates accessibility props for tabs.
- `createListItemAccessibilityProps`: Creates accessibility props for list items.
- `createHeaderAccessibilityProps`: Creates accessibility props for headers.
- `createSearchAccessibilityProps`: Creates accessibility props for search fields.
- `createImageAccessibilityProps`: Creates accessibility props for images.
- `createAdjustableAccessibilityProps`: Creates accessibility props for adjustable components.
- `createCheckboxAccessibilityProps`: Creates accessibility props for checkboxes.
- `createRadioAccessibilityProps`: Creates accessibility props for radio buttons.
- `createExpandableAccessibilityProps`: Creates accessibility props for expandable components.
- `createActionableAccessibilityProps`: Creates accessibility props with custom actions.

### Usage Examples

```typescript
import {
  createButtonAccessibilityProps,
  createToggleAccessibilityProps,
} from '../utils/accessibility';

// Button example
<TouchableOpacity
  {...createButtonAccessibilityProps(
    'Submit',
    'Submit your profile information',
    isDisabled
  )}
  onPress={handleSubmit}
  disabled={isDisabled}
>
  <Text>Submit</Text>
</TouchableOpacity>

// Toggle example
<Switch
  value={isEnabled}
  onValueChange={toggleFeature}
  {...createToggleAccessibilityProps(
    'Notifications',
    isEnabled,
    'Toggle to enable or disable notifications'
  )}
/>
```

## Best Practices

### General Guidelines

1. **Test with real users**: Include people with disabilities in your user testing.
2. **Start early**: Implement accessibility from the beginning of development.
3. **Regular audits**: Conduct regular accessibility audits.
4. **Documentation**: Document accessibility features and requirements.
5. **Training**: Provide accessibility training for all team members.

### Component-Specific Guidelines

#### Images

- Always provide alternative text for images using `accessibilityLabel`.
- If an image is decorative, set `accessible={false}`.

#### Navigation

- Ensure navigation elements are clearly labeled.
- Provide skip navigation options for screen reader users.
- Ensure consistent navigation patterns.

#### Modals and Dialogs

- Trap focus within modals when they are open.
- Provide clear close mechanisms.
- Announce modal openings to screen readers.

#### Lists

- Properly structure lists for screen readers.
- Provide context about the list (e.g., "Item 3 of 10").

## Resources

### Tools and Libraries

- [React Native Accessibility API](https://reactnative.dev/docs/accessibility)
- [iOS Accessibility](https://developer.apple.com/accessibility/ios/)
- [Android Accessibility](https://developer.android.com/guide/topics/ui/accessibility)

### Testing Tools

- [Accessibility Inspector (Xcode)](https://developer.apple.com/library/archive/documentation/Accessibility/Conceptual/AccessibilityMacOSX/OSXAXTestingApps.html)
- [Accessibility Scanner (Android)](https://play.google.com/store/apps/details?id=com.google.android.apps.accessibility.auditor)

### Standards and Guidelines

- [WCAG 2.1](https://www.w3.org/TR/WCAG21/)
- [Mobile Accessibility: How WCAG 2.0 and Other W3C/WAI Guidelines Apply to Mobile](https://www.w3.org/TR/mobile-accessibility-mapping/)

---

By following these guidelines, we can ensure that the 10-Date mobile app is accessible to all users, regardless of their abilities. If you have any questions or need assistance implementing accessibility features, please contact the accessibility team.