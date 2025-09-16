<template>
  <Teleport to="body">
    <!-- Overlay -->
    <Transition
      name="overlay"
      enter-active-class="transition-opacity duration-300"
      leave-active-class="transition-opacity duration-300"
      enter-from-class="opacity-0"
      leave-to-class="opacity-0"
    >
      <div v-if="open && overlay" :class="overlayClasses" @click="handleOverlayClick" />
    </Transition>

    <!-- Sheet -->
    <Transition
      :name="`sheet-${side}`"
      enter-active-class="transition-transform duration-300 ease-out"
      leave-active-class="transition-transform duration-300 ease-in"
      :enter-from-class="getEnterFromClass()"
      :leave-to-class="getLeaveToClass()"
    >
      <div
        v-if="open"
        :class="sheetClasses"
        @touchstart="handleTouchStart"
        @touchmove="handleTouchMove"
        @touchend="handleTouchEnd"
      >
        <!-- Drag Handle -->
        <div v-if="showHandle" :class="handleClasses" />

        <!-- Header -->
        <div
          v-if="title || $slots.header"
          class="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700"
        >
          <slot name="header">
            <h2 class="text-lg font-semibold text-gray-900 dark:text-gray-100">
              {{ title }}
            </h2>
          </slot>

          <button
            v-if="showCloseButton"
            @click="close"
            type="button"
            class="text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 transition-colors p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
            aria-label="Fechar"
          >
            <i class="fas fa-times text-lg" />
          </button>
        </div>

        <!-- Content -->
        <div class="flex-1 overflow-y-auto p-4">
          <slot :close="close" />
        </div>

        <!-- Footer -->
        <div
          v-if="$slots.footer"
          class="flex items-center justify-end gap-3 p-4 border-t border-gray-200 dark:border-gray-700"
        >
          <slot name="footer" :close="close" />
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
  import { computed } from 'vue';
  import { useSheet } from './hooks/useSheet';

  // Props interface
  interface Props {
    open?: boolean;
    title?: string;
    side?: 'top' | 'bottom' | 'left' | 'right';
    size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
    overlay?: boolean;
    dismissible?: boolean;
    closeOnOverlayClick?: boolean;
    showHandle?: boolean;
    showCloseButton?: boolean;
    className?: string;
  }

  const props = withDefaults(defineProps<Props>(), {
    open: false,
    side: 'bottom',
    size: 'md',
    overlay: true,
    dismissible: true,
    closeOnOverlayClick: true,
    showHandle: true,
    showCloseButton: true,
  });

  // Emits
  const emit = defineEmits<{
    'update:open': [value: boolean];
    close: [];
    open: [];
  }>();

  // Use sheet hook
  const {
    overlayClasses,
    sheetClasses,
    handleClasses,
    close,
    open,
    handleOverlayClick,
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
  } = useSheet(props, emit);

  // Animation classes based on side
  const getEnterFromClass = () => {
    const transforms = {
      top: 'transform -translate-y-full',
      bottom: 'transform translate-y-full',
      left: 'transform -translate-x-full',
      right: 'transform translate-x-full',
    };
    return transforms[props.side];
  };

  const getLeaveToClass = () => {
    return getEnterFromClass();
  };

  // Expose methods
  defineExpose({
    close,
    open,
  });
</script>

<script lang="ts">
  export default {
    name: 'Sheet',
  };
</script>
