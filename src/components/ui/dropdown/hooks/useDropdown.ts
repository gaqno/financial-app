import { ref, computed, onMounted, onBeforeUnmount, nextTick } from 'vue';
import { useDarkMode } from '../../../composables/useDarkMode';

// Types
interface DropdownItem {
  id: string | number;
  label: string;
  icon?: string;
  disabled?: boolean;
  divider?: boolean;
  action?: () => void;
}

interface UseDropdownProps {
  items?: DropdownItem[];
  placement?: 'bottom-start' | 'bottom-end' | 'top-start' | 'top-end' | 'left' | 'right';
  trigger?: 'click' | 'hover';
  disabled?: boolean;
  closeOnClick?: boolean;
  offset?: number;
  className?: string;
}

interface UseDropdownEmits {
  'select': (item: DropdownItem) => void;
  'open': () => void;
  'close': () => void;
}

export const useDropdown = (props: UseDropdownProps, emit: UseDropdownEmits) => {
  // Dark mode awareness
  const { isDarkMode } = useDarkMode();

  // State
  const isOpen = ref(false);
  const triggerRef = ref<HTMLElement | null>(null);
  const dropdownRef = ref<HTMLElement | null>(null);
  const activeIndex = ref(-1);

  // Computed properties
  const placementClasses = computed(() => {
    const placements = {
      'bottom-start': 'top-full left-0 mt-1',
      'bottom-end': 'top-full right-0 mt-1',
      'top-start': 'bottom-full left-0 mb-1',
      'top-end': 'bottom-full right-0 mb-1',
      'left': 'right-full top-0 mr-1',
      'right': 'left-full top-0 ml-1',
    };
    return placements[props.placement || 'bottom-start'];
  });

  const dropdownClasses = computed(() => {
    return [
      'absolute z-50 min-w-[12rem] bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg py-1 transition-all duration-200',
      placementClasses.value,
      // Add dark class to dropdown to ensure proper dark mode inheritance
      isDarkMode.value ? 'dark' : '',
      props.className,
    ].filter(Boolean).join(' ');
  });

  const itemClasses = computed(() => (item: DropdownItem, index: number) => {
    const baseClasses = 'w-full px-3 py-2 text-left text-sm transition-colors duration-150 flex items-center gap-2';
    
    if (item.disabled) {
      return `${baseClasses} text-gray-400 dark:text-gray-600 cursor-not-allowed`;
    }
    
    if (item.divider) {
      return 'border-t border-gray-200 dark:border-gray-700 my-1';
    }
    
    const activeClasses = activeIndex.value === index 
      ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300' 
      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700';
    
    return `${baseClasses} ${activeClasses} cursor-pointer`;
  });

  const visibleItems = computed(() => {
    return (props.items || []).filter(item => !item.divider);
  });

  // Methods
  const open = async () => {
    if (props.disabled) return;
    
    isOpen.value = true;
    emit('open');
    
    await nextTick();
    
    // Focus first non-disabled item
    const firstEnabledIndex = (props.items || []).findIndex(item => !item.disabled && !item.divider);
    if (firstEnabledIndex >= 0) {
      activeIndex.value = firstEnabledIndex;
    }
  };

  const close = () => {
    isOpen.value = false;
    activeIndex.value = -1;
    emit('close');
  };

  const toggle = () => {
    if (isOpen.value) {
      close();
    } else {
      open();
    }
  };

  const selectItem = (item: DropdownItem, index: number) => {
    if (item.disabled || item.divider) return;
    
    // Execute item action if present
    if (item.action) {
      item.action();
    }
    
    emit('select', item);
    
    if (props.closeOnClick !== false) {
      close();
    }
  };

  const handleKeydown = (event: KeyboardEvent) => {
    if (!isOpen.value) {
      if (event.key === 'Enter' || event.key === ' ' || event.key === 'ArrowDown') {
        event.preventDefault();
        open();
      }
      return;
    }

    const enabledItems = (props.items || []).filter(item => !item.disabled && !item.divider);
    
    switch (event.key) {
      case 'Escape':
        event.preventDefault();
        close();
        triggerRef.value?.focus();
        break;
        
      case 'ArrowDown':
        event.preventDefault();
        if (activeIndex.value < enabledItems.length - 1) {
          activeIndex.value++;
        } else {
          activeIndex.value = 0;
        }
        break;
        
      case 'ArrowUp':
        event.preventDefault();
        if (activeIndex.value > 0) {
          activeIndex.value--;
        } else {
          activeIndex.value = enabledItems.length - 1;
        }
        break;
        
      case 'Enter':
      case ' ':
        event.preventDefault();
        const activeItem = enabledItems[activeIndex.value];
        if (activeItem) {
          selectItem(activeItem, activeIndex.value);
        }
        break;
        
      case 'Tab':
        close();
        break;
    }
  };

  const handleClickOutside = (event: Event) => {
    if (
      isOpen.value &&
      triggerRef.value &&
      dropdownRef.value &&
      !triggerRef.value.contains(event.target as Node) &&
      !dropdownRef.value.contains(event.target as Node)
    ) {
      close();
    }
  };

  const handleMouseEnter = () => {
    if (props.trigger === 'hover' && !props.disabled) {
      open();
    }
  };

  const handleMouseLeave = () => {
    if (props.trigger === 'hover' && !props.disabled) {
      close();
    }
  };

  // Lifecycle
  onMounted(() => {
    document.addEventListener('click', handleClickOutside);
  });

  onBeforeUnmount(() => {
    document.removeEventListener('click', handleClickOutside);
  });

  return {
    // State
    isOpen,
    triggerRef,
    dropdownRef,
    activeIndex,
    
    // Computed properties
    dropdownClasses,
    itemClasses,
    visibleItems,
    
    // Methods
    open,
    close,
    toggle,
    selectItem,
    handleKeydown,
    handleMouseEnter,
    handleMouseLeave,
  };
};
