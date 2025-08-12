import { computed } from 'vue'
import { useFinanceStore } from '../../stores/financeStore'
import { useCategoryDetection } from '../useCategoryDetection'
import type { IFinanceRecord } from '../../types/finance'

export function useFinanceTable() {
  // FIXED: Use store instead of composable to respect smart projection
  const store = useFinanceStore()

  const { detectCategory, getAllCategories, getCategoryIcon } = useCategoryDetection()

  // Computed properties for table display - FIXED: Use store data that respects projection
  const totalRecords = computed(() => store.records.length)

  const recordsByCategory = computed(() => {
    const categories: Record<string, IFinanceRecord[]> = {}
    store.records.forEach(record => {
      const category = record.Categoria || 'Sem categoria'
      if (!categories[category]) {
        categories[category] = []
      }
      categories[category].push(record)
    })
    return categories
  })

  const monthlyTotals = computed(() => {
    const totals: Record<string, { receitas: number; despesas: number; saldo: number }> = {}

    Object.entries(store.groupedByMonth).forEach(([monthKey, records]) => {
      const receitas = records
        .filter(r => r.Tipo === 'Receita')
        .reduce((sum, r) => sum + r.Valor, 0)

      const despesas = records
        .filter(r => r.Tipo === 'Despesa')
        .reduce((sum, r) => sum + Math.abs(r.Valor), 0)

      totals[monthKey] = {
        receitas,
        despesas,
        saldo: receitas - despesas
      }
    })

    return totals
  })

  // Helper functions
  const isRecurringRecord = (record: IFinanceRecord): boolean => {
    return !!(record.recurrence && record.recurrence.isActive)
  }

  const formatDate = (dateStr: string): string => {
    if (!dateStr) return ''

    // For date-only strings (YYYY-MM-DD), parse as local date to avoid timezone issues
    if (dateStr.match(/^\d{4}-\d{2}-\d{2}$/)) {
      const [year, month, day] = dateStr.split('-').map(Number)
      const date = new Date(year, month - 1, day) // month is 0-based in constructor
      return date.toLocaleDateString('pt-BR')
    }

    // For other date formats, use regular parsing
    const date = new Date(dateStr)
    return date.toLocaleDateString('pt-BR')
  }

  const formatCurrency = (value: number): string => {
    return value.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    })
  }

  const getValueColor = (value: number): string => {
    return value < 0 ? 'text-red-600' : 'text-green-600'
  }

  const getCurrentDate = (): string => {
    return new Date().toISOString().split('T')[0]
  }

  return {
    // State
    data: store.records, // Expose store data directly
    filteredData: store.filteredData, // Expose store data directly - FIXED: Use correct property name
    groupedByMonth: store.groupedByMonth, // Expose store data directly
    saldoFinal: store.saldoFinal, // Expose store data directly
    totalRecords,
    recordsByCategory,
    monthlyTotals,

    // Actions
    addRecord: store.addRecord,
    updateRecord: store.updateRecord,
    removeRecord: store.removeRecord,

    // Helpers
    isRecurringRecord,
    formatDate,
    formatCurrency,
    getValueColor,
    getCurrentDate,
    detectCategory,
    getAllCategories,
    getCategoryIcon,

    // Recurrence
    recurrence: store.recurrence // Expose store recurrence directly
  }
} 