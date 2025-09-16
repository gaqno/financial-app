import { computed, ref } from 'vue';
import { useFinanceStore } from '../../../stores/financeStore';
import { storeToRefs } from 'pinia';

export interface FinanceModalCallbacks {
  onSheetOpened: () => void;
  onSheetClosed: () => void;
}

export function useFinanceModal(
  transactionForm: any,
  editForm: any,
  editRecurrence: any,
  validation: any,
  callbacks: FinanceModalCallbacks
) {
  const financeStore = useFinanceStore();
  const { editingRecord } = storeToRefs(financeStore);

  // Create/Edit modal state
  const showCreateSheet = ref(false);
  const isCreating = computed(() => showCreateSheet.value);

  // Use validated form fields instead of reactive object
  const newRecord = computed(() => ({
    Data: transactionForm.fields.data.value || new Date().toISOString().split('T')[0],
    Descrição: transactionForm.fields.descricao.value || '',
    Valor: transactionForm.fields.valor.value || 0,
    Tipo: transactionForm.fields.tipo.value || 'Receita',
    Categoria: transactionForm.fields.categoria.value || '',
    Status: transactionForm.fields.status.value || '❌',
  }));

  // Business day state for edit modal
  const editBusinessDayInfo = ref({
    isBusinessDayMode: false,
    dayNumber: 5,
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear(),
    calculatedDate: '',
  });

  // Computed property for current record (either editing or creating)
  const currentRecord = computed(() => {
    if (isCreating.value) {
      return newRecord.value;
    } else {
      // For editing, use validated form fields
      return {
        Data: editForm.fields.data?.value || editingRecord.value?.Data || '',
        Descrição: editForm.fields.descricao?.value || editingRecord.value?.Descrição || '',
        Valor: editForm.fields.valor?.value || editingRecord.value?.Valor || 0,
        Tipo: editForm.fields.tipo?.value || editingRecord.value?.Tipo || 'Receita',
        Categoria: editForm.fields.categoria?.value || editingRecord.value?.Categoria || '',
        Status: editForm.fields.status?.value || editingRecord.value?.Status || '❌',
        recurrence: editingRecord.value?.recurrence,
      };
    }
  });

  // Computed for date field value to handle v-model correctly
  const dateFieldValue = computed({
    get: () => {
      return (isCreating.value ? transactionForm.fields.data.value : editForm.fields.data.value) || '';
    },
    set: (value: string) => {
      if (isCreating.value) {
        transactionForm.fields.data.value = value;
      } else {
        editForm.fields.data.value = value;
      }
    },
  });

  // Handle business day changes in edit modal
  const handleEditBusinessDayChange = (businessDayInfo: any) => {
    editBusinessDayInfo.value = businessDayInfo;
    if (businessDayInfo.calculatedDate) {
      editForm.fields.data.value = businessDayInfo.calculatedDate;
    }
  };

  // Handle business day changes in create modal
  const handleCreateBusinessDayChange = (businessDayInfo: any) => {
    // For creation, we can use the same editBusinessDayInfo for UI display
    editBusinessDayInfo.value = businessDayInfo;
    if (businessDayInfo.calculatedDate) {
      transactionForm.fields.data.value = businessDayInfo.calculatedDate;
    }
  };

  // Create sheet functions
  const openCreateSheet = () => {
    // Reset transaction form to defaults
    transactionForm.reset();
    showCreateSheet.value = true;
    callbacks.onSheetOpened();
  };

  const setTransactionType = (tipo: 'Receita' | 'Despesa') => {
    // Set the transaction type in the form
    transactionForm.fields.tipo.value = tipo;
  };

  // Enhanced close function to handle both create and edit
  const closeSheet = () => {
    if (showCreateSheet.value) {
      showCreateSheet.value = false;
      callbacks.onSheetClosed();
    } else {
      financeStore.closeEditSheet();
      callbacks.onSheetClosed();
    }
  };

  // Create placeholder functions for recurrence
  const getEditRecurrenceOccurrences = (): number => {
    return 0; // Placeholder
  };

  const getEditRecurrenceDescription = (): string => {
    return ''; // Placeholder
  };

  return {
    // State
    showCreateSheet,
    editBusinessDayInfo,

    // Computed
    isCreating,
    newRecord,
    currentRecord,
    dateFieldValue,

    // Methods
    openCreateSheet,
    setTransactionType,
    closeSheet,
    handleEditBusinessDayChange,
    handleCreateBusinessDayChange,
    getEditRecurrenceOccurrences,
    getEditRecurrenceDescription,
  };
}
