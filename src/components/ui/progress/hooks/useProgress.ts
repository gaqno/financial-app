import { computed } from 'vue';

// Types
interface UseProgressProps {
  value?: number;
  max?: number;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  variant?: 'default' | 'success' | 'warning' | 'danger';
  showLabel?: boolean;
  showPercentage?: boolean;
  label?: string;
  indeterminate?: boolean;
  className?: string;
}

export const useProgress = (props: UseProgressProps) => {
  // Computed properties
  const percentage = computed(() => {
    if (props.indeterminate) return 0;
    const currentValue = Math.min(Math.max(props.value || 0, 0), props.max || 100);
    return Math.round((currentValue / (props.max || 100)) * 100);
  });

  const sizeClasses = computed(() => {
    const sizes = {
      xs: 'h-1',
      sm: 'h-2',
      md: 'h-3',
      lg: 'h-4',
    };
    return sizes[props.size || 'md'];
  });

  const variantClasses = computed(() => {
    const variants = {
      default: 'bg-blue-600 dark:bg-blue-500',
      success: 'bg-green-600 dark:bg-green-500',
      warning: 'bg-yellow-500 dark:bg-yellow-500',
      danger: 'bg-red-600 dark:bg-red-500',
    };
    return variants[props.variant || 'default'];
  });

  const trackClasses = computed(() => {
    return [
      'w-full bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden',
      sizeClasses.value,
      props.className,
    ].filter(Boolean).join(' ');
  });

  const barClasses = computed(() => {
    const baseClasses = 'h-full transition-all duration-300 ease-out rounded-full';
    const animationClasses = props.indeterminate ? 'animate-pulse' : '';
    
    return [
      baseClasses,
      variantClasses.value,
      animationClasses,
    ].filter(Boolean).join(' ');
  });

  const labelClasses = computed(() => {
    return 'text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex justify-between items-center';
  });

  const barStyle = computed(() => {
    if (props.indeterminate) {
      return {
        width: '100%',
        backgroundImage: `linear-gradient(
          90deg,
          transparent 0%,
          currentColor 25%,
          currentColor 75%,
          transparent 100%
        )`,
        animation: 'indeterminate 1.5s ease-in-out infinite',
      };
    }
    
    return {
      width: `${percentage.value}%`,
    };
  });

  return {
    // Computed properties
    percentage,
    trackClasses,
    barClasses,
    labelClasses,
    barStyle,
  };
};
