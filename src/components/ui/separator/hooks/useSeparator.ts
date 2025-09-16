import { computed } from 'vue';

// Types
interface UseSeparatorProps {
  orientation?: 'horizontal' | 'vertical';
  variant?: 'solid' | 'dashed' | 'dotted';
  size?: 'xs' | 'sm' | 'md' | 'lg';
  color?: 'default' | 'muted' | 'strong';
  className?: string;
}

export const useSeparator = (props: UseSeparatorProps) => {
  // Computed properties
  const orientationClasses = computed(() => {
    const orientations = {
      horizontal: 'w-full border-t',
      vertical: 'h-full border-l',
    };
    return orientations[props.orientation || 'horizontal'];
  });

  const variantClasses = computed(() => {
    const variants = {
      solid: 'border-solid',
      dashed: 'border-dashed',
      dotted: 'border-dotted',
    };
    return variants[props.variant || 'solid'];
  });

  const sizeClasses = computed(() => {
    const sizes = {
      xs: 'border-0.5',
      sm: 'border',
      md: 'border-2',
      lg: 'border-4',
    };
    return sizes[props.size || 'sm'];
  });

  const colorClasses = computed(() => {
    const colors = {
      default: 'border-gray-200 dark:border-gray-700',
      muted: 'border-gray-100 dark:border-gray-800',
      strong: 'border-gray-300 dark:border-gray-600',
    };
    return colors[props.color || 'default'];
  });

  const separatorClasses = computed(() => {
    return [
      orientationClasses.value,
      variantClasses.value,
      sizeClasses.value,
      colorClasses.value,
      props.className,
    ].filter(Boolean).join(' ');
  });

  return {
    // Computed properties
    separatorClasses,
  };
};
