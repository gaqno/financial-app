import { computed } from 'vue';

// Types
interface SelectOption {
  label: string;
  value: string | number;
  disabled?: boolean;
}

interface UseSelectProps {
  modelValue?: string | number;
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
  id?: string;
  errorMessage?: string;
  helperText?: string;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'outline' | 'filled';
  options?: SelectOption[] | string[] | number[];
  className?: string;
}

interface UseSelectEmits {
  'update:modelValue': (value: string | number) => void;
  'blur': (event: Event) => void;
  'focus': (event: Event) => void;
}

export const useSelect = (props: UseSelectProps, emit: UseSelectEmits) => {
  // Computed properties
  const normalizedOptions = computed(() => {
    return (props.options || []).map(option => {
      if (typeof option === 'string' || typeof option === 'number') {
        return {
          label: option.toString(),
          value: option,
          disabled: false,
        };
      }
      return option;
    });
  });

  const sizeClasses = computed(() => {
    const sizes = {
      sm: 'px-3 py-2 text-sm',
      md: 'px-3 py-3 text-base',
      lg: 'px-4 py-4 text-lg',
    };
    return sizes[props.size || 'md'];
  });

  const variantClasses = computed(() => {
    const baseClasses = 'w-full rounded-lg border transition-all duration-200 focus:outline-none focus:ring-2 appearance-none pr-10';
    
    if (props.errorMessage) {
      return `${baseClasses} border-red-300 bg-red-50 focus:border-red-500 focus:ring-red-200 dark:border-red-600 dark:bg-red-900/20 dark:focus:border-red-400 dark:focus:ring-red-800`;
    }

    const variants = {
      default: `${baseClasses} border-gray-300 bg-white focus:border-blue-500 focus:ring-blue-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:focus:border-blue-400 dark:focus:ring-blue-800`,
      outline: `${baseClasses} border-gray-300 bg-transparent focus:border-blue-500 focus:ring-blue-200 dark:border-gray-600 dark:text-white dark:focus:border-blue-400 dark:focus:ring-blue-800`,
      filled: `${baseClasses} border-transparent bg-gray-100 focus:border-blue-500 focus:ring-blue-200 dark:bg-gray-600 dark:text-white dark:focus:border-blue-400 dark:focus:ring-blue-800`,
    };

    return variants[props.variant || 'default'];
  });

  const disabledClasses = computed(() => {
    return props.disabled 
      ? 'opacity-50 cursor-not-allowed bg-gray-50 dark:bg-gray-800' 
      : 'cursor-pointer';
  });

  const selectClasses = computed(() => {
    return [
      sizeClasses.value,
      variantClasses.value,
      disabledClasses.value,
      props.className,
    ].filter(Boolean).join(' ');
  });

  // Methods
  const handleChange = (event: Event) => {
    const target = event.target as HTMLSelectElement;
    const value = target.value;
    
    // Try to convert to number if the original option was a number
    const numericValue = Number(value);
    const shouldUseNumeric = !isNaN(numericValue) && 
      (props.options || []).some(option => typeof option === 'number' || 
        (typeof option === 'object' && typeof option.value === 'number'));
    
    emit('update:modelValue', shouldUseNumeric ? numericValue : value);
  };

  return {
    // Computed properties
    normalizedOptions,
    selectClasses,
    
    // Methods
    handleChange,
  };
};
