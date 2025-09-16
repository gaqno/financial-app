import { computed } from 'vue';

// Types
interface UseLabelProps {
  htmlFor?: string;
  required?: boolean;
  disabled?: boolean;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'bold' | 'muted';
  className?: string;
}

export const useLabel = (props: UseLabelProps) => {
  // Computed properties
  const sizeClasses = computed(() => {
    const sizes = {
      sm: 'text-sm',
      md: 'text-base',
      lg: 'text-lg',
    };
    return sizes[props.size || 'md'];
  });

  const variantClasses = computed(() => {
    const variants = {
      default: 'font-medium text-gray-900 dark:text-gray-100',
      bold: 'font-bold text-gray-900 dark:text-gray-100',
      muted: 'font-medium text-gray-600 dark:text-gray-400',
    };
    return variants[props.variant || 'default'];
  });

  const disabledClasses = computed(() => {
    return props.disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer';
  });

  const labelClasses = computed(() => {
    return [
      'block transition-colors duration-200',
      sizeClasses.value,
      variantClasses.value,
      disabledClasses.value,
      props.className,
    ].filter(Boolean).join(' ');
  });

  return {
    // Computed properties
    labelClasses,
  };
};
