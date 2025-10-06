import { computed, onMounted, onBeforeUnmount } from 'vue';
import { useDarkMode } from '../../../composables/useDarkMode';

// Types
interface UseModalProps {
  open?: boolean;
  dismissible?: boolean;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'full';
  position?: 'center' | 'top' | 'bottom';
  backdrop?: 'dark' | 'light' | 'blur';
  className?: string;
}

interface UseModalEmits {
  'update:open': (value: boolean) => void;
  'close': () => void;
  'escape': () => void;
}

export const useModal = (props: UseModalProps, emit: UseModalEmits) => {
  // Dark mode awareness
  const { isDarkMode } = useDarkMode();

  // Computed properties
  const sizeClasses = computed(() => {
    const sizes = {
      xs: 'max-w-xs',
      sm: 'max-w-sm',
      md: 'max-w-md',
      lg: 'max-w-lg',
      xl: 'max-w-xl',
      full: 'max-w-full mx-4',
    };
    return sizes[props.size || 'md'];
  });

  const positionClasses = computed(() => {
    const positions = {
      center: 'items-center justify-center',
      top: 'items-start justify-center pt-16',
      bottom: 'items-end justify-center pb-16',
    };
    return positions[props.position || 'center'];
  });

  const backdropClasses = computed(() => {
    const backdrops = {
      dark: 'bg-black/50',
      light: 'bg-white/50 dark:bg-black/30',
      blur: 'bg-black/30 backdrop-blur-sm',
    };
    return backdrops[props.backdrop || 'blur'];
  });

  const overlayClasses = computed(() => {
    return [
      'fixed inset-0 z-50 flex p-4 transition-all duration-300',
      positionClasses.value,
      backdropClasses.value,
      // Add dark class to overlay to ensure proper dark mode inheritance
      isDarkMode.value ? 'dark' : '',
    ].filter(Boolean).join(' ');
  });

  const modalClasses = computed(() => {
    return [
      'relative bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 transform transition-all duration-300 w-full',
      sizeClasses.value,
      props.className,
    ].filter(Boolean).join(' ');
  });

  // Methods
  const closeModal = () => {
    emit('update:open', false);
    emit('close');
  };

  const handleBackdropClick = (event: Event) => {
    if (props.dismissible && event.target === event.currentTarget) {
      closeModal();
    }
  };

  const handleEscapeKey = (event: KeyboardEvent) => {
    if (event.key === 'Escape' && props.open) {
      if (props.dismissible) {
        closeModal();
      }
      emit('escape');
    }
  };

  // Lifecycle
  onMounted(() => {
    if (typeof window !== 'undefined') {
      document.addEventListener('keydown', handleEscapeKey);
    }
  });

  onBeforeUnmount(() => {
    if (typeof window !== 'undefined') {
      document.removeEventListener('keydown', handleEscapeKey);
    }
  });

  return {
    // Computed properties
    overlayClasses,
    modalClasses,
    
    // Methods
    closeModal,
    handleBackdropClick,
  };
};
