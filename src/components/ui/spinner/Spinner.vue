<template>
  <!-- Spinner Type -->
  <div v-if="type === 'spinner'" :class="spinnerClasses" />

  <!-- Dots Type -->
  <div v-else-if="type === 'dots'" class="flex space-x-1" :class="variantClasses">
    <div :class="dotClasses" style="animation-delay: 0ms" />
    <div :class="dotClasses" style="animation-delay: 150ms" />
    <div :class="dotClasses" style="animation-delay: 300ms" />
  </div>

  <!-- Pulse Type -->
  <div v-else-if="type === 'pulse'" :class="[spinnerClasses, 'rounded-full bg-current animate-pulse opacity-75']" />

  <!-- Bars Type -->
  <div v-else-if="type === 'bars'" class="flex space-x-1" :class="variantClasses">
    <div :class="barClasses" class="animate-bounce" style="animation-delay: 0ms" />
    <div :class="barClasses" class="animate-bounce" style="animation-delay: 100ms" />
    <div :class="barClasses" class="animate-bounce" style="animation-delay: 200ms" />
  </div>

  <!-- Default to spinner -->
  <div v-else :class="spinnerClasses" />
</template>

<script setup lang="ts">
  import { useSpinner } from './hooks/useSpinner';

  // Props interface
  interface Props {
    size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
    variant?: 'default' | 'success' | 'warning' | 'danger' | 'white';
    speed?: 'slow' | 'normal' | 'fast';
    type?: 'spinner' | 'dots' | 'pulse' | 'bars';
    className?: string;
  }

  const props = withDefaults(defineProps<Props>(), {
    size: 'md',
    variant: 'default',
    speed: 'normal',
    type: 'spinner',
  });

  // Use spinner hook
  const { spinnerClasses, dotClasses, barClasses, variantClasses } = useSpinner(props);
</script>

<script lang="ts">
  export default {
    name: 'Spinner',
  };
</script>

<style scoped>
  /* Custom animation speeds */
  @keyframes spin-slow {
    to {
      transform: rotate(360deg);
    }
  }

  @keyframes spin-fast {
    to {
      transform: rotate(360deg);
    }
  }

  .animate-spin-slow {
    animation: spin-slow 2s linear infinite;
  }

  .animate-spin-fast {
    animation: spin-fast 0.5s linear infinite;
  }
</style>
