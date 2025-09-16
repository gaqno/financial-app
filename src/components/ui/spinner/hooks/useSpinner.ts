import { computed } from 'vue';

// Types
interface UseSpinnerProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'white';
  speed?: 'slow' | 'normal' | 'fast';
  type?: 'spinner' | 'dots' | 'pulse' | 'bars';
  className?: string;
}

export const useSpinner = (props: UseSpinnerProps) => {
  // Computed properties
  const sizeClasses = computed(() => {
    const sizes = {
      xs: 'w-3 h-3',
      sm: 'w-4 h-4',
      md: 'w-6 h-6',
      lg: 'w-8 h-8',
      xl: 'w-10 h-10',
    };
    return sizes[props.size || 'md'];
  });

  const variantClasses = computed(() => {
    const variants = {
      default: 'text-blue-600 dark:text-blue-400',
      success: 'text-green-600 dark:text-green-400',
      warning: 'text-yellow-500 dark:text-yellow-400',
      danger: 'text-red-600 dark:text-red-400',
      white: 'text-white',
    };
    return variants[props.variant || 'default'];
  });

  const speedClasses = computed(() => {
    const speeds = {
      slow: 'animate-spin-slow',
      normal: 'animate-spin',
      fast: 'animate-spin-fast',
    };
    return speeds[props.speed || 'normal'];
  });

  const spinnerClasses = computed(() => {
    if (props.type === 'spinner') {
      return [
        'border-2 border-current border-t-transparent rounded-full',
        sizeClasses.value,
        variantClasses.value,
        speedClasses.value,
        props.className,
      ].filter(Boolean).join(' ');
    }
    
    return [
      sizeClasses.value,
      variantClasses.value,
      props.className,
    ].filter(Boolean).join(' ');
  });

  const dotClasses = computed(() => {
    const dotSizes = {
      xs: 'w-1 h-1',
      sm: 'w-1.5 h-1.5',
      md: 'w-2 h-2',
      lg: 'w-2.5 h-2.5',
      xl: 'w-3 h-3',
    };
    
    return [
      'bg-current rounded-full animate-pulse',
      dotSizes[props.size || 'md'],
    ].filter(Boolean).join(' ');
  });

  const barClasses = computed(() => {
    const barSizes = {
      xs: 'w-0.5 h-3',
      sm: 'w-0.5 h-4',
      md: 'w-1 h-5',
      lg: 'w-1 h-6',
      xl: 'w-1.5 h-8',
    };
    
    return [
      'bg-current rounded-full',
      barSizes[props.size || 'md'],
    ].filter(Boolean).join(' ');
  });

  return {
    // Computed properties
    spinnerClasses,
    dotClasses,
    barClasses,
    variantClasses,
  };
};
