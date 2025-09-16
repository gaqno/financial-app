<template>
  <Teleport to="body">
    <Transition
      name="modal"
      enter-active-class="transition-all duration-300 ease-out"
      leave-active-class="transition-all duration-200 ease-in"
      enter-from-class="opacity-0"
      leave-to-class="opacity-0"
    >
      <div v-if="open" :class="overlayClasses" @click="handleBackdropClick">
        <Transition
          name="modal-content"
          enter-active-class="transition-all duration-300 ease-out"
          leave-active-class="transition-all duration-200 ease-in"
          enter-from-class="opacity-0 transform scale-95 translate-y-4"
          leave-to-class="opacity-0 transform scale-95 translate-y-4"
        >
          <div v-if="open" :class="modalClasses" @click.stop>
            <!-- Header -->
            <div v-if="$slots.header || title" class="flex items-center justify-between p-6 pb-4">
              <div class="flex-1">
                <slot name="header">
                  <h3 class="text-lg font-semibold text-gray-900 dark:text-gray-100">
                    {{ title }}
                  </h3>
                  <p v-if="description" class="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    {{ description }}
                  </p>
                </slot>
              </div>

              <!-- Close button -->
              <button
                v-if="showCloseButton"
                @click="closeModal"
                type="button"
                class="ml-4 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 transition-colors p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
                aria-label="Fechar modal"
              >
                <i class="fas fa-times text-lg" />
              </button>
            </div>

            <!-- Content -->
            <div class="px-6 py-4 flex-1 overflow-y-auto">
              <slot />
            </div>

            <!-- Footer -->
            <div
              v-if="$slots.footer"
              class="flex items-center justify-end gap-3 p-6 pt-4 border-t border-gray-200 dark:border-gray-700"
            >
              <slot name="footer" />
            </div>
          </div>
        </Transition>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
  import { useModal } from './hooks/useModal';

  // Props interface
  interface Props {
    open?: boolean;
    title?: string;
    description?: string;
    dismissible?: boolean;
    showCloseButton?: boolean;
    size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'full';
    position?: 'center' | 'top' | 'bottom';
    backdrop?: 'dark' | 'light' | 'blur';
    className?: string;
  }

  const props = withDefaults(defineProps<Props>(), {
    open: false,
    dismissible: true,
    showCloseButton: true,
    size: 'md',
    position: 'center',
    backdrop: 'blur',
  });

  // Emits
  const emit = defineEmits<{
    'update:open': [value: boolean];
    close: [];
    escape: [];
  }>();

  // Use modal hook
  const { overlayClasses, modalClasses, closeModal, handleBackdropClick } = useModal(props, emit);
</script>

<script lang="ts">
  export default {
    name: 'Modal',
  };
</script>
