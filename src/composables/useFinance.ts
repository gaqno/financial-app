import { ref, computed, watch } from 'vue';
import { financeRecordSchema, financeFormSchema } from '../types/finance';
import type { IFinanceRecord, IFinanceFormData, IFilter, IFinanceRecordWithMonth } from '../types/finance';
import { useLocalStorage } from './useLocalStorage';
import { useRecurrence } from './useRecurrence';

const STORAGE_KEY = 'financeData';

type SortField = 'Data' | 'Descrição' | 'Valor' | 'Tipo' | 'Categoria' | 'Status';
type SortDirection = 'asc' | 'desc';

export function useFinance() {
  const { data: storedData, clearStorage } = useLocalStorage<IFinanceRecord[]>(STORAGE_KEY, []);
  const { data: storedHiddenMonths, clearStorage: clearHiddenMonthsStorage } = useLocalStorage<string[]>(`${STORAGE_KEY}_hiddenMonths`, []);
  const { data: storedFilters, clearStorage: clearFiltersStorage } = useLocalStorage<{
    filter: IFilter;
    categoryFilter: string;
    sortField: SortField;
    sortDirection: SortDirection;
  }>(`${STORAGE_KEY}_filters`, {
    filter: 'all',
    categoryFilter: '',
    sortField: 'Data',
    sortDirection: 'desc'
  });

  // Convert stored hidden months array to Set and sync with localStorage
  const hiddenMonths = ref<Set<string>>(new Set(storedHiddenMonths.value));
  const filter = ref<IFilter>(storedFilters.value.filter);
  const categoryFilter = ref<string>(storedFilters.value.categoryFilter);
  const sortField = ref<SortField>(storedFilters.value.sortField);
  const sortDirection = ref<SortDirection>(storedFilters.value.sortDirection);

  const editingItems = ref<Set<number>>(new Set());
  const formErrors = ref<Record<string, string>>({});

  // Watch for changes in hiddenMonths and sync to localStorage
  watch(
    hiddenMonths,
    (newHiddenMonths) => {
      storedHiddenMonths.value = Array.from(newHiddenMonths);
    },
    { deep: true }
  );

  // Watch for changes in filters and sync to localStorage
  watch(
    [filter, categoryFilter, sortField, sortDirection],
    ([newFilter, newCategoryFilter, newSortField, newSortDirection]) => {
      storedFilters.value = {
        filter: newFilter,
        categoryFilter: newCategoryFilter,
        sortField: newSortField,
        sortDirection: newSortDirection,
      };
    },
    { deep: true }
  );

  // Initialize recurrence functionality
  const recurrence = useRecurrence();

  // Computed properties
  const sortedData = computed(() => {
    // First, get all visible records (excluding hidden months)
    const visibleRecords = storedData.value.filter(item => {
      const date = new Date(item.Data);
      const monthKey = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`;
      return !hiddenMonths.value.has(monthKey);
    });

    // Calculate saldo chronologically (always by date, oldest first)
    const chronologicalRecords = [...visibleRecords].sort((a, b) => {
      const dateA = new Date(a.Data).getTime();
      const dateB = new Date(b.Data).getTime();
      return dateA - dateB; // Always ascending by date for saldo calculation
    });

    // Calculate running total (saldo) chronologically - FIXED: Only completed transactions
    let runningTotal = 0;
    const recordsWithSaldo = chronologicalRecords.map(item => {
      // Only add to running total if transaction is completed (✔️)
      if (item.Status === '✔️') {
        runningTotal += item.Valor;
      }
      return { ...item, Saldo: runningTotal };
    });

    // Now sort according to user preference for display
    return recordsWithSaldo.sort((a, b) => {
      let aValue: any = a[sortField.value];
      let bValue: any = b[sortField.value];

      // Handle date sorting
      if (sortField.value === 'Data') {
        aValue = new Date(aValue).getTime();
        bValue = new Date(bValue).getTime();
      }

      // Handle string sorting
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        aValue = aValue.toLowerCase();
        bValue = bValue.toLowerCase();
      }

      // Handle null/undefined values
      if (aValue == null && bValue == null) return 0;
      if (aValue == null) return 1;
      if (bValue == null) return -1;

      let comparison = 0;
      if (aValue < bValue) comparison = -1;
      if (aValue > bValue) comparison = 1;

      return sortDirection.value === 'desc' ? -comparison : comparison;
    });
  });

  const filteredData = computed(() => {
    let result = sortedData.value;

    // Apply type filter
    if (filter.value !== 'all') {
      result = result.filter(item => item.Tipo === filter.value);
    }

    // Apply category filter
    if (categoryFilter.value) {
      result = result.filter(item => item.Categoria === categoryFilter.value);
    }

    return result;
  });

  const groupedByMonth = computed(() => {
    const groups: Record<string, IFinanceRecordWithMonth[]> = {};

    filteredData.value.forEach(record => {
      const date = new Date(record.Data);
      const monthKey = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`;
      const monthName = date.toLocaleDateString('pt-BR', {
        year: 'numeric',
        month: 'long'
      });

      if (!groups[monthKey]) {
        groups[monthKey] = [];
      }
      groups[monthKey].push({ ...record, monthName });
    });

    // Sort months in descending order (newest first) and return as ordered object
    const sortedKeys = Object.keys(groups).sort((a, b) => {
      // Convert YYYY-MM format to comparable dates for reliable sorting
      const dateA = new Date(a + '-01'); // Add day to make valid date
      const dateB = new Date(b + '-01');
      return dateB.getTime() - dateA.getTime(); // Descending order (newest first)
    });
    const sortedGroups: Record<string, IFinanceRecordWithMonth[]> = {};

    sortedKeys.forEach(key => {
      // Sort records within each month by date (newest first)
      sortedGroups[key] = groups[key].sort((a, b) => new Date(b.Data).getTime() - new Date(a.Data).getTime());
    });

    return sortedGroups;
  });

  // Get all available months (including hidden ones) for management
  const allAvailableMonths = computed(() => {
    const months: Record<string, { key: string; name: string; isHidden: boolean; recordCount: number }> = {};

    storedData.value.forEach(record => {
      const date = new Date(record.Data);
      const monthKey = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`;
      const monthName = date.toLocaleDateString('pt-BR', {
        year: 'numeric',
        month: 'long'
      });

      if (!months[monthKey]) {
        months[monthKey] = {
          key: monthKey,
          name: monthName,
          isHidden: hiddenMonths.value.has(monthKey),
          recordCount: 0
        };
      }
      months[monthKey].recordCount++;
    });

    // Sort months in descending order (newest first) - December at top, January at bottom
    const sortedKeys = Object.keys(months).sort((a, b) => {
      // Convert YYYY-MM format to comparable dates for reliable sorting
      const dateA = new Date(a + '-01'); // Add day to make valid date
      const dateB = new Date(b + '-01');
      return dateB.getTime() - dateA.getTime(); // Descending order (newest first)
    });
    const sortedMonths: Record<string, { key: string; name: string; isHidden: boolean; recordCount: number }> = {};

    sortedKeys.forEach(key => {
      sortedMonths[key] = months[key];
    });

    return sortedMonths;
  });

  // Calculate saldo final excluding hidden months - FIXED: Only completed transactions
  const saldoFinal = computed(() => {
    return sortedData.value
      .filter(item => item.Status === '✔️') // Only completed transactions
      .reduce((acc, item) => acc + item.Valor, 0);
  });

  // Additional balance calculations
  const saldoPendente = computed(() => {
    return Math.abs(sortedData.value
      .filter(item => item.Status === '❌' && item.Tipo === 'Despesa') // Only pending expenses
      .reduce((acc, item) => acc + item.Valor, 0)); // Math.abs to get positive value
  });

  const saldoCompleto = computed(() => {
    return sortedData.value.reduce((acc, item) => acc + item.Valor, 0); // All transactions
  });

  // Sorting functions
  const setSorting = (field: SortField) => {
    if (sortField.value === field) {
      sortDirection.value = sortDirection.value === 'asc' ? 'desc' : 'asc';
    } else {
      sortField.value = field;
      sortDirection.value = field === 'Data' ? 'desc' : 'asc'; // Default to desc for dates, asc for others
    }
  };

  const getSortIcon = (field: SortField) => {
    if (sortField.value !== field) return 'fas fa-sort text-gray-400';
    return sortDirection.value === 'asc'
      ? 'fas fa-sort-up text-blue-500'
      : 'fas fa-sort-down text-blue-500';
  };

  // Form validation
  const validateForm = (formData: Partial<IFinanceFormData>) => {
    try {
      financeFormSchema.parse(formData);
      formErrors.value = {};
      return true;
    } catch (error) {
      if (error instanceof Error) {
        formErrors.value = {
          form: error.message
        };
      }
      return false;
    }
  };

  // Record validation
  const validateRecord = (record: Partial<IFinanceRecord>) => {
    try {
      financeRecordSchema.parse(record);
      return true;
    } catch (error) {
      return false;
    }
  };

  // CRUD operations with recurrence support
  const addRecord = (record: Omit<IFinanceRecord, 'Saldo'>) => {
    if (!validateForm(record)) return false;

    // Generate recurring records if enabled
    const recordsToAdd = recurrence.generateRecurringRecords(record);

    // Validate and add all records
    const validRecords = recordsToAdd.filter(rec => {
      const newRecord = { ...rec, Saldo: 0 };
      return validateRecord(newRecord);
    }).map(rec => ({ ...rec, Saldo: 0 }));

    if (validRecords.length > 0) {
      storedData.value = [...storedData.value, ...validRecords];
      return true;
    }
    return false;
  };

  const updateRecord = (index: number, record: Partial<IFinanceRecord>) => {
    if (!validateRecord(record)) return false;

    const currentRecord = filteredData.value[index];
    if (!currentRecord) return false;

    // Find the record in the original data array
    const originalIndex = storedData.value.findIndex(item =>
      item.Data === currentRecord.Data &&
      item.Descrição === currentRecord.Descrição &&
      item.Valor === currentRecord.Valor
    );

    if (originalIndex === -1) return false;

    const updatedRecord = {
      ...storedData.value[originalIndex],
      ...record,
      Saldo: 0, // Will be recalculated
    };

    storedData.value[originalIndex] = updatedRecord;
    return true;
  };

  const removeRecord = (index: number) => {
    const recordToRemove = filteredData.value[index];
    if (!recordToRemove) return false;

    // Find the record in the original data array
    const originalIndex = storedData.value.findIndex(item =>
      item.Data === recordToRemove.Data &&
      item.Descrição === recordToRemove.Descrição &&
      item.Valor === recordToRemove.Valor
    );

    if (originalIndex === -1) return false;

    storedData.value.splice(originalIndex, 1);
    return true;
  };

  const importRecords = (records: Omit<IFinanceRecord, 'Saldo'>[]) => {
    const validRecords = records.filter(record => validateRecord(record)).map(record => ({
      ...record,
      Saldo: 0 // Will be recalculated
    }));

    storedData.value = [...storedData.value, ...validRecords];
  };

  // Edit state management
  const toggleEdit = (index: number) => {
    if (editingItems.value.has(index)) {
      editingItems.value.delete(index);
    } else {
      editingItems.value.add(index);
    }
  };

  const startEditAll = () => {
    filteredData.value.forEach((_, index) => editingItems.value.add(index));
  };

  const cancelAllEdits = () => {
    editingItems.value.clear();
  };

  const isEditing = (index: number) => editingItems.value.has(index);

  // Filter management
  const setFilter = (newFilter: IFilter) => {
    filter.value = newFilter;
  };

  const setCategoryFilter = (category: string) => {
    categoryFilter.value = category;
  };

  const clearCategoryFilter = () => {
    categoryFilter.value = '';
  };

  const clearAllData = () => {
    clearStorage();
    clearHiddenMonthsStorage();
    clearFiltersStorage();
    recurrence.clearRecurrenceData();
    editingItems.value.clear();
    filter.value = 'all';
    categoryFilter.value = '';
    formErrors.value = {};
    hiddenMonths.value.clear();
    sortField.value = 'Data';
    sortDirection.value = 'desc';
  };

  // Export state persistence functions for debugging/management
  const getStateSnapshot = () => ({
    dataCount: storedData.value.length,
    hiddenMonthsCount: hiddenMonths.value.size,
    hiddenMonths: Array.from(hiddenMonths.value),
    currentFilter: filter.value,
    categoryFilter: categoryFilter.value,
    sortField: sortField.value,
    sortDirection: sortDirection.value,
    isRecurring: recurrence.isRecurring.value,
    recurrenceSettings: recurrence.recurrenceSettings.value,
  });

  const restoreFromSnapshot = (snapshot: any) => {
    // This could be used for import/export functionality in the future
  };

  // Month visibility management functions
  const toggleMonthVisibility = (monthKey: string) => {
    if (hiddenMonths.value.has(monthKey)) {
      hiddenMonths.value.delete(monthKey);
    } else {
      hiddenMonths.value.add(monthKey);
    }
  };

  const hideMonth = (monthKey: string) => {
    hiddenMonths.value.add(monthKey);
  };

  const showMonth = (monthKey: string) => {
    hiddenMonths.value.delete(monthKey);
  };

  const isMonthHidden = (monthKey: string) => {
    return hiddenMonths.value.has(monthKey);
  };

  const showAllMonths = () => {
    hiddenMonths.value.clear();
  };

  const getHiddenMonthsCount = () => {
    return hiddenMonths.value.size;
  };

  return {
    data: storedData,
    sortedData,
    filteredData,
    groupedByMonth,
    saldoFinal,
    saldoPendente,
    saldoCompleto,
    filter,
    categoryFilter,
    editingItems,
    formErrors,
    sortField,
    sortDirection,
    addRecord,
    updateRecord,
    removeRecord,
    importRecords,
    toggleEdit,
    startEditAll,
    cancelAllEdits,
    isEditing,
    setFilter,
    setCategoryFilter,
    clearCategoryFilter,
    validateForm,
    clearAllData,
    setSorting,
    getSortIcon,
    // Expose recurrence functionality
    recurrence,
    hiddenMonths,
    allAvailableMonths,
    toggleMonthVisibility,
    hideMonth,
    showMonth,
    isMonthHidden,
    showAllMonths,
    getHiddenMonthsCount,
    getStateSnapshot,
    restoreFromSnapshot,
  };
}
