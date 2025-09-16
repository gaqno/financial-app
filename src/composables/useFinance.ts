import { ref, computed } from 'vue';
import { financeRecordSchema, financeFormSchema } from '../types/finance';
import type { IFinanceRecord, IFinanceFormData } from '../types/finance';
import { useFinanceStore } from '../stores/financeStore';
import { useRecurrence } from './useRecurrence';


export function useFinance() {
  // Use store instead of direct Supabase access to avoid multiple instances
  const store = useFinanceStore();

  // Use store data directly instead of creating duplicates (with safety checks)
  const storedData = computed(() => store.records || []);
  const hiddenMonths = computed(() => store.hiddenMonths || new Set());
  const filter = computed(() => store.filter || 'all');
  const categoryFilter = computed(() => store.categoryFilter || '');
  const sortField = computed(() => store.sortField || 'Data');
  const sortDirection = computed(() => store.sortDirection || 'desc');

  // Legacy clearStorage methods for backward compatibility
  const clearStorage = () => {
    // Now uses store methods
    store.clearAllData();
  };
  const clearHiddenMonthsStorage = () => {
    store.showAllMonths();
  };
  const clearFiltersStorage = () => {
    store.setFilter('all');
    store.clearCategoryFilter();
    store.setSorting('Data', 'desc');
  };

  const editingItems = ref<Set<number>>(new Set());
  const formErrors = ref<Record<string, string>>({});

  // Watch for changes and sync to Supabase (handled by useSupabaseFinance)
  // These watchers are maintained for component compatibility

  // Initialize recurrence functionality
  const recurrence = useRecurrence();

  // Main computed property - use store sortedData
  const sortedData = computed(() => store.sortedData);

  // Form validation functions
  const validateFinanceRecord = (record: IFinanceRecord) => {
    return financeRecordSchema.safeParse(record);
  };

  const validateFinanceForm = (form: IFinanceFormData) => {
    return financeFormSchema.safeParse(form);
  };

  // Export the main data object like the original
  const data = computed(() => storedData.value);

  return {
    // Data
    data,
    storedData,
    sortedData,
    hiddenMonths,
    filter,
    categoryFilter,
    sortField,
    sortDirection,
    editingItems,
    formErrors,
    isLoading: store.isLoading,

    // Storage operations
    clearStorage,
    clearHiddenMonthsStorage,
    clearFiltersStorage,

    // Store operations
    addRecord: store.addRecord,
    updateRecord: store.updateRecord,
    deleteRecord: store.removeRecord,
    loadData: store.loadFromStorage,

    // Recurrence
    ...recurrence,

    // Validation
    validateFinanceRecord,
    validateFinanceForm,
  };
}
