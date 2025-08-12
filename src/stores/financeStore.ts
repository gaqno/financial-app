import { defineStore } from 'pinia'
import { ref, computed, reactive } from 'vue'
import { useLocalStorage } from '../composables/useLocalStorage'
import { useRecurrence } from '../composables/useRecurrence'
import { useBusinessDays } from '../composables/finance/useBusinessDays'
import { useAutoCorrection } from '../composables/finance/useAutoCorrection'
import { useRecurrenceHelpers } from '../composables/finance/useRecurrenceHelpers'
import type { IFinanceRecord, IFinanceFormData, IRecurrence, IFilter } from '../types/finance'
import { financeRecordSchema } from '../types/finance'

type SortField = 'Data' | 'Descrição' | 'Valor' | 'Tipo' | 'Categoria' | 'Status'
type SortDirection = 'asc' | 'desc'

interface IFinanceState {
  records: IFinanceRecord[]
  hiddenMonths: Set<string>
  filters: {
    filter: IFilter
    categoryFilter: string
    sortField: SortField
    sortDirection: SortDirection
  }
  editingItems: Set<number>
  formErrors: Record<string, string>
}

interface IStorageState {
  records: IFinanceRecord[]
  hiddenMonths: string[]
  filters: {
    filter: IFilter
    categoryFilter: string
    sortField: SortField
    sortDirection: SortDirection
  }
}

export const useFinanceStore = defineStore('finance', () => {
  // ===========================================
  // STATE
  // ===========================================

  const records = ref<IFinanceRecord[]>([])
  const hiddenMonths = ref<Set<string>>(new Set())
  const editingItems = ref<Set<number>>(new Set())
  const formErrors = ref<Record<string, string>>({})

  // Modal states
  const showDeleteConfirm = ref<boolean>(false)
  const itemToDelete = ref<{ record: IFinanceRecord; index: number } | null>(null)
  const showEditSheet = ref<boolean>(false)
  const showUndoToast = ref<boolean>(false)
  const deletedItem = ref<{ record: IFinanceRecord; index: number; restoreData?: any } | null>(null)
  const undoTimeLeft = ref<number>(0)

  // Edit form states
  const editingRecord = ref<IFinanceRecord | null>(null)
  const originalEditIndex = ref<number>(-1)
  const editRecurrence = ref({
    isActive: false,
    frequency: 'mensal' as 'semanal' | 'quinzenal' | 'mensal' | 'trimestral',
    endDate: ''
  })

  // Import composables for extracted functionality
  const { correctFutureRecordsAfterEdit, removeRecurringRecordsBeyondDate, validateAndCorrectRecurringRecords } = useAutoCorrection()
  const { updateAllLinkedRecurringRecords, generateRecurringRecordsForEdit } = useRecurrenceHelpers()

  // Debug watchers (development only)
  if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
    import('vue').then(({ watch }) => {
      watch(showEditSheet, (newValue, oldValue) => {
        // Debug watcher for development
      })

      watch(editingRecord, (newValue, oldValue) => {
        // Debug watcher for development
      })
    })
  }

  const filters = ref({
    filter: 'all' as IFilter,
    categoryFilter: '',
    sortField: 'Data' as SortField,
    sortDirection: 'desc' as SortDirection
  })

  // ===========================================
  // PERSISTENCE
  // ===========================================

  const STORAGE_KEY = 'financeData'
  const HIDDEN_MONTHS_KEY = `${STORAGE_KEY}_hiddenMonths`
  const FILTERS_KEY = `${STORAGE_KEY}_filters`

  const loadFromStorage = (): void => {
    try {
      // Load records
      const storedRecords = localStorage.getItem(STORAGE_KEY)
      if (storedRecords) {
        records.value = JSON.parse(storedRecords)
      }

      // Load hidden months
      const storedHiddenMonths = localStorage.getItem(HIDDEN_MONTHS_KEY)
      if (storedHiddenMonths) {
        hiddenMonths.value = new Set(JSON.parse(storedHiddenMonths))
      }

      // Load filters
      const storedFilters = localStorage.getItem(FILTERS_KEY)
      if (storedFilters) {
        filters.value = { ...filters.value, ...JSON.parse(storedFilters) }
      }
    } catch (error) {
      // Error loading data from storage - silent in production
    }
  }

  const saveToStorage = (): void => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(records.value))
      localStorage.setItem(HIDDEN_MONTHS_KEY, JSON.stringify(Array.from(hiddenMonths.value)))
      localStorage.setItem(FILTERS_KEY, JSON.stringify(filters.value))
    } catch (error) {
      // Error saving data to storage - silent in production
    }
  }

  // ===========================================
  // COMPUTED PROPERTIES
  // ===========================================

  const sortedData = computed(() => {
    // Filter records based on smart projection ONLY for DISPLAY
    const smartVisibleRecords = records.value.filter(item => {
      const date = new Date(item.Data)
      const monthKey = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`

      // Only include if in smart projection
      return isMonthInSmartProjection(monthKey)
    })

    // FIXED: Calculate running totals chronologically using ALL records, not just visible ones
    // This ensures the balance calculation is always accurate regardless of projection settings
    const allRecordsChronological = [...records.value].sort((a, b) => {
      return new Date(a.Data).getTime() - new Date(b.Data).getTime()
    })

    // Calculate running balance considering ALL records chronologically
    let runningTotal = 0
    const balanceMap = new Map<string, number>()

    allRecordsChronological.forEach(item => {
      // FIXED: Only include completed transactions (✔️) in running balance
      if (item.Status === '✔️') {
        runningTotal += item.Valor
      }
      // Store the balance for this record (using a unique key based on date + description + value)
      const recordKey = `${item.Data}_${item.Descrição}_${item.Valor}`
      balanceMap.set(recordKey, runningTotal)
    })

    // Apply the calculated balances to visible records only
    const recordsWithSaldo = smartVisibleRecords.map(item => {
      const recordKey = `${item.Data}_${item.Descrição}_${item.Valor}`
      const calculatedSaldo = balanceMap.get(recordKey) || 0
      return { ...item, Saldo: calculatedSaldo }
    })

    // Sort according to user preferences for display
    return recordsWithSaldo.sort((a, b) => {
      let aValue: any = a[filters.value.sortField]
      let bValue: any = b[filters.value.sortField]

      if (filters.value.sortField === 'Data') {
        aValue = new Date(aValue).getTime()
        bValue = new Date(bValue).getTime()
      }

      if (typeof aValue === 'string' && typeof bValue === 'string') {
        aValue = aValue.toLowerCase()
        bValue = bValue.toLowerCase()
      }

      const comparison = aValue < bValue ? -1 : aValue > bValue ? 1 : 0
      return filters.value.sortDirection === 'desc' ? -comparison : comparison
    })
  })

  const filteredData = computed(() => {
    return sortedData.value.filter(item => {
      // Type filter
      if (filters.value.filter !== 'all' && item.Tipo !== filters.value.filter) {
        return false
      }

      // Category filter
      if (filters.value.categoryFilter &&
        !item.Categoria?.toLowerCase().includes(filters.value.categoryFilter.toLowerCase())) {
        return false
      }

      return true
    })
  })

  const groupedByMonth = computed(() => {
    const grouped: Record<string, IFinanceRecord[]> = {}

    filteredData.value.forEach(item => {
      const date = new Date(item.Data)
      const monthKey = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`

      if (!grouped[monthKey]) {
        grouped[monthKey] = []
      }
      grouped[monthKey].push(item)
    })

    // Sort months in smart projection order (current month first, then chronological)
    const currentMonthKey = getCurrentMonthKey()
    const visibleMonthKeys = Array.from(getSmartVisibleMonths.value)

    // Sort visible month keys chronologically from current month forward
    const sortedKeys = visibleMonthKeys.sort((a, b) => {
      const dateA = new Date(a + '-01')
      const dateB = new Date(b + '-01')
      const currentDate = new Date(currentMonthKey + '-01')

      // Current month first, then ascending chronological order
      if (a === currentMonthKey) return -1
      if (b === currentMonthKey) return 1

      return dateA.getTime() - dateB.getTime()
    })

    // Create ordered result with only months that have data
    const result: Record<string, IFinanceRecord[]> = {}
    sortedKeys.forEach(key => {
      if (grouped[key]) {
        result[key] = grouped[key]
      }
    })

    return result
  })

  // Balance calculations - FIXED: Only completed transactions should count toward final balance
  const saldoFinal = computed(() => {
    return filteredData.value
      .filter(item => item.Status === '✔️') // Only completed transactions
      .reduce((total, item) => total + item.Valor, 0)
  })

  // Additional balance breakdowns
  const saldoPendente = computed(() => {
    return Math.abs(filteredData.value
      .filter(item => item.Status === '❌' && item.Tipo === 'Despesa') // Only pending expenses
      .reduce((total, item) => total + item.Valor, 0)) // Math.abs to get positive value
  })

  const saldoCompleto = computed(() => {
    return filteredData.value.reduce((total, item) => total + item.Valor, 0) // All transactions
  })

  // ===========================================
  // ACTIONS - SMART MONTH PROJECTION
  // ===========================================

  // Smart month projection settings (SIMPLIFIED)
  const projectionSettings = ref({
    includePastMonths: 0,    // Por padrão: sem meses passados
    includeFutureMonths: 3,  // Próximos 3 meses por padrão
    maxFutureMonths: 12      // Máximo 12 meses no futuro
  })

  const getCurrentMonthKey = (): string => {
    const now = new Date()
    return `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}`
  }

  const getSmartVisibleMonths = computed(() => {
    const currentMonthKey = getCurrentMonthKey()
    const [currentYear, currentMonth] = currentMonthKey.split('-').map(Number)
    const visibleMonthKeys = new Set<string>()

    // Add current month (always visible)
    visibleMonthKeys.add(currentMonthKey)

    // Add past months (only if enabled)
    if (projectionSettings.value.includePastMonths > 0) {
      for (let i = 1; i <= projectionSettings.value.includePastMonths; i++) {
        const pastDate = new Date(currentYear, currentMonth - 1 - i, 1)
        const pastKey = `${pastDate.getFullYear()}-${(pastDate.getMonth() + 1).toString().padStart(2, '0')}`
        visibleMonthKeys.add(pastKey)
      }
    }

    // Add future months
    for (let i = 1; i <= projectionSettings.value.includeFutureMonths; i++) {
      const futureDate = new Date(currentYear, currentMonth - 1 + i, 1)
      const futureKey = `${futureDate.getFullYear()}-${(futureDate.getMonth() + 1).toString().padStart(2, '0')}`
      visibleMonthKeys.add(futureKey)
    }

    return visibleMonthKeys
  })

  const isMonthInSmartProjection = (monthKey: string): boolean => {
    return getSmartVisibleMonths.value.has(monthKey)
  }

  // SIMPLIFIED projection updates
  const updateProjectionSettings = (settings: { includePastMonths: number; includeFutureMonths: number }): void => {
    projectionSettings.value.includePastMonths = Math.max(0, Math.min(6, settings.includePastMonths))
    projectionSettings.value.includeFutureMonths = Math.max(1, Math.min(12, settings.includeFutureMonths))
    saveToStorage()
  }

  // ===========================================
  // ACTIONS - RECURRENCE CLEANUP
  // ===========================================

  const cleanInvalidRecurrences = (): void => {
    const cleanedRecords = records.value.filter(record => {
      // If record has no recurrence, keep it
      if (!record.recurrence) return true;

      // If no end date, keep it
      if (!record.recurrence.endDate) return true;

      // Parse end date properly
      let endDate: Date;
      const endDateStr = record.recurrence.endDate;

      if (endDateStr.match(/^\d{4}-\d{2}-\d{2}$/)) {
        const [year, month, day] = endDateStr.split('-').map(Number);
        endDate = new Date(year, month - 1, day); // month is 0-based
      } else {
        endDate = new Date(endDateStr);
      }

      // Parse record date properly
      let recordDate: Date;
      const recordDateStr = record.Data;

      if (recordDateStr.match(/^\d{4}-\d{2}-\d{2}$/)) {
        const [year, month, day] = recordDateStr.split('-').map(Number);
        recordDate = new Date(year, month - 1, day); // month is 0-based
      } else {
        recordDate = new Date(recordDateStr);
      }

      // Keep record if it's on or before the end date
      const shouldKeep = recordDate <= endDate;

      if (!shouldKeep) {
        console.log('🧹 [CLEANUP] Removing invalid recurrence record:', {
          description: record.Descrição,
          date: record.Data,
          endDate: record.recurrence.endDate,
          reason: 'Record date is after end date'
        });
      }

      return shouldKeep;
    });

    const removedCount = records.value.length - cleanedRecords.length;
    if (removedCount > 0) {
      console.log(`🧹 [CLEANUP] Removed ${removedCount} invalid recurrence records`);
      records.value = cleanedRecords;
      saveToStorage();
    }
  };

  // ===========================================
  // ACTIONS - RECORD MANAGEMENT
  // ===========================================

  const addRecord = (recordData: IFinanceFormData): boolean => {
    try {
      const validatedRecord = financeRecordSchema.parse(recordData)
      records.value.push(validatedRecord)
      saveToStorage()
      return true
    } catch (error) {
      return false
    }
  }

  const updateRecord = (index: number, updatedData: Partial<IFinanceRecord>): boolean => {
    try {
      if (index < 0 || index >= records.value.length) {
        return false
      }

      const currentRecord = records.value[index]
      const mergedRecord = { ...currentRecord, ...updatedData }
      const validatedRecord = financeRecordSchema.parse(mergedRecord)

      records.value[index] = validatedRecord
      saveToStorage()
      return true
    } catch (error) {
      return false
    }
  }

  const removeRecord = (index: number): boolean => {
    try {
      if (index < 0 || index >= records.value.length) {
        return false
      }

      const newRecords = [...records.value]
      newRecords.splice(index, 1)
      records.value = newRecords
      saveToStorage()
      return true
    } catch (error) {
      return false
    }
  }

  const importRecords = (newRecords: IFinanceRecord[]): boolean => {
    try {
      const validatedRecords = newRecords.map(record => financeRecordSchema.parse(record))
      records.value.push(...validatedRecords)
      saveToStorage()
      return true
    } catch (error) {
      return false
    }
  }

  // ===========================================
  // ACTIONS - FILTER MANAGEMENT
  // ===========================================

  const setFilter = (filter: IFilter): void => {
    filters.value.filter = filter
    saveToStorage()
  }

  const setCategoryFilter = (category: string): void => {
    filters.value.categoryFilter = category
    saveToStorage()
  }

  const clearCategoryFilter = (): void => {
    filters.value.categoryFilter = ''
    saveToStorage()
  }

  const setSorting = (field: SortField, direction: SortDirection): void => {
    filters.value.sortField = field
    filters.value.sortDirection = direction
    saveToStorage()
  }

  // Legacy month visibility functions (kept for backward compatibility)
  const toggleMonthVisibility = (monthKey: string): void => {
    if (hiddenMonths.value.has(monthKey)) {
      hiddenMonths.value.delete(monthKey)
    } else {
      hiddenMonths.value.add(monthKey)
    }
    saveToStorage()
  }

  const hideMonth = (monthKey: string): void => {
    hiddenMonths.value.add(monthKey)
    saveToStorage()
  }

  const showMonth = (monthKey: string): void => {
    hiddenMonths.value.delete(monthKey)
    saveToStorage()
  }

  const showAllMonths = (): void => {
    hiddenMonths.value.clear()
    saveToStorage()
  }

  const hideAllMonths = (): void => {
    // Get all unique month keys from records
    const allMonthKeys = new Set<string>()
    records.value.forEach(item => {
      const date = new Date(item.Data)
      const monthKey = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`
      allMonthKeys.add(monthKey)
    })

    allMonthKeys.forEach(monthKey => {
      hiddenMonths.value.add(monthKey)
    })
    saveToStorage()
  }

  const isMonthHidden = (monthKey: string): boolean => {
    return hiddenMonths.value.has(monthKey)
  }

  const getHiddenMonthsCount = (): number => {
    return hiddenMonths.value.size
  }

  // ===========================================
  // ACTIONS - EDITING STATE
  // ===========================================

  const toggleEdit = (index: number): void => {
    if (editingItems.value.has(index)) {
      editingItems.value.delete(index)
    } else {
      editingItems.value.add(index)
    }
  }

  const startEditAll = (): void => {
    records.value.forEach((_, index) => {
      editingItems.value.add(index)
    })
  }

  const cancelAllEdits = (): void => {
    editingItems.value.clear()
    formErrors.value = {}
  }

  const isEditing = (index: number): boolean => {
    return editingItems.value.has(index)
  }

  // ===========================================
  // ACTIONS - UTILITY
  // ===========================================

  const clearAllData = (): void => {
    records.value = []
    hiddenMonths.value.clear()
    editingItems.value.clear()
    formErrors.value = {}
    filters.value = {
      filter: 'all',
      categoryFilter: '',
      sortField: 'Data',
      sortDirection: 'desc'
    }

    // Clear storage
    localStorage.removeItem(STORAGE_KEY)
    localStorage.removeItem(HIDDEN_MONTHS_KEY)
    localStorage.removeItem(FILTERS_KEY)
  }

  const getStateSnapshot = () => {
    return {
      records: [...records.value],
      hiddenMonths: Array.from(hiddenMonths.value),
      filters: { ...filters.value }
    }
  }

  const restoreFromSnapshot = (snapshot: any): void => {
    try {
      records.value = snapshot.records || []
      hiddenMonths.value = new Set(snapshot.hiddenMonths || [])
      filters.value = { ...filters.value, ...snapshot.filters }
      saveToStorage()
    } catch (error) {
      // Error restoring from snapshot - silent in production
    }
  }

  const getSortIcon = (field: SortField): string => {
    if (filters.value.sortField !== field) return 'fas fa-sort'
    return filters.value.sortDirection === 'asc' ? 'fas fa-sort-up' : 'fas fa-sort-down'
  }

  // ===========================================
  // ACTIONS - MODAL MANAGEMENT
  // ===========================================

  const confirmDelete = (record: IFinanceRecord, index: number): void => {
    itemToDelete.value = { record, index }
    showDeleteConfirm.value = true
  }

  const cancelDelete = (): void => {
    itemToDelete.value = null
    showDeleteConfirm.value = false
  }

  const executeDelete = (): boolean => {
    if (!itemToDelete.value) return false

    const { record, index } = itemToDelete.value

    try {
      // Store deleted item for undo functionality
      deletedItem.value = {
        record: { ...record },
        index,
        restoreData: { ...record }
      }

      // Remove the record
      const success = removeRecord(index)

      if (success) {
        // Close delete modal
        showDeleteConfirm.value = false
        itemToDelete.value = null

        // Force reactivity update by triggering the computed properties
        // This ensures the UI updates immediately
        if (typeof window !== 'undefined') {
          // Use nextTick to ensure DOM updates
          import('vue').then(({ nextTick }) => {
            nextTick(() => {
              // console.log('🔄 [STORE] UI reactivity updated after deletion')
            })
          })
        }

        // Show undo toast
        showUndoToast.value = true
        undoTimeLeft.value = 5

        // Start countdown timer
        const countdownInterval = setInterval(() => {
          undoTimeLeft.value--
          if (undoTimeLeft.value <= 0) {
            clearInterval(countdownInterval)
            showUndoToast.value = false
            deletedItem.value = null
            undoTimeLeft.value = 0

            // Final cleanup - ensure UI is updated
            if (typeof window !== 'undefined') {
              import('vue').then(({ nextTick }) => {
                nextTick(() => {
                  // console.log('🔄 [STORE] Final UI cleanup after undo timeout')
                })
              })
            }
          }
        }, 1000)

        // Auto-hide timer (backup)
        setTimeout(() => {
          clearInterval(countdownInterval)
          showUndoToast.value = false
          deletedItem.value = null
          undoTimeLeft.value = 0
        }, 5500)

        return true
      } else {
        // Failed to delete record - silent in production
        return false
      }

    } catch (error) {
      // Error deleting record - silent in production
      return false
    }
  }

  const openEditSheet = (): void => {
    showEditSheet.value = true
  }

  const closeEditSheet = (): void => {
    showEditSheet.value = false
    editingRecord.value = null
    originalEditIndex.value = -1
    editRecurrence.value = {
      isActive: false,
      frequency: 'mensal',
      endDate: ''
    }
  }

  const undoDelete = (): void => {
    if (!deletedItem.value) return

    try {
      // Re-add the record at its original position
      const { record, index } = deletedItem.value

      // Insert at the correct position
      if (index >= records.value.length) {
        records.value.push(record)
      } else {
        records.value.splice(index, 0, record)
      }

      saveToStorage()

      // Hide undo toast
      showUndoToast.value = false
      deletedItem.value = null
      undoTimeLeft.value = 0

    } catch (error) {
      // Error undoing deletion - silent in production
    }
  }

  const hideUndoToast = (): void => {
    showUndoToast.value = false
    deletedItem.value = null
    undoTimeLeft.value = 0
  }

  const startEdit = (record: IFinanceRecord, index: number): void => {
    editingRecord.value = { ...record }
    originalEditIndex.value = index

    // Initialize recurrence data if it exists
    if (record.recurrence) {
      editRecurrence.value = {
        isActive: true,
        frequency: record.recurrence.frequency,
        endDate: record.recurrence.endDate || ''
      }
    }

    openEditSheet()
  }

  // ===========================================
  // BATCH UPDATE FOR RECURRING RECORDS
  // ===========================================
  // Functions moved to useRecurrenceHelpers composable

  // Modified saveEdit function to handle recurring records
  const saveEdit = (): boolean => {
    if (!editingRecord.value || originalEditIndex.value === -1) {
      // No record being edited - silent in production
      return false
    }

    try {
      // Get the original record before editing
      const originalRecord = records.value[originalEditIndex.value]

      // Prepare the updated record
      const updatedRecord = { ...editingRecord.value }

      // Handle recurrence if enabled
      if (editRecurrence.value.isActive) {
        // If this record doesn't have recurrence yet, we need to generate recurring records
        if (!originalRecord.recurrence?.recurrenceId) {
          console.log('🔄 [EDIT] Adding recurrence to existing record, generating recurring records...')

          // Import the recurrence functions
          const { generateRecurringRecords } = useRecurrence()

          // Temporarily set the recurrence settings for generation
          const tempRecurrenceSettings = {
            frequency: editRecurrence.value.frequency,
            endDate: editRecurrence.value.endDate,
            isActive: true
          }

          // Generate recurring records using the composable
          const baseRecord = {
            Data: updatedRecord.Data,
            Descrição: updatedRecord.Descrição,
            Valor: updatedRecord.Valor,
            Tipo: updatedRecord.Tipo,
            Categoria: updatedRecord.Categoria,
            Status: updatedRecord.Status
          }

          // Use a custom generation function for editing context
          const generatedRecords = generateRecurringRecordsForEdit(baseRecord, tempRecurrenceSettings)

          if (generatedRecords.length > 0) {
            // Remove the original record
            records.value.splice(originalEditIndex.value, 1)

            // Add all generated records (including the updated original)
            generatedRecords.forEach(record => {
              records.value.push({ ...record, Saldo: 0 })
            })

            saveToStorage()
            closeEditSheet()
            return true
          }
        } else {
          // Update existing recurrence metadata
          updatedRecord.recurrence = {
            ...originalRecord.recurrence, // Preserve existing recurrence data
            frequency: editRecurrence.value.frequency,
            endDate: editRecurrence.value.endDate,
            isActive: true
          }
        }
      } else {
        delete updatedRecord.recurrence
      }

      // Check if this is a recurring record that should update linked records
      const isRecurringRecord = originalRecord.recurrence?.recurrenceId
      let editProcessed = false

      if (isRecurringRecord) {
        // Ask user if they want to update all linked records
        const shouldUpdateAll = confirm(
          `Este é um registro recorrente. Deseja atualizar todos os registros vinculados?\n\n` +
          `✅ SIM - Atualizar todos (recomendado)\n` +
          `❌ NÃO - Atualizar apenas este registro`
        )

        if (shouldUpdateAll) {
          // Update all linked recurring records
          const batchUpdateSuccess = updateAllLinkedRecurringRecords(originalRecord, {
            Descrição: updatedRecord.Descrição,
            Valor: updatedRecord.Valor,
            Tipo: updatedRecord.Tipo,
            Categoria: updatedRecord.Categoria,
            Status: updatedRecord.Status,
            recurrence: updatedRecord.recurrence
          }, records, saveToStorage)

          if (batchUpdateSuccess) {
            // ✨ AUTO CORRECTION: Apply corrections after batch update
            correctFutureRecordsAfterEdit(originalRecord, updatedRecord, records, saveToStorage, cleanInvalidRecurrences)
            closeEditSheet()
            return true
          }
        } else {
          // User declined batch update, just update the single record without auto-correction
          const success = updateRecord(originalEditIndex.value, updatedRecord)
          if (success) {
            editProcessed = true
            closeEditSheet()
            return true
          }
          return false
        }
      }

      // Only continue if we haven't processed the edit yet
      if (!editProcessed) {
        // Update the single record using the store's updateRecord method
        const success = updateRecord(originalEditIndex.value, updatedRecord)

        if (success) {
          // ✨ AUTO CORRECTION: Apply corrections after single record update (only for non-recurring)
          if (!isRecurringRecord) {
            correctFutureRecordsAfterEdit(originalRecord, updatedRecord, records, saveToStorage, cleanInvalidRecurrences)
          }
          closeEditSheet()
          return true
        } else {
          // Failed to update record - silent in production
          return false
        }
      }

    } catch (error) {
      // Failed to save - silent in production  
      return false
    }

    // Fallback return in case nothing else handled the edit
    return false
  }

  // Helper function to generate recurring records for edit context
  // Function moved to useRecurrenceHelpers composable

  // ===========================================
  // ACTIONS - AUTO CORRECTION AFTER EDITS  
  // ===========================================
  // Functions moved to composables: useAutoCorrection and useRecurrenceHelpers

  // ===========================================
  // INITIALIZATION
  // ===========================================

  // Load data on store creation
  loadFromStorage()

  // ===========================================
  // RETURN STORE API
  // ===========================================

  return {
    // State (reactive)
    records,
    sortedData,
    filteredData,
    groupedByMonth,
    saldoFinal,
    saldoPendente,
    saldoCompleto,

    // Filter state
    filter: computed(() => filters.value.filter),
    categoryFilter: computed(() => filters.value.categoryFilter),
    sortField: computed(() => filters.value.sortField),
    sortDirection: computed(() => filters.value.sortDirection),

    // Editing state
    editingItems: computed(() => editingItems.value),
    formErrors: computed(() => formErrors.value),

    // Actions - Records
    addRecord,
    updateRecord,
    removeRecord,
    importRecords,
    cleanInvalidRecurrences, // Add the new function to the return object

    // Actions - Filters
    setFilter,
    setCategoryFilter,
    clearCategoryFilter,
    setSorting,
    getSortIcon,

    // Actions - Month visibility (legacy)
    toggleMonthVisibility,
    hideMonth,
    showMonth,
    showAllMonths,
    hideAllMonths,
    isMonthHidden,
    getHiddenMonthsCount,

    // Smart Projection
    projectionSettings: computed(() => projectionSettings.value),
    getSmartVisibleMonths,
    isMonthInSmartProjection,
    updateProjectionSettings,
    getCurrentMonthKey,

    // Actions - Editing
    toggleEdit,
    startEditAll,
    cancelAllEdits,
    isEditing,

    // Actions - Utility
    clearAllData,
    getStateSnapshot,
    restoreFromSnapshot,

    // Actions - Modal
    showDeleteConfirm,
    itemToDelete,
    showEditSheet,
    showUndoToast,
    deletedItem,
    undoTimeLeft,
    confirmDelete,
    cancelDelete,
    executeDelete,
    openEditSheet,
    closeEditSheet,
    startEdit,
    saveEdit,
    undoDelete,
    hideUndoToast,

    // Edit form states
    editingRecord,
    originalEditIndex,
    editRecurrence,

    // Batch update for recurring records (exposed for tests)
    updateAllLinkedRecurringRecords,

    // Recurrence (delegated to composable)
    recurrence: useRecurrence(),

    // Auto-correction (from composables)
    autoCorrection: {
      correctFutureRecordsAfterEdit,
      removeRecurringRecordsBeyondDate,
      validateAndCorrectRecurringRecords
    },

    // Recurrence helpers (from composables) 
    recurrenceHelpers: {
      updateAllLinkedRecurringRecords,
      generateRecurringRecordsForEdit
    }
  }
}) 