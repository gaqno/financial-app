import { watch } from 'vue';
import { useFinanceStore } from '../../../stores/financeStore';
import { storeToRefs } from 'pinia';
import { useRecurrenceHelpers } from '../../../composables/finance/useRecurrenceHelpers';

export function useFinanceFormSubmission(
  transactionForm: any,
  editForm: any,
  validation: any,
  editRecurrence: any,
  callbacks: {
    onSheetClosed: () => void;
  }
) {
  const financeStore = useFinanceStore();
  const { editingRecord } = storeToRefs(financeStore);
  const { generateRecurringRecordsForEdit } = useRecurrenceHelpers();

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

  // Validated form handlers
  const handleValidatedCreate = async () => {
    validation.showValidationErrors.value = true;

    if (!validation.isTransactionValid.value) {
      console.warn('❌ Formulário inválido, não é possível criar transação');
      return;
    }

    try {
      const transactionData = await transactionForm.submit();
      if (transactionData) {
        // ✅ RECURRENCE FIX: Check for recurrence before adding record
        if (editRecurrence.value.isActive) {
          console.log('🔄 [CREATE] Processing recurrence in handleValidatedCreate:', editRecurrence.value);

          // Create recurrence settings from validated form
          const recurrenceSettings = {
            frequency: editRecurrence.value.frequency,
            endDate:
              editRecurrence.value.endDate ||
              new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split('T')[0],
            isActive: true,
          };

          console.log('🔄 [CREATE] Recurrence settings:', recurrenceSettings);

          // Generate all recurring records
          const recordsToAdd = generateRecurringRecordsForEdit(transactionData, recurrenceSettings);
          console.log('🔄 [CREATE] Generated recurring records:', recordsToAdd.length);

          // Use batch insert for multiple records
          await financeStore.addRecordsBatch(recordsToAdd);
        } else {
          // Add single record (no recurrence)
          await financeStore.addRecord(transactionData);
        }

        transactionForm.reset();
        validation.showValidationErrors.value = false;
        callbacks.onSheetClosed();
      }
    } catch (error) {
      console.error('❌ Erro ao criar transação:', error);
      alert('Erro ao criar transação. Verifique os dados e tente novamente.');
    }
  };

  const handleValidatedEdit = async () => {
    validation.showValidationErrors.value = true;

    if (!validation.isEditValid.value) {
      console.warn('❌ Formulário de edição inválido, não é possível salvar');
      return;
    }

    try {
      // ✅ BUG FIX: Sync editForm data to store's editingRecord before saving
      if (editingRecord.value) {
        editingRecord.value.Data = editForm.fields.data?.value || editingRecord.value.Data;
        editingRecord.value.Descrição = editForm.fields.descricao?.value || editingRecord.value.Descrição;
        editingRecord.value.Valor = editForm.fields.valor?.value || editingRecord.value.Valor;
        editingRecord.value.Tipo = editForm.fields.tipo?.value || editingRecord.value.Tipo;
        editingRecord.value.Categoria = editForm.fields.categoria?.value || editingRecord.value.Categoria;
        editingRecord.value.Status = editForm.fields.status?.value || editingRecord.value.Status;

        console.log('🔄 [EDIT_SYNC] Synced editForm data to store editingRecord:', editingRecord.value);
      }

      // Sync recurrence settings from editRecurrence to store's editRecurrence
      if (editRecurrence.value) {
        // Get recurrence state from the reactive editRecurrence ref
        console.log('🔄 [EDIT_RECURRENCE] Current editRecurrence state:', editRecurrence.value);
      }

      // Use store's saveEdit function that handles recurrence properly
      const success = await financeStore.saveEdit();

      if (success) {
        validation.showValidationErrors.value = false;
        console.log('✅ [EDIT] Record saved successfully');
      } else {
        console.error('❌ [EDIT] Failed to save record');
      }
    } catch (error) {
      console.error('❌ Erro ao editar transação:', error);
      alert('Erro ao editar transação. Verifique os dados e tente novamente.');
    }
  };

  return {
    // Methods
    handleValidatedCreate,
    handleValidatedEdit,
  };
}
