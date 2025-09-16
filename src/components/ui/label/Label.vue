<template>
  <label :for="htmlFor" :class="labelClasses">
    <slot />
    <span v-if="required" class="text-red-500 ml-1" aria-label="obrigatório">*</span>
  </label>
</template>

<script setup lang="ts">
  import { useLabel } from './hooks/useLabel';

  // Props interface
  interface Props {
    htmlFor?: string;
    required?: boolean;
    disabled?: boolean;
    size?: 'sm' | 'md' | 'lg';
    variant?: 'default' | 'bold' | 'muted';
    className?: string;
  }

  const props = withDefaults(defineProps<Props>(), {
    required: false,
    disabled: false,
    size: 'md',
    variant: 'default',
  });

  // Use label hook
  const { labelClasses } = useLabel(props);
</script>

<script lang="ts">
  export default {
    name: 'Label',
  };
</script>
