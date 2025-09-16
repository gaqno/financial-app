import { ref, reactive, computed, nextTick } from 'vue';
import { useFinanceStore } from '../../stores/financeStore';
import { useCategoryDetection } from '../useCategoryDetection';
import { useRecurrence } from '../useRecurrence';
import { useDarkMode } from '../useDarkMode';
import { useToast } from '../useToast';
import type { IFinanceRecord, IRecurrenceFrequency } from '../../types/finance';

export function useFinanceForms() {
  const financeStore = useFinanceStore();
  const { detectCategory } = useCategoryDetection();
  const recurrence = useRecurrence();
  const { isDarkMode, themeClass } = useDarkMode();
  const toast = useToast();

  // Default record template
  const getDefaultRecord = (): IFinanceRecord => ({
    Data: new Date().toISOString().split('T')[0],
    Descrição: '',
    Valor: 0,
    Tipo: 'Receita',
    Status: '❌',
    Categoria: '',
  });

  // Form state
  const newRecord = ref<IFinanceRecord>(getDefaultRecord());
  const editingRecord = ref<IFinanceRecord | null>(null);
  const originalEditIndex = ref<number>(-1);
  const isMultipleMode = ref<boolean>(false);
  const multipleRecords = ref<IFinanceRecord[]>([]);

  // Enhanced loading states for better UX
  const isAdding = ref<boolean>(false);
  const isSavingMultiple = ref<boolean>(false);
  const isValidatingForm = ref<boolean>(false);
  const isSavingEdit = ref<boolean>(false);

  // Form validation feedback
  const showValidationErrors = ref<boolean>(false);
  const formErrors = ref<Record<string, string>>({});

  // Dark mode aware form styling
  const formClasses = computed(() => ({
    container: isDarkMode.value ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200',
    input: isDarkMode.value
      ? 'bg-gray-700 border-gray-600 text-gray-100 placeholder-gray-400 focus:border-blue-500 focus:ring-blue-500'
      : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:border-blue-500 focus:ring-blue-500',
    select: isDarkMode.value
      ? 'bg-gray-700 border-gray-600 text-gray-100 focus:border-blue-500 focus:ring-blue-500'
      : 'bg-white border-gray-300 text-gray-900 focus:border-blue-500 focus:ring-blue-500',
    label: isDarkMode.value ? 'text-gray-200 font-medium' : 'text-gray-700 font-medium',
    error: isDarkMode.value ? 'text-red-400 bg-red-900/20 border-red-800' : 'text-red-600 bg-red-50 border-red-200',
    success: isDarkMode.value
      ? 'text-green-400 bg-green-900/20 border-green-800'
      : 'text-green-600 bg-green-50 border-green-200',
    button: {
      primary: isDarkMode.value
        ? 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500 text-white disabled:bg-gray-600'
        : 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500 text-white disabled:bg-gray-400',
      secondary: isDarkMode.value
        ? 'bg-gray-700 hover:bg-gray-600 focus:ring-gray-500 text-gray-200 border-gray-600'
        : 'bg-gray-100 hover:bg-gray-200 focus:ring-gray-500 text-gray-900 border-gray-300',
    },
  }));

  // Edit recurrence state
  const editRecurrence = reactive({
    isActive: false,
    frequency: 'mensal' as IRecurrenceFrequency,
    endDate: '',
  });

  // Existing recurrence warning
  const existingRecurrenceWarning = ref<{
    description: string;
    frequency: string;
    originalRecord?: any;
  } | null>(null);

  // Enhanced form validation with detailed error messages
  const validateNewRecord = () => {
    const errors: Record<string, string> = {};

    if (!newRecord.value.Data) {
      errors.Data = 'Data é obrigatória';
    }

    if (!newRecord.value.Descrição.trim()) {
      errors.Descrição = 'Descrição é obrigatória';
    } else if (newRecord.value.Descrição.length > 100) {
      errors.Descrição = 'Descrição deve ter no máximo 100 caracteres';
    }

    if (newRecord.value.Valor === 0) {
      errors.Valor = 'Valor deve ser diferente de zero';
    } else if (isNaN(newRecord.value.Valor)) {
      errors.Valor = 'Valor deve ser um número válido';
    }

    if (!newRecord.value.Tipo) {
      errors.Tipo = 'Tipo é obrigatório';
    }

    formErrors.value = errors;
    return Object.keys(errors).length === 0;
  };

  const validateEditRecord = () => {
    if (!editingRecord.value) return false;

    const errors: Record<string, string> = {};

    if (!editingRecord.value.Data) {
      errors.Data = 'Data é obrigatória';
    }

    if (!editingRecord.value.Descrição.trim()) {
      errors.Descrição = 'Descrição é obrigatória';
    } else if (editingRecord.value.Descrição.length > 100) {
      errors.Descrição = 'Descrição deve ter no máximo 100 caracteres';
    }

    if (editingRecord.value.Valor === 0) {
      errors.Valor = 'Valor deve ser diferente de zero';
    } else if (isNaN(editingRecord.value.Valor)) {
      errors.Valor = 'Valor deve ser um número válido';
    }

    formErrors.value = errors;
    return Object.keys(errors).length === 0;
  };

  const isNewRecordValid = computed(() => {
    return !!(
      newRecord.value.Data &&
      newRecord.value.Descrição &&
      newRecord.value.Valor !== 0 &&
      Object.keys(formErrors.value).length === 0
    );
  });

  const isEditRecordValid = computed(() => {
    return !!(
      editingRecord.value?.Data &&
      editingRecord.value?.Descrição &&
      editingRecord.value?.Valor !== 0 &&
      Object.keys(formErrors.value).length === 0
    );
  });

  const getFieldError = (fieldName: string): string | null => {
    return formErrors.value[fieldName] || null;
  };

  const clearFieldError = (fieldName: string) => {
    if (formErrors.value[fieldName]) {
      delete formErrors.value[fieldName];
      formErrors.value = { ...formErrors.value };
    }
  };

  // Form actions
  const resetNewRecord = () => {
    newRecord.value = getDefaultRecord();
  };

  // Pre-set form values
  const setNewRecordType = (tipo: 'Receita' | 'Despesa') => {
    newRecord.value.Tipo = tipo;
  };

  const resetEditRecord = () => {
    editingRecord.value = null;
    originalEditIndex.value = -1;
    editRecurrence.isActive = false;
    editRecurrence.frequency = 'mensal';
    editRecurrence.endDate = '';
  };

  const onDescriptionChange = () => {
    if (newRecord.value.Descrição && !newRecord.value.Categoria) {
      const detectedCategory = detectCategory(newRecord.value.Descrição);
      if (detectedCategory && detectedCategory !== 'Outros') {
        newRecord.value.Categoria = detectedCategory;
      }
    }
  };

  const onEditDescriptionChange = () => {
    if (editingRecord.value?.Descrição && !editingRecord.value.Categoria) {
      const detectedCategory = detectCategory(editingRecord.value.Descrição);
      if (detectedCategory && detectedCategory !== 'Outros') {
        editingRecord.value.Categoria = detectedCategory;
      }
    }
  };

  const onCategoryChange = () => {
    // Reset auto-detection when user manually selects category
  };

  // Enhanced form submission with validation and UX feedback
  const handleAdd = async () => {
    if (isAdding.value) return;

    // Clear previous errors and validate
    formErrors.value = {};
    showValidationErrors.value = true;

    if (!validateNewRecord()) {
      toast.warning('Por favor, corrija os erros no formulário', {
        title: '⚠️ Formulário Inválido',
        duration: 3000,
      });
      return;
    }

    isAdding.value = true;
    isValidatingForm.value = true;

    try {
      const categoria = newRecord.value.Categoria || detectCategory(newRecord.value.Descrição);

      const recordToAdd = {
        ...newRecord.value,
        Categoria: categoria,
      };

      if (recurrence.isRecurring.value && recurrence.recurrenceSettings.value.isActive) {
        // Generate recurring records
        const recordsToAdd = recurrence.generateRecurringRecords(recordToAdd);

        toast.info(`Gerando ${recordsToAdd.length} registros recorrentes...`, {
          title: '🔄 Processando Recorrência',
          duration: 2000,
        });

        // Use batch insert for multiple records
        await financeStore.addRecordsBatch(recordsToAdd);

        const recordType = recordToAdd.Tipo === 'Receita' ? '💰 Receitas' : '💸 Despesas';
        const formattedValue = Math.abs(recordToAdd.Valor).toLocaleString('pt-BR', {
          style: 'currency',
          currency: 'BRL',
        });

        toast.success(
          `${recordsToAdd.length} ${recordType.toLowerCase()} recorrentes criadas (${formattedValue} cada)`,
          {
            title: '✅ Recorrência Criada',
            duration: 4000,
          }
        );
      } else {
        // Add single record
        await financeStore.addRecord(recordToAdd);

        const recordType = recordToAdd.Tipo === 'Receita' ? '💰 Receita' : '💸 Despesa';
        const formattedValue = Math.abs(recordToAdd.Valor).toLocaleString('pt-BR', {
          style: 'currency',
          currency: 'BRL',
        });

        toast.success(`${recordType} adicionada: ${recordToAdd.Descrição} (${formattedValue})`, {
          title: '✅ Registro Criado',
          duration: 3000,
        });
      }

      resetNewRecord();
      formErrors.value = {};
      showValidationErrors.value = false;

      // Clear recurrence after adding
      recurrence.clearRecurrenceData();
    } catch (error) {
      console.error('❌ [FORM] Error adding record:', error);
      toast.error('Erro inesperado ao salvar registro. Tente novamente.', {
        title: '❌ Erro ao Salvar',
        duration: 4000,
      });
    } finally {
      isAdding.value = false;
      isValidatingForm.value = false;
    }
  };

  // Enhanced multiple records functionality
  const addMultipleRecord = () => {
    // Validate before adding
    if (!validateNewRecord()) {
      toast.warning('Corrija os erros antes de adicionar o registro', {
        title: '⚠️ Formulário Inválido',
        duration: 3000,
      });
      return;
    }

    const categoria = newRecord.value.Categoria || detectCategory(newRecord.value.Descrição);

    const recordToAdd = {
      ...newRecord.value,
      Categoria: categoria,
    };

    multipleRecords.value.push(recordToAdd);

    const recordType = recordToAdd.Tipo === 'Receita' ? '💰' : '💸';
    const formattedValue = Math.abs(recordToAdd.Valor).toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    });

    toast.success(`${recordType} ${recordToAdd.Descrição} (${formattedValue}) adicionado à lista`, {
      title: `📝 Registro ${multipleRecords.value.length} Adicionado`,
      duration: 2000,
    });

    // Reset form but keep some values for convenience
    const currentDate = newRecord.value.Data;
    const currentTipo = newRecord.value.Tipo;
    const currentStatus = newRecord.value.Status;

    resetNewRecord();
    formErrors.value = {};

    // Restore convenient values
    newRecord.value.Data = currentDate;
    newRecord.value.Tipo = currentTipo;
    newRecord.value.Status = currentStatus;
  };

  const removeMultipleRecord = (index: number) => {
    multipleRecords.value.splice(index, 1);
  };

  const saveAllMultipleRecords = async () => {
    if (isSavingMultiple.value || multipleRecords.value.length === 0) return;

    isSavingMultiple.value = true;

    try {
      toast.info(`Salvando ${multipleRecords.value.length} registros...`, {
        title: '💾 Salvando Registros',
        duration: 2000,
      });

      // Use batch insert for better performance
      await financeStore.addRecordsBatch(multipleRecords.value);

      const totalValue = multipleRecords.value.reduce((sum, record) => sum + Math.abs(record.Valor), 0);
      const formattedTotal = totalValue.toLocaleString('pt-BR', {
        style: 'currency',
        currency: 'BRL',
      });

      toast.success(`${multipleRecords.value.length} registros salvos com sucesso! Total: ${formattedTotal}`, {
        title: '✅ Registros Salvos',
        duration: 4000,
      });

      clearMultipleRecords();
      isMultipleMode.value = false;
    } catch (error) {
      console.error('❌ [FORM] Error saving multiple records:', error);
      toast.error('Erro ao salvar registros múltiplos. Tente novamente.', {
        title: '❌ Erro ao Salvar',
        duration: 4000,
      });
    } finally {
      isSavingMultiple.value = false;
    }
  };

  const clearMultipleRecords = () => {
    multipleRecords.value = [];
  };

  // Edit functionality
  const openEditSheet = (record: IFinanceRecord, index: number) => {
    editingRecord.value = { ...record };
    originalEditIndex.value = index;

    // Load existing recurrence settings
    if (record.recurrence && record.recurrence.isActive) {
      editRecurrence.isActive = true;
      editRecurrence.frequency = record.recurrence.frequency;
      editRecurrence.endDate = record.recurrence.endDate;
    } else {
      editRecurrence.isActive = false;
      editRecurrence.frequency = 'mensal';
      editRecurrence.endDate = '';
    }
  };

  const closeEditSheet = () => {
    resetEditRecord();
    existingRecurrenceWarning.value = null;
  };

  const saveEditSheet = async () => {
    if (!editingRecord.value || isSavingEdit.value) return;

    // Validate edit form
    if (!validateEditRecord()) {
      toast.warning('Corrija os erros no formulário antes de salvar', {
        title: '⚠️ Formulário Inválido',
        duration: 3000,
      });
      return;
    }

    isSavingEdit.value = true;

    try {
      // Update the editing record with recurrence settings
      if (editRecurrence.isActive) {
        editingRecord.value.recurrence = {
          frequency: editRecurrence.frequency,
          endDate: editRecurrence.endDate,
          isActive: true,
        };
      } else {
        // Remove recurrence if disabled
        delete editingRecord.value.recurrence;
      }

      toast.info('Salvando alterações...', {
        title: '💾 Salvando',
        duration: 1500,
      });

      // Use saveEdit instead of updateRecord for proper recurrence handling
      const success = await financeStore.saveEdit();

      if (success) {
        const recordType = editingRecord.value.Tipo === 'Receita' ? '💰 Receita' : '💸 Despesa';
        const formattedValue = Math.abs(editingRecord.value.Valor).toLocaleString('pt-BR', {
          style: 'currency',
          currency: 'BRL',
        });

        toast.success(`${recordType} atualizada: ${editingRecord.value.Descrição} (${formattedValue})`, {
          title: '✅ Registro Atualizado',
          duration: 3000,
        });

        closeEditSheet();
      } else {
        toast.error('Falha ao atualizar o registro. Tente novamente.', {
          title: '❌ Erro na Atualização',
          duration: 4000,
        });
      }
    } catch (error) {
      console.error('❌ [FORM] Error saving edit:', error);
      toast.error('Erro inesperado ao salvar alterações.', {
        title: '❌ Erro Interno',
        duration: 4000,
      });
    } finally {
      isSavingEdit.value = false;
    }
  };

  // Toggle multiple mode
  const toggleMultipleMode = () => {
    isMultipleMode.value = !isMultipleMode.value;

    if (isMultipleMode.value) {
      resetNewRecord();
    } else {
      clearMultipleRecords();
    }
  };

  return {
    // State
    newRecord,
    editingRecord,
    originalEditIndex,
    isMultipleMode,
    multipleRecords,
    editRecurrence,
    existingRecurrenceWarning,

    // Enhanced loading states
    isAdding,
    isSavingMultiple,
    isValidatingForm,
    isSavingEdit,

    // Form validation
    formErrors,
    showValidationErrors,
    validateNewRecord,
    validateEditRecord,
    getFieldError,
    clearFieldError,

    // Computed
    isNewRecordValid,
    isEditRecordValid,

    // Dark mode and styling
    isDarkMode,
    themeClass,
    formClasses,

    // Enhanced toast system
    toast,

    // Actions
    resetNewRecord,
    setNewRecordType,
    resetEditRecord,
    onDescriptionChange,
    onEditDescriptionChange,
    onCategoryChange,
    handleAdd,

    // Multiple records
    addMultipleRecord,
    removeMultipleRecord,
    saveAllMultipleRecords,
    clearMultipleRecords,
    toggleMultipleMode,

    // Edit functionality
    openEditSheet,
    closeEditSheet,
    saveEditSheet,
  };
}
