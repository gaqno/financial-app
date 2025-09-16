<template>
  <Teleport to="body">
    <div v-if="hasToasts" class="toast-container">
      <TransitionGroup
        name="toast"
        tag="div"
        class="toast-wrapper"
        enter-active-class="toast-enter-active"
        leave-active-class="toast-leave-active"
        enter-from-class="toast-enter-from"
        leave-to-class="toast-leave-to"
      >
        <div
          v-for="toast in toasts"
          :key="toast.id"
          class="toast"
          :class="getToastClasses(toast)"
          @click="dismiss(toast.id)"
        >
          <!-- Icon -->
          <div class="toast-icon">
            <i :class="getIconClass(toast.type)" />
          </div>

          <!-- Content -->
          <div class="toast-content">
            <div v-if="toast.title" class="toast-title">
              {{ toast.title }}
            </div>
            <div class="toast-message">
              {{ toast.message }}
            </div>
          </div>

          <!-- Dismiss Button -->
          <button class="toast-dismiss" @click.stop="dismiss(toast.id)" type="button" aria-label="Fechar notificação">
            <i class="fas fa-times" />
          </button>
        </div>
      </TransitionGroup>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
  import type { IToast } from '../types/toast';
  import { useToast } from '../composables/useToast';

  const { toasts, hasToasts, dismiss } = useToast();

  const getToastClasses = (toast: IToast): string => {
    const baseClasses = 'toast-item';
    const typeClasses = {
      success: 'toast-success',
      error: 'toast-error',
      warning: 'toast-warning',
      info: 'toast-info',
    };

    return `${baseClasses} ${typeClasses[toast.type]}`;
  };

  const getIconClass = (type: string): string => {
    const iconMap = {
      success: 'fas fa-check-circle',
      error: 'fas fa-exclamation-circle',
      warning: 'fas fa-exclamation-triangle',
      info: 'fas fa-info-circle',
    };

    return iconMap[type as keyof typeof iconMap] || iconMap.info;
  };
</script>

<style scoped>
  .toast-container {
    @apply fixed top-4 right-4 z-[9999] pointer-events-none;
  }

  .toast-wrapper {
    @apply flex flex-col gap-2;
  }

  .toast {
    @apply flex items-start gap-3 p-4 rounded-lg shadow-lg border pointer-events-auto cursor-pointer;
    @apply transition-all duration-300 ease-in-out;
    @apply max-w-sm w-full;
  }

  .toast:hover {
    @apply shadow-xl transform scale-105;
  }

  .toast-item {
    @apply bg-white;
  }

  .toast-success {
    @apply border-green-200 bg-green-50;
  }

  .toast-success .toast-icon {
    @apply text-green-600;
  }

  .toast-error {
    @apply border-red-200 bg-red-50;
  }

  .toast-error .toast-icon {
    @apply text-red-600;
  }

  .toast-warning {
    @apply border-yellow-200 bg-yellow-50;
  }

  .toast-warning .toast-icon {
    @apply text-yellow-600;
  }

  .toast-info {
    @apply border-blue-200 bg-blue-50;
  }

  .toast-info .toast-icon {
    @apply text-blue-600;
  }

  .toast-icon {
    @apply flex-shrink-0 text-lg;
  }

  .toast-content {
    @apply flex-1 min-w-0;
  }

  .toast-title {
    @apply font-medium text-gray-900 text-sm mb-1;
  }

  .toast-message {
    @apply text-gray-700 text-sm leading-relaxed;
  }

  .toast-dismiss {
    @apply flex-shrink-0 text-gray-400 hover:text-gray-600 transition-colors;
    @apply rounded-full p-1 hover:bg-gray-100;
  }

  /* Animações */
  .toast-enter-active {
    @apply transition-all duration-300 ease-out;
  }

  .toast-leave-active {
    @apply transition-all duration-200 ease-in;
  }

  .toast-enter-from {
    @apply opacity-0 transform translate-x-full scale-95;
  }

  .toast-leave-to {
    @apply opacity-0 transform translate-x-full scale-95;
  }

  /* Mobile adjustments */
  @media (max-width: 640px) {
    .toast-container {
      @apply top-2 right-2 left-2;
    }

    .toast {
      @apply max-w-none;
    }
  }
</style>
