import { ref, computed, onMounted, onBeforeUnmount } from 'vue';
import { useDarkMode } from '../../../composables/useDarkMode';

// Types
interface UseTooltipProps {
  content?: string;
  position?: 'top' | 'bottom' | 'left' | 'right';
  trigger?: 'hover' | 'click' | 'focus';
  delay?: number;
  disabled?: boolean;
  maxWidth?: string;
  className?: string;
}

export const useTooltip = (props: UseTooltipProps) => {
  // Dark mode awareness
  const { isDarkMode } = useDarkMode();

  // State
  const isVisible = ref(false);
  const triggerRef = ref<HTMLElement | null>(null);
  const tooltipRef = ref<HTMLElement | null>(null);
  const showTimeout = ref<number | null>(null);
  const hideTimeout = ref<number | null>(null);

  // Computed properties
  const positionClasses = computed(() => {
    const positions = {
      top: 'bottom-full left-1/2 transform -translate-x-1/2 mb-2',
      bottom: 'top-full left-1/2 transform -translate-x-1/2 mt-2',
      left: 'right-full top-1/2 transform -translate-y-1/2 mr-2',
      right: 'left-full top-1/2 transform -translate-y-1/2 ml-2',
    };
    return positions[props.position || 'top'];
  });

  const arrowClasses = computed(() => {
    const arrows = {
      top: 'top-full left-1/2 transform -translate-x-1/2 border-l-transparent border-r-transparent border-b-transparent border-t-gray-800 dark:border-t-gray-200',
      bottom: 'bottom-full left-1/2 transform -translate-x-1/2 border-l-transparent border-r-transparent border-t-transparent border-b-gray-800 dark:border-b-gray-200',
      left: 'left-full top-1/2 transform -translate-y-1/2 border-t-transparent border-b-transparent border-r-transparent border-l-gray-800 dark:border-l-gray-200',
      right: 'right-full top-1/2 transform -translate-y-1/2 border-t-transparent border-b-transparent border-l-transparent border-r-gray-800 dark:border-r-gray-200',
    };
    return `absolute w-0 h-0 border-4 ${arrows[props.position || 'top']}`;
  });

  const tooltipClasses = computed(() => {
    return [
      'absolute z-50 px-3 py-2 text-sm font-medium text-white bg-gray-800 dark:bg-gray-200 dark:text-gray-800 rounded-lg shadow-lg transition-all duration-200',
      positionClasses.value,
      // Add dark class to tooltip to ensure proper dark mode inheritance
      isDarkMode.value ? 'dark' : '',
      props.className,
    ].filter(Boolean).join(' ');
  });

  const tooltipStyle = computed(() => {
    return {
      maxWidth: props.maxWidth || '320px',
      pointerEvents: 'none' as const,
    };
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

  const show = () => {
    if (props.disabled) return;
    
    clearTimeouts();
    
    if (props.delay && props.delay > 0) {
      showTimeout.value = window.setTimeout(() => {
        isVisible.value = true;
      }, props.delay);
    } else {
      isVisible.value = true;
    }
  };

  const hide = () => {
    clearTimeouts();
    
    hideTimeout.value = window.setTimeout(() => {
      isVisible.value = false;
    }, 100);
  };

  const toggle = () => {
    if (isVisible.value) {
      hide();
    } else {
      show();
    }
  };

  const handleMouseEnter = () => {
    if (props.trigger === 'hover') {
      show();
    }
  };

  const handleMouseLeave = () => {
    if (props.trigger === 'hover') {
      hide();
    }
  };

  const handleClick = () => {
    if (props.trigger === 'click') {
      toggle();
    }
  };

  const handleFocus = () => {
    if (props.trigger === 'focus') {
      show();
    }
  };

  const handleBlur = () => {
    if (props.trigger === 'focus') {
      hide();
    }
  };

  const handleClickOutside = (event: Event) => {
    if (props.trigger === 'click' && 
        tooltipRef.value && 
        triggerRef.value && 
        !tooltipRef.value.contains(event.target as Node) &&
        !triggerRef.value.contains(event.target as Node)) {
      hide();
    }
  };

  // Lifecycle
  onMounted(() => {
    if (props.trigger === 'click') {
      document.addEventListener('click', handleClickOutside);
    }
  });

  onBeforeUnmount(() => {
    clearTimeouts();
    if (props.trigger === 'click') {
      document.removeEventListener('click', handleClickOutside);
    }
  });

  return {
    // State
    isVisible,
    triggerRef,
    tooltipRef,
    
    // Computed properties
    tooltipClasses,
    arrowClasses,
    tooltipStyle,
    
    // Methods
    show,
    hide,
    toggle,
    handleMouseEnter,
    handleMouseLeave,
    handleClick,
    handleFocus,
    handleBlur,
  };
};
