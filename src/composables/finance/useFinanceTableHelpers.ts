import { ref, computed, watch } from 'vue'
import { useFinanceStore } from '../../stores/financeStore'
import { formatDateForDisplay } from '../../utils/dateUtils'
import type { IFinanceRecord } from '../../types/finance'

const isDevelopment = computed(() => typeof window !== 'undefined' && window.location.hostname === 'localhost')

export function useFinanceTableHelpers() {
  const financeStore = useFinanceStore()


  // Local state for UI interactions
  const collapsedMonths = ref(new Set<string>())

  // Month collapse functionality
  const handleMonthToggle = (monthKey: string, isCollapsed: boolean) => {
    // Manage local collapse state, not month visibility
    if (isCollapsed) {
      collapsedMonths.value.add(monthKey)
    } else {
      collapsedMonths.value.delete(monthKey)
    }
    // Month collapsed state updated locally
  }

  // Handle status toggle with proper index mapping
  const handleToggleStatus = async (record: IFinanceRecord, displayIndex: number) => {
    const originalStatus = record.Status
    const targetStatus: '❌' | '✔️' = originalStatus === '✔️' ? '❌' : '✔️'

    // Check if this is a recurring record
    if (record.recurrence?.recurrenceId) {
      ('🔄 [TOGGLE_STATUS] Handling recurring record status change:', {
        date: record.Data,
        description: record.Descrição,
        recurrenceId: record.recurrence.recurrenceId,
        instanceNumber: record.recurrence.instanceNumber,
        statusChange: `${originalStatus} → ${targetStatus}`
      })

      // For recurring records, ask user if they want to update past instances
      const shouldUpdateAll = confirm(
        `Este é um registro recorrente.\n\n` +
        `Deseja atualizar o status de todas as ocorrências PASSADAS desta recorrência?\n\n` +
        `✅ SIM - Atualizar ocorrências passadas e atual (recomendado)\n` +
        `❌ NÃO - Atualizar apenas este registro\n\n` +
        `Nota: Registros futuros não serão afetados.`
      )

      if (shouldUpdateAll) {
        // Use batch update system for recurring records
        try {
          const { useRecurrenceHelpers } = await import('./useRecurrenceHelpers')
          const { updateAllLinkedRecurringRecords } = useRecurrenceHelpers()

          const success = await updateAllLinkedRecurringRecords(record, {
            Status: targetStatus
          }, financeStore, financeStore.saveToStorage, {
            isStatusOnlyChange: true,
            skipAutoCorrection: true
          })

          if (!success && isDevelopment.value) {
            console.warn('Failed to update recurring record status via batch system')
          }
          return
        } catch (error) {
          if (isDevelopment.value) {
            console.error('❌ [TOGGLE_STATUS] Error with batch update, falling back to single record:', error)
          }
          // Fall through to individual update
        }
      }
    }

    // Individual record update (for non-recurring or when user chose single update)
    const recordIndex = financeStore.records.findIndex(r => {
      // Basic properties must match
      const basicMatch = r.Data === record.Data &&
        r.Descrição === record.Descrição &&
        r.Valor === record.Valor &&
        r.Tipo === record.Tipo &&
        r.Status === originalStatus

      // For recurring records, also match recurrence metadata
      if (record.recurrence?.recurrenceId) {
        return basicMatch &&
          r.recurrence?.recurrenceId === record.recurrence.recurrenceId &&
          r.recurrence?.instanceNumber === record.recurrence.instanceNumber
      }

      // For non-recurring records, ensure recurrence is null/undefined on both
      return basicMatch && (!record.recurrence === !r.recurrence)
    })

    if (recordIndex !== -1) {
      const updatedRecord = { ...record, Status: targetStatus }

        ('🔄 [TOGGLE_STATUS] Updating single record:', {
          recordIndex,
          date: record.Data,
          description: record.Descrição,
          isRecurring: !!record.recurrence?.recurrenceId,
          statusChange: `${originalStatus} → ${targetStatus}`
        })

      try {
        const success = await financeStore.updateRecord(recordIndex, updatedRecord)

        if (!success && isDevelopment.value) {
          console.warn('Failed to update record status')
        }
      } catch (error) {
        if (isDevelopment.value) {
          console.error('❌ [TABLE_HELPERS] Erro ao alterar status:', error)
        }
      }
    } else if (isDevelopment.value) {
      console.warn('Record not found in store for status toggle:', {
        searchedFor: {
          date: record.Data,
          description: record.Descrição,
          value: record.Valor,
          type: record.Tipo,
          status: originalStatus,
          recurrenceId: record.recurrence?.recurrenceId,
          instanceNumber: record.recurrence?.instanceNumber
        },
        totalRecords: financeStore.records.length
      })
    }
  }

  // Get starting index for a month in the flat record list
  const getMonthStartIndex = (monthKey: string): number => {
    let currentIndex = 0
    const monthKeys = Object.keys(financeStore.groupedByMonth)

    for (const key of monthKeys) {
      if (key === monthKey) {
        break
      }
      currentIndex += financeStore.groupedByMonth[key].length
    }

    return currentIndex
  }

  // Environment detection
  const isDevelopment = computed(() => {
    if (typeof window !== 'undefined') {
      return window.location.hostname === 'localhost'
    }
    return false
  })

  // Format date helper
  const formatDate = (dateString: string): string => {
    return formatDateForDisplay(dateString)
  }

  return {
    // State
    collapsedMonths,
    isDevelopment,

    // Store references for easy access
    data: financeStore.records,
    filteredData: financeStore.filteredData,
    groupedByMonth: financeStore.groupedByMonth,
    saldoFinal: financeStore.saldoFinal,

    // Methods
    handleMonthToggle,
    handleToggleStatus,
    getMonthStartIndex,
    formatDate
  }
} 