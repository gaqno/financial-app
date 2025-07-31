<template>
  <!-- Investment Dashboard Content -->
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
    
    <!-- Resumo da Carteira -->
    <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <div class="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm font-medium text-gray-600">Total Investido</p>
            <p class="text-2xl font-bold text-gray-900">
              {{ totalInvested.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) }}
            </p>
          </div>
          <div class="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
            <i class="fas fa-wallet text-blue-600"></i>
          </div>
        </div>
      </div>

      <div class="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm font-medium text-gray-600">Rendimento</p>
            <p class="text-2xl font-bold" :class="totalYield >= 0 ? 'text-green-600' : 'text-red-600'">
              {{ totalYield.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) }}
            </p>
          </div>
          <div class="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
            <i class="fas fa-chart-line text-green-600"></i>
          </div>
        </div>
      </div>

      <div class="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm font-medium text-gray-600">Rentabilidade</p>
            <p class="text-2xl font-bold" :class="totalYieldPercentage >= 0 ? 'text-green-600' : 'text-red-600'">
              {{ totalYieldPercentage.toFixed(2) }}%
            </p>
          </div>
          <div class="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
            <i class="fas fa-percentage text-yellow-600"></i>
          </div>
        </div>
      </div>

      <div class="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm font-medium text-gray-600">Investimentos</p>
            <p class="text-2xl font-bold text-gray-900">{{ investments.length }}</p>
            <p class="text-xs text-gray-500">{{ activeInvestments.length }} ativos</p>
          </div>
          <div class="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
            <i class="fas fa-layer-group text-purple-600"></i>
          </div>
        </div>
      </div>
    </div>

      <!-- Gráfico de Alocação -->
      <div class="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
        <h3 class="text-lg font-semibold text-gray-900 mb-4">🎯 Distribuição da Carteira</h3>
        <div class="grid lg:grid-cols-2 gap-6">
          <div class="flex items-center justify-center">
            <canvas ref="allocationChartRef" width="300" height="300"></canvas>
          </div>
          <div class="space-y-3">
            <div 
              v-for="allocation in portfolioAllocation" 
              :key="allocation.category"
              class="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
            >
              <div class="flex items-center space-x-3">
                <div 
                  class="w-4 h-4 rounded-full"
                  :style="{ backgroundColor: allocation.color }"
                ></div>
                <span class="text-sm font-medium text-gray-700">{{ allocation.category }}</span>
              </div>
              <div class="text-right">
                <p class="text-sm font-semibold text-gray-900">
                  {{ allocation.amount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) }}
                </p>
                <p class="text-xs text-gray-500">{{ allocation.percentage.toFixed(1) }}%</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Projeções de Rendimento -->
      <ProjectionPanel 
        :projections="portfolioProjections"
        :total-portfolio-value="totalPortfolioValue"
        :simulate-investment="simulateInvestment"
      />

      <!-- Formulário de Adição -->
      <div class="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
        <h3 class="text-lg font-semibold text-gray-900 mb-4">➕ Adicionar Investimento</h3>
        <form @submit.prevent="handleAdd" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <div>
            <select 
              v-model="newInvestment.type" 
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            >
              <option value="" disabled>Selecione o tipo</option>
              <option v-for="(typeData, key) in INVESTMENT_TYPES" :key="key" :value="key">
                {{ typeData.icon }} {{ typeData.name }}
              </option>
            </select>
          </div>
          
          <div>
            <input 
              v-model="newInvestment.name"
              type="text" 
              placeholder="Nome do investimento"
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>

          <div>
            <input 
              v-model="newInvestment.institution"
              type="text" 
              placeholder="Instituição"
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>

          <div>
            <input 
              v-model.number="newInvestment.initialAmount"
              type="number" 
              step="0.01"
              placeholder="Valor inicial"
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>

          <div>
            <button 
              type="submit"
              class="w-full bg-blue-500 text-white py-2 px-4 rounded-lg font-medium hover:bg-blue-600 transition-colors"
            >
              <i class="fas fa-plus mr-2"></i>Adicionar
            </button>
          </div>
        </form>

        <!-- Campos adicionais (expandido) -->
        <div v-if="showAdvancedForm" class="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Taxa de Rendimento (%)</label>
            <input 
              v-model.number="newInvestment.yieldRate"
              type="number" 
              step="0.01"
              placeholder="Ex: 120 (para 120% do CDI)"
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Tipo de Rendimento</label>
            <select 
              v-model="newInvestment.yieldType"
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="CDI_PERCENTAGE">% do CDI</option>
              <option value="SELIC_PERCENTAGE">% da Selic</option>
              <option value="PERCENTAGE">Taxa Fixa (%)</option>
              <option value="FIXED">Valor Fixo</option>
            </select>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Data de Aplicação</label>
            <input 
              v-model="newInvestment.startDate"
              type="date" 
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>

        <button 
          @click="showAdvancedForm = !showAdvancedForm"
          class="mt-3 text-sm text-blue-600 hover:text-blue-800"
        >
          {{ showAdvancedForm ? 'Ocultar' : 'Mostrar' }} opções avançadas
        </button>
      </div>

      <!-- Filtros -->
      <div class="flex flex-wrap gap-2">
        <button 
          @click="setFilter('all')"
          :class="filter === 'all' ? 'bg-blue-500 text-white' : 'bg-white text-gray-700 border border-gray-300'"
          class="px-4 py-2 rounded-lg font-medium hover:bg-blue-600 hover:text-white transition-colors"
        >
          Todos ({{ investments.length }})
        </button>
        <button 
          @click="setFilter('RENDA_FIXA')"
          :class="filter === 'RENDA_FIXA' ? 'bg-green-500 text-white' : 'bg-white text-gray-700 border border-gray-300'"
          class="px-4 py-2 rounded-lg font-medium hover:bg-green-600 hover:text-white transition-colors"
        >
          🏦 Renda Fixa
        </button>
        <button 
          @click="setFilter('RENDA_VARIAVEL')"
          :class="filter === 'RENDA_VARIAVEL' ? 'bg-blue-500 text-white' : 'bg-white text-gray-700 border border-gray-300'"
          class="px-4 py-2 rounded-lg font-medium hover:bg-blue-600 hover:text-white transition-colors"
        >
          📊 Renda Variável
        </button>
        <button 
          @click="setFilter('FUNDOS')"
          :class="filter === 'FUNDOS' ? 'bg-yellow-500 text-white' : 'bg-white text-gray-700 border border-gray-300'"
          class="px-4 py-2 rounded-lg font-medium hover:bg-yellow-600 hover:text-white transition-colors"
        >
          💼 Fundos
        </button>
      </div>

      <!-- Lista de Investimentos -->
      <div class="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
        <div 
          v-for="investment in filteredInvestments" 
          :key="investment.id"
          class="bg-white rounded-xl shadow-sm p-6 border border-gray-100 hover:shadow-md transition-shadow cursor-pointer"
          @click="selectInvestment(investment)"
        >
          <div class="flex items-start justify-between mb-4">
            <div class="flex items-center space-x-2">
              <span class="text-2xl">{{ getInvestmentTypeIcon(investment.type) }}</span>
              <div>
                <h4 class="font-semibold text-gray-900">{{ investment.name }}</h4>
                <p class="text-sm text-gray-600">{{ investment.institution }}</p>
              </div>
            </div>
            <span 
              :class="investment.status === 'ACTIVE' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'"
              class="px-2 py-1 text-xs font-medium rounded-full"
            >
              {{ investment.status === 'ACTIVE' ? 'Ativo' : 'Inativo' }}
            </span>
          </div>

          <div class="space-y-2">
            <div class="flex justify-between">
              <span class="text-sm text-gray-600">Valor Aplicado:</span>
              <span class="text-sm font-medium">
                {{ investment.appliedAmount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) }}
              </span>
            </div>

            <div class="flex justify-between">
              <span class="text-sm text-gray-600">Valor Atual:</span>
              <span class="text-sm font-medium">
                {{ investment.currentAmount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) }}
              </span>
            </div>

            <div class="flex justify-between">
              <span class="text-sm text-gray-600">Rendimento:</span>
              <span 
                :class="getInvestmentYieldAmount(investment) >= 0 ? 'text-green-600' : 'text-red-600'"
                class="text-sm font-medium"
              >
                {{ getInvestmentYieldAmount(investment).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) }}
                ({{ getInvestmentYieldPercentage(investment).toFixed(2) }}%)
              </span>
            </div>

            <div v-if="investment.maturityDate" class="flex justify-between">
              <span class="text-sm text-gray-600">Vencimento:</span>
              <span class="text-sm font-medium">
                {{ new Date(investment.maturityDate).toLocaleDateString('pt-BR') }}
              </span>
            </div>
          </div>

          <div class="mt-4 flex space-x-2">
            <button 
              @click.stop="editInvestment(investment)"
              class="flex-1 bg-blue-50 text-blue-600 py-2 px-3 rounded-lg text-sm font-medium hover:bg-blue-100 transition-colors"
            >
              <i class="fas fa-edit mr-1"></i>Editar
            </button>
            <button 
              @click.stop="confirmDelete(investment)"
              class="flex-1 bg-red-50 text-red-600 py-2 px-3 rounded-lg text-sm font-medium hover:bg-red-100 transition-colors"
            >
              <i class="fas fa-trash mr-1"></i>Excluir
            </button>
          </div>
        </div>
      </div>

      <!-- Estado vazio -->
      <div v-if="filteredInvestments.length === 0" class="text-center py-12">
        <div class="w-24 h-24 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
          <i class="fas fa-chart-line text-gray-400 text-3xl"></i>
        </div>
        <h3 class="text-lg font-medium text-gray-900 mb-2">Nenhum investimento encontrado</h3>
        <p class="text-gray-600 mb-4">
          {{ filter === 'all' ? 'Comece adicionando seu primeiro investimento!' : 'Nenhum investimento nesta categoria.' }}
        </p>
        <button 
          v-if="filter !== 'all'"
          @click="clearFilter"
          class="bg-blue-500 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-600 transition-colors"
        >
          Ver todos os investimentos
        </button>
      </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, nextTick } from 'vue';
import { Chart, registerables } from 'chart.js';
import { useInvestments } from '../../composables/useInvestments';
import { INVESTMENT_TYPES, type InvestmentTypeKey } from '../../types/investments';
import ProjectionPanel from './ProjectionPanel.vue';

Chart.register(...registerables);

// Composables
const {
  investments,
  filteredInvestments,
  totalPortfolioValue,
  totalInvested,
  totalYield,
  totalYieldPercentage,
  portfolioAllocation,
  portfolioProjections,
  activeInvestments,
  filter,
  addInvestment,
  removeInvestment,
  setFilter,
  clearFilter,
  getInvestmentTypeIcon,
  getInvestmentYieldAmount,
  getInvestmentYieldPercentage,
  simulateInvestment,
  updateCurrentValues
} = useInvestments();

// State
const showAdvancedForm = ref(false);
const selectedInvestment = ref(null);
const allocationChartRef = ref<HTMLCanvasElement | null>(null);
let allocationChart: Chart | null = null;

// Reactive form data
const newInvestment = reactive({
  name: '',
  type: '' as InvestmentTypeKey,
  institution: '',
  initialAmount: 0,
  yieldType: 'CDI_PERCENTAGE' as const,
  yieldRate: 100,
  startDate: getCurrentDate(),
  maturityDate: '',
  status: 'ACTIVE' as const,
  autoReinvest: false
});

function getCurrentDate(): string {
  return new Date().toISOString().split('T')[0];
}

function resetForm(): void {
  Object.assign(newInvestment, {
    name: '',
    type: '',
    institution: '',
    initialAmount: 0,
    yieldType: 'CDI_PERCENTAGE',
    yieldRate: 100,
    startDate: getCurrentDate(),
    maturityDate: '',
    status: 'ACTIVE',
    autoReinvest: false
  });
}

function handleAdd(): void {
  if (!newInvestment.name || !newInvestment.type || !newInvestment.institution || newInvestment.initialAmount <= 0) {
    alert('Por favor, preencha todos os campos obrigatórios!');
    return;
  }

  addInvestment({
    ...newInvestment,
    currentAmount: newInvestment.initialAmount,
    appliedAmount: newInvestment.initialAmount,
    lastUpdate: getCurrentDate()
  });

  resetForm();
  showAdvancedForm.value = false;
  nextTick(() => {
    renderAllocationChart();
  });
}

function selectInvestment(investment: any): void {
  selectedInvestment.value = investment;
  // Aqui poderia abrir um modal de detalhes
}

function editInvestment(investment: any): void {
  // Implementar edição
  console.log('Editar investimento:', investment);
}

function confirmDelete(investment: any): void {
  if (confirm(`Tem certeza que deseja excluir "${investment.name}"?`)) {
    removeInvestment(investment.id);
    nextTick(() => {
      renderAllocationChart();
    });
  }
}

function renderAllocationChart(): void {
  if (!allocationChartRef.value || portfolioAllocation.value.length === 0) return;

  if (allocationChart) {
    allocationChart.destroy();
  }

  const ctx = allocationChartRef.value.getContext('2d');
  if (!ctx) return;

  allocationChart = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: portfolioAllocation.value.map(a => a.category),
      datasets: [{
        data: portfolioAllocation.value.map(a => a.amount),
        backgroundColor: portfolioAllocation.value.map(a => a.color),
        borderWidth: 2,
        borderColor: '#ffffff'
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: false
        },
        tooltip: {
          callbacks: {
            label: (context) => {
              const value = context.parsed;
              const total = portfolioAllocation.value.reduce((sum, a) => sum + a.amount, 0);
              const percentage = ((value / total) * 100).toFixed(1);
              return `${context.label}: ${value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} (${percentage}%)`;
            }
          }
        }
      }
    }
  });
}

onMounted(() => {
  updateCurrentValues();
  nextTick(() => {
    renderAllocationChart();
  });
});
</script>

<script lang="ts">
export default {
  name: 'InvestmentDashboard'
};
</script> 