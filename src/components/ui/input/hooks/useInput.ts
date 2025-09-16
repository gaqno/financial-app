import { ref, computed, watch } from 'vue';

// Types
interface UseInputProps {
  modelValue?: string | number;
  type?: 'text' | 'email' | 'password' | 'number' | 'tel' | 'url' | 'search';
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
  readonly?: boolean;
  id?: string;
  leftIcon?: string;
  rightIcon?: string;
  errorMessage?: string;
  helperText?: string;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'outline' | 'filled';
  clearable?: boolean;
  clearButtonTitle?: string;
  className?: string;
}

interface UseInputEmits {
  'update:modelValue': (value: string | number) => void;
  'blur': (event: Event) => void;
  'focus': (event: Event) => void;
}

export const useInput = (props: UseInputProps, emit: UseInputEmits) => {
  // Internal state
  const showPassword = ref(false);
  const inputType = ref(props.type || 'text');

  // Computed properties
  const showClearButton = computed(() => props.clearable && !props.disabled && !props.readonly);
  
  const showPasswordToggle = computed(() => props.type === 'password');

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

  const paddingClasses = computed(() => {
    let leftPadding = '';
    let rightPadding = '';

    if (props.leftIcon) {
      leftPadding = (props.size || 'md') === 'sm' ? 'pl-9' : (props.size || 'md') === 'lg' ? 'pl-12' : 'pl-10';
    }

    if (props.rightIcon || showClearButton.value || showPasswordToggle.value) {
      rightPadding = (props.size || 'md') === 'sm' ? 'pr-9' : (props.size || 'md') === 'lg' ? 'pr-12' : 'pr-10';
    }

    return `${leftPadding} ${rightPadding}`;
  });

  const inputClasses = computed(() => {
    return [
      sizeClasses.value,
      variantClasses.value,
      disabledClasses.value,
      paddingClasses.value,
      props.className,
    ].filter(Boolean).join(' ');
  });

  const leftIconClasses = computed(() => {
    const baseClasses = 'absolute left-0 top-0 flex items-center justify-center text-gray-400 dark:text-gray-500 pointer-events-none';
    const sizes = {
      sm: 'w-9 h-full text-sm',
      md: 'w-10 h-full text-base',
      lg: 'w-12 h-full text-lg',
    };
    return `${baseClasses} ${sizes[props.size || 'md']}`;
  });

  const rightIconClasses = computed(() => {
    const baseClasses = 'absolute right-0 top-0 flex items-center justify-center text-gray-400 dark:text-gray-500';
    const sizes = {
      sm: 'w-9 h-full text-sm',
      md: 'w-10 h-full text-base',
      lg: 'w-12 h-full text-lg',
    };
    return `${baseClasses} ${sizes[props.size || 'md']}`;
  });

  // Methods
  const handleInput = (event: Event) => {
    const target = event.target as HTMLInputElement;
    const value = props.type === 'number' ? Number(target.value) : target.value;
    emit('update:modelValue', value);
  };

  const clearInput = () => {
    emit('update:modelValue', '');
  };

  const togglePasswordVisibility = () => {
    showPassword.value = !showPassword.value;
    inputType.value = showPassword.value ? 'text' : 'password';
  };

  // Watchers
  watch(() => props.type, (newType) => {
    if (newType !== 'password') {
      showPassword.value = false;
    }
    inputType.value = newType || 'text';
  });

  return {
    // State
    showPassword,
    inputType,
    
    // Computed properties
    showClearButton,
    showPasswordToggle,
    inputClasses,
    leftIconClasses,
    rightIconClasses,
    
    // Methods
    handleInput,
    clearInput,
    togglePasswordVisibility,
  };
};
