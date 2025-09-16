<template>
  <div class="relative inline-block">
    <!-- Trigger -->
    <div
      ref="triggerRef"
      @click="toggle"
      @keydown="handleKeydown"
      @mouseenter="handleMouseEnter"
      @mouseleave="handleMouseLeave"
      :tabindex="disabled ? -1 : 0"
      :aria-expanded="isOpen"
      :aria-haspopup="true"
      role="button"
    >
      <slot name="trigger" :open="isOpen" :toggle="toggle" />
    </div>

    <!-- Dropdown Menu -->
    <Teleport to="body">
      <Transition
        name="dropdown"
        enter-active-class="transition-all duration-200 ease-out"
        leave-active-class="transition-all duration-150 ease-in"
        enter-from-class="opacity-0 scale-95 transform -translate-y-1"
        leave-to-class="opacity-0 scale-95 transform -translate-y-1"
      >
        <div v-if="isOpen" ref="dropdownRef" :class="dropdownClasses" role="menu" :aria-labelledby="componentId">
          <!-- Custom Content Slot -->
          <div v-if="$slots.default">
            <slot :close="close" :items="items" />
          </div>

          <!-- Default Items Rendering -->
          <template v-else>
            <template v-for="(item, index) in items" :key="item.id">
              <!-- Divider -->
              <hr v-if="item.divider" class="border-t border-gray-200 dark:border-gray-700 my-1" />

              <!-- Menu Item -->
              <button
                v-else
                :class="itemClasses(item, index)"
                :disabled="item.disabled"
                @click="selectItem(item, index)"
                @mouseenter="activeIndex = index"
                role="menuitem"
                type="button"
              >
                <!-- Icon -->
                <i v-if="item.icon" :class="item.icon" class="w-4 h-4 flex-shrink-0" />

                <!-- Label -->
                <span class="truncate">{{ item.label }}</span>
              </button>
            </template>
          </template>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
  import { computed } from 'vue';
  import { useDropdown } from './hooks/useDropdown';

  // Types
  interface DropdownItem {
    id: string | number;
    label: string;
    icon?: string;
    disabled?: boolean;
    divider?: boolean;
    action?: () => void;
  }

  // Props interface
  interface Props {
    items?: DropdownItem[];
    placement?: 'bottom-start' | 'bottom-end' | 'top-start' | 'top-end' | 'left' | 'right';
    trigger?: 'click' | 'hover';
    disabled?: boolean;
    closeOnClick?: boolean;
    offset?: number;
    className?: string;
  }

  const props = withDefaults(defineProps<Props>(), {
    items: () => [],
    placement: 'bottom-start',
    trigger: 'click',
    disabled: false,
    closeOnClick: true,
    offset: 4,
  });

  // Emits
  const emit = defineEmits<{
    select: [item: DropdownItem];
    open: [];
    close: [];
  }>();

  // Generate component ID
  const componentId = computed(() => `dropdown-${Math.random().toString(36).substr(2, 9)}`);

  // Use dropdown hook
  const {
    isOpen,
    triggerRef,
    dropdownRef,
    activeIndex,
    dropdownClasses,
    itemClasses,
    visibleItems,
    open,
    close,
    toggle,
    selectItem,
    handleKeydown,
    handleMouseEnter,
    handleMouseLeave,
  } = useDropdown(props, emit);

  // Expose methods
  defineExpose({
    isOpen,
    open,
    close,
    toggle,
  });
</script>

<script lang="ts">
  export default {
    name: 'Dropdown',
  };
</script>
