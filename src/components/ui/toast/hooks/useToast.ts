import { computed } from 'vue';

// Types
interface UseToastProps {
  type?: 'success' | 'error' | 'warning' | 'info';
  title?: string;
  message: string;
  dismissible?: boolean;
  duration?: number;
  icon?: boolean;
  actions?: Array<{
    label: string;
    action: () => void;
    variant?: 'primary' | 'secondary';
  }>;
  className?: string;
}

interface UseToastEmits {
  dismiss: () => void;
  action: (actionIndex: number) => void;
}

export const useToast = (props: UseToastProps, emit: UseToastEmits) => {
  // Computed properties
  const typeClasses = computed(() => {
    const variants = {
      success: 'border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900/20',
      error: 'border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20',
      warning: 'border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-900/20',
      info: 'border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-900/20',
    };
    return variants[props.type || 'info'];
  });

  const toastClasses = computed(() => {
    return [
      'flex items-start gap-3 p-4 rounded-lg shadow-lg border pointer-events-auto cursor-pointer transition-all duration-300 ease-in-out max-w-sm w-full hover:shadow-xl hover:scale-105',
      typeClasses.value,
      props.className,
    ].filter(Boolean).join(' ');
  });

  const iconClasses = computed(() => {
    const icons = {
      success: 'fas fa-check-circle text-green-600 dark:text-green-400',
      error: 'fas fa-exclamation-circle text-red-600 dark:text-red-400',
      warning: 'fas fa-exclamation-triangle text-yellow-600 dark:text-yellow-400',
      info: 'fas fa-info-circle text-blue-600 dark:text-blue-400',
    };
    return `flex-shrink-0 text-lg ${icons[props.type || 'info']}`;
  });

  const titleClasses = computed(() => {
    const colors = {
      success: 'text-green-900 dark:text-green-100',
      error: 'text-red-900 dark:text-red-100',
      warning: 'text-yellow-900 dark:text-yellow-100',
      info: 'text-blue-900 dark:text-blue-100',
    };
    return `font-medium text-sm mb-1 ${colors[props.type || 'info']}`;
  });

  const messageClasses = computed(() => {
    const colors = {
      success: 'text-green-800 dark:text-green-200',
      error: 'text-red-800 dark:text-red-200',
      warning: 'text-yellow-800 dark:text-yellow-200',
      info: 'text-blue-800 dark:text-blue-200',
    };
    return `text-sm leading-relaxed ${colors[props.type || 'info']}`;
  });

  const dismissButtonClasses = computed(() => {
    const colors = {
      success: 'text-green-400 hover:text-green-600 dark:text-green-500 dark:hover:text-green-300',
      error: 'text-red-400 hover:text-red-600 dark:text-red-500 dark:hover:text-red-300',
      warning: 'text-yellow-400 hover:text-yellow-600 dark:text-yellow-500 dark:hover:text-yellow-300',
      info: 'text-blue-400 hover:text-blue-600 dark:text-blue-500 dark:hover:text-blue-300',
    };
    return `flex-shrink-0 transition-colors rounded-full p-1 hover:bg-black/5 dark:hover:bg-white/5 ${colors[props.type || 'info']}`;
  });

  // Methods
  const handleDismiss = () => {
    emit('dismiss');
  };

  const handleAction = (actionIndex: number) => {
    if (props.actions && props.actions[actionIndex]) {
      props.actions[actionIndex].action();
      emit('action', actionIndex);
    }
  };

  return {
    // Computed properties
    toastClasses,
    iconClasses,
    titleClasses,
    messageClasses,
    dismissButtonClasses,
    
    // Methods
    handleDismiss,
    handleAction,
  };
};
