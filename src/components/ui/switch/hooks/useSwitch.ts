import { computed } from 'vue';

// Types
interface UseSwitchProps {
  modelValue?: boolean;
  disabled?: boolean;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'success' | 'warning' | 'danger';
  label?: string;
  description?: string;
  id?: string;
  className?: string;
}

interface UseSwitchEmits {
  'update:modelValue': (value: boolean) => void;
  'change': (value: boolean) => void;
}

export const useSwitch = (props: UseSwitchProps, emit: UseSwitchEmits) => {
  // Computed properties
  const sizeClasses = computed(() => {
    const sizes = {
      sm: {
        track: 'w-9 h-5',
        thumb: 'w-4 h-4',
        translate: 'translate-x-4',
      },
      md: {
        track: 'w-11 h-6',
        thumb: 'w-5 h-5',
        translate: 'translate-x-5',
      },
      lg: {
        track: 'w-14 h-7',
        thumb: 'w-6 h-6',
        translate: 'translate-x-7',
      },
    };
    return sizes[props.size || 'md'];
  });

  const variantClasses = computed(() => {
    if (props.disabled) {
      return props.modelValue
        ? 'bg-gray-300 dark:bg-gray-600'
        : 'bg-gray-200 dark:bg-gray-700';
    }

    const variants = {
      default: props.modelValue
        ? 'bg-blue-600 dark:bg-blue-500'
        : 'bg-gray-200 dark:bg-gray-700',
      success: props.modelValue
        ? 'bg-green-600 dark:bg-green-500'
        : 'bg-gray-200 dark:bg-gray-700',
      warning: props.modelValue
        ? 'bg-yellow-500 dark:bg-yellow-500'
        : 'bg-gray-200 dark:bg-gray-700',
      danger: props.modelValue
        ? 'bg-red-600 dark:bg-red-500'
        : 'bg-gray-200 dark:bg-gray-700',
    };

    return variants[props.variant || 'default'];
  });

  const trackClasses = computed(() => {
    const baseClasses = 'relative inline-flex flex-shrink-0 border-2 border-transparent rounded-full cursor-pointer transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500';
    
    const disabledClasses = props.disabled 
      ? 'opacity-50 cursor-not-allowed' 
      : 'cursor-pointer';

    return [
      baseClasses,
      sizeClasses.value.track,
      variantClasses.value,
      disabledClasses,
      props.className,
    ].filter(Boolean).join(' ');
  });

  const thumbClasses = computed(() => {
    const baseClasses = 'pointer-events-none inline-block rounded-full bg-white shadow transform ring-0 transition duration-200 ease-in-out';
    const translateClasses = props.modelValue ? sizeClasses.value.translate : 'translate-x-0';
    
    return [
      baseClasses,
      sizeClasses.value.thumb,
      translateClasses,
    ].filter(Boolean).join(' ');
  });

  const labelClasses = computed(() => {
    const baseClasses = 'font-medium text-gray-900 dark:text-gray-100';
    const disabledClasses = props.disabled ? 'opacity-50' : '';
    
    return [baseClasses, disabledClasses].filter(Boolean).join(' ');
  });

  const descriptionClasses = computed(() => {
    const baseClasses = 'text-sm text-gray-500 dark:text-gray-400';
    const disabledClasses = props.disabled ? 'opacity-50' : '';
    
    return [baseClasses, disabledClasses].filter(Boolean).join(' ');
  });

  // Methods
  const handleToggle = () => {
    if (!props.disabled) {
      const newValue = !props.modelValue;
      emit('update:modelValue', newValue);
      emit('change', newValue);
    }
  };

  const handleKeydown = (event: KeyboardEvent) => {
    if (event.key === ' ' || event.key === 'Enter') {
      event.preventDefault();
      handleToggle();
    }
  };

  return {
    // Computed properties
    trackClasses,
    thumbClasses,
    labelClasses,
    descriptionClasses,
    
    // Methods
    handleToggle,
    handleKeydown,
  };
};
