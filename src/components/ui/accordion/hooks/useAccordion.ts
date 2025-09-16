import { ref, computed } from 'vue';

// Types
interface UseAccordionProps {
  defaultOpen?: boolean;
  disabled?: boolean;
  variant?: 'default' | 'bordered' | 'filled';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

interface UseAccordionEmits {
  'update:open': (value: boolean) => void;
  'toggle': (open: boolean) => void;
}

export const useAccordion = (props: UseAccordionProps, emit: UseAccordionEmits) => {
  // State
  const isOpen = ref(props.defaultOpen || false);

  // Computed properties
  const sizeClasses = computed(() => {
    const sizes = {
      sm: 'p-3',
      md: 'p-4',
      lg: 'p-6',
    };
    return sizes[props.size || 'md'];
  });

  const variantClasses = computed(() => {
    const variants = {
      default: 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700',
      bordered: 'bg-white dark:bg-gray-800 border-2 border-gray-300 dark:border-gray-600',
      filled: 'bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600',
    };
    return variants[props.variant || 'default'];
  });

  const accordionClasses = computed(() => {
    return [
      'rounded-lg overflow-hidden transition-all duration-200',
      variantClasses.value,
      props.className,
    ].filter(Boolean).join(' ');
  });

  const headerClasses = computed(() => {
    const baseClasses = 'w-full flex items-center justify-between text-left transition-colors duration-200';
    const interactionClasses = props.disabled 
      ? 'cursor-not-allowed opacity-50' 
      : 'cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700';
    
    return [
      baseClasses,
      sizeClasses.value,
      interactionClasses,
    ].filter(Boolean).join(' ');
  });

  const contentClasses = computed(() => {
    return [
      'overflow-hidden transition-all duration-300 ease-in-out',
      sizeClasses.value,
      'border-t border-gray-200 dark:border-gray-700',
    ].filter(Boolean).join(' ');
  });

  const iconClasses = computed(() => {
    return [
      'transition-transform duration-200 text-gray-400 dark:text-gray-500',
      isOpen.value ? 'rotate-180' : 'rotate-0',
    ].filter(Boolean).join(' ');
  });

  // Methods
  const toggle = () => {
    if (props.disabled) return;
    
    const newState = !isOpen.value;
    isOpen.value = newState;
    emit('update:open', newState);
    emit('toggle', newState);
  };

  const open = () => {
    if (props.disabled) return;
    
    isOpen.value = true;
    emit('update:open', true);
    emit('toggle', true);
  };

  const close = () => {
    if (props.disabled) return;
    
    isOpen.value = false;
    emit('update:open', false);
    emit('toggle', false);
  };

  const handleKeydown = (event: KeyboardEvent) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      toggle();
    }
  };

  return {
    // State
    isOpen,
    
    // Computed properties
    accordionClasses,
    headerClasses,
    contentClasses,
    iconClasses,
    
    // Methods
    toggle,
    open,
    close,
    handleKeydown,
  };
};
