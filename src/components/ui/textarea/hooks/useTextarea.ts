import { computed } from 'vue';

// Types
interface UseTextareaProps {
  modelValue?: string;
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
  readonly?: boolean;
  id?: string;
  errorMessage?: string;
  helperText?: string;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'outline' | 'filled';
  rows?: number;
  maxLength?: number;
  showCharCount?: boolean;
  resizable?: boolean;
  className?: string;
}

type UseTextareaEmits = {
  (evt: 'update:modelValue', value: string): void;
  (evt: 'blur', event: Event): void;
  (evt: 'focus', event: Event): void;
};

export const useTextarea = (props: UseTextareaProps, emit: UseTextareaEmits) => {
  // Computed properties
  const characterCount = computed(() => {
    return props.modelValue ? props.modelValue.length : 0;
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
    const baseClasses = 'w-full rounded-lg border transition-all duration-200 focus:outline-none focus:ring-2';
    
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
      : '';
  });

  const textareaClasses = computed(() => {
    return [
      sizeClasses.value,
      variantClasses.value,
      disabledClasses.value,
      props.className,
    ].filter(Boolean).join(' ');
  });

  // Methods
  const handleInput = (event: Event) => {
    const target = event.target as HTMLTextAreaElement;
    let value = target.value;
    
    // Apply maxLength if specified
    if (props.maxLength && value.length > props.maxLength) {
      value = value.substring(0, props.maxLength);
      target.value = value;
    }
    
    emit('update:modelValue', value);
  };

  return {
    // Computed properties
    characterCount,
    textareaClasses,
    
    // Methods
    handleInput,
  };
};
