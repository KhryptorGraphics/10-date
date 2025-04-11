/**
 * Accessibility Utilities
 * 
 * This module provides helper functions and constants for implementing
 * accessibility features in the 10-Date mobile app.
 */

/**
 * AccessibilityProps interface
 * 
 * Defines common accessibility properties that can be applied to components
 */
export interface AccessibilityProps {
  accessible?: boolean;
  accessibilityLabel?: string;
  accessibilityHint?: string;
  accessibilityRole?: AccessibilityRole;
  accessibilityState?: AccessibilityState;
  accessibilityValue?: AccessibilityValue;
  accessibilityActions?: AccessibilityAction[];
  onAccessibilityAction?: (event: { nativeEvent: { actionName: string } }) => void;
}

/**
 * AccessibilityRole type
 * 
 * Defines the possible accessibility roles for components
 */
export type AccessibilityRole =
  | 'none'
  | 'button'
  | 'link'
  | 'search'
  | 'image'
  | 'text'
  | 'adjustable'
  | 'checkbox'
  | 'radio'
  | 'spinbutton'
  | 'switch'
  | 'tab'
  | 'tablist'
  | 'timer'
  | 'list'
  | 'header'
  | 'summary'
  | 'imagebutton'
  | 'menu';

/**
 * AccessibilityState interface
 * 
 * Defines the possible accessibility states for components
 */
export interface AccessibilityState {
  disabled?: boolean;
  selected?: boolean;
  checked?: boolean | 'mixed';
  busy?: boolean;
  expanded?: boolean;
}

/**
 * AccessibilityValue interface
 * 
 * Defines the possible accessibility values for components
 */
export interface AccessibilityValue {
  min?: number;
  max?: number;
  now?: number;
  text?: string;
}

/**
 * AccessibilityAction interface
 * 
 * Defines the possible accessibility actions for components
 */
export interface AccessibilityAction {
  name: string;
  label?: string;
}

/**
 * Create accessibility props for a button
 * 
 * @param label The accessibility label for the button
 * @param hint The accessibility hint for the button
 * @param disabled Whether the button is disabled
 * @returns AccessibilityProps object
 */
export const createButtonAccessibilityProps = (
  label: string,
  hint?: string,
  disabled?: boolean
): AccessibilityProps => {
  return {
    accessible: true,
    accessibilityLabel: label,
    accessibilityHint: hint,
    accessibilityRole: 'button',
    accessibilityState: {
      disabled: !!disabled,
    },
  };
};

/**
 * Create accessibility props for a toggle/switch
 * 
 * @param label The accessibility label for the toggle
 * @param isOn Whether the toggle is on
 * @param hint The accessibility hint for the toggle
 * @returns AccessibilityProps object
 */
export const createToggleAccessibilityProps = (
  label: string,
  isOn: boolean,
  hint?: string
): AccessibilityProps => {
  return {
    accessible: true,
    accessibilityLabel: `${label}, ${isOn ? 'enabled' : 'disabled'}`,
    accessibilityHint: hint,
    accessibilityRole: 'switch',
    accessibilityState: {
      checked: isOn,
    },
  };
};

/**
 * Create accessibility props for a tab
 * 
 * @param label The accessibility label for the tab
 * @param isSelected Whether the tab is selected
 * @returns AccessibilityProps object
 */
export const createTabAccessibilityProps = (
  label: string,
  isSelected: boolean
): AccessibilityProps => {
  return {
    accessible: true,
    accessibilityLabel: label,
    accessibilityRole: 'tab',
    accessibilityState: {
      selected: isSelected,
    },
  };
};

/**
 * Create accessibility props for a list item
 * 
 * @param label The accessibility label for the list item
 * @param hint The accessibility hint for the list item
 * @returns AccessibilityProps object
 */
export const createListItemAccessibilityProps = (
  label: string,
  hint?: string
): AccessibilityProps => {
  return {
    accessible: true,
    accessibilityLabel: label,
    accessibilityHint: hint,
    accessibilityRole: 'text',
  };
};

/**
 * Create accessibility props for a header
 * 
 * @param label The accessibility label for the header
 * @returns AccessibilityProps object
 */
export const createHeaderAccessibilityProps = (
  label: string
): AccessibilityProps => {
  return {
    accessible: true,
    accessibilityLabel: label,
    accessibilityRole: 'header',
  };
};

/**
 * Create accessibility props for a search field
 * 
 * @param label The accessibility label for the search field
 * @param hint The accessibility hint for the search field
 * @returns AccessibilityProps object
 */
export const createSearchAccessibilityProps = (
  label: string,
  hint?: string
): AccessibilityProps => {
  return {
    accessible: true,
    accessibilityLabel: label,
    accessibilityHint: hint,
    accessibilityRole: 'search',
  };
};

/**
 * Create accessibility props for an image
 * 
 * @param description The description of the image
 * @returns AccessibilityProps object
 */
export const createImageAccessibilityProps = (
  description: string
): AccessibilityProps => {
  return {
    accessible: true,
    accessibilityLabel: description,
    accessibilityRole: 'image',
  };
};

/**
 * Create accessibility props for an adjustable component (e.g., slider)
 * 
 * @param label The accessibility label for the component
 * @param min The minimum value
 * @param max The maximum value
 * @param current The current value
 * @returns AccessibilityProps object
 */
export const createAdjustableAccessibilityProps = (
  label: string,
  min: number,
  max: number,
  current: number
): AccessibilityProps => {
  return {
    accessible: true,
    accessibilityLabel: label,
    accessibilityRole: 'adjustable',
    accessibilityValue: {
      min,
      max,
      now: current,
      text: `${current} of ${max}`,
    },
  };
};

/**
 * Create accessibility props for a checkbox
 * 
 * @param label The accessibility label for the checkbox
 * @param isChecked Whether the checkbox is checked
 * @param hint The accessibility hint for the checkbox
 * @returns AccessibilityProps object
 */
export const createCheckboxAccessibilityProps = (
  label: string,
  isChecked: boolean,
  hint?: string
): AccessibilityProps => {
  return {
    accessible: true,
    accessibilityLabel: `${label}, ${isChecked ? 'checked' : 'unchecked'}`,
    accessibilityHint: hint,
    accessibilityRole: 'checkbox',
    accessibilityState: {
      checked: isChecked,
    },
  };
};

/**
 * Create accessibility props for a radio button
 * 
 * @param label The accessibility label for the radio button
 * @param isSelected Whether the radio button is selected
 * @param hint The accessibility hint for the radio button
 * @returns AccessibilityProps object
 */
export const createRadioAccessibilityProps = (
  label: string,
  isSelected: boolean,
  hint?: string
): AccessibilityProps => {
  return {
    accessible: true,
    accessibilityLabel: `${label}, ${isSelected ? 'selected' : 'not selected'}`,
    accessibilityHint: hint,
    accessibilityRole: 'radio',
    accessibilityState: {
      checked: isSelected,
    },
  };
};

/**
 * Create accessibility props for an expandable component
 * 
 * @param label The accessibility label for the component
 * @param isExpanded Whether the component is expanded
 * @param hint The accessibility hint for the component
 * @returns AccessibilityProps object
 */
export const createExpandableAccessibilityProps = (
  label: string,
  isExpanded: boolean,
  hint?: string
): AccessibilityProps => {
  return {
    accessible: true,
    accessibilityLabel: `${label}, ${isExpanded ? 'expanded' : 'collapsed'}`,
    accessibilityHint: hint,
    accessibilityState: {
      expanded: isExpanded,
    },
  };
};

/**
 * Create accessibility props with custom actions
 * 
 * @param label The accessibility label for the component
 * @param actions The accessibility actions for the component
 * @param onAction The callback for when an action is performed
 * @returns AccessibilityProps object
 */
export const createActionableAccessibilityProps = (
  label: string,
  actions: { name: string; label: string }[],
  onAction: (actionName: string) => void
): AccessibilityProps => {
  return {
    accessible: true,
    accessibilityLabel: label,
    accessibilityActions: actions,
    onAccessibilityAction: (event) => onAction(event.nativeEvent.actionName),
  };
};

/**
 * Announce a message to screen readers
 * 
 * @param message The message to announce
 */
export const announceForAccessibility = (message: string): void => {
  // This is a placeholder for the actual implementation
  // In a real app, this would use the appropriate native module
  console.log('Accessibility announcement:', message);
};

/**
 * Check if a screen reader is enabled
 * 
 * @returns Promise that resolves to a boolean indicating if a screen reader is enabled
 */
export const isScreenReaderEnabled = async (): Promise<boolean> => {
  // This is a placeholder for the actual implementation
  // In a real app, this would use the appropriate native module
  return Promise.resolve(false);
};

/**
 * Get the recommended minimum touch target size
 * 
 * @returns The recommended minimum touch target size in points
 */
export const getMinimumTouchTargetSize = (): { width: number; height: number } => {
  return {
    width: 44,
    height: 44,
  };
};

/**
 * Check if high contrast mode is enabled
 * 
 * @returns Promise that resolves to a boolean indicating if high contrast mode is enabled
 */
export const isHighContrastEnabled = async (): Promise<boolean> => {
  // This is a placeholder for the actual implementation
  // In a real app, this would use the appropriate native module
  return Promise.resolve(false);
};

/**
 * Get the recommended font scale factor
 * 
 * @returns The recommended font scale factor
 */
export const getFontScale = (): number => {
  // This is a placeholder for the actual implementation
  // In a real app, this would use the appropriate native module
  return 1;
};

/**
 * Check if reduced motion is enabled
 * 
 * @returns Promise that resolves to a boolean indicating if reduced motion is enabled
 */
export const isReducedMotionEnabled = async (): Promise<boolean> => {
  // This is a placeholder for the actual implementation
  // In a real app, this would use the appropriate native module
  return Promise.resolve(false);
};

/**
 * Get the recommended animation duration based on accessibility settings
 * 
 * @param defaultDuration The default animation duration in milliseconds
 * @returns The recommended animation duration in milliseconds
 */
export const getAccessibleAnimationDuration = async (
  defaultDuration: number
): Promise<number> => {
  const reducedMotion = await isReducedMotionEnabled();
  
  if (reducedMotion) {
    // Reduce animation duration or disable animations
    return 0; // Disable animations
  }
  
  return defaultDuration;
};