<template>
  <div class="min-h-screen bg-gray-50 dark:bg-slate-900 theme-transition">
    <!-- Header with Tabs -->
    <header
      class="bg-white dark:bg-slate-800 shadow-sm border-b border-gray-200 dark:border-slate-600 sticky top-0 z-40 theme-transition">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex justify-between items-center h-16">
          <div class="flex items-center">
            <div>
              <h1 class="text-xl font-bold text-gray-900 dark:text-slate-100">🐷 por.quinho</h1>
              <p class="text-xs text-gray-500 dark:text-slate-400 italic">De pouco em pouco se enche o porquinho</p>
            </div>
          </div>
        </div>

        <!-- Tab Navigation with Balance and Actions -->
        <div class="border-t border-gray-200 dark:border-slate-600">
          <div class="flex justify-between items-center">
            <!-- Tabs -->
            <NavigationTabs :tabs="tabs" :active-tab="activeTab" @update:active-tab="activeTab = $event" />

            <!-- Balance and Actions -->
            <div class="hidden md:flex items-center space-x-4">
              <!-- Balance -->
              <div v-if="shouldShowBalance" class="flex items-center space-x-2">
                <span class="text-sm font-medium text-gray-600 dark:text-slate-300">
                  {{ currentActiveTab === 'transactions' ? 'Saldo:' : 'Carteira:' }}
                </span>
                <span :class="currentBalance < 0 ? 'text-red-600' : 'text-green-600'" class="text-lg font-semibold">
                  {{ currentBalance.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) }}
                </span>
              </div>

              <!-- New Record Button (only for transactions tab) -->
              <button v-if="activeTab === 'transactions'" @click="handleNewRecord"
                class="bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white py-2 px-4 rounded-lg font-medium transition-colors flex items-center gap-2 text-sm">
                <i class="fas fa-plus-circle"></i>
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
            <i class="fas fa-chart-bar text-gray-400 text-3xl"></i>
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
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import FinanceTable from './FinanceTable.vue';
import InvestmentDashboard from './investments/InvestmentDashboard.vue';
import NavigationTabs from './navigation/NavigationTabs/index.vue';
import { useFinanceStore } from '../stores/financeStore';

// Composables - FIXED: Use store instead of composable to respect smart projection
const store = useFinanceStore();

// Investment data will be received from InvestmentDashboard component via ref
const totalPortfolioValue = ref(0);
const investmentCount = ref(0);

// State
const activeTab = ref('transactions');

// Refs for child components
const financeTableRef = ref<InstanceType<typeof FinanceTable> | null>(null);
const investmentDashboardRef = ref<InstanceType<typeof InvestmentDashboard> | null>(null);

// Tabs configuration
const tabs = computed(() => [
  {
    id: 'transactions',
    label: 'Transações',
    icon: '💰',
    badge: store.records.length || null
  },
  {
    id: 'investments',
    label: 'Investimentos',
    icon: '📈',
    badge: investmentCount.value || null
  },
  {
    id: 'reports',
    label: 'Relatórios',
    icon: '📊',
    badge: null
  }
]);

// Computed
const currentActiveTab = computed(() => activeTab.value);

const currentBalance = computed(() => {
  switch (activeTab.value) {
    case 'transactions':
      // FIXED: Use store's saldoFinal which respects smart projection
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

// Methods
const handleNewRecord = () => {
  // Open the create sheet in FinanceTable
  if (financeTableRef.value) {
    financeTableRef.value.openCreateSheet();
  }
};

const handlePortfolioUpdate = (data: { totalValue: number; count: number }) => {
  totalPortfolioValue.value = data.totalValue;
  investmentCount.value = data.count;
};
</script>

<script lang="ts">
export default {
  name: 'PorQuinho'
};
</script>