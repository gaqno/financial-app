<template>
  <div class="relative inline-block">
    <!-- Trigger -->
    <div
      ref="triggerRef"
      @click="handleClick"
      @mouseenter="handleMouseEnter"
      @mouseleave="handleMouseLeave"
      @focus="handleFocus"
      @blur="handleBlur"
    >
      <slot name="trigger" :open="isOpen" :toggle="toggle" />
    </div>

    <!-- Popover -->
    <Teleport to="body">
      <Transition
        name="popover"
        enter-active-class="transition-all duration-200 ease-out"
        leave-active-class="transition-all duration-150 ease-in"
        enter-from-class="opacity-0 scale-95"
        leave-to-class="opacity-0 scale-95"
      >
        <div
          v-if="isOpen"
          ref="popoverRef"
          :class="popoverClasses"
          role="dialog"
          :aria-labelledby="title ? `popover-title-${componentId}` : undefined"
        >
          <!-- Arrow -->
          <div v-if="arrow" :class="arrowClasses" />

          <!-- Header -->
          <div v-if="title || $slots.header" class="mb-2">
            <slot name="header">
              <h3
                v-if="title"
                :id="`popover-title-${componentId}`"
                class="font-semibold text-gray-900 dark:text-gray-100"
              >
                {{ title }}
              </h3>
            </slot>
          </div>

          <!-- Content -->
          <div class="text-sm text-gray-700 dark:text-gray-300">
            <slot :close="close" />
          </div>

          <!-- Footer -->
          <div v-if="$slots.footer" class="mt-3 pt-2 border-t border-gray-200 dark:border-gray-600">
            <slot name="footer" :close="close" />
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
  import { computed } from 'vue';
  import { usePopover } from './hooks/usePopover';

  // Props interface
  interface Props {
    title?: string;
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

  const props = withDefaults(defineProps<Props>(), {
    placement: 'bottom',
    trigger: 'click',
    offset: 8,
    arrow: true,
    disabled: false,
    closeOnClickOutside: true,
    closeOnEscape: true,
    delay: 0,
  });

  // Emits
  const emit = defineEmits<{
    open: [];
    close: [];
    toggle: [open: boolean];
  }>();

  // Generate component ID
  const componentId = computed(() => Math.random().toString(36).substr(2, 9));

  // Use popover hook
  const {
    isOpen,
    triggerRef,
    popoverRef,
    popoverClasses,
    arrowClasses,
    open,
    close,
    toggle,
    handleClick,
    handleMouseEnter,
    handleMouseLeave,
    handleFocus,
    handleBlur,
  } = usePopover(props, emit);

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
    name: 'Popover',
  };
</script>
