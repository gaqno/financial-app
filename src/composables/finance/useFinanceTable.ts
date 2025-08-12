import { computed } from 'vue'
import { useFinance } from '../useFinance'
import { useCategoryDetection } from '../useCategoryDetection'
import type { IFinanceRecord } from '../../types/finance'

export function useFinanceTable() {
  // Core finance functionality
  const {
    data,
    filteredData,
    groupedByMonth,
    saldoFinal,
    addRecord,
    updateRecord,
    removeRecord,
    recurrence
  } = useFinance()

  const { detectCategory, getAllCategories, getCategoryIcon } = useCategoryDetection()

  // Computed properties for table display
  const totalRecords = computed(() => data.value.length)

  const recordsByCategory = computed(() => {
    const categories: Record<string, IFinanceRecord[]> = {}
    data.value.forEach(record => {
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

    Object.entries(groupedByMonth.value).forEach(([monthKey, records]) => {
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
    data,
    filteredData,
    groupedByMonth,
    saldoFinal,
    totalRecords,
    recordsByCategory,
    monthlyTotals,

    // Actions
    addRecord,
    updateRecord,
    removeRecord,

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
    recurrence
  }
} 