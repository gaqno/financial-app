import { ref, computed, watch } from 'vue'
import { useFinanceStore } from '../../stores/financeStore'
import type { IFinanceRecord } from '../../types/finance'

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
  const handleToggleStatus = (record: IFinanceRecord, displayIndex: number) => {
    const originalStatus = record.Status
    const targetStatus: '❌' | '✔️' = originalStatus === '✔️' ? '❌' : '✔️'

    // Find the actual record in the store by matching properties
    const recordIndex = financeStore.records.findIndex(r =>
      r.Data === record.Data &&
      r.Descrição === record.Descrição &&
      r.Valor === record.Valor &&
      r.Tipo === record.Tipo &&
      r.Status === originalStatus // Match the ORIGINAL status
    )

    if (recordIndex !== -1) {
      const updatedRecord = { ...record, Status: targetStatus }
      const success = financeStore.updateRecord(recordIndex, updatedRecord)

      if (!success && isDevelopment.value) {
        console.warn('Failed to update record status')
      }
    } else if (isDevelopment.value) {
      console.warn('Record not found in store for status toggle')
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
    if (!dateString) return ''

    // For date-only strings (YYYY-MM-DD), parse as local date to avoid timezone issues
    if (dateString.match(/^\d{4}-\d{2}-\d{2}$/)) {
      const [year, month, day] = dateString.split('-').map(Number)
      const date = new Date(year, month - 1, day) // month is 0-based in constructor

      return date.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      })
    }

    // For other date formats, use regular parsing
    const date = new Date(dateString)
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    })
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