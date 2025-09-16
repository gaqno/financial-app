import { computed } from 'vue';

// Types
interface UseButtonProps {
  type?: 'button' | 'submit' | 'reset';
  variant?: 'primary' | 'secondary' | 'danger' | 'success' | 'warning' | 'info' | 'ghost' | 'outline';
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  disabled?: boolean;
  loading?: boolean;
  leftIcon?: string;
  rightIcon?: string;
  content?: string;
  fullWidth?: boolean;
  className?: string;
}

interface UseButtonEmits {
  click: (event: Event) => void;
}

export const useButton = (props: UseButtonProps, emit: UseButtonEmits) => {
  // Computed properties
  const sizeClasses = computed(() => {
    const sizes = {
      xs: 'px-2 py-1 text-xs font-medium',
      sm: 'px-3 py-2 text-sm font-medium',
      md: 'px-4 py-2 text-sm font-medium',
      lg: 'px-4 py-3 text-base font-medium',
      xl: 'px-6 py-4 text-lg font-medium',
    };
    return sizes[props.size || 'md'];
  });

  const variantClasses = computed(() => {
    const baseClasses = 'inline-flex items-center justify-center rounded-lg border transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';

    const variants = {
      primary: `${baseClasses} border-transparent bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500 dark:bg-blue-500 dark:hover:bg-blue-600 dark:focus:ring-blue-400`,
      secondary: `${baseClasses} border-gray-300 bg-white text-gray-700 hover:bg-gray-50 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600 dark:focus:ring-blue-400`,
      danger: `${baseClasses} border-transparent bg-red-600 text-white hover:bg-red-700 focus:ring-red-500 dark:bg-red-500 dark:hover:bg-red-600 dark:focus:ring-red-400`,
      success: `${baseClasses} border-transparent bg-green-600 text-white hover:bg-green-700 focus:ring-green-500 dark:bg-green-500 dark:hover:bg-green-600 dark:focus:ring-green-400`,
      warning: `${baseClasses} border-transparent bg-yellow-500 text-white hover:bg-yellow-600 focus:ring-yellow-500 dark:bg-yellow-500 dark:hover:bg-yellow-600 dark:focus:ring-yellow-400`,
      info: `${baseClasses} border-transparent bg-cyan-600 text-white hover:bg-cyan-700 focus:ring-cyan-500 dark:bg-cyan-500 dark:hover:bg-cyan-600 dark:focus:ring-cyan-400`,
      ghost: `${baseClasses} border-transparent bg-transparent text-gray-700 hover:bg-gray-100 focus:ring-gray-500 dark:text-gray-200 dark:hover:bg-gray-800 dark:focus:ring-gray-400`,
      outline: `${baseClasses} border-gray-300 bg-transparent text-gray-700 hover:bg-gray-50 focus:ring-blue-500 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-800 dark:focus:ring-blue-400`,
    };

    return variants[props.variant || 'primary'];
  });

  const fullWidthClasses = computed(() => {
    return props.fullWidth ? 'w-full' : '';
  });

  const buttonClasses = computed(() => {
    return [
      sizeClasses.value,
      variantClasses.value,
      fullWidthClasses.value,
      props.className,
    ].filter(Boolean).join(' ');
  });

  // Methods
  const handleClick = (event: Event) => {
    if (!props.disabled && !props.loading) {
      emit('click', event);
    }
  };

  return {
    // Computed properties
    buttonClasses,
    
    // Methods
    handleClick,
  };
};
