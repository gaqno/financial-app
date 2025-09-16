import { ref, computed, onBeforeUnmount } from 'vue';
import { useFinanceStore } from '../../stores/financeStore';
import { useDarkMode } from '../useDarkMode';
import { useToast } from '../useToast';
import type { IFinanceRecord } from '../../types/finance';

interface IDeleteItem {
  record: IFinanceRecord;
  index: number;
}

interface IDeletedItem {
  record: IFinanceRecord;
  index: number;
  restoreData?: any;
}

export function useFinanceModals() {
  const financeStore = useFinanceStore();
  const { isDarkMode, themeClass } = useDarkMode();
  const toast = useToast();

  // Modal state
  const showDeleteConfirm = ref<boolean>(false);
  const itemToDelete = ref<IDeleteItem | null>(null);

  // Enhanced toast state (now using global toast system)
  const showUndoToast = ref<boolean>(false);
  const deletedItem = ref<IDeletedItem | null>(null);
  const undoTimeLeft = ref<number>(0);

  // Edit sheet modal state
  const showEditSheet = ref<boolean>(false);

  // Multiple records modal state
  const showMultipleRecords = ref<boolean>(false);

  // Loading states for better UX
  const isDeletingRecord = ref<boolean>(false);
  const isRestoringRecord = ref<boolean>(false);

  // Internal timer for undo countdown
  let undoTimer: number | null = null;
  let undoCountdown: number | null = null;

  // Dark mode aware CSS classes
  const modalClasses = computed(() => ({
    backdrop: isDarkMode.value ? 'bg-gray-900/75 backdrop-blur-sm' : 'bg-black/50 backdrop-blur-sm',
    modal: isDarkMode.value ? 'bg-gray-800 border-gray-700 shadow-2xl' : 'bg-white border-gray-200 shadow-xl',
    text: isDarkMode.value ? 'text-gray-100' : 'text-gray-900',
    textSecondary: isDarkMode.value ? 'text-gray-300' : 'text-gray-600',
    button: {
      primary: isDarkMode.value
        ? 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500 text-white'
        : 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500 text-white',
      secondary: isDarkMode.value
        ? 'bg-gray-700 hover:bg-gray-600 focus:ring-gray-500 text-gray-200 border-gray-600'
        : 'bg-gray-100 hover:bg-gray-200 focus:ring-gray-500 text-gray-900 border-gray-300',
      danger: isDarkMode.value
        ? 'bg-red-600 hover:bg-red-700 focus:ring-red-500 text-white'
        : 'bg-red-600 hover:bg-red-700 focus:ring-red-500 text-white',
    },
  }));

  // Delete confirmation modal
  const confirmDelete = (record: IFinanceRecord, index: number) => {
    itemToDelete.value = { record, index };
    showDeleteConfirm.value = true;
  };

  const cancelDelete = () => {
    itemToDelete.value = null;
    showDeleteConfirm.value = false;
  };

  const executeDelete = async () => {
    if (!itemToDelete.value || isDeletingRecord.value) return;

    const { record, index } = itemToDelete.value;
    isDeletingRecord.value = true;

    try {
      // Store deleted item for undo functionality
      deletedItem.value = {
        record: { ...record },
        index,
        restoreData: { ...record },
      };

      // Remove the record using the store
      const success = financeStore.removeRecord(index);

      if (success) {
        // Close delete modal
        showDeleteConfirm.value = false;
        itemToDelete.value = null;

        // Show enhanced success toast with undo action
        const recordType = record.Tipo === 'Receita' ? '💰 Receita' : '💸 Despesa';
        const formattedValue = Math.abs(record.Valor).toLocaleString('pt-BR', {
          style: 'currency',
          currency: 'BRL',
        });

        toast.success(`${recordType} excluída: ${record.Descrição} (${formattedValue})`, {
          title: '✅ Registro Excluído',
          duration: 5000,
        });

        // Show undo toast
        showUndoToastWithTimer();
      } else {
        toast.error('Falha ao excluir o registro. Tente novamente.', {
          title: '❌ Erro na Exclusão',
          duration: 4000,
        });
      }
    } catch (error) {
      console.error('❌ [MODAL] Error deleting record:', error);
      toast.error('Erro inesperado ao excluir registro.', {
        title: '❌ Erro Interno',
        duration: 4000,
      });
    } finally {
      isDeletingRecord.value = false;
    }
  };

  // Undo functionality
  const showUndoToastWithTimer = () => {
    if (undoTimer) {
      clearTimeout(undoTimer);
    }
    if (undoCountdown) {
      clearInterval(undoCountdown);
    }

    undoTimeLeft.value = 5;
    showUndoToast.value = true;

    // Countdown timer
    undoCountdown = window.setInterval(() => {
      undoTimeLeft.value--;
      if (undoTimeLeft.value <= 0) {
        hideUndoToast();
      }
    }, 1000);

    // Auto-hide timer
    undoTimer = window.setTimeout(() => {
      hideUndoToast();
    }, 5000);
  };

  const undoDelete = async () => {
    if (!deletedItem.value || isRestoringRecord.value) return;

    isRestoringRecord.value = true;

    try {
      const { record, restoreData } = deletedItem.value;

      // Add the record back to the data
      const success = await financeStore.addRecord(restoreData);

      if (success) {
        const recordType = record.Tipo === 'Receita' ? '💰 Receita' : '💸 Despesa';
        const formattedValue = Math.abs(record.Valor).toLocaleString('pt-BR', {
          style: 'currency',
          currency: 'BRL',
        });

        toast.success(`${recordType} restaurada: ${record.Descrição} (${formattedValue})`, {
          title: '🔄 Exclusão Desfeita',
          duration: 3000,
        });

        // Clear undo state
        hideUndoToast();
      } else {
        toast.error('Falha ao restaurar o registro. Tente novamente.', {
          title: '❌ Erro na Restauração',
          duration: 4000,
        });
      }
    } catch (error) {
      console.error('❌ [MODAL] Error restoring record:', error);
      toast.error('Erro inesperado ao restaurar registro.', {
        title: '❌ Erro Interno',
        duration: 4000,
      });
    } finally {
      isRestoringRecord.value = false;
    }
  };

  const hideUndoToast = () => {
    showUndoToast.value = false;
    deletedItem.value = null;
    undoTimeLeft.value = 0;

    if (undoTimer) {
      clearTimeout(undoTimer);
      undoTimer = null;
    }
    if (undoCountdown) {
      clearInterval(undoCountdown);
      undoCountdown = null;
    }
  };

  // Edit sheet modal
  const openEditSheet = () => {
    showEditSheet.value = true;
  };

  const closeEditSheet = () => {
    showEditSheet.value = false;
  };

  // Multiple records modal
  const openMultipleRecords = () => {
    showMultipleRecords.value = true;
  };

  const closeMultipleRecords = () => {
    showMultipleRecords.value = false;
  };

  // Computed properties
  const hasActiveModal = computed(() => {
    return showDeleteConfirm.value || showEditSheet.value || showMultipleRecords.value;
  });

  const hasActiveToast = computed(() => {
    return showUndoToast.value;
  });

  // Cleanup on unmount
  onBeforeUnmount(() => {
    if (undoTimer) {
      clearTimeout(undoTimer);
    }
    if (undoCountdown) {
      clearInterval(undoCountdown);
    }
  });

  // ESC key handler for modals
  const handleEscapeKey = (event: KeyboardEvent) => {
    if (event.key === 'Escape') {
      if (showDeleteConfirm.value) {
        cancelDelete();
      } else if (showEditSheet.value) {
        closeEditSheet();
      } else if (showMultipleRecords.value) {
        closeMultipleRecords();
      }
    }
  };

  // Auto-register escape key handler
  if (typeof window !== 'undefined') {
    document.addEventListener('keydown', handleEscapeKey);

    onBeforeUnmount(() => {
      document.removeEventListener('keydown', handleEscapeKey);
    });
  }

  return {
    // Delete confirmation modal
    showDeleteConfirm,
    itemToDelete,
    confirmDelete,
    cancelDelete,
    executeDelete,

    // Undo toast
    showUndoToast,
    deletedItem,
    undoTimeLeft,
    undoDelete,
    hideUndoToast,

    // Edit sheet modal
    showEditSheet,
    openEditSheet,
    closeEditSheet,

    // Multiple records modal
    showMultipleRecords,
    openMultipleRecords,
    closeMultipleRecords,

    // Loading states
    isDeletingRecord,
    isRestoringRecord,

    // Dark mode and styling
    isDarkMode,
    themeClass,
    modalClasses,

    // Enhanced toast system
    toast,

    // Computed
    hasActiveModal,
    hasActiveToast,

    // Utilities
    handleEscapeKey,
  };
}
