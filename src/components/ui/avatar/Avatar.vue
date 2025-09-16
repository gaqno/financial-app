<template>
  <div :class="avatarClasses">
    <!-- Avatar Image -->
    <img
      v-if="showImage"
      :src="src"
      :alt="alt"
      class="w-full h-full object-cover"
      @error="handleImageError"
      @load="handleImageLoad"
    />

    <!-- Fallback Content -->
    <div v-else-if="showFallback" class="flex items-center justify-center w-full h-full">
      <!-- Fallback Icon -->
      <i v-if="fallbackIcon" :class="[fallbackIcon, fallbackClasses]" />

      <!-- Fallback Text -->
      <span v-else :class="fallbackClasses">
        {{ fallbackText }}
      </span>
    </div>

    <!-- Default User Icon -->
    <div v-else class="flex items-center justify-center w-full h-full">
      <i :class="['fas fa-user', fallbackClasses]" />
    </div>

    <!-- Status Indicator -->
    <div v-if="showStatus && status" :class="statusClasses" />
  </div>
</template>

<script setup lang="ts">
  import { useAvatar } from './hooks/useAvatar';

  // Props interface
  interface Props {
    src?: string;
    alt?: string;
    size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
    shape?: 'circle' | 'square' | 'rounded';
    fallback?: string;
    fallbackIcon?: string;
    status?: 'online' | 'offline' | 'away' | 'busy';
    showStatus?: boolean;
    className?: string;
  }

  const props = withDefaults(defineProps<Props>(), {
    size: 'md',
    shape: 'circle',
    showStatus: false,
  });

  // Use avatar hook
  const {
    avatarClasses,
    statusClasses,
    fallbackClasses,
    showImage,
    showFallback,
    fallbackText,
    handleImageError,
    handleImageLoad,
  } = useAvatar(props);
</script>

<script lang="ts">
  export default {
    name: 'Avatar',
  };
</script>
