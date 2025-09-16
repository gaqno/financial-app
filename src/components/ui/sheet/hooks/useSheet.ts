import { ref, computed, onMounted, onBeforeUnmount, watch } from 'vue';
import { useDarkMode } from '../../../composables/useDarkMode';

// Types
interface UseSheetProps {
  open?: boolean;
  side?: 'top' | 'bottom' | 'left' | 'right';
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  overlay?: boolean;
  dismissible?: boolean;
  closeOnOverlayClick?: boolean;
  className?: string;
}

interface UseSheetEmits {
  'update:open': (value: boolean) => void;
  'close': () => void;
  'open': () => void;
}

export const useSheet = (props: UseSheetProps, emit: UseSheetEmits) => {
  // Dark mode awareness
  const { isDarkMode } = useDarkMode();

  // State
  const isAnimating = ref(false);
  const startY = ref(0);
  const currentY = ref(0);
  const isDragging = ref(false);

  // Computed properties
  const sideClasses = computed(() => {
    const sides = {
      top: 'top-0 left-0 right-0',
      bottom: 'bottom-0 left-0 right-0',
      left: 'top-0 left-0 bottom-0',
      right: 'top-0 right-0 bottom-0',
    };
    return sides[props.side || 'bottom'];
  });

  const sizeClasses = computed(() => {
    const side = props.side || 'bottom';
    
    if (side === 'top' || side === 'bottom') {
      const sizes = {
        sm: 'h-1/4',
        md: 'h-1/3',
        lg: 'h-1/2',
        xl: 'h-2/3',
        full: 'h-full',
      };
      return sizes[props.size || 'md'];
    } else {
      const sizes = {
        sm: 'w-80',
        md: 'w-96',
        lg: 'w-1/2',
        xl: 'w-2/3',
        full: 'w-full',
      };
      return sizes[props.size || 'md'];
    }
  });

  const transformClasses = computed(() => {
    const side = props.side || 'bottom';
    const transforms = {
      top: 'translate-y-0',
      bottom: 'translate-y-0',
      left: 'translate-x-0',
      right: 'translate-x-0',
    };
    return transforms[side];
  });

  const overlayClasses = computed(() => {
    return [
      'fixed inset-0 z-50 bg-black/50 backdrop-blur-sm transition-opacity duration-300',
      props.open ? 'opacity-100' : 'opacity-0 pointer-events-none',
      // Add dark class to overlay to ensure proper dark mode inheritance
      isDarkMode.value ? 'dark' : '',
    ].filter(Boolean).join(' ');
  });

  const sheetClasses = computed(() => {
    return [
      'fixed z-50 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 transition-transform duration-300 ease-out',
      sideClasses.value,
      sizeClasses.value,
      getRoundedClasses(),
      // Add dark class to sheet to ensure proper dark mode inheritance
      isDarkMode.value ? 'dark' : '',
      props.className,
    ].filter(Boolean).join(' ');
  });

  const getRoundedClasses = () => {
    const side = props.side || 'bottom';
    const roundedClasses = {
      top: 'rounded-b-xl',
      bottom: 'rounded-t-xl',
      left: 'rounded-r-xl',
      right: 'rounded-l-xl',
    };
    return roundedClasses[side];
  };

  const handleClasses = computed(() => {
    const side = props.side || 'bottom';
    if (side === 'top' || side === 'bottom') {
      return 'w-12 h-1 bg-gray-300 dark:bg-gray-600 rounded-full mx-auto my-3 cursor-grab active:cursor-grabbing';
    }
    return 'w-1 h-12 bg-gray-300 dark:bg-gray-600 rounded-full my-auto mx-3 cursor-grab active:cursor-grabbing';
  });

  // Methods
  const close = () => {
    emit('update:open', false);
    emit('close');
  };

  const open = () => {
    emit('update:open', true);
    emit('open');
  };

  const handleOverlayClick = () => {
    if (props.closeOnOverlayClick !== false && props.dismissible !== false) {
      close();
    }
  };

  const handleEscapeKey = (event: KeyboardEvent) => {
    if (event.key === 'Escape' && props.open && props.dismissible !== false) {
      close();
    }
  };

  // Touch/mouse drag handlers for mobile swipe-to-close
  const handleTouchStart = (event: TouchEvent) => {
    if (!props.dismissible) return;
    
    startY.value = event.touches[0].clientY;
    currentY.value = startY.value;
    isDragging.value = true;
  };

  const handleTouchMove = (event: TouchEvent) => {
    if (!isDragging.value || !props.dismissible) return;
    
    currentY.value = event.touches[0].clientY;
    const deltaY = currentY.value - startY.value;
    
    // Only allow dragging in the close direction
    const side = props.side || 'bottom';
    if (
      (side === 'bottom' && deltaY > 0) ||
      (side === 'top' && deltaY < 0)
    ) {
      event.preventDefault();
    }
  };

  const handleTouchEnd = () => {
    if (!isDragging.value || !props.dismissible) return;
    
    const deltaY = currentY.value - startY.value;
    const threshold = 100; // pixels
    const side = props.side || 'bottom';
    
    if (
      (side === 'bottom' && deltaY > threshold) ||
      (side === 'top' && deltaY < -threshold)
    ) {
      close();
    }
    
    isDragging.value = false;
  };

  // Prevent body scroll when sheet is open
  const preventBodyScroll = (prevent: boolean) => {
    if (typeof document !== 'undefined') {
      if (prevent) {
        document.body.style.overflow = 'hidden';
      } else {
        document.body.style.overflow = '';
      }
    }
  };

  // Lifecycle
  onMounted(() => {
    document.addEventListener('keydown', handleEscapeKey);
  });

  onBeforeUnmount(() => {
    document.removeEventListener('keydown', handleEscapeKey);
    preventBodyScroll(false);
  });

  // Watch for open state changes
  watch(() => props.open, (isOpen) => {
    preventBodyScroll(isOpen || false);
  }, { immediate: true });

  return {
    // State
    isAnimating,
    isDragging,
    
    // Computed properties
    overlayClasses,
    sheetClasses,
    handleClasses,
    
    // Methods
    close,
    open,
    handleOverlayClick,
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
  };
};
