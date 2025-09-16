<template>
  <div class="w-full">
    <!-- Label -->
    <div v-if="showLabel || showPercentage" :class="labelClasses">
      <span v-if="showLabel">{{ label || 'Progresso' }}</span>
      <span v-if="showPercentage && !indeterminate" class="text-xs">{{ percentage }}%</span>
      <span v-else-if="showPercentage && indeterminate" class="text-xs">Carregando...</span>
    </div>

    <!-- Progress Track -->
    <div
      :class="trackClasses"
      role="progressbar"
      :aria-valuenow="indeterminate ? undefined : value"
      :aria-valuemax="max"
      :aria-valuemin="0"
    >
      <div :class="barClasses" :style="barStyle" />
    </div>
  </div>
</template>

<script setup lang="ts">
  import { useProgress } from './hooks/useProgress';

  // Props interface
  interface Props {
    value?: number;
    max?: number;
    size?: 'xs' | 'sm' | 'md' | 'lg';
    variant?: 'default' | 'success' | 'warning' | 'danger';
    showLabel?: boolean;
    showPercentage?: boolean;
    label?: string;
    indeterminate?: boolean;
    className?: string;
  }

  const props = withDefaults(defineProps<Props>(), {
    value: 0,
    max: 100,
    size: 'md',
    variant: 'default',
    showLabel: false,
    showPercentage: false,
    indeterminate: false,
  });

  // Use progress hook
  const { percentage, trackClasses, barClasses, labelClasses, barStyle } = useProgress(props);
</script>

<script lang="ts">
  export default {
    name: 'Progress',
  };
</script>

<style scoped>
  @keyframes indeterminate {
    0% {
      transform: translateX(-100%);
    }
    100% {
      transform: translateX(100%);
    }
  }

  .animate-indeterminate {
    animation: indeterminate 1.5s ease-in-out infinite;
  }
</style>
