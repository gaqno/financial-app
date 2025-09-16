<template>
  <Transition name="modal">
    <div
      v-if="showDeleteConfirm"
      class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      @click="cancelDelete"
    >
      <div
        class="bg-white rounded-2xl shadow-xl max-w-sm w-full p-6 transform transition-all modal-content"
        @click.stop
      >
        <div class="text-center">
          <!-- Icon -->
          <div class="w-12 h-12 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center">
            <i class="fas fa-exclamation-triangle text-red-600 text-xl"></i>
          </div>

          <!-- Title -->
          <h3 class="text-lg font-semibold text-gray-900 mb-2">
            {{ title }}
          </h3>

          <!-- Message -->
          <p class="text-gray-600 mb-2">
            {{ message }}
          </p>

          <!-- Record details -->
          <div v-if="itemToDelete" class="bg-gray-50 rounded-lg p-3 mb-4 text-left">
            <div class="text-sm text-gray-800 font-medium flex items-center gap-2">
              {{ itemToDelete.record.Descrição }}
              <RecurringIcon :record="itemToDelete.record" size="xs" />
            </div>
            <div class="text-sm text-gray-600">
              {{ formatDate(itemToDelete.record.Data) }}
            </div>
            <div :class="getValueColor(itemToDelete.record.Valor)" class="text-sm font-semibold">
              {{ formatCurrency(itemToDelete.record.Valor) }}
            </div>

            <!-- Additional record info -->
            <div class="mt-2 flex items-center gap-2 text-xs text-gray-500">
              <span class="flex items-center gap-1">
                {{ itemToDelete.record.Tipo === 'Receita' ? '💰' : '💸' }}
                {{ itemToDelete.record.Tipo }}
              </span>
              <span>•</span>
              <span>{{ itemToDelete.record.Status }}</span>
              <span v-if="itemToDelete.record.Categoria">
                •
                {{ getCategoryIcon(itemToDelete.record.Categoria) }}
                {{ itemToDelete.record.Categoria }}
              </span>
            </div>
          </div>

          <!-- Actions -->
          <div class="flex gap-3">
            <button
              @click="cancelDelete"
              class="flex-1 px-4 py-3 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-colors"
            >
              {{ cancelText }}
            </button>
            <button
              @click="executeDelete"
              class="flex-1 px-4 py-3 bg-red-500 text-white rounded-xl font-medium hover:bg-red-600 transition-colors"
              :disabled="isDeleting"
            >
              <i v-if="isDeleting" class="fas fa-spinner fa-spin mr-1"></i>
              <i v-else class="fas fa-trash mr-1"></i>
              {{ confirmText }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </Transition>
</template>

<script setup lang="ts">
  import { ref } from 'vue';
  import { useFinanceModals } from '../../../composables/finance/useFinanceModals';
  import { useFinanceTable } from '../../../composables/finance/useFinanceTable';
  import { useCategoryDetection } from '../../../composables/useCategoryDetection';
  import RecurringIcon from '../utils/RecurringIcon.vue';

  interface Props {
    title?: string;
    message?: string;
    confirmText?: string;
    cancelText?: string;
  }

  const props = withDefaults(defineProps<Props>(), {
    title: 'Confirmar Exclusão',
    message: 'Tem certeza que deseja excluir este registro?',
    confirmText: 'Excluir',
    cancelText: 'Cancelar',
  });

  // Use composables
  const { showDeleteConfirm, itemToDelete, cancelDelete, executeDelete: executeDeleteAction } = useFinanceModals();

  const { formatDate, formatCurrency, getValueColor } = useFinanceTable();
  const { getCategoryIcon } = useCategoryDetection();

  // Local state
  const isDeleting = ref(false);

  // Enhanced delete with loading state
  const executeDelete = async () => {
    if (isDeleting.value) return;

    isDeleting.value = true;

    try {
      await executeDeleteAction();
    } finally {
      isDeleting.value = false;
    }
  };
</script>

<style scoped>
  /* Modal transitions */
  .modal-enter-active,
  .modal-leave-active {
    transition: opacity 0.3s ease;
  }

  .modal-enter-from,
  .modal-leave-to {
    opacity: 0;
  }

  .modal-content {
    animation: modalSlideUp 0.3s ease-out;
  }

  @keyframes modalSlideUp {
    from {
      transform: translateY(20px);
      opacity: 0;
    }

    to {
      transform: translateY(0);
      opacity: 1;
    }
  }
</style>
