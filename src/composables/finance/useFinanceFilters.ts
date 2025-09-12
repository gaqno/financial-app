import { ref, computed } from 'vue'
import { useFinance } from '../useFinance'
import { useCategoryDetection } from '../useCategoryDetection'
import type { IFinanceRecord } from '../../types/finance'

type IFilter = 'all' | 'Receita' | 'Despesa'

export function useFinanceFilters() {
  const {
    data,
    filter,
    categoryFilter,
    filteredData,
    setFilter: setFinanceFilter,
    setCategoryFilter,
    clearCategoryFilter
  } = useFinance()

  const { getAllCategories, getCategoryIcon } = useCategoryDetection()

  // Additional filter state
  const searchTerm = ref<string>('')
  const statusFilter = ref<'all' | '❌' | '✔️'>('all')
  const dateRange = ref<{ start?: string; end?: string }>({})

  // Enhanced filtered data with search and additional filters
  const enhancedFilteredData = computed(() => {
    let result = filteredData.value

    // Apply search term filter
    if (searchTerm.value.trim()) {
      const search = searchTerm.value.toLowerCase().trim()
      result = result.filter(record =>
        record.Descrição.toLowerCase().includes(search) ||
        record.Categoria?.toLowerCase().includes(search)
      )
    }

    // Apply status filter
    if (statusFilter.value !== 'all') {
      result = result.filter(record => record.Status === statusFilter.value)
    }

    // Apply date range filter
    if (dateRange.value.start) {
      result = result.filter(record => record.Data >= dateRange.value.start!)
    }
    if (dateRange.value.end) {
      result = result.filter(record => record.Data <= dateRange.value.end!)
    }

    return result
  })

  // Category totals for filtered data
  const categoryTotals = computed(() => {
    const totals: Record<string, number> = {}

    enhancedFilteredData.value.forEach(record => {
      const category = record.Categoria || 'Sem categoria'
      totals[category] = (totals[category] || 0) + record.Valor
    })

    return totals
  })

  // Records without category
  const recordsWithoutCategory = computed(() => {
    return data.value.filter(record => !record.Categoria || record.Categoria === '')
  })

  // Filter actions
  const setFilter = (newFilter: IFilter) => {
    setFinanceFilter(newFilter)
  }

  const filterByCategory = (category: string) => {
    setCategoryFilter(category)
  }

  const clearAllFilters = () => {
    setFilter('all')
    clearCategoryFilter()
    searchTerm.value = ''
    statusFilter.value = 'all'
    dateRange.value = {}
  }

  const setSearchTerm = (term: string) => {
    searchTerm.value = term
  }

  const setStatusFilter = (status: 'all' | '❌' | '✔️') => {
    statusFilter.value = status
  }

  const setDateRange = (start?: string, end?: string) => {
    dateRange.value = { start, end }
  }

  // Quick filter presets
  const showPendingOnly = () => {
    setFilter('all')
    setStatusFilter('❌')
  }

  const showCompletedOnly = () => {
    setFilter('all')
    setStatusFilter('✔️')
  }

  const showRecentTransactions = (days: number = 7) => {
    const endDate = new Date().toISOString().split('T')[0]
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)
    const start = startDate.toISOString().split('T')[0]

    setDateRange(start, endDate)
  }

  // Active filter indicators
  const hasActiveFilters = computed(() => {
    return filter.value !== 'all' ||
      !!categoryFilter.value ||
      !!searchTerm.value.trim() ||
      statusFilter.value !== 'all' ||
      !!dateRange.value.start ||
      !!dateRange.value.end
  })

  const activeFiltersCount = computed(() => {
    let count = 0
    if (filter.value !== 'all') count++
    if (categoryFilter.value) count++
    if (searchTerm.value.trim()) count++
    if (statusFilter.value !== 'all') count++
    if (dateRange.value.start || dateRange.value.end) count++
    return count
  })

  const activeFiltersDescription = computed(() => {
    const descriptions: string[] = []

    if (filter.value !== 'all') {
      descriptions.push(`Tipo: ${filter.value}`)
    }
    if (categoryFilter.value) {
      descriptions.push(`Categoria: ${categoryFilter.value}`)
    }
    if (searchTerm.value.trim()) {
      descriptions.push(`Busca: "${searchTerm.value.trim()}"`)
    }
    if (statusFilter.value !== 'all') {
      descriptions.push(`Status: ${statusFilter.value}`)
    }
    if (dateRange.value.start || dateRange.value.end) {
      descriptions.push('Período personalizado')
    }

    return descriptions.join(', ')
  })

  return {
    // State
    searchTerm,
    statusFilter,
    dateRange,
    filter,
    categoryFilter,

    // Computed
    enhancedFilteredData,
    categoryTotals,
    recordsWithoutCategory,
    hasActiveFilters,
    activeFiltersCount,
    activeFiltersDescription,

    // Actions
    setFilter,
    filterByCategory,
    clearCategoryFilter,
    clearAllFilters,
    setSearchTerm,
    setStatusFilter,
    setDateRange,

    // Quick presets
    showPendingOnly,
    showCompletedOnly,
    showRecentTransactions,

    // Helpers
    getAllCategories,
    getCategoryIcon
  }
} 