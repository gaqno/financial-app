// Common UI component types and interfaces

// Size variants used across multiple components
export type Size = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

// Color variants used across multiple components
export type ColorVariant = 'default' | 'primary' | 'secondary' | 'success' | 'warning' | 'danger' | 'info';

// Animation and interaction states
export type LoadingState = 'idle' | 'loading' | 'success' | 'error';

// Common props that many components share
export interface BaseComponentProps {
  className?: string;
  disabled?: boolean;
  id?: string;
}

export interface SizeableComponentProps extends BaseComponentProps {
  size?: Size;
}

export interface VariantComponentProps extends BaseComponentProps {
  variant?: ColorVariant;
}

export interface LoadingComponentProps extends BaseComponentProps {
  loading?: boolean;
}

// Form-related types
export interface FormFieldProps extends BaseComponentProps {
  required?: boolean;
  errorMessage?: string;
  helperText?: string;
}

// Event handler types
export type ClickHandler = (event: Event) => void;
export type ChangeHandler = (value: any) => void;
export type FocusHandler = (event: Event) => void;
export type BlurHandler = (event: Event) => void;

// Position and placement types
export type Position = 'top' | 'bottom' | 'left' | 'right';
export type Placement = 'center' | 'start' | 'end';

// Status types
export type Status = 'online' | 'offline' | 'away' | 'busy';
export type ToastType = 'success' | 'error' | 'warning' | 'info';

// Animation types
export type AnimationType = 'none' | 'fade' | 'slide' | 'scale' | 'bounce';
export type AnimationSpeed = 'slow' | 'normal' | 'fast';
