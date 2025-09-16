import { ref, computed, onMounted, onBeforeUnmount, nextTick } from 'vue';
import { useDarkMode } from '../../../composables/useDarkMode';

// Types
interface UsePopoverProps {
  placement?: 'top' | 'bottom' | 'left' | 'right' | 'top-start' | 'top-end' | 'bottom-start' | 'bottom-end';
  trigger?: 'click' | 'hover' | 'focus' | 'manual';
  offset?: number;
  arrow?: boolean;
  disabled?: boolean;
  closeOnClickOutside?: boolean;
  closeOnEscape?: boolean;
  delay?: number;
  className?: string;
}

interface UsePopoverEmits {
  'open': () => void;
  'close': () => void;
  'toggle': (open: boolean) => void;
}

export const usePopover = (props: UsePopoverProps, emit: UsePopoverEmits) => {
  // Dark mode awareness
  const { isDarkMode } = useDarkMode();

  // State
  const isOpen = ref(false);
  const triggerRef = ref<HTMLElement | null>(null);
  const popoverRef = ref<HTMLElement | null>(null);
  const showTimeout = ref<number | null>(null);
  const hideTimeout = ref<number | null>(null);

  // Computed properties
  const placementClasses = computed(() => {
    const offset = props.offset || 8;
    const placements = {
      'top': `bottom-full left-1/2 transform -translate-x-1/2 mb-${offset}`,
      'bottom': `top-full left-1/2 transform -translate-x-1/2 mt-${offset}`,
      'left': `right-full top-1/2 transform -translate-y-1/2 mr-${offset}`,
      'right': `left-full top-1/2 transform -translate-y-1/2 ml-${offset}`,
      'top-start': `bottom-full left-0 mb-${offset}`,
      'top-end': `bottom-full right-0 mb-${offset}`,
      'bottom-start': `top-full left-0 mt-${offset}`,
      'bottom-end': `top-full right-0 mt-${offset}`,
    };
    return placements[props.placement || 'bottom'];
  });

  const arrowClasses = computed(() => {
    if (!props.arrow) return '';
    
    const arrows = {
      'top': 'top-full left-1/2 transform -translate-x-1/2 border-l-transparent border-r-transparent border-b-transparent border-t-white dark:border-t-gray-800',
      'bottom': 'bottom-full left-1/2 transform -translate-x-1/2 border-l-transparent border-r-transparent border-t-transparent border-b-white dark:border-b-gray-800',
      'left': 'left-full top-1/2 transform -translate-y-1/2 border-t-transparent border-b-transparent border-r-transparent border-l-white dark:border-l-gray-800',
      'right': 'right-full top-1/2 transform -translate-y-1/2 border-t-transparent border-b-transparent border-l-transparent border-r-white dark:border-r-gray-800',
      'top-start': 'top-full left-4 border-l-transparent border-r-transparent border-b-transparent border-t-white dark:border-t-gray-800',
      'top-end': 'top-full right-4 border-l-transparent border-r-transparent border-b-transparent border-t-white dark:border-t-gray-800',
      'bottom-start': 'bottom-full left-4 border-l-transparent border-r-transparent border-t-transparent border-b-white dark:border-b-gray-800',
      'bottom-end': 'bottom-full right-4 border-l-transparent border-r-transparent border-t-transparent border-b-white dark:border-b-gray-800',
    };
    
    return `absolute w-0 h-0 border-4 ${arrows[props.placement || 'bottom']}`;
  });

  const popoverClasses = computed(() => {
    return [
      'absolute z-50 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-3 min-w-max max-w-xs',
      placementClasses.value,
      // Add dark class to popover to ensure proper dark mode inheritance
      isDarkMode.value ? 'dark' : '',
      props.className,
    ].filter(Boolean).join(' ');
  });

  // Methods
  const clearTimeouts = () => {
    if (showTimeout.value) {
      clearTimeout(showTimeout.value);
      showTimeout.value = null;
    }
    if (hideTimeout.value) {
      clearTimeout(hideTimeout.value);
      hideTimeout.value = null;
    }
  };

  const open = () => {
    if (props.disabled) return;
    
    clearTimeouts();
    
    const delayMs = props.delay || 0;
    
    if (delayMs > 0) {
      showTimeout.value = window.setTimeout(() => {
        isOpen.value = true;
        emit('open');
        emit('toggle', true);
      }, delayMs);
    } else {
      isOpen.value = true;
      emit('open');
      emit('toggle', true);
    }
  };

  const close = () => {
    clearTimeouts();
    
    hideTimeout.value = window.setTimeout(() => {
      isOpen.value = false;
      emit('close');
      emit('toggle', false);
    }, 100);
  };

  const toggle = () => {
    if (isOpen.value) {
      close();
    } else {
      open();
    }
  };

  const handleClick = () => {
    if (props.trigger === 'click') {
      toggle();
    }
  };

  const handleMouseEnter = () => {
    if (props.trigger === 'hover') {
      open();
    }
  };

  const handleMouseLeave = () => {
    if (props.trigger === 'hover') {
      close();
    }
  };

  const handleFocus = () => {
    if (props.trigger === 'focus') {
      open();
    }
  };

  const handleBlur = () => {
    if (props.trigger === 'focus') {
      close();
    }
  };

  const handleKeydown = (event: KeyboardEvent) => {
    if (event.key === 'Escape' && props.closeOnEscape !== false) {
      close();
    }
  };

  const handleClickOutside = (event: Event) => {
    if (
      isOpen.value &&
      props.closeOnClickOutside !== false &&
      triggerRef.value &&
      popoverRef.value &&
      !triggerRef.value.contains(event.target as Node) &&
      !popoverRef.value.contains(event.target as Node)
    ) {
      close();
    }
  };

  // Lifecycle
  onMounted(() => {
    if (props.closeOnClickOutside !== false) {
      document.addEventListener('click', handleClickOutside);
    }
    if (props.closeOnEscape !== false) {
      document.addEventListener('keydown', handleKeydown);
    }
  });

  onBeforeUnmount(() => {
    clearTimeouts();
    document.removeEventListener('click', handleClickOutside);
    document.removeEventListener('keydown', handleKeydown);
  });

  return {
    // State
    isOpen,
    triggerRef,
    popoverRef,
    
    // Computed properties
    popoverClasses,
    arrowClasses,
    
    // Methods
    open,
    close,
    toggle,
    handleClick,
    handleMouseEnter,
    handleMouseLeave,
    handleFocus,
    handleBlur,
  };
};
