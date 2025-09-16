<template>
  <div :class="alertClasses">
    <div class="flex items-start">
      <!-- Icon -->
      <i v-if="icon" :class="[getIcon, iconClasses]" />

      <!-- Content -->
      <div class="flex-1">
        <slot />
      </div>

      <!-- Dismiss button -->
      <button
        v-if="dismissible"
        @click="handleDismiss"
        type="button"
        :class="dismissButtonClasses"
        aria-label="Fechar alerta"
      >
        <i class="fas fa-times" />
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { useAlert } from './hooks/useAlert';

  // Props interface
  interface Props {
    variant?: 'info' | 'success' | 'warning' | 'error';
    size?: 'sm' | 'md' | 'lg';
    dismissible?: boolean;
    icon?: boolean;
    className?: string;
  }

  const props = withDefaults(defineProps<Props>(), {
    variant: 'info',
    size: 'md',
    dismissible: false,
    icon: true,
  });

  // Emits
  const emit = defineEmits<{
    dismiss: [];
  }>();

  // Use alert hook
  const { alertClasses, iconClasses, dismissButtonClasses, getIcon, handleDismiss } = useAlert(props, emit);
</script>

<script lang="ts">
  export default {
    name: 'Alert',
  };
</script>
