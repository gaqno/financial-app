<template>
  <div class="relative inline-block">
    <!-- Trigger Element -->
    <div
      ref="triggerRef"
      @mouseenter="handleMouseEnter"
      @mouseleave="handleMouseLeave"
      @click="handleClick"
      @focus="handleFocus"
      @blur="handleBlur"
    >
      <slot />
    </div>

    <!-- Tooltip -->
    <Teleport to="body">
      <Transition
        name="tooltip"
        enter-active-class="transition-all duration-200 ease-out"
        leave-active-class="transition-all duration-150 ease-in"
        enter-from-class="opacity-0 scale-95"
        leave-to-class="opacity-0 scale-95"
      >
        <div
          v-if="isVisible && (content || $slots.content)"
          ref="tooltipRef"
          :class="tooltipClasses"
          :style="tooltipStyle"
          role="tooltip"
        >
          <!-- Tooltip Content -->
          <slot name="content">
            {{ content }}
          </slot>

          <!-- Arrow -->
          <div :class="arrowClasses" />
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
  import { useTooltip } from './hooks/useTooltip';

  // Props interface
  interface Props {
    content?: string;
    position?: 'top' | 'bottom' | 'left' | 'right';
    trigger?: 'hover' | 'click' | 'focus';
    delay?: number;
    disabled?: boolean;
    maxWidth?: string;
    className?: string;
  }

  const props = withDefaults(defineProps<Props>(), {
    position: 'top',
    trigger: 'hover',
    delay: 0,
    disabled: false,
    maxWidth: '320px',
  });

  // Use tooltip hook
  const {
    isVisible,
    triggerRef,
    tooltipRef,
    tooltipClasses,
    arrowClasses,
    tooltipStyle,
    handleMouseEnter,
    handleMouseLeave,
    handleClick,
    handleFocus,
    handleBlur,
  } = useTooltip(props);
</script>

<script lang="ts">
  export default {
    name: 'Tooltip',
  };
</script>
