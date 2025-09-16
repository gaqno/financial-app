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
          <Avatar size="xl" icon="fas fa-exclamation-triangle" variant="danger" class="mx-auto mb-4" />

          <!-- Title -->
          <h3 class="text-lg font-semibold text-gray-900 mb-2">
            {{ title }}
          </h3>

          <!-- Message -->
          <p class="text-gray-600 mb-2">
            {{ message }}
          </p>

          <!-- Record details -->
          <Card v-if="itemToDelete" variant="filled" size="sm" class="text-left mb-4">
            <div class="space-y-2">
              <div class="text-sm font-medium text-gray-900 dark:text-gray-100 flex items-center gap-2">
                {{ itemToDelete.record.Descrição }}
                <RecurringIcon :record="itemToDelete.record" size="xs" />
              </div>
              <div class="text-sm text-gray-600 dark:text-gray-400">
                {{ formatDate(itemToDelete.record.Data) }}
              </div>
              <div :class="getValueColor(itemToDelete.record.Valor)" class="text-sm font-semibold">
                {{ formatCurrency(itemToDelete.record.Valor) }}
              </div>

              <!-- Additional record info -->
              <div class="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                <Badge :variant="itemToDelete.record.Tipo === 'Receita' ? 'success' : 'danger'" size="sm">
                  {{ itemToDelete.record.Tipo === 'Receita' ? '💰' : '💸' }}
                  {{ itemToDelete.record.Tipo }}
                </Badge>
                <Badge variant="secondary" size="sm">
                  {{ itemToDelete.record.Status }}
                </Badge>
                <Badge v-if="itemToDelete.record.Categoria" variant="secondary" size="sm">
                  {{ getCategoryIcon(itemToDelete.record.Categoria) }}
                  {{ itemToDelete.record.Categoria }}
                </Badge>
              </div>
            </div>
          </Card>

          <!-- Actions -->
          <div class="flex gap-3">
            <Button variant="secondary" size="lg" :full-width="true" @click="cancelDelete">
              {{ cancelText }}
            </Button>
            <Button
              variant="danger"
              size="lg"
              :full-width="true"
              :loading="isDeleting"
              left-icon="fas fa-trash"
              @click="executeDelete"
            >
              {{ confirmText }}
            </Button>
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
  import { Card } from '@/components/ui/card/Card.vue';
  import { Button } from '@/components/ui/button/Button.vue';
  import { Avatar } from '@/components/ui/avatar/Avatar.vue';
  import { Badge } from '@/components/ui/badge/Badge.vue';

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
