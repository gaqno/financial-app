import { computed } from 'vue';

// Types
interface UseCardProps {
  variant?: 'default' | 'outlined' | 'elevated' | 'filled';
  size?: 'sm' | 'md' | 'lg';
  hoverable?: boolean;
  clickable?: boolean;
  className?: string;
}

export const useCard = (props: UseCardProps) => {
  // Computed properties
  const sizeClasses = computed(() => {
    const sizes = {
      sm: 'p-4',
      md: 'p-6',
      lg: 'p-8',
    };
    return sizes[props.size || 'md'];
  });

  const variantClasses = computed(() => {
    const variants = {
      default: 'bg-white border border-gray-200 shadow-sm dark:bg-gray-800 dark:border-gray-700',
      outlined: 'bg-white border-2 border-gray-300 dark:bg-gray-800 dark:border-gray-600',
      elevated: 'bg-white border border-gray-200 shadow-lg dark:bg-gray-800 dark:border-gray-700',
      filled: 'bg-gray-50 border border-gray-200 dark:bg-gray-700 dark:border-gray-600',
    };
    return variants[props.variant || 'default'];
  });

  const interactionClasses = computed(() => {
    let classes = '';
    
    if (props.hoverable) {
      classes += ' hover:shadow-md transition-shadow duration-200';
    }
    
    if (props.clickable) {
      classes += ' cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors duration-200';
    }
    
    return classes;
  });

  const cardClasses = computed(() => {
    return [
      'rounded-lg overflow-hidden',
      sizeClasses.value,
      variantClasses.value,
      interactionClasses.value,
      props.className,
    ].filter(Boolean).join(' ');
  });

  const headerClasses = computed(() => {
    return `-mx-${props.size === 'sm' ? '4' : props.size === 'lg' ? '8' : '6'} -mt-${props.size === 'sm' ? '4' : props.size === 'lg' ? '8' : '6'} mb-${props.size === 'sm' ? '4' : props.size === 'lg' ? '6' : '4'} px-${props.size === 'sm' ? '4' : props.size === 'lg' ? '8' : '6'} py-${props.size === 'sm' ? '3' : props.size === 'lg' ? '4' : '4'} border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-750`;
  });

  const footerClasses = computed(() => {
    return `-mx-${props.size === 'sm' ? '4' : props.size === 'lg' ? '8' : '6'} -mb-${props.size === 'sm' ? '4' : props.size === 'lg' ? '8' : '6'} mt-${props.size === 'sm' ? '4' : props.size === 'lg' ? '6' : '4'} px-${props.size === 'sm' ? '4' : props.size === 'lg' ? '8' : '6'} py-${props.size === 'sm' ? '3' : props.size === 'lg' ? '4' : '4'} border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-750`;
  });

  return {
    // Computed properties
    cardClasses,
    headerClasses,
    footerClasses,
  };
};
