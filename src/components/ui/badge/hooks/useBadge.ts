import { computed } from 'vue';

// Types
interface UseBadgeProps {
  variant?: 'default' | 'primary' | 'secondary' | 'success' | 'warning' | 'danger' | 'info' | 'dark' | 'light';
  size?: 'xs' | 'sm' | 'md' | 'lg';
  rounded?: boolean;
  outline?: boolean;
  dot?: boolean;
  icon?: string;
  className?: string;
}

export const useBadge = (props: UseBadgeProps) => {
  // Computed properties
  const sizeClasses = computed(() => {
    if (props.dot) {
      const dotSizes = {
        xs: 'w-2 h-2',
        sm: 'w-2.5 h-2.5',
        md: 'w-3 h-3',
        lg: 'w-4 h-4',
      };
      return dotSizes[props.size || 'md'];
    }

    const sizes = {
      xs: 'px-1.5 py-0.5 text-xs',
      sm: 'px-2 py-1 text-xs',
      md: 'px-2.5 py-1.5 text-sm',
      lg: 'px-3 py-2 text-base',
    };
    return sizes[props.size || 'md'];
  });

  const variantClasses = computed(() => {
    const baseVariants = {
      default: {
        solid: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
        outline: 'border border-gray-300 text-gray-700 dark:border-gray-600 dark:text-gray-300',
      },
      primary: {
        solid: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
        outline: 'border border-blue-300 text-blue-700 dark:border-blue-600 dark:text-blue-400',
      },
      secondary: {
        solid: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
        outline: 'border border-gray-300 text-gray-700 dark:border-gray-600 dark:text-gray-300',
      },
      success: {
        solid: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
        outline: 'border border-green-300 text-green-700 dark:border-green-600 dark:text-green-400',
      },
      warning: {
        solid: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
        outline: 'border border-yellow-300 text-yellow-700 dark:border-yellow-600 dark:text-yellow-400',
      },
      danger: {
        solid: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
        outline: 'border border-red-300 text-red-700 dark:border-red-600 dark:text-red-400',
      },
      info: {
        solid: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-300',
        outline: 'border border-cyan-300 text-cyan-700 dark:border-cyan-600 dark:text-cyan-400',
      },
      dark: {
        solid: 'bg-gray-800 text-white dark:bg-gray-200 dark:text-gray-800',
        outline: 'border border-gray-800 text-gray-800 dark:border-gray-200 dark:text-gray-200',
      },
      light: {
        solid: 'bg-gray-50 text-gray-700 dark:bg-gray-600 dark:text-gray-200',
        outline: 'border border-gray-200 text-gray-600 dark:border-gray-500 dark:text-gray-400',
      },
    };

    const variant = props.variant || 'default';
    const style = props.outline ? 'outline' : 'solid';
    
    return baseVariants[variant][style];
  });

  const shapeClasses = computed(() => {
    if (props.dot) {
      return 'rounded-full';
    }
    return props.rounded ? 'rounded-full' : 'rounded-md';
  });

  const badgeClasses = computed(() => {
    const baseClasses = props.dot 
      ? 'inline-block' 
      : 'inline-flex items-center justify-center font-medium';

    return [
      baseClasses,
      sizeClasses.value,
      variantClasses.value,
      shapeClasses.value,
      props.className,
    ].filter(Boolean).join(' ');
  });

  const iconClasses = computed(() => {
    if (!props.icon) return '';
    
    const iconSizes = {
      xs: 'text-xs',
      sm: 'text-xs',
      md: 'text-sm',
      lg: 'text-base',
    };
    
    return `${props.icon} ${iconSizes[props.size || 'md']}`;
  });

  return {
    // Computed properties
    badgeClasses,
    iconClasses,
  };
};
