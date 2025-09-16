import { computed, watch, ref } from 'vue';
import { useFinanceStore } from '../../../stores/financeStore';
import { storeToRefs } from 'pinia';
import { useFinanceTableHelpers } from '../../../composables/finance/useFinanceTableHelpers';
import { useCSVImport } from '../../../composables/useCSVImport';
import { useBusinessDays } from '../../../composables/finance/useBusinessDays';
import { useCategoryDetection } from '../../../composables/useCategoryDetection';
import { useFinanceForms } from '../../../composables/finance/useFinanceForms';
import { useTransactionValidation } from '../../../composables/finance/useTransactionValidation';
import { useRecurrenceHelpers } from '../../../composables/finance/useRecurrenceHelpers';

export interface FinanceTableCallbacks {
  onSheetOpened: () => void;
  onSheetClosed: () => void;
}

export function useFinanceTableMain(callbacks: FinanceTableCallbacks) {
  // Main store
  const financeStore = useFinanceStore();

  // Get reactive refs from store - CRITICAL: Use storeToRefs for ALL reactive data
  const {
    records,
    filteredData,
    groupedByMonth,
    saldoFinal,
    showDeleteConfirm,
    itemToDelete,
    showEditSheet,
    editingRecord,
    editRecurrence,
    originalEditIndex,
    showUndoToast,
    undoTimeLeft,
    projectionSettings,
    getSmartVisibleMonths,
  } = storeToRefs(financeStore);

  // Store actions (these don't need refs)
  const {
    confirmDelete,
    openEditSheet,
    closeEditSheet,
    startEdit,
    saveEdit,
    undoDelete,
    hideUndoToast,
    getCurrentMonthKey,
    updateProjectionSettings,
  } = financeStore;

  // Store functions that need to be callable from template
  const getHiddenMonthsCount = financeStore.getHiddenMonthsCount;

  // Table helpers with store integration
  const { collapsedMonths, handleMonthToggle, handleToggleStatus, getMonthStartIndex, formatDate } =
    useFinanceTableHelpers();

  // CSV Import functionality
  const { importCSV } = useCSVImport();

  // Business days functionality for edit modal
  const { calculateBusinessDay, getMonthName } = useBusinessDays();

  // Category detection functionality
  const { getAllCategories, getCategoryIcon } = useCategoryDetection();

  // Finance forms functionality for edit modal
  const { saveEditSheet: saveEditFromForms } = useFinanceForms();

  // Transaction validation functionality
  const { transactionForm, recurrenceForm, completeForm, editForm, validation, utils } = useTransactionValidation();

  // Recurrence helpers functionality
  const { generateRecurringRecordsForEdit } = useRecurrenceHelpers();

  // Create/Edit modal state
  const showCreateSheet = ref(false);
  const isCreating = computed(() => showCreateSheet.value);

  // Business day state for edit modal
  const editBusinessDayInfo = ref({
    isBusinessDayMode: false,
    dayNumber: 5,
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear(),
    calculatedDate: '',
  });

  // Use validated form fields instead of reactive object
  const newRecord = computed(() => ({
    Data: transactionForm.fields.data.value || new Date().toISOString().split('T')[0],
    Descrição: transactionForm.fields.descricao.value || '',
    Valor: transactionForm.fields.valor.value || 0,
    Tipo: transactionForm.fields.tipo.value || 'Receita',
    Categoria: transactionForm.fields.categoria.value || '',
    Status: transactionForm.fields.status.value || '❌',
  }));

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

  // Watch for editingRecord changes to sync with editForm
  watch(
    editingRecord,
    (newRecord) => {
      if (newRecord) {
        console.log('🔄 [EDIT_SYNC] Syncing editingRecord to editForm:', newRecord);
        editForm.setValues({
          Data: newRecord.Data,
          Descrição: newRecord.Descrição,
          Valor: newRecord.Valor,
          Tipo: newRecord.Tipo,
          Categoria: newRecord.Categoria || '',
          Status: newRecord.Status,
        });
      }
    },
    { immediate: true }
  );

  // Simplified handlers that work with the store
  const handleEditRecord = (record: any, index: number) => {
    // Find the actual index in the main records array by matching record properties
    const actualIndex = financeStore.records.findIndex(
      (r) =>
        r.Data === record.Data &&
        r.Descrição === record.Descrição &&
        r.Valor === record.Valor &&
        r.Tipo === record.Tipo &&
        r.Status === record.Status
    );

    if (actualIndex === -1) {
      return;
    }

    startEdit(record, actualIndex);
  };

  const handleDeleteRecord = (record: any, index: number) => {
    // Find the actual index in the main records array by matching record properties
    // This ensures we delete the correct record regardless of filtering/sorting
    const actualIndex = financeStore.records.findIndex(
      (r) =>
        r.Data === record.Data &&
        r.Descrição === record.Descrição &&
        r.Valor === record.Valor &&
        r.Tipo === record.Tipo &&
        r.Status === record.Status
    );

    if (actualIndex === -1) {
      return;
    }

    confirmDelete(record, actualIndex);
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

  const saveCreateSheet = async () => {
    try {
      let recordToSave = { ...newRecord.value };

      // ✅ FIX: Attach recurrence metadata to record
      if (editRecurrence.value.isActive) {
        console.log('🔄 [CREATE] Processing recurrence:', editRecurrence.value);

        // Create recurrence settings
        const recurrenceSettings = {
          frequency: editRecurrence.value.frequency,
          endDate:
            editRecurrence.value.endDate ||
            new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split('T')[0],
          isActive: true,
        };

        // ✅ ATTACH recurrence metadata to the record
        recordToSave = {
          ...recordToSave,
          recurrence: recurrenceSettings,
        } as any;

        console.log('✅ [CREATE] Record with recurrence metadata:', recordToSave);

        // Generate all recurring records
        const recordsToAdd = generateRecurringRecordsForEdit(recordToSave, recurrenceSettings);
        console.log('🔄 [CREATE] Generated recurring records:', recordsToAdd.length);

        // Use batch insert for multiple records
        await financeStore.addRecordsBatch(recordsToAdd);
      } else {
        // ✅ SINGLE RECORD: No recurrence, add single record
        await financeStore.addRecord(recordToSave);
      }

      // Close sheet and reset form
      showCreateSheet.value = false;

      // Reset recurrence settings after successful creation
      editRecurrence.value = {
        isActive: false,
        frequency: 'mensal',
        endDate: '',
      };
    } catch (error) {
      console.error('Error creating record:', error);
    }
  };

  // Enhanced close function to handle both create and edit
  const closeSheet = () => {
    if (showCreateSheet.value) {
      showCreateSheet.value = false;
      callbacks.onSheetClosed();
    } else {
      closeEditSheet();
      callbacks.onSheetClosed();
    }
  };

  // ✅ PREVENT INFINITE LOOP: Add submission guards
  const isSubmittingCreate = ref(false);
  const isSubmittingEdit = ref(false);

  // Validated form handlers
  const handleValidatedCreate = async () => {
    // ✅ DEFENSIVE PROGRAMMING: Prevent multiple simultaneous submissions
    if (isSubmittingCreate.value) {
      console.warn('⚠️ [CREATE] Submission already in progress, ignoring duplicate call');
      return;
    }

    validation.showValidationErrors.value = true;

    if (!validation.isTransactionValid.value) {
      console.warn('❌ Formulário inválido, não é possível criar transação');
      return;
    }

    try {
      isSubmittingCreate.value = true;
      console.log('🔄 [CREATE] Starting create submission...');

      let transactionData = await transactionForm.submit();
      console.log('✅ [CREATE] Transaction form submitted successfully:', transactionData);

      // ✅ FIX: Attach recurrence metadata to transaction data
      if (recurrenceForm.fields.recurrenceActive.value && transactionData) {
        console.log('🔄 [CREATE] Processing recurrence with data:', recurrenceForm.values);

        // Map form frequency values to valid IRecurrenceFrequency values
        const mapFrequency = (freq: string | undefined): 'mensal' | 'semanal' | 'quinzenal' | 'trimestral' => {
          switch (freq) {
            case 'semestral':
              return 'trimestral'; // 6 months -> 3 months (closest valid)
            case 'anual':
              return 'trimestral'; // 12 months -> 3 months (closest valid)
            case 'semanal':
              return 'semanal';
            case 'quinzenal':
              return 'quinzenal';
            case 'trimestral':
              return 'trimestral';
            default:
              return 'mensal';
          }
        };

        const recurrenceData = {
          isActive: true,
          frequency: mapFrequency(recurrenceForm.fields.recurrenceFrequency.value),
          endDate: recurrenceForm.fields.recurrenceEndDate.value || '',
        };

        // ✅ ATTACH recurrence metadata to the original transaction
        transactionData = {
          ...transactionData,
          recurrence: recurrenceData,
        } as any;

        console.log('✅ [CREATE] Transaction with recurrence metadata:', transactionData);

        const recordsToAdd = generateRecurringRecordsForEdit(transactionData!, recurrenceData);
        console.log('🔄 [CREATE] Generated recurring records:', recordsToAdd.length);
        await financeStore.addRecordsBatch(recordsToAdd);
      } else {
        // ✅ SINGLE TRANSACTION: No recurrence, add single record
        if (transactionData) {
          await financeStore.addRecord(transactionData);
        }
      }

      // Reset forms and close sheet
      transactionForm.reset();
      recurrenceForm.reset();
      validation.showValidationErrors.value = false;
      showCreateSheet.value = false;
      callbacks.onSheetClosed();

      console.log('✅ [CREATE] Create process completed, sheet closed');
    } catch (error) {
      console.error('❌ Error in handleValidatedCreate:', error);
    } finally {
      // ✅ ALWAYS reset the guard, even if there's an error
      isSubmittingCreate.value = false;
      console.log('🔄 [CREATE] Submission guard reset');
    }
  };

  const handleValidatedEdit = async () => {
    // ✅ DEFENSIVE PROGRAMMING: Prevent multiple simultaneous submissions
    if (isSubmittingEdit.value) {
      console.warn('⚠️ [EDIT] Submission already in progress, ignoring duplicate call');
      return;
    }

    validation.showValidationErrors.value = true;

    if (!validation.isEditValid.value) {
      console.warn('❌ Edit form invalid, cannot save');
      return;
    }

    try {
      isSubmittingEdit.value = true;
      console.log('🔄 [EDIT] Starting edit submission...');

      const editData = await editForm.submit();
      console.log('✅ [EDIT] Edit form submitted successfully:', editData);

      // ✅ FIX: Sync validation form data to store's editRecurrence state
      if (editingRecord.value && editData) {
        // Update editingRecord with form data
        Object.assign(editingRecord.value, editData);

        // ✅ CRITICAL FIX: Read from the ACTUAL UI state (editRecurrence), not validation state
        console.log('🔄 [EDIT] Current editRecurrence state (from UI):', editRecurrence.value);

        // No need to sync - the UI is ALREADY updating editRecurrence.value directly!
        // The store's saveEdit() function reads from editRecurrence.value which is correct
      }

      // ✅ DEBUG: Log recurrence state before calling saveEdit
      console.log('🔍 [DEBUG] About to call saveEdit with editRecurrence state:', editRecurrence.value);

      await financeStore.saveEdit();
      console.log('✅ [EDIT] Store save completed successfully');

      // Reset validation and close
      validation.showValidationErrors.value = false;
      callbacks.onSheetClosed();

      console.log('✅ [EDIT] Edit process completed, sheet closed');
    } catch (error) {
      console.error('❌ Error in handleValidatedEdit:', error);
    } finally {
      // ✅ ALWAYS reset the guard, even if there's an error
      isSubmittingEdit.value = false;
      console.log('🔄 [EDIT] Submission guard reset');
    }
  };

  // Helper function to format month key to Portuguese month name
  const formatMonthDisplayName = (monthKey: string): string => {
    try {
      // monthKey format: "YYYY-MM"
      const [year, month] = monthKey.split('-');
      const date = new Date(parseInt(year), parseInt(month) - 1, 1);
      return date.toLocaleDateString('pt-BR', {
        month: 'long',
        year: 'numeric',
      });
    } catch {
      return monthKey; // Fallback to original key if parsing fails
    }
  };

  // Create a wrapper for CSV import
  const handleImport = async (records: any[]) => {
    try {
      console.log('📥 [CSV] Starting import of', records.length, 'records');
      await financeStore.importRecords(records);
      console.log('✅ [CSV] Import completed successfully');
    } catch (error) {
      console.error('❌ [CSV] Import failed:', error);
    }
  };

  // Placeholder functions for recurrence UI
  const getEditRecurrenceOccurrences = (): number => {
    return 0; // Placeholder
  };

  const getEditRecurrenceDescription = (): string => {
    return ''; // Placeholder
  };

  return {
    // Store refs
    records,
    filteredData,
    groupedByMonth,
    saldoFinal,
    showDeleteConfirm,
    itemToDelete,
    showEditSheet,
    editingRecord,
    editRecurrence,
    originalEditIndex,
    showUndoToast,
    undoTimeLeft,
    projectionSettings,
    getSmartVisibleMonths,

    // Store actions
    confirmDelete,
    openEditSheet,
    closeEditSheet,
    startEdit,
    saveEdit,
    undoDelete,
    hideUndoToast,
    getCurrentMonthKey,
    updateProjectionSettings,
    getHiddenMonthsCount,

    // Helpers
    collapsedMonths,
    handleMonthToggle,
    handleToggleStatus,
    getMonthStartIndex,
    formatDate,

    // Import
    importCSV,

    // Business days
    calculateBusinessDay,
    getMonthName,

    // Categories
    getAllCategories,
    getCategoryIcon,

    // Forms
    transactionForm,
    recurrenceForm,
    completeForm,
    editForm,
    validation,
    utils,
    saveEditFromForms,

    // Modal state
    showCreateSheet,
    isCreating,
    newRecord,
    currentRecord,
    dateFieldValue,
    editBusinessDayInfo,

    // Business day handlers
    handleEditBusinessDayChange,
    handleCreateBusinessDayChange,

    // Record operations
    handleEditRecord,
    handleDeleteRecord,

    // Sheet operations
    openCreateSheet,
    setTransactionType,
    saveCreateSheet,
    closeSheet,

    // Validated form handlers
    handleValidatedCreate,
    handleValidatedEdit,

    // Submission state (for UI feedback)
    isSubmittingCreate,
    isSubmittingEdit,

    // CSV Import
    handleImport,

    // Utilities
    formatMonthDisplayName,
    getEditRecurrenceOccurrences,
    getEditRecurrenceDescription,
  };
}
