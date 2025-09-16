import { ref, computed, watch } from 'vue';

// Types
interface UseAvatarProps {
  src?: string;
  alt?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  shape?: 'circle' | 'square' | 'rounded';
  fallback?: string;
  fallbackIcon?: string;
  status?: 'online' | 'offline' | 'away' | 'busy';
  showStatus?: boolean;
  className?: string;
}

export const useAvatar = (props: UseAvatarProps) => {
  // State
  const imageError = ref(false);
  const imageLoaded = ref(false);

  // Computed properties
  const sizeClasses = computed(() => {
    const sizes = {
      xs: 'w-6 h-6',
      sm: 'w-8 h-8',
      md: 'w-10 h-10',
      lg: 'w-12 h-12',
      xl: 'w-16 h-16',
      '2xl': 'w-20 h-20',
    };
    return sizes[props.size || 'md'];
  });

  const shapeClasses = computed(() => {
    const shapes = {
      circle: 'rounded-full',
      square: 'rounded-none',
      rounded: 'rounded-lg',
    };
    return shapes[props.shape || 'circle'];
  });

  const statusSizeClasses = computed(() => {
    const statusSizes = {
      xs: 'w-1.5 h-1.5',
      sm: 'w-2 h-2',
      md: 'w-2.5 h-2.5',
      lg: 'w-3 h-3',
      xl: 'w-4 h-4',
      '2xl': 'w-5 h-5',
    };
    return statusSizes[props.size || 'md'];
  });

  const statusColorClasses = computed(() => {
    const colors = {
      online: 'bg-green-500',
      offline: 'bg-gray-400',
      away: 'bg-yellow-500',
      busy: 'bg-red-500',
    };
    return colors[props.status || 'offline'];
  });

  const avatarClasses = computed(() => {
    return [
      'relative inline-flex items-center justify-center overflow-hidden bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300',
      sizeClasses.value,
      shapeClasses.value,
      props.className,
    ].filter(Boolean).join(' ');
  });

  const statusClasses = computed(() => {
    return [
      'absolute border-2 border-white dark:border-gray-800 rounded-full',
      statusSizeClasses.value,
      statusColorClasses.value,
      'bottom-0 right-0',
    ].filter(Boolean).join(' ');
  });

  const fallbackClasses = computed(() => {
    const textSizes = {
      xs: 'text-xs',
      sm: 'text-sm',
      md: 'text-base',
      lg: 'text-lg',
      xl: 'text-xl',
      '2xl': 'text-2xl',
    };
    return `font-medium ${textSizes[props.size || 'md']}`;
  });

  const showImage = computed(() => {
    return props.src && !imageError.value;
  });

  const showFallback = computed(() => {
    return !showImage.value && (props.fallback || props.fallbackIcon);
  });

  const fallbackText = computed(() => {
    if (props.fallback) {
      // Take first two characters or initials
      return props.fallback.slice(0, 2).toUpperCase();
    }
    return '';
  });

  // Methods
  const handleImageError = () => {
    imageError.value = true;
    imageLoaded.value = false;
  };

  const handleImageLoad = () => {
    imageError.value = false;
    imageLoaded.value = true;
  };

  // Watch for src changes to reset error state
  watch(() => props.src, () => {
    imageError.value = false;
    imageLoaded.value = false;
  });

  return {
    // State
    imageError,
    imageLoaded,
    
    // Computed properties
    avatarClasses,
    statusClasses,
    fallbackClasses,
    showImage,
    showFallback,
    fallbackText,
    
    // Methods
    handleImageError,
    handleImageLoad,
  };
};
