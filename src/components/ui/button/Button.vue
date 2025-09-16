<template>
  <button :type="type" :disabled="disabled || loading" :class="buttonClasses" @click="handleClick">
    <!-- Loading spinner -->
    <span v-if="loading" class="animate-spin mr-2">
      <i class="fas fa-spinner" />
    </span>

    <!-- Left icon -->
    <i v-else-if="leftIcon" :class="leftIcon" class="mr-2" />

    <!-- Button content -->
    <span v-if="$slots.default || content">
      <slot>{{ content }}</slot>
    </span>

    <!-- Right icon -->
    <i v-if="rightIcon && !loading" :class="rightIcon" class="ml-2" />
  </button>
</template>

<script setup lang="ts">
  import { useButton } from './hooks/useButton';

  // Props interface
  interface Props {
    type?: 'button' | 'submit' | 'reset';
    variant?: 'primary' | 'secondary' | 'danger' | 'success' | 'warning' | 'info' | 'ghost' | 'outline';
    size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
    disabled?: boolean;
    loading?: boolean;
    leftIcon?: string;
    rightIcon?: string;
    content?: string;
    fullWidth?: boolean;
    className?: string;
  }

  const props = withDefaults(defineProps<Props>(), {
    type: 'button',
    variant: 'primary',
    size: 'md',
    disabled: false,
    loading: false,
    fullWidth: false,
  });

  // Emits
  const emit = defineEmits<{
    click: [event: Event];
  }>();

  // Use button hook
  const { buttonClasses, handleClick } = useButton(props, emit);
</script>

<script lang="ts">
  export default {
    name: 'Button',
  };
</script>
