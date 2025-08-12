import { ref, reactive, computed, nextTick } from 'vue'
import { useFinanceStore } from '../../stores/financeStore'
import { useCategoryDetection } from '../useCategoryDetection'
import { useRecurrence } from '../useRecurrence'
import type { IFinanceRecord, IRecurrenceFrequency } from '../../types/finance'

export function useFinanceForms() {
  const financeStore = useFinanceStore()
  const { detectCategory } = useCategoryDetection()
  const recurrence = useRecurrence()

  // Default record template
  const getDefaultRecord = (): Omit<IFinanceRecord, 'Saldo'> => ({
    Data: new Date().toISOString().split('T')[0],
    Descrição: '',
    Valor: 0,
    Tipo: 'Receita',
    Status: '❌',
    Categoria: ''
  })

  // Form state
  const newRecord = ref<Omit<IFinanceRecord, 'Saldo'>>(getDefaultRecord())
  const editingRecord = ref<IFinanceRecord | null>(null)
  const originalEditIndex = ref<number>(-1)
  const isMultipleMode = ref<boolean>(false)
  const multipleRecords = ref<Omit<IFinanceRecord, 'Saldo'>[]>([])

  // Edit recurrence state
  const editRecurrence = reactive({
    isActive: false,
    frequency: 'mensal' as IRecurrenceFrequency,
    endDate: ''
  })

  // Existing recurrence warning
  const existingRecurrenceWarning = ref<{
    description: string
    frequency: string
    originalRecord?: any
  } | null>(null)

  // Form validation
  const isNewRecordValid = computed(() => {
    return !!(
      newRecord.value.Data &&
      newRecord.value.Descrição &&
      newRecord.value.Valor !== 0
    )
  })

  const isEditRecordValid = computed(() => {
    return !!(
      editingRecord.value?.Data &&
      editingRecord.value?.Descrição &&
      editingRecord.value?.Valor !== 0
    )
  })

  // Form actions
  const resetNewRecord = () => {
    newRecord.value = getDefaultRecord()
  }

  const resetEditRecord = () => {
    editingRecord.value = null
    originalEditIndex.value = -1
    editRecurrence.isActive = false
    editRecurrence.frequency = 'mensal'
    editRecurrence.endDate = ''
  }

  const onDescriptionChange = () => {
    if (newRecord.value.Descrição && !newRecord.value.Categoria) {
      const detectedCategory = detectCategory(newRecord.value.Descrição)
      if (detectedCategory && detectedCategory !== 'Outros') {
        newRecord.value.Categoria = detectedCategory
      }
    }
  }

  const onEditDescriptionChange = () => {
    if (editingRecord.value?.Descrição && !editingRecord.value.Categoria) {
      const detectedCategory = detectCategory(editingRecord.value.Descrição)
      if (detectedCategory && detectedCategory !== 'Outros') {
        editingRecord.value.Categoria = detectedCategory
      }
    }
  }

  const onCategoryChange = () => {
    // Reset auto-detection when user manually selects category
    console.log('🔄 [FORM] Category manually changed:', newRecord.value.Categoria)
  }

  // Handle form submission
  const handleAdd = async () => {
    if (!isNewRecordValid.value) return

    try {
      const categoria = newRecord.value.Categoria || detectCategory(newRecord.value.Descrição)

      const recordToAdd = {
        ...newRecord.value,
        Categoria: categoria
      }

      console.log('📝 [FORM] Adding new record:', recordToAdd)

      if (recurrence.isRecurring.value && recurrence.recurrenceSettings.value.isActive) {
        // Generate recurring records
        const recordsToAdd = recurrence.generateRecurringRecords(recordToAdd)
        console.log('🔄 [FORM] Generated recurring records:', recordsToAdd.length)

        recordsToAdd.forEach(record => {
          financeStore.addRecord(record)
        })
      } else {
        // Add single record
        financeStore.addRecord(recordToAdd)
      }

      resetNewRecord()

      // Clear recurrence after adding
      recurrence.clearRecurrenceData()

    } catch (error) {
      console.error('❌ [FORM] Error adding record:', error)
    }
  }

  // Multiple records functionality
  const addMultipleRecord = () => {
    if (!isNewRecordValid.value) return

    const categoria = newRecord.value.Categoria || detectCategory(newRecord.value.Descrição)

    const recordToAdd = {
      ...newRecord.value,
      Categoria: categoria
    }

    multipleRecords.value.push(recordToAdd)
    console.log('📝 [FORM] Added to multiple records list:', recordToAdd)

    // Reset form but keep some values for convenience
    const currentDate = newRecord.value.Data
    const currentTipo = newRecord.value.Tipo
    const currentStatus = newRecord.value.Status

    resetNewRecord()

    // Restore convenient values
    newRecord.value.Data = currentDate
    newRecord.value.Tipo = currentTipo
    newRecord.value.Status = currentStatus
  }

  const removeMultipleRecord = (index: number) => {
    multipleRecords.value.splice(index, 1)
    console.log('🗑️ [FORM] Removed multiple record at index:', index)
  }

  const saveAllMultipleRecords = async () => {
    try {
      console.log('💾 [FORM] Saving all multiple records:', multipleRecords.value.length)

      for (const record of multipleRecords.value) {
        financeStore.addRecord(record)
      }

      clearMultipleRecords()
      isMultipleMode.value = false

    } catch (error) {
      console.error('❌ [FORM] Error saving multiple records:', error)
    }
  }

  const clearMultipleRecords = () => {
    multipleRecords.value = []
    console.log('🧹 [FORM] Cleared multiple records list')
  }

  // Edit functionality
  const openEditSheet = (record: IFinanceRecord, index: number) => {
    editingRecord.value = { ...record }
    originalEditIndex.value = index

    // Load existing recurrence settings
    if (record.recurrence && record.recurrence.isActive) {
      console.log('📄 [FORM] Loading existing recurrence settings:', record.recurrence)
      editRecurrence.isActive = true
      editRecurrence.frequency = record.recurrence.frequency
      editRecurrence.endDate = record.recurrence.endDate
    } else {
      console.log('📄 [FORM] No existing recurrence found, setting defaults')
      editRecurrence.isActive = false
      editRecurrence.frequency = 'mensal'
      editRecurrence.endDate = ''
    }

    console.log('✏️ [FORM] Opened edit sheet for record:', record)
  }

  const closeEditSheet = () => {
    resetEditRecord()
    existingRecurrenceWarning.value = null
    console.log('❌ [FORM] Closed edit sheet')
  }

  const saveEditSheet = async () => {
    if (!editingRecord.value || !isEditRecordValid.value) return

    try {
      const updatedRecord = {
        ...editingRecord.value,
        recurrence: editRecurrence.isActive ? {
          frequency: editRecurrence.frequency,
          endDate: editRecurrence.endDate,
          isActive: true
        } : undefined
      }

      console.log('💾 [FORM] Saving edited record:', updatedRecord)

      const success = financeStore.updateRecord(originalEditIndex.value, updatedRecord)

      if (success) {
        console.log('✅ [FORM] Record updated successfully')
        closeEditSheet()
      } else {
        console.error('❌ [FORM] Failed to update record')
      }

    } catch (error) {
      console.error('❌ [FORM] Error saving edit:', error)
    }
  }

  // Toggle multiple mode
  const toggleMultipleMode = () => {
    isMultipleMode.value = !isMultipleMode.value

    if (isMultipleMode.value) {
      resetNewRecord()
      console.log('🔀 [FORM] Enabled multiple mode')
    } else {
      clearMultipleRecords()
      console.log('🔀 [FORM] Disabled multiple mode')
    }
  }

  return {
    // State
    newRecord,
    editingRecord,
    originalEditIndex,
    isMultipleMode,
    multipleRecords,
    editRecurrence,
    existingRecurrenceWarning,

    // Computed
    isNewRecordValid,
    isEditRecordValid,

    // Actions
    resetNewRecord,
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
    saveEditSheet
  }
} 