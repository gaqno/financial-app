<template>
  <div class="min-h-screen bg-gray-50">
    <!-- Header with Tabs -->
    <header class="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex justify-between items-center h-16">
          <div class="flex items-center">
            <h1 class="text-xl font-bold text-gray-900">💰 FinanceApp</h1>
          </div>
          <div class="flex items-center space-x-2">
            <span class="text-sm font-medium text-gray-600 hidden sm:block">
              {{ currentActiveTab === 'transactions' ? 'Saldo:' : 'Carteira:' }}
            </span>
            <span 
              :class="currentBalance < 0 ? 'text-red-600' : 'text-green-600'" 
              class="text-sm font-semibold hidden sm:block"
            >
              {{ currentBalance.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) }}
            </span>
          </div>
        </div>

        <!-- Tab Navigation -->
        <div class="border-t border-gray-200">
          <nav class="flex space-x-8" aria-label="Tabs">
            <button
              v-for="tab in tabs"
              :key="tab.id"
              @click="activeTab = tab.id"
              :class="[
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300',
                'whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm'
              ]"
            >
              <span class="mr-2">{{ tab.icon }}</span>
              {{ tab.label }}
              <span 
                v-if="tab.badge"
                class="ml-2 bg-gray-100 text-gray-600 py-0.5 px-2 rounded-full text-xs"
              >
                {{ tab.badge }}
              </span>
            </button>
          </nav>
        </div>
      </div>
    </header>

    <!-- Tab Content -->
    <main>
      <!-- Transações Tab -->
      <div v-show="activeTab === 'transactions'">
        <FinanceTable />
      </div>

      <!-- Investimentos Tab -->
      <div v-show="activeTab === 'investments'">
        <InvestmentDashboard />
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
import { useFinance } from '../composables/useFinance';
import { useInvestments } from '../composables/useInvestments';

// Composables
const { saldoFinal, data } = useFinance();
const { totalPortfolioValue, investments } = useInvestments();

// State
const activeTab = ref('transactions');

// Tabs configuration
const tabs = computed(() => [
  {
    id: 'transactions',
    label: 'Transações',
    icon: '💰',
    badge: data.value.length || null
  },
  {
    id: 'investments',
    label: 'Investimentos',
    icon: '📈',
    badge: investments.value.length || null
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
      return saldoFinal.value;
    case 'investments':
      return totalPortfolioValue.value;
    default:
      return 0;
  }
});
</script>

<script lang="ts">
export default {
  name: 'FinanceApp'
};
</script> 