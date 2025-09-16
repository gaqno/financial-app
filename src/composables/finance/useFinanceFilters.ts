import { ref, computed } from 'vue';
import { useFinance } from '../useFinance';
import { useCategoryDetection } from '../useCategoryDetection';
import { useDarkMode } from '../useDarkMode';
import { useToast } from '../useToast';
import type { IFinanceRecord } from '../../types/finance';

type IFilter = 'all' | 'Receita' | 'Despesa';

export function useFinanceFilters() {
  const {
    data,
    filter,
    categoryFilter,
    filteredData,
    setFilter: setFinanceFilter,
    setCategoryFilter,
    clearCategoryFilter,
  } = useFinance();

  const { getAllCategories, getCategoryIcon } = useCategoryDetection();
  const { isDarkMode, themeClass } = useDarkMode();
  const toast = useToast();

  // Additional filter state
  const searchTerm = ref<string>('');
  const statusFilter = ref<'all' | '❌' | '✔️'>('all');
  const dateRange = ref<{ start?: string; end?: string }>({});

  // Filter performance state
  const isFiltering = ref<boolean>(false);
  const lastFilterTime = ref<number>(0);

  // Dark mode aware filter styling
  const filterClasses = computed(() => ({
    container: isDarkMode.value ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200',
    filterButton: {
      active: isDarkMode.value ? 'bg-blue-600 text-white border-blue-600' : 'bg-blue-600 text-white border-blue-600',
      inactive: isDarkMode.value
        ? 'bg-gray-700 text-gray-300 border-gray-600 hover:bg-gray-600'
        : 'bg-gray-100 text-gray-700 border-gray-300 hover:bg-gray-200',
    },
    searchInput: isDarkMode.value
      ? 'bg-gray-700 border-gray-600 text-gray-100 placeholder-gray-400 focus:border-blue-500'
      : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:border-blue-500',
    categoryChip: {
      active: isDarkMode.value ? 'bg-blue-600 text-white' : 'bg-blue-600 text-white',
      inactive: isDarkMode.value
        ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
        : 'bg-gray-100 text-gray-700 hover:bg-gray-200',
    },
    badge: isDarkMode.value ? 'bg-blue-900 text-blue-200' : 'bg-blue-100 text-blue-800',
    text: {
      primary: isDarkMode.value ? 'text-gray-100' : 'text-gray-900',
      secondary: isDarkMode.value ? 'text-gray-300' : 'text-gray-600',
      muted: isDarkMode.value ? 'text-gray-400' : 'text-gray-500',
    },
  }));

  // Enhanced filtered data with search and additional filters
  const enhancedFilteredData = computed(() => {
    const startTime = performance.now();
    isFiltering.value = true;

    let result = filteredData.value;

    // Apply search term filter with improved performance
    if (searchTerm.value.trim()) {
      const search = searchTerm.value.toLowerCase().trim();
      result = result.filter((record) => {
        const description = record.Descrição.toLowerCase();
        const category = record.Categoria?.toLowerCase() || '';
        return description.includes(search) || category.includes(search);
      });
    }

    // Apply status filter
    if (statusFilter.value !== 'all') {
      result = result.filter((record) => record.Status === statusFilter.value);
    }

    // Apply date range filter with proper date comparison
    if (dateRange.value.start) {
      result = result.filter((record) => record.Data >= dateRange.value.start!);
    }
    if (dateRange.value.end) {
      result = result.filter((record) => record.Data <= dateRange.value.end!);
    }

    const endTime = performance.now();
    lastFilterTime.value = endTime - startTime;
    isFiltering.value = false;

    return result;
  });

  // Enhanced statistics with better formatting
  const filterStatistics = computed(() => {
    const total = data.value.length;
    const filtered = enhancedFilteredData.value.length;
    const percentage = total > 0 ? Math.round((filtered / total) * 100) : 0;

    const totalValue = enhancedFilteredData.value.reduce((sum, record) => {
      return sum + (record.Tipo === 'Receita' ? record.Valor : -Math.abs(record.Valor));
    }, 0);

    const formattedValue = totalValue.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    });

    return {
      total,
      filtered,
      percentage,
      totalValue,
      formattedValue,
      filterTime: lastFilterTime.value,
    };
  });

  // Category totals for filtered data
  const categoryTotals = computed(() => {
    const totals: Record<string, number> = {};

    enhancedFilteredData.value.forEach((record) => {
      const category = record.Categoria || 'Sem categoria';
      totals[category] = (totals[category] || 0) + record.Valor;
    });

    return totals;
  });

  // Records without category
  const recordsWithoutCategory = computed(() => {
    return data.value.filter((record) => !record.Categoria || record.Categoria === '');
  });

  // Enhanced filter actions with UX feedback
  const setFilter = (newFilter: IFilter) => {
    setFinanceFilter(newFilter);

    if (newFilter !== 'all') {
      const filterType = newFilter === 'Receita' ? '💰 Receitas' : '💸 Despesas';
      toast.info(`Exibindo apenas ${filterType.toLowerCase()}`, {
        title: `🔍 Filtro: ${filterType}`,
        duration: 2000,
      });
    }
  };

  const filterByCategory = (category: string) => {
    setCategoryFilter(category);

    const icon = getCategoryIcon(category);
    toast.info(`Exibindo registros da categoria "${category}"`, {
      title: `🔍 ${icon} Filtro: ${category}`,
      duration: 2000,
    });
  };

  const clearAllFilters = () => {
    const hadActiveFilters = hasActiveFilters.value;

    setFilter('all');
    clearCategoryFilter();
    searchTerm.value = '';
    statusFilter.value = 'all';
    dateRange.value = {};

    if (hadActiveFilters) {
      toast.success('Todos os filtros foram removidos', {
        title: '🔄 Filtros Limpos',
        duration: 2000,
      });
    }
  };

  // Enhanced search with debouncing
  const setSearchTerm = (term: string) => {
    searchTerm.value = term;

    if (term.trim().length >= 3) {
      toast.info(`Buscando por "${term.trim()}"`, {
        title: '🔍 Pesquisando',
        duration: 1500,
      });
    }
  };

  const quickSearch = (query: string) => {
    setSearchTerm(query);

    // Scroll to results if needed
    if (typeof document !== 'undefined') {
      const resultsElement = document.querySelector('[data-filter-results]');
      if (resultsElement) {
        resultsElement.scrollIntoView({ behavior: 'smooth' });
      }
    }
  };

  const setStatusFilter = (status: 'all' | '❌' | '✔️') => {
    statusFilter.value = status;

    if (status !== 'all') {
      const statusText = status === '✔️' ? 'Concluídos' : 'Pendentes';
      const statusEmoji = status === '✔️' ? '✅' : '⏳';

      toast.info(`Exibindo apenas registros ${statusText.toLowerCase()}`, {
        title: `🔍 ${statusEmoji} Filtro: ${statusText}`,
        duration: 2000,
      });
    }
  };

  const setDateRange = (start?: string, end?: string) => {
    dateRange.value = { start, end };

    if (start || end) {
      let message = 'Filtro de período aplicado';

      if (start && end) {
        const startFormatted = new Date(start).toLocaleDateString('pt-BR');
        const endFormatted = new Date(end).toLocaleDateString('pt-BR');
        message = `Período: ${startFormatted} até ${endFormatted}`;
      } else if (start) {
        const startFormatted = new Date(start).toLocaleDateString('pt-BR');
        message = `A partir de: ${startFormatted}`;
      } else if (end) {
        const endFormatted = new Date(end).toLocaleDateString('pt-BR');
        message = `Até: ${endFormatted}`;
      }

      toast.info(message, {
        title: '📅 Filtro de Data',
        duration: 2500,
      });
    }
  };

  // Enhanced quick filter presets with feedback
  const showPendingOnly = () => {
    clearAllFilters();
    setStatusFilter('❌');
  };

  const showCompletedOnly = () => {
    clearAllFilters();
    setStatusFilter('✔️');
  };

  const showRecentTransactions = (days: number = 7) => {
    const endDate = new Date().toISOString().split('T')[0];
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    const start = startDate.toISOString().split('T')[0];

    clearAllFilters();
    setDateRange(start, endDate);

    toast.info(`Exibindo últimos ${days} dias`, {
      title: '📅 Período Recente',
      duration: 2000,
    });
  };

  const showCurrentMonth = () => {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];

    clearAllFilters();
    setDateRange(start, end);

    toast.info('Exibindo mês atual', {
      title: '📅 Mês Atual',
      duration: 2000,
    });
  };

  const showThisYear = () => {
    const year = new Date().getFullYear();
    const start = `${year}-01-01`;
    const end = `${year}-12-31`;

    clearAllFilters();
    setDateRange(start, end);

    toast.info(`Exibindo registros de ${year}`, {
      title: '📅 Ano Atual',
      duration: 2000,
    });
  };

  // Active filter indicators
  const hasActiveFilters = computed(() => {
    return (
      filter.value !== 'all' ||
      !!categoryFilter.value ||
      !!searchTerm.value.trim() ||
      statusFilter.value !== 'all' ||
      !!dateRange.value.start ||
      !!dateRange.value.end
    );
  });

  const activeFiltersCount = computed(() => {
    let count = 0;
    if (filter.value !== 'all') count++;
    if (categoryFilter.value) count++;
    if (searchTerm.value.trim()) count++;
    if (statusFilter.value !== 'all') count++;
    if (dateRange.value.start || dateRange.value.end) count++;
    return count;
  });

  const activeFiltersDescription = computed(() => {
    const descriptions: string[] = [];

    if (filter.value !== 'all') {
      descriptions.push(`Tipo: ${filter.value}`);
    }
    if (categoryFilter.value) {
      descriptions.push(`Categoria: ${categoryFilter.value}`);
    }
    if (searchTerm.value.trim()) {
      descriptions.push(`Busca: "${searchTerm.value.trim()}"`);
    }
    if (statusFilter.value !== 'all') {
      descriptions.push(`Status: ${statusFilter.value}`);
    }
    if (dateRange.value.start || dateRange.value.end) {
      descriptions.push('Período personalizado');
    }

    return descriptions.join(', ');
  });

  return {
    // State
    searchTerm,
    statusFilter,
    dateRange,
    filter,
    categoryFilter,

    // Performance state
    isFiltering,
    lastFilterTime,

    // Computed
    enhancedFilteredData,
    categoryTotals,
    recordsWithoutCategory,
    hasActiveFilters,
    activeFiltersCount,
    activeFiltersDescription,
    filterStatistics,

    // Dark mode and styling
    isDarkMode,
    themeClass,
    filterClasses,

    // Enhanced toast system
    toast,

    // Actions
    setFilter,
    filterByCategory,
    clearCategoryFilter,
    clearAllFilters,
    setSearchTerm,
    quickSearch,
    setStatusFilter,
    setDateRange,

    // Enhanced quick presets
    showPendingOnly,
    showCompletedOnly,
    showRecentTransactions,
    showCurrentMonth,
    showThisYear,

    // Helpers
    getAllCategories,
    getCategoryIcon,
  };
}
