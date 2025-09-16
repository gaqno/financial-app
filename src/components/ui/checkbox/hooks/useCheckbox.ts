import { computed } from 'vue';

// Types
interface UseCheckboxProps {
  modelValue?: boolean;
  label?: string;
  description?: string;
  disabled?: boolean;
  required?: boolean;
  id?: string;
  errorMessage?: string;
  size?: 'sm' | 'md' | 'lg';
  customStyle?: boolean;
  className?: string;
}

interface UseCheckboxEmits {
  'update:modelValue': (value: boolean) => void;
  'blur': (event: Event) => void;
  'focus': (event: Event) => void;
}

export const useCheckbox = (props: UseCheckboxProps, emit: UseCheckboxEmits) => {
  // Computed properties
  const sizeClasses = computed(() => {
    const sizes = {
      sm: 'h-4 w-4',
      md: 'h-5 w-5',
      lg: 'h-6 w-6',
    };
    return sizes[props.size || 'md'];
  });

  const baseCheckboxClasses = computed(() => {
    if (props.customStyle) {
      return 'sr-only'; // Hide native checkbox when using custom style
    }
    
    const baseClasses = 'rounded border-gray-300 text-blue-600 shadow-sm focus:ring-blue-500 focus:ring-2 focus:ring-offset-2 dark:border-gray-600 dark:bg-gray-700 dark:focus:ring-blue-400 dark:focus:ring-offset-gray-800 transition-all duration-200';
    return baseClasses;
  });

  const disabledClasses = computed(() => {
    return props.disabled 
      ? 'opacity-50 cursor-not-allowed' 
      : 'cursor-pointer';
  });

  const errorClasses = computed(() => {
    return props.errorMessage 
      ? 'border-red-300 text-red-600 focus:ring-red-500 dark:border-red-600' 
      : '';
  });

  const checkboxClasses = computed(() => {
    return [
      sizeClasses.value,
      baseCheckboxClasses.value,
      disabledClasses.value,
      errorClasses.value,
      props.className,
    ].filter(Boolean).join(' ');
  });

  const customCheckmarkClasses = computed(() => {
    if (!props.customStyle) return '';
    
    const baseClasses = 'absolute inset-0 flex items-center justify-center rounded border-2 transition-all duration-200';
    const sizeClass = sizeClasses.value;
    
    const stateClasses = props.modelValue
      ? 'bg-blue-600 border-blue-600 dark:bg-blue-500 dark:border-blue-500'
      : 'bg-white border-gray-300 dark:bg-gray-700 dark:border-gray-600';
    
    const interactionClasses = !props.disabled
      ? 'hover:border-blue-400 dark:hover:border-blue-400'
      : 'opacity-50 cursor-not-allowed';
    
    const errorClass = props.errorMessage
      ? 'border-red-300 dark:border-red-600'
      : '';
    
    return [
      baseClasses,
      sizeClass,
      stateClasses,
      interactionClasses,
      errorClass,
    ].filter(Boolean).join(' ');
  });

  const labelClasses = computed(() => {
    const baseClasses = 'font-medium text-gray-900 dark:text-gray-100 cursor-pointer';
    const disabledClass = props.disabled ? 'opacity-50 cursor-not-allowed' : '';
    const errorClass = props.errorMessage ? 'text-red-700 dark:text-red-400' : '';
    
    return [baseClasses, disabledClass, errorClass].filter(Boolean).join(' ');
  });

  // Methods
  const handleChange = (event: Event) => {
    const target = event.target as HTMLInputElement;
    emit('update:modelValue', target.checked);
  };

  return {
    // Computed properties
    checkboxClasses,
    customCheckmarkClasses,
    labelClasses,
    
    // Methods
    handleChange,
  };
};
