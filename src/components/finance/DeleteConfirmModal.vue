<template>
  <Transition name="modal">
    <div
      v-if="financeStore.showDeleteConfirm"
      data-modal="delete-confirm"
      class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      @click="financeStore.cancelDelete"
    >
      <div
        class="bg-white rounded-2xl shadow-xl max-w-sm w-full p-6 transform transition-all modal-content"
        @click.stop
      >
        <div class="text-center">
          <div class="w-12 h-12 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center">
            <i class="fas fa-exclamation-triangle text-red-600 text-xl"></i>
          </div>

          <h3 class="text-lg font-semibold text-gray-900 mb-2">Confirmar Exclusão</h3>

          <p class="text-gray-600 mb-2">Tem certeza que deseja excluir este registro?</p>

          <div v-if="financeStore.itemToDelete" class="bg-gray-50 rounded-lg p-3 mb-4 text-left">
            <div class="text-sm text-gray-800 font-medium flex items-center gap-1">
              {{ financeStore.itemToDelete.record.Descrição }}
              <span
                v-if="isRecurringRecord(financeStore.itemToDelete.record)"
                class="text-blue-500 text-xs"
                title="Registro recorrente"
              >
                <i class="fas fa-sync"></i>
              </span>
            </div>
            <div class="text-sm text-gray-600">
              {{ formatDate(financeStore.itemToDelete.record.Data) }}
            </div>
            <div
              :class="financeStore.itemToDelete.record.Valor < 0 ? 'text-red-600' : 'text-green-600'"
              class="text-sm font-semibold"
            >
              {{
                financeStore.itemToDelete.record.Valor.toLocaleString('pt-BR', {
                  style: 'currency',
                  currency: 'BRL',
                })
              }}
            </div>
          </div>

          <!-- 🔥 ENHANCED: Show different options for recurring vs normal records -->
          <div v-if="!isRecurringRecord(financeStore.itemToDelete?.record)" class="flex gap-3">
            <button
              @click="financeStore.cancelDelete"
              class="flex-1 px-4 py-3 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-colors"
            >
              Cancelar
            </button>
            <button
              @click="handleExecuteDelete"
              class="flex-1 px-4 py-3 bg-red-500 text-white rounded-xl font-medium hover:bg-red-600 transition-colors"
            >
              <i class="fas fa-trash mr-1"></i>
              Excluir
            </button>
          </div>

          <!-- 🔥 NEW: Recurring record deletion options -->
          <div v-else class="space-y-3">
            <p class="text-sm text-orange-600 font-medium">
              <i class="fas fa-sync mr-1"></i>
              Este é um registro recorrente. O que deseja fazer?
            </p>

            <div class="flex flex-col gap-2">
              <button
                @click="handleRecurringDelete('current')"
                class="w-full px-4 py-3 bg-orange-500 text-white rounded-xl font-medium hover:bg-orange-600 transition-colors text-sm"
              >
                <i class="fas fa-trash mr-1"></i>
                Excluir apenas este registro
              </button>

              <button
                @click="handleRecurringDelete('future')"
                class="w-full px-4 py-3 bg-red-500 text-white rounded-xl font-medium hover:bg-red-600 transition-colors text-sm"
              >
                <i class="fas fa-trash-alt mr-1"></i>
                Excluir este e próximos registros
              </button>

              <button
                @click="handleRecurringDelete('all')"
                class="w-full px-4 py-3 bg-red-700 text-white rounded-xl font-medium hover:bg-red-800 transition-colors text-sm"
              >
                <i class="fas fa-exclamation-triangle mr-1"></i>
                Excluir TODA a série recorrente
              </button>

              <button
                @click="financeStore.cancelDelete"
                class="w-full px-4 py-3 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-colors text-sm"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </Transition>
</template>

<script setup lang="ts">
  import { watch, onMounted } from 'vue';
  import { useFinanceStore } from '../../stores/financeStore';
  import { formatDateForDisplay } from '../../utils/dateUtils';

  const financeStore = useFinanceStore();

  // Debug: Component lifecycle
  onMounted(() => {
    // Component mounted
  });

  // Debug: Watch showDeleteConfirm changes
  watch(
    () => financeStore.showDeleteConfirm,
    (newValue, oldValue) => {
      // Debug watcher for development

      // Force check DOM visibility
      if (newValue) {
        // setTimeout(() => {
        //   const modalElement = document.querySelector('[data-modal="delete-confirm"]')
        //   // Debug modal visibility
        //   // Modal visibility debug info
        // }, 100)
      }
    }
  );

  const formatDate = (dateStr: string): string => {
    return formatDateForDisplay(dateStr);
  };

  const isRecurringRecord = (record: any): boolean => {
    return !!(record.recurrence && record.recurrence.isActive && record.recurrence.recurrenceId);
  };

  const handleExecuteDelete = async (): Promise<void> => {
    try {
      await financeStore.executeDelete();
    } catch (error) {
      console.error('❌ [DELETE_MODAL] Erro ao excluir registro:', error);
    }
  };

  // 🔥 NEW: Handle recurring record deletion with options
  const handleRecurringDelete = async (deleteOption: 'current' | 'future' | 'all'): Promise<void> => {
    if (!financeStore.itemToDelete) return;

    try {
      const { record } = financeStore.itemToDelete;
      const { deleteRecurringRecord } = financeStore.recurrenceHelpers;

      // Call the recurring deletion function
      const result = await deleteRecurringRecord(
        record,
        deleteOption,
        financeStore.records,
        financeStore.saveToStorage
      );

      if (result.success) {
        // Close the modal
        financeStore.cancelDelete();

        // Show success message based on deletion type
        const messages = {
          current: `Registro individual excluído: ${record.Descrição}`,
          future: `${result.deletedCount} registros futuros excluídos: ${record.Descrição}`,
          all: `${result.deletedCount} registros da série completa excluídos: ${record.Descrição}`,
        };

        // Use the toast system (assuming it's available globally)
        console.log('✅ [RECURRING_DELETE]', messages[deleteOption]);

        // Trigger a reactive update
        if (typeof window !== 'undefined') {
          import('vue').then(({ nextTick }) => {
            nextTick(() => {
              console.log('🔄 [DELETE_MODAL] UI updated after recurring deletion');
            });
          });
        }
      } else {
        console.error('❌ [DELETE_MODAL] Failed to delete recurring records');
      }
    } catch (error) {
      console.error('❌ [DELETE_MODAL] Error in recurring deletion:', error);
    }
  };
</script>

<style scoped>
  /* Modal animations */
  .modal-enter-active,
  .modal-leave-active {
    transition: opacity 0.3s ease;
  }

  .modal-enter-from,
  .modal-leave-to {
    opacity: 0;
  }

  .modal-enter-active .modal-content {
    animation: modalSlideIn 0.3s ease;
  }

  @keyframes modalSlideIn {
    from {
      transform: scale(0.9) translateY(-20px);
      opacity: 0;
    }

    to {
      transform: scale(1) translateY(0);
      opacity: 1;
    }
  }
</style>
