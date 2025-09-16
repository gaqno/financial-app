<template>
  <!-- Multi-line text skeleton -->
  <div v-if="variant === 'text' && lines && lines > 1" class="space-y-2">
    <div v-for="(width, index) in textLineWidths" :key="index" :class="textLineClasses" :style="{ width }" />
  </div>

  <!-- Single skeleton -->
  <div v-else :class="skeletonClasses" :style="skeletonStyle" />
</template>

<script setup lang="ts">
  import { useSkeleton } from './hooks/useSkeleton';

  // Props interface
  interface Props {
    variant?: 'text' | 'circular' | 'rectangular' | 'rounded';
    width?: string | number;
    height?: string | number;
    animation?: 'pulse' | 'wave' | 'none';
    lines?: number;
    className?: string;
  }

  const props = withDefaults(defineProps<Props>(), {
    variant: 'text',
    animation: 'pulse',
    lines: 1,
  });

  // Use skeleton hook
  const { skeletonClasses, skeletonStyle, textLineClasses, textLineWidths } = useSkeleton(props);
</script>

<script lang="ts">
  export default {
    name: 'Skeleton',
  };
</script>

<style scoped>
  @keyframes wave {
    0% {
      transform: translateX(-100%);
    }
    50% {
      transform: translateX(100%);
    }
    100% {
      transform: translateX(100%);
    }
  }

  .animate-wave {
    position: relative;
    overflow: hidden;
    background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.4), transparent);
    background-size: 200% 100%;
    animation: wave 1.5s infinite;
  }

  /* Dark mode wave effect */
  .dark .animate-wave {
    background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.1), transparent);
    background-size: 200% 100%;
  }
</style>
