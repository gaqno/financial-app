<template>
  <div :class="toastClasses" @click="handleDismiss">
    <!-- Icon -->
    <div v-if="icon" :class="iconClasses">
      <i :class="iconClasses" />
    </div>

    <!-- Content -->
    <div class="flex-1 min-w-0">
      <!-- Title -->
      <div v-if="title" :class="titleClasses">
        {{ title }}
      </div>

      <!-- Message -->
      <div :class="messageClasses">
        {{ message }}
      </div>

      <!-- Actions -->
      <div v-if="actions && actions.length > 0" class="flex gap-2 mt-3">
        <button
          v-for="(action, index) in actions"
          :key="index"
          @click.stop="handleAction(index)"
          :class="getActionButtonClasses(action.variant)"
          class="px-3 py-1 text-xs font-medium rounded-md transition-colors"
        >
          {{ action.label }}
        </button>
      </div>
    </div>

    <!-- Dismiss Button -->
    <button
      v-if="dismissible"
      @click.stop="handleDismiss"
      type="button"
      :class="dismissButtonClasses"
      aria-label="Fechar notificação"
    >
      <i class="fas fa-times" />
    </button>
  </div>
</template>

<script setup lang="ts">
  import { computed } from 'vue';
  import { useToast } from './hooks/useToast';

  // Props interface
  interface ToastAction {
    label: string;
    action: () => void;
    variant?: 'primary' | 'secondary';
  }

  interface Props {
    type?: 'success' | 'error' | 'warning' | 'info';
    title?: string;
    message: string;
    dismissible?: boolean;
    duration?: number;
    icon?: boolean;
    actions?: ToastAction[];
    className?: string;
  }

  const props = withDefaults(defineProps<Props>(), {
    type: 'info',
    dismissible: true,
    duration: 5000,
    icon: true,
  });

  // Emits
  const emit = defineEmits<{
    dismiss: [];
    action: [actionIndex: number];
  }>();

  // Use toast hook
  const { toastClasses, iconClasses, titleClasses, messageClasses, dismissButtonClasses, handleDismiss, handleAction } =
    useToast(props, emit);

  // Action button classes
  const getActionButtonClasses = computed(() => (variant: 'primary' | 'secondary' = 'primary') => {
    const baseClasses = 'px-3 py-1 text-xs font-medium rounded-md transition-colors';

    const variantClasses = {
      primary: {
        success: 'bg-green-600 text-white hover:bg-green-700 dark:bg-green-500 dark:hover:bg-green-600',
        error: 'bg-red-600 text-white hover:bg-red-700 dark:bg-red-500 dark:hover:bg-red-600',
        warning: 'bg-yellow-600 text-white hover:bg-yellow-700 dark:bg-yellow-500 dark:hover:bg-yellow-600',
        info: 'bg-blue-600 text-white hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600',
      },
      secondary: {
        success:
          'bg-green-100 text-green-800 hover:bg-green-200 dark:bg-green-800 dark:text-green-100 dark:hover:bg-green-700',
        error: 'bg-red-100 text-red-800 hover:bg-red-200 dark:bg-red-800 dark:text-red-100 dark:hover:bg-red-700',
        warning:
          'bg-yellow-100 text-yellow-800 hover:bg-yellow-200 dark:bg-yellow-800 dark:text-yellow-100 dark:hover:bg-yellow-700',
        info: 'bg-blue-100 text-blue-800 hover:bg-blue-200 dark:bg-blue-800 dark:text-blue-100 dark:hover:bg-blue-700',
      },
    };

    return `${baseClasses} ${variantClasses[variant][props.type || 'info']}`;
  });
</script>

<script lang="ts">
  export default {
    name: 'Toast',
  };
</script>
