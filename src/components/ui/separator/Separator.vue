<template>
  <div :class="separatorClasses" role="separator" :aria-orientation="orientation" />
</template>

<script setup lang="ts">
  import { useSeparator } from './hooks/useSeparator';

  // Props interface
  interface Props {
    orientation?: 'horizontal' | 'vertical';
    variant?: 'solid' | 'dashed' | 'dotted';
    size?: 'xs' | 'sm' | 'md' | 'lg';
    color?: 'default' | 'muted' | 'strong';
    className?: string;
  }

  const props = withDefaults(defineProps<Props>(), {
    orientation: 'horizontal',
    variant: 'solid',
    size: 'sm',
    color: 'default',
  });

  // Use separator hook
  const { separatorClasses } = useSeparator(props);
</script>

<script lang="ts">
  export default {
    name: 'Separator',
  };
</script>
