<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-900 theme-transition">
    <!-- Header with Tabs -->
    <header
      class="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-600 sticky top-0 z-40 theme-transition"
    >
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex justify-between items-center h-16">
          <div class="flex items-center">
            <div>
              <h1 class="text-xl font-bold text-gray-900 dark:text-gray-100">🐷 por.quinho</h1>
              <p class="text-xs text-gray-500 dark:text-gray-400 italic">De pouco em pouco se enche o porquinho</p>
            </div>
          </div>
        </div>

        <!-- Tab Navigation with Balance and Actions -->
        <div class="border-t border-gray-200 dark:border-gray-600">
          <div class="flex justify-between items-center">
            <!-- Tabs -->
            <NavigationTabs :tabs="tabs" :active-tab="activeTab" @update:active-tab="activeTab = $event" />

            <!-- Balance and Actions -->
            <div class="hidden md:flex items-center space-x-4">
              <!-- Balance -->
              <div class="flex items-center space-x-2">
                <span class="text-sm font-medium text-gray-600 dark:text-gray-300">
                  {{ currentActiveTab === 'transactions' ? 'Saldo:' : 'Carteira:' }}
                </span>
                <span :class="currentBalance < 0 ? 'text-red-600' : 'text-green-600'" class="text-lg font-semibold">
                  {{ currentBalance.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) }}
                </span>
              </div>

              <!-- New Record Button (only for transactions tab) -->
              <button
                v-if="activeTab === 'transactions'"
                @click="handleNewRecord"
                class="bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg font-medium transition-colors flex items-center gap-2 text-sm"
              >
                <i class="fas fa-plus-circle" />
                <span class="hidden sm:inline">Novo Registro</span>
                <span class="sm:hidden">+</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </header>

    <!-- Tab Content -->
    <main>
      <!-- Transações Tab -->
      <div v-show="activeTab === 'transactions'">
        <FinanceTable ref="financeTableRef" />
      </div>

      <!-- Investimentos Tab -->
      <div v-show="activeTab === 'investments'">
        <InvestmentDashboard ref="investmentDashboardRef" @portfolio-updated="handlePortfolioUpdate" />
      </div>

      <!-- Relatórios Tab (Placeholder) -->
      <div v-show="activeTab === 'reports'" class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div class="bg-white rounded-xl shadow-sm p-12 text-center">
          <div class="w-24 h-24 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
            <i class="fas fa-chart-bar text-gray-400 text-3xl" />
          </div>
          <h3 class="text-xl font-semibold text-gray-900 mb-2">Relatórios em Desenvolvimento</h3>
          <p class="text-gray-600 mb-4">
            Em breve você terá acesso a relatórios detalhados sobre suas finanças e investimentos.
          </p>
          <div class="flex justify-center space-x-4 text-sm text-gray-500">
            <span>📊 Análise de gastos</span>
            <span>📈 Performance de investimentos</span>
            <span>📋 Relatório mensal</span>
          </div>
        </div>
      </div>
    </main>

    <!-- Mobile FAB - Only show on transactions tab -->
    <!-- DEBUG: Currently visible on all screen sizes for testing -->
    <FloatingActionButton
      v-if="activeTab === 'transactions'"
      @quick-add-income="handleQuickAddIncome"
      @quick-add-expense="handleQuickAddExpense"
      @voice-input="handleVoiceInput"
      @scan-receipt="handleScanReceipt"
      @toggle-filters="handleToggleFilters"
    />

    <!-- DEBUG: Active tab indicator -->
    <div class="fixed top-4 left-4 z-[10000] bg-red-500 text-white px-2 py-1 rounded text-xs">
      Active Tab: {{ activeTab }}
    </div>
  </div>
</template>

<script setup lang="ts">
  import { ref, computed } from 'vue';
  import FinanceTable from './FinanceTable/FinanceTable.vue';
  import InvestmentDashboard from './investments/InvestmentDashboard.vue';
  import NavigationTabs from './navigation/NavigationTabs/index.vue';
  import FloatingActionButton from './mobile/FloatingActionButton.vue';
  import { useFinanceStore } from '../stores/financeStore';

  const store = useFinanceStore();

  const totalPortfolioValue = ref(0);
  const investmentCount = ref(0);

  const activeTab = ref('transactions');

  const financeTableRef = ref<InstanceType<typeof FinanceTable> | null>(null);
  const investmentDashboardRef = ref<InstanceType<typeof InvestmentDashboard> | null>(null);

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

  const handleNewRecord = () => {
    if (financeTableRef.value) {
      financeTableRef.value.openCreateSheet();
    }
  };

  // FAB Event Handlers
  const handleQuickAddIncome = () => {
    if (financeTableRef.value) {
      financeTableRef.value.openCreateSheet();
      // TODO: Pre-select "Receita" type when opening the form
    }
  };

  const handleQuickAddExpense = () => {
    if (financeTableRef.value) {
      financeTableRef.value.openCreateSheet();
      // TODO: Pre-select "Despesa" type when opening the form
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
</script>

<script lang="ts">
  export default {
    name: 'PorQuinho',
  };
</script>
