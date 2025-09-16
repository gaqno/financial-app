<template>
  <div :class="accordionClasses">
    <!-- Header -->
    <button
      :class="headerClasses"
      :disabled="disabled"
      :aria-expanded="isOpen"
      :aria-controls="`accordion-content-${componentId}`"
      @click="toggle"
      @keydown="handleKeydown"
    >
      <!-- Header Content -->
      <div class="flex-1 min-w-0">
        <slot name="header" :open="isOpen" :toggle="toggle">
          <div class="flex items-center gap-3">
            <i v-if="icon" :class="icon" class="text-lg" />
            <div class="min-w-0 flex-1">
              <h3 v-if="title" class="font-semibold text-gray-900 dark:text-gray-100">
                {{ title }}
              </h3>
              <p v-if="subtitle" class="text-sm text-gray-600 dark:text-gray-400 mt-1">
                {{ subtitle }}
              </p>
            </div>
          </div>
        </slot>
      </div>

      <!-- Expand/Collapse Icon -->
      <div class="flex-shrink-0 ml-3">
        <slot name="icon" :open="isOpen">
          <i :class="iconClasses" class="fas fa-chevron-down" />
        </slot>
      </div>
    </button>

    <!-- Content -->
    <Transition
      name="accordion"
      enter-active-class="transition-all duration-300 ease-out"
      leave-active-class="transition-all duration-300 ease-in"
      enter-from-class="max-h-0 opacity-0"
      leave-to-class="max-h-0 opacity-0"
      enter-to-class="max-h-screen opacity-100"
      leave-from-class="max-h-screen opacity-100"
    >
      <div v-if="isOpen" :id="`accordion-content-${componentId}`" :class="contentClasses" role="region">
        <slot :open="isOpen" :close="close" />
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
  import { computed } from 'vue';
  import { useAccordion } from './hooks/useAccordion';

  // Props interface
  interface Props {
    defaultOpen?: boolean;
    title?: string;
    subtitle?: string;
    icon?: string;
    disabled?: boolean;
    variant?: 'default' | 'bordered' | 'filled';
    size?: 'sm' | 'md' | 'lg';
    className?: string;
  }

  const props = withDefaults(defineProps<Props>(), {
    defaultOpen: false,
    disabled: false,
    variant: 'default',
    size: 'md',
  });

  // Emits
  const emit = defineEmits<{
    'update:open': [value: boolean];
    toggle: [open: boolean];
  }>();

  // Generate unique component ID
  const componentId = computed(() => Math.random().toString(36).substr(2, 9));

  // Use accordion hook
  const { isOpen, accordionClasses, headerClasses, contentClasses, iconClasses, toggle, open, close, handleKeydown } =
    useAccordion(props, emit);

  // Expose methods for parent components
  defineExpose({
    isOpen,
    toggle,
    open,
    close,
  });
</script>

<script lang="ts">
  export default {
    name: 'Accordion',
  };
</script>

<style scoped>
  .accordion-enter-active,
  .accordion-leave-active {
    overflow: hidden;
  }
</style>
