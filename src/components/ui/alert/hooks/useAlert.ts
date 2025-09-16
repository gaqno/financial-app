import { computed } from 'vue';

// Types
interface UseAlertProps {
  variant?: 'info' | 'success' | 'warning' | 'error';
  size?: 'sm' | 'md' | 'lg';
  dismissible?: boolean;
  icon?: boolean;
  className?: string;
}

interface UseAlertEmits {
  (evt: "dismiss"): void;
}

export const useAlert = (props: UseAlertProps, emit: UseAlertEmits) => {
  // Computed properties
  const sizeClasses = computed(() => {
    const sizes = {
      sm: 'p-3 text-sm',
      md: 'p-4 text-base',
      lg: 'p-6 text-lg',
    };
    return sizes[props.size || 'md'];
  });

  const variantClasses = computed(() => {
    const variants = {
      info: 'bg-blue-50 border border-blue-200 text-blue-800 dark:bg-blue-900/20 dark:border-blue-800 dark:text-blue-300',
      success: 'bg-green-50 border border-green-200 text-green-800 dark:bg-green-900/20 dark:border-green-800 dark:text-green-300',
      warning: 'bg-yellow-50 border border-yellow-200 text-yellow-800 dark:bg-yellow-900/20 dark:border-yellow-800 dark:text-yellow-300',
      error: 'bg-red-50 border border-red-200 text-red-800 dark:bg-red-900/20 dark:border-red-800 dark:text-red-300',
    };
    return variants[props.variant || 'info'];
  });

  const alertClasses = computed(() => {
    return [
      'rounded-lg transition-all duration-200',
      sizeClasses.value,
      variantClasses.value,
      props.className,
    ].filter(Boolean).join(' ');
  });

  const iconClasses = computed(() => {
    const baseClasses = 'flex-shrink-0 mr-3';
    const sizes = {
      sm: 'w-4 h-4',
      md: 'w-5 h-5',
      lg: 'w-6 h-6',
    };
    return `${baseClasses} ${sizes[props.size || 'md']}`;
  });

  const dismissButtonClasses = computed(() => {
    const baseClasses = 'flex-shrink-0 ml-auto pl-3 opacity-70 hover:opacity-100 transition-opacity duration-200';
    const sizes = {
      sm: 'w-4 h-4',
      md: 'w-5 h-5',
      lg: 'w-6 h-6',
    };
    return `${baseClasses} ${sizes[props.size || 'md']}`;
  });

  const getIcon = computed(() => {
    const icons = {
      info: 'fas fa-info-circle',
      success: 'fas fa-check-circle',
      warning: 'fas fa-exclamation-triangle',
      error: 'fas fa-exclamation-circle',
    };
    return icons[props.variant || 'info'];
  });

  // Methods
  const handleDismiss = () => {
    emit('dismiss');
  };

  return {
    // Computed properties
    alertClasses,
    iconClasses,
    dismissButtonClasses,
    getIcon,
    
    // Methods
    handleDismiss,
  };
};
