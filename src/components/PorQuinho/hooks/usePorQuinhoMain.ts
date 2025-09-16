import { ref, computed, nextTick, watch } from 'vue';
import { storeToRefs } from 'pinia';
import { useFinanceStore } from '../../../stores/financeStore';
import { useDarkMode } from '../../../composables/useDarkMode';
import { useToast } from '../../../composables/useToast';
import type FinanceTable from '../../FinanceTable/FinanceTable.vue';
import type InvestmentDashboard from '../../investments/InvestmentDashboard.vue';

export function usePorQuinhoMain() {
  // Store integration
  const store = useFinanceStore();
  const { showEditSheet } = storeToRefs(store);
  const { isDarkMode, themeClass } = useDarkMode();
  const toast = useToast();

  // Defensive reset of potentially stuck modal states on init
  // Reset any stuck edit sheet state on component initialization
  if (showEditSheet.value) {
    store.closeEditSheet();
  }

  // Main state with enhanced debugging
  const activeTab = ref('transactions');
  const totalPortfolioValue = ref(0);
  const investmentCount = ref(0);
  const showCreateSheet = ref(false);

  // Enhanced tab management with UX feedback and dark mode awareness
  const setActiveTab = (tabId: string) => {
    console.log('🔄 [NAVIGATION] Switching tab:', {
      from: activeTab.value,
      to: tabId,
      darkMode: isDarkMode.value,
    });

    activeTab.value = tabId;
  };

  // Watch for activeTab changes for debugging
  watch(activeTab, (newTab, oldTab) => {
    console.log('🔄 [NAVIGATION] Tab changed:', { oldTab, newTab });
  });

  // Component refs
  const financeTableRef = ref<InstanceType<typeof FinanceTable> | null>(null);
  const investmentDashboardRef = ref<InstanceType<typeof InvestmentDashboard> | null>(null);

  // Computed properties
  const tabs = computed(() => [
    {
      id: 'transactions',
      label: 'Transações',
      icon: '💰',
      badge: store.records.length || null,
    },
    {
      id: 'investments',
      label: 'Investimentos',
      icon: '📈',
      badge: investmentCount.value || null,
    },
    {
      id: 'reports',
      label: 'Relatórios',
      icon: '📊',
      badge: null,
    },
  ]);

  const currentActiveTab = computed(() => activeTab.value);

  const currentBalance = computed(() => {
    switch (activeTab.value) {
      case 'transactions':
        return store.saldoFinal;
      case 'investments':
        return totalPortfolioValue.value;
      default:
        return 0;
    }
  });

  const shouldShowBalance = computed(() => {
    return activeTab.value === 'transactions' || activeTab.value === 'investments';
  });

  // Detect when any modal is open (either create or edit)
  const isModalOpen = computed(() => {
    return showCreateSheet.value || showEditSheet.value;
  });

  // Event handlers
  const handleNewRecord = () => {
    if (financeTableRef.value) {
      showCreateSheet.value = true;
      financeTableRef.value.openCreateSheet();
    }
  };

  // FAB Event Handlers
  const handleQuickAddIncome = async () => {
    if (financeTableRef.value) {
      // Track that create sheet is opening
      showCreateSheet.value = true;

      // Open the sheet and pre-select "Receita" type
      financeTableRef.value.openCreateSheet();

      // Use nextTick to ensure the form is ready before setting the type
      await nextTick();
      financeTableRef.value.setTransactionType('Receita');
    }
  };

  const handleQuickAddExpense = async () => {
    if (financeTableRef.value) {
      // Track that create sheet is opening
      showCreateSheet.value = true;

      // Open the sheet and pre-select "Despesa" type
      financeTableRef.value.openCreateSheet();

      // Use nextTick to ensure the form is ready before setting the type
      await nextTick();
      financeTableRef.value.setTransactionType('Despesa');
    }
  };

  const handleVoiceInput = () => {
    // TODO: Implement voice input functionality
    console.log('Voice input activated');
  };

  const handleScanReceipt = () => {
    // TODO: Implement receipt scanning functionality
    console.log('Receipt scanning activated');
  };

  const handleToggleFilters = () => {
    // TODO: Implement quick filters toggle
    console.log('Quick filters toggled');
  };

  const handlePortfolioUpdate = (data: { totalValue: number; count: number }) => {
    totalPortfolioValue.value = data.totalValue;
    investmentCount.value = data.count;
  };

  // Handle sheet open/close events from FinanceTable
  const handleSheetOpened = () => {
    showCreateSheet.value = true;
  };

  const handleSheetClosed = () => {
    showCreateSheet.value = false;
  };

  // Watch for edit sheet changes (handled by store)
  watch([showEditSheet], ([editSheetOpen]) => {
    // Edit sheet state is handled by the store, no additional logic needed
    console.log('Edit sheet state changed:', editSheetOpen);
  });

  return {
    // State
    activeTab,
    setActiveTab,
    totalPortfolioValue,
    investmentCount,
    showCreateSheet,

    // Refs
    financeTableRef,
    investmentDashboardRef,

    // Computed
    tabs,
    currentActiveTab,
    currentBalance,
    shouldShowBalance,
    isModalOpen,

    // Event handlers
    handleNewRecord,
    handleQuickAddIncome,
    handleQuickAddExpense,
    handleVoiceInput,
    handleScanReceipt,
    handleToggleFilters,
    handlePortfolioUpdate,
    handleSheetOpened,
    handleSheetClosed,

    // Dark mode and styling
    isDarkMode,
    themeClass,

    // Enhanced toast system
    toast,
  };
}
