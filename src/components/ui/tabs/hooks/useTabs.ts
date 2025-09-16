import { ref, computed, watch } from 'vue';

// Types
interface TabItem {
  id: string;
  label: string;
  icon?: string;
  disabled?: boolean;
  badge?: string | number;
  content?: string;
}

interface UseTabsProps {
  items: TabItem[];
  defaultValue?: string;
  orientation?: 'horizontal' | 'vertical';
  variant?: 'default' | 'pills' | 'underline' | 'cards';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

type UseTabsEmits = {
  (evt: 'update:modelValue', value: string): void;
  (evt: 'change', value: string, item: TabItem): void;
};

export const useTabs = (props: UseTabsProps, emit: UseTabsEmits) => {
  // State
  const activeTab = ref(props.defaultValue || props.items[0]?.id || '');

  // Computed properties
  const orientationClasses = computed(() => {
    const orientations = {
      horizontal: 'flex-row',
      vertical: 'flex-col',
    };
    return orientations[props.orientation || 'horizontal'];
  });

  const sizeClasses = computed(() => {
    const sizes = {
      sm: 'px-3 py-2 text-sm',
      md: 'px-4 py-3 text-base',
      lg: 'px-6 py-4 text-lg',
    };
    return sizes[props.size || 'md'];
  });

  const variantClasses = computed(() => {
    const variants = {
      default: {
        list: 'border-b border-gray-200 dark:border-gray-700',
        tab: 'border-b-2 border-transparent hover:border-gray-300 dark:hover:border-gray-600',
        activeTab: 'border-blue-500 text-blue-600 dark:text-blue-400',
        inactiveTab: 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300',
      },
      pills: {
        list: 'bg-gray-100 dark:bg-gray-800 rounded-lg p-1',
        tab: 'rounded-md transition-colors duration-200',
        activeTab: 'bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm',
        inactiveTab: 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300',
      },
      underline: {
        list: '',
        tab: 'border-b-2 border-transparent hover:border-gray-300 dark:hover:border-gray-600 pb-2',
        activeTab: 'border-blue-500 text-blue-600 dark:text-blue-400',
        inactiveTab: 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300',
      },
      cards: {
        list: 'border-b border-gray-200 dark:border-gray-700',
        tab: 'border border-transparent hover:border-gray-300 dark:hover:border-gray-600 rounded-t-lg',
        activeTab: 'border-gray-300 dark:border-gray-600 border-b-white dark:border-b-gray-800 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100',
        inactiveTab: 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300',
      },
    };
    return variants[props.variant || 'default'];
  });

  const tabListClasses = computed(() => {
    return [
      'flex',
      orientationClasses.value,
      variantClasses.value.list,
      props.className,
    ].filter(Boolean).join(' ');
  });

  const getTabClasses = computed(() => (item: TabItem) => {
    const baseClasses = 'relative font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';
    const isActive = activeTab.value === item.id;
    const stateClasses = isActive ? variantClasses.value.activeTab : variantClasses.value.inactiveTab;
    const disabledClasses = item.disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer';
    
    return [
      baseClasses,
      sizeClasses.value,
      variantClasses.value.tab,
      stateClasses,
      disabledClasses,
    ].filter(Boolean).join(' ');
  });

  const contentClasses = computed(() => {
    return 'mt-4 focus:outline-none';
  });

  const activeTabItem = computed(() => {
    return props.items.find(item => item.id === activeTab.value);
  });

  // Methods
  const selectTab = (tabId: string) => {
    const item = props.items.find(item => item.id === tabId);
    if (!item || item.disabled) return;
    
    activeTab.value = tabId;
    emit('update:modelValue', tabId);
    emit('change', tabId, item);
  };

  const handleKeydown = (event: KeyboardEvent, tabId: string) => {
    const currentIndex = props.items.findIndex(item => item.id === tabId);
    let nextIndex = currentIndex;
    
    switch (event.key) {
      case 'ArrowLeft':
      case 'ArrowUp':
        event.preventDefault();
        nextIndex = currentIndex > 0 ? currentIndex - 1 : props.items.length - 1;
        // Skip disabled tabs
        while (props.items[nextIndex]?.disabled && nextIndex !== currentIndex) {
          nextIndex = nextIndex > 0 ? nextIndex - 1 : props.items.length - 1;
        }
        break;
        
      case 'ArrowRight':
      case 'ArrowDown':
        event.preventDefault();
        nextIndex = currentIndex < props.items.length - 1 ? currentIndex + 1 : 0;
        // Skip disabled tabs
        while (props.items[nextIndex]?.disabled && nextIndex !== currentIndex) {
          nextIndex = nextIndex < props.items.length - 1 ? nextIndex + 1 : 0;
        }
        break;
        
      case 'Home':
        event.preventDefault();
        nextIndex = 0;
        while (props.items[nextIndex]?.disabled && nextIndex < props.items.length - 1) {
          nextIndex++;
        }
        break;
        
      case 'End':
        event.preventDefault();
        nextIndex = props.items.length - 1;
        while (props.items[nextIndex]?.disabled && nextIndex > 0) {
          nextIndex--;
        }
        break;
        
      case 'Enter':
      case ' ':
        event.preventDefault();
        selectTab(tabId);
        return;
        
      default:
        return;
    }
    
    if (nextIndex !== currentIndex && !props.items[nextIndex]?.disabled) {
      selectTab(props.items[nextIndex].id);
    }
  };

  // Watch for external changes
  watch(() => props.defaultValue, (newValue) => {
    if (newValue && newValue !== activeTab.value) {
      selectTab(newValue);
    }
  });

  return {
    // State
    activeTab,
    
    // Computed properties
    tabListClasses,
    getTabClasses,
    contentClasses,
    activeTabItem,
    
    // Methods
    selectTab,
    handleKeydown,
  };
};
