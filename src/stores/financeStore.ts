import { defineStore } from 'pinia'
import { ref, computed, reactive } from 'vue'
import { useLocalStorage } from '../composables/useLocalStorage'
import { useRecurrence } from '../composables/useRecurrence'
import { useBusinessDays } from '../composables/finance/useBusinessDays'
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
    // Filter records based on smart projection ONLY
    const smartVisibleRecords = records.value.filter(item => {
      const date = new Date(item.Data)
      const monthKey = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`

      // Only include if in smart projection
      return isMonthInSmartProjection(monthKey)
    })

    // Calculate running totals chronologically
    const chronologicalRecords = [...smartVisibleRecords].sort((a, b) => {
      return new Date(a.Data).getTime() - new Date(b.Data).getTime()
    })

    let runningTotal = 0
    const recordsWithSaldo = chronologicalRecords.map(item => {
      runningTotal += item.Valor
      return { ...item, Saldo: runningTotal }
    })

    // Sort according to user preferences
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

  const saldoFinal = computed(() => {
    return filteredData.value.reduce((total, item) => total + item.Valor, 0)
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

  /**
   * Updates all recurring records linked to the same recurrenceId
   * @param originalRecord - The original record being edited
   * @param updatedFields - The fields to update (excluding Date and instanceNumber)
   * @returns boolean - Success status
   */
  const updateAllLinkedRecurringRecords = (originalRecord: IFinanceRecord, updatedFields: Partial<IFinanceRecord>): boolean => {
    try {
      // Check if the original record has recurrence info
      if (!originalRecord.recurrence?.recurrenceId) {
        return false
      }

      const recurrenceId = originalRecord.recurrence.recurrenceId
      let updatedCount = 0

      // Find all records with the same recurrenceId
      const linkedRecords = records.value.filter(record =>
        record.recurrence?.recurrenceId === recurrenceId
      )

      if (linkedRecords.length <= 1) {
        // No other linked records found
        return false
      }

      // Create new records array for reactivity
      const newRecords = [...records.value]

      // Update each linked record (preserve Date and instanceNumber)
      linkedRecords.forEach(linkedRecord => {
        const recordIndex = newRecords.findIndex(r =>
          r.Data === linkedRecord.Data &&
          r.Descrição === linkedRecord.Descrição &&
          r.recurrence?.recurrenceId === recurrenceId
        )

        if (recordIndex !== -1) {
          // Preserve the original Date and instanceNumber for each record
          const preservedDate = newRecords[recordIndex].Data
          const preservedInstanceNumber = newRecords[recordIndex].recurrence?.instanceNumber

          // Apply all updates except Date
          newRecords[recordIndex] = {
            ...newRecords[recordIndex],
            ...updatedFields,
            Data: preservedDate, // Keep original date
            recurrence: updatedFields.recurrence ? {
              ...updatedFields.recurrence,
              instanceNumber: preservedInstanceNumber // Keep original instance number
            } : newRecords[recordIndex].recurrence
          }
          updatedCount++
        }
      })

      // Update the records array for reactivity
      records.value = newRecords
      saveToStorage()

      return updatedCount > 0
    } catch (error) {
      return false
    }
  }

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
          })

          if (batchUpdateSuccess) {
            // ✨ AUTO CORRECTION: Apply corrections after batch update
            correctFutureRecordsAfterEdit(originalRecord, updatedRecord)
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
            correctFutureRecordsAfterEdit(originalRecord, updatedRecord)
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
  const generateRecurringRecordsForEdit = (
    baseRecord: Omit<IFinanceRecord, 'Saldo'>,
    recurrenceSettings: IRecurrence
  ): Omit<IFinanceRecord, 'Saldo'>[] => {
    console.log('🔄 [EDIT_RECURRENCE] Starting edit recurrence generation for:', {
      description: baseRecord.Descrição,
      startDate: baseRecord.Data,
      frequency: recurrenceSettings.frequency,
      endDate: recurrenceSettings.endDate
    })

    // Import business day logic from useRecurrence
    const { generateRecurringRecords } = useRecurrence()

    // Temporarily set the recurrence settings
    const originalIsRecurring = useRecurrence().isRecurring.value
    const originalSettings = { ...useRecurrence().recurrenceSettings.value }

    useRecurrence().isRecurring.value = true
    useRecurrence().recurrenceSettings.value = recurrenceSettings

    // Generate records using the composable logic (which includes business day detection)
    const generatedRecords = generateRecurringRecords(baseRecord)

    // Restore original settings
    useRecurrence().isRecurring.value = originalIsRecurring
    useRecurrence().recurrenceSettings.value = originalSettings

    console.log('🔄 [EDIT_RECURRENCE] Edit generation complete:', {
      totalRecords: generatedRecords.length,
      originalDate: baseRecord.Data
    })

    return generatedRecords
  }

  // ===========================================
  // ACTIONS - AUTO CORRECTION AFTER EDITS
  // ===========================================

  /**
   * Corrige automaticamente lançamentos errôneos futuros após uma edição
   * @param originalRecord O registro original antes da edição
   * @param updatedRecord O registro após a edição
   */
  const correctFutureRecordsAfterEdit = (originalRecord: IFinanceRecord, updatedRecord: IFinanceRecord): void => {
    console.log('🔧 [AUTO_CORRECTION] Starting automatic correction of future records...')

    const corrections = {
      removed: 0,
      updated: 0,
      errors: 0
    }

    try {
      // Verificar se houve mudança na data limite de recorrência
      const originalEndDate = originalRecord.recurrence?.endDate
      const newEndDate = updatedRecord.recurrence?.endDate
      const recurrenceId = originalRecord.recurrence?.recurrenceId || updatedRecord.recurrence?.recurrenceId

      if (recurrenceId && originalEndDate !== newEndDate) {
        console.log('🔧 [AUTO_CORRECTION] Detected recurrence end date change:', {
          original: originalEndDate,
          new: newEndDate,
          recurrenceId
        })

        // Se a nova data limite é anterior à original, remover lançamentos além da nova data
        if (newEndDate && originalEndDate && newEndDate < originalEndDate) {
          corrections.removed += removeRecurringRecordsBeyondDate(recurrenceId, newEndDate)
        }

        // Se a nova data limite é posterior, não fazemos nada (usuário pode querer gerar novos)
        // Mas podemos informar que há possibilidade de gerar mais lançamentos
        if (newEndDate && originalEndDate && newEndDate > originalEndDate) {
          console.log('🔧 [AUTO_CORRECTION] New end date is later, user may want to generate additional records')
        }
      }

      // Verificar se houve mudança em valores/categoria/descrição de registros recorrentes
      if (recurrenceId && (
        originalRecord.Valor !== updatedRecord.Valor ||
        originalRecord.Categoria !== updatedRecord.Categoria ||
        originalRecord.Descrição !== updatedRecord.Descrição ||
        originalRecord.Tipo !== updatedRecord.Tipo
      )) {
        console.log('🔧 [AUTO_CORRECTION] Detected changes in recurring record properties')

        // Esta correção já é tratada pela função updateAllLinkedRecurringRecords
        // mas vamos garantir que todos os futuros estejam corretos
        corrections.updated += validateAndCorrectRecurringRecords(recurrenceId, updatedRecord)
      }

      // Sempre executar limpeza geral após edições
      cleanInvalidRecurrences()

      console.log('✅ [AUTO_CORRECTION] Completed automatic correction:', corrections)

      // Notificar usuário se houver correções significativas
      if (corrections.removed > 0 || corrections.updated > 0) {
        const message = []
        if (corrections.removed > 0) {
          message.push(`${corrections.removed} lançamento(s) removido(s) por estarem além da nova data limite`)
        }
        if (corrections.updated > 0) {
          message.push(`${corrections.updated} lançamento(s) futuro(s) corrigido(s)`)
        }

        // Em produção, pode usar um toast/notification system
        console.log('ℹ️ [AUTO_CORRECTION] Correções aplicadas: ' + message.join('; '))
      }

    } catch (error) {
      console.error('❌ [AUTO_CORRECTION] Error during automatic correction:', error)
      corrections.errors++
    }
  }

  /**
   * Remove registros recorrentes que estão além de uma data específica
   * @param recurrenceId ID da recorrência
   * @param endDate Data limite (formato YYYY-MM-DD)
   * @returns Número de registros removidos
   */
  const removeRecurringRecordsBeyondDate = (recurrenceId: string, endDate: string): number => {
    console.log('🗑️ [AUTO_CORRECTION] Removing recurring records beyond date:', { recurrenceId, endDate })

    // Parse da data limite
    let limitDate: Date
    if (endDate.match(/^\d{4}-\d{2}-\d{2}$/)) {
      const [year, month, day] = endDate.split('-').map(Number)
      limitDate = new Date(year, month - 1, day) // month is 0-based
    } else {
      limitDate = new Date(endDate)
    }

    const initialCount = records.value.length

    // Filtrar registros, removendo os que estão além da data limite
    records.value = records.value.filter(record => {
      // Se não é da mesma recorrência, manter
      if (record.recurrence?.recurrenceId !== recurrenceId) {
        return true
      }

      // Parse da data do registro
      let recordDate: Date
      if (record.Data.match(/^\d{4}-\d{2}-\d{2}$/)) {
        const [year, month, day] = record.Data.split('-').map(Number)
        recordDate = new Date(year, month - 1, day) // month is 0-based
      } else {
        recordDate = new Date(record.Data)
      }

      // Manter apenas se a data do registro está dentro do limite
      const shouldKeep = recordDate <= limitDate

      if (!shouldKeep) {
        console.log('🗑️ [AUTO_CORRECTION] Removing record beyond end date:', {
          description: record.Descrição,
          date: record.Data,
          endDate: endDate
        })
      }

      return shouldKeep
    })

    const removedCount = initialCount - records.value.length

    if (removedCount > 0) {
      saveToStorage()
      console.log(`✅ [AUTO_CORRECTION] Removed ${removedCount} records beyond end date`)
    }

    return removedCount
  }

  /**
   * Valida e corrige registros recorrentes para garantir consistência
   * @param recurrenceId ID da recorrência
   * @param referenceRecord Registro de referência com os dados corretos
   * @returns Número de registros corrigidos
   */
  const validateAndCorrectRecurringRecords = (recurrenceId: string, referenceRecord: IFinanceRecord): number => {
    console.log('🔧 [AUTO_CORRECTION] Validating and correcting recurring records for:', recurrenceId)

    let correctedCount = 0

    records.value.forEach((record, index) => {
      if (record.recurrence?.recurrenceId === recurrenceId) {
        let needsCorrection = false
        const updates: Partial<IFinanceRecord> = {}

        // Verificar se categoria, tipo, valor estão consistentes
        if (record.Categoria !== referenceRecord.Categoria) {
          updates.Categoria = referenceRecord.Categoria
          needsCorrection = true
        }

        if (record.Tipo !== referenceRecord.Tipo) {
          updates.Tipo = referenceRecord.Tipo
          needsCorrection = true
        }

        if (record.Valor !== referenceRecord.Valor) {
          updates.Valor = referenceRecord.Valor
          needsCorrection = true
        }

        // Aplicar correções se necessário
        if (needsCorrection) {
          records.value[index] = { ...record, ...updates }
          correctedCount++

          console.log('🔧 [AUTO_CORRECTION] Corrected record:', {
            date: record.Data,
            description: record.Descrição,
            updates
          })
        }
      }
    })

    if (correctedCount > 0) {
      saveToStorage()
      console.log(`✅ [AUTO_CORRECTION] Corrected ${correctedCount} recurring records`)
    }

    return correctedCount
  }

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

    // Batch update for recurring records
    updateAllLinkedRecurringRecords,

    // Recurrence (delegated to composable)
    recurrence: useRecurrence(),

    // Auto-correction
    correctFutureRecordsAfterEdit,
    removeRecurringRecordsBeyondDate,
    validateAndCorrectRecurringRecords
  }
}) 