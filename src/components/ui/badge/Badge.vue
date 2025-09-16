<template>
  <span :class="badgeClasses">
    <!-- Icon -->
    <i v-if="icon && !dot" :class="iconClasses" :class="{ 'mr-1': $slots.default }" />

    <!-- Content (only if not a dot) -->
    <span v-if="!dot">
      <slot />
    </span>
  </span>
</template>

<script setup lang="ts">
  import { useBadge } from './hooks/useBadge';

  // Props interface
  interface Props {
    variant?: 'default' | 'primary' | 'secondary' | 'success' | 'warning' | 'danger' | 'info' | 'dark' | 'light';
    size?: 'xs' | 'sm' | 'md' | 'lg';
    rounded?: boolean;
    outline?: boolean;
    dot?: boolean;
    icon?: string;
    className?: string;
  }

  const props = withDefaults(defineProps<Props>(), {
    variant: 'default',
    size: 'md',
    rounded: false,
    outline: false,
    dot: false,
  });

  // Use badge hook
  const { badgeClasses, iconClasses } = useBadge(props);
</script>

<script lang="ts">
  export default {
    name: 'Badge',
  };
</script>
