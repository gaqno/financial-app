<template>
  <!-- Investment Dashboard Content -->
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
    <!-- Resumo da Carteira -->
    <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <div
        class="bg-white dark:bg-gray-900 rounded-xl shadow-sm p-6 border border-gray-100 dark:border-gray-800 transition-colors"
      >
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm font-medium text-gray-600 dark:text-gray-300">Total Investido</p>
            <p class="text-2xl font-bold text-gray-900 dark:text-white">
              {{ totalInvested.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) }}
            </p>
          </div>
          <div class="w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
            <i class="fas fa-wallet text-blue-600 dark:text-blue-300"></i>
          </div>
        </div>
      </div>

      <div
        class="bg-white dark:bg-gray-900 rounded-xl shadow-sm p-6 border border-gray-100 dark:border-gray-800 transition-colors"
      >
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm font-medium text-gray-600 dark:text-gray-300">Rendimento</p>
            <p
              class="text-2xl font-bold"
              :class="(totalReturn || 0) >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'"
            >
              {{ (totalReturn || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) }}
            </p>
          </div>
          <div class="w-10 h-10 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center">
            <i class="fas fa-chart-line text-green-600 dark:text-green-300"></i>
          </div>
        </div>
      </div>

      <div
        class="bg-white dark:bg-gray-900 rounded-xl shadow-sm p-6 border border-gray-100 dark:border-gray-800 transition-colors"
      >
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm font-medium text-gray-600 dark:text-gray-300">Rentabilidade</p>
            <p
              class="text-2xl font-bold"
              :class="
                (returnPercentage || 0) >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
              "
            >
              {{ (returnPercentage || 0).toFixed(2) }}%
            </p>
          </div>
          <div class="w-10 h-10 bg-yellow-100 dark:bg-yellow-900 rounded-lg flex items-center justify-center">
            <i class="fas fa-percentage text-yellow-600 dark:text-yellow-300"></i>
          </div>
        </div>
      </div>

      <div
        class="bg-white dark:bg-gray-900 rounded-xl shadow-sm p-6 border border-gray-100 dark:border-gray-800 transition-colors"
      >
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm font-medium text-gray-600 dark:text-gray-300">Investimentos</p>
            <p class="text-2xl font-bold text-gray-900 dark:text-white">{{ investments.length }}</p>
            <p class="text-xs text-gray-500 dark:text-gray-400">
              {{ investments.filter((inv) => inv.status === 'ACTIVE').length }} ativos
            </p>
          </div>
          <div class="w-10 h-10 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center">
            <i class="fas fa-layer-group text-purple-600 dark:text-purple-300"></i>
          </div>
        </div>
      </div>
    </div>

    <!-- Gráfico de Alocação -->
    <div
      class="bg-white dark:bg-gray-900 rounded-xl shadow-sm p-6 border border-gray-100 dark:border-gray-800 transition-colors"
    >
      <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">🎯 Distribuição da Carteira</h3>
      <div class="grid lg:grid-cols-2 gap-6">
        <div class="flex items-center justify-center">
          <canvas ref="allocationChartRef" width="300" height="300"></canvas>
        </div>
        <div class="space-y-3">
          <div
            v-for="allocation in portfolioAllocation"
            :key="allocation.category"
            class="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg transition-colors"
          >
            <div class="flex items-center space-x-3">
              <div class="w-4 h-4 rounded-full" :style="{ backgroundColor: allocation.color }"></div>
              <span class="text-sm font-medium text-gray-700 dark:text-gray-100">
                {{ allocation.category }}
              </span>
            </div>
            <div class="text-right">
              <p class="text-sm font-semibold text-gray-900 dark:text-white">
                {{ allocation.amount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) }}
              </p>
              <p class="text-xs text-gray-500 dark:text-gray-400">{{ allocation.percentage.toFixed(1) }}%</p>
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

    <!-- Formulário de Adição - Layout de Dois Cards -->
    <div class="space-y-4">
      <h3 class="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
        <i class="fas fa-plus mr-2 text-blue-600 dark:text-blue-300"></i>
        Adicionar Novo Investimento
      </h3>

      <form @submit="onSubmit" class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <!-- Card 1: Informações Básicas -->
        <div
          class="bg-white dark:bg-gray-900 rounded-xl shadow-sm p-6 border border-gray-100 dark:border-gray-800 transition-colors"
        >
          <div class="flex items-center justify-between mb-4">
            <h4 class="text-md font-semibold text-gray-800 dark:text-white flex items-center">
              <i class="fas fa-info-circle mr-2 text-blue-500 dark:text-blue-300"></i>
              Informações Básicas
            </h4>
            <span class="text-xs bg-blue-50 dark:bg-blue-900 text-blue-600 dark:text-blue-200 px-2 py-1 rounded-full"
              >Obrigatório</span
            >
          </div>

          <div class="space-y-4">
            <!-- Tipo de Investimento -->
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-100 mb-2">
                <i class="fas fa-chart-pie mr-1"></i>
                Tipo de Investimento
              </label>
              <select
                v-model="type"
                v-bind="typeAttrs"
                class="w-full px-3 py-3 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:focus:ring-blue-400 bg-gray-50 dark:bg-gray-800 hover:bg-white dark:hover:bg-gray-700 transition-colors"
                required
              >
                <option value="" disabled>Selecione o tipo de investimento</option>
                <option v-for="(typeData, key) in INVESTMENT_TYPES" :key="key" :value="key">
                  {{ typeData.icon }} {{ typeData.name }}
                </option>
              </select>
            </div>

            <!-- Nome do Investimento -->
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-100 mb-2">
                <i class="fas fa-tag mr-1"></i>
                Nome do Investimento
              </label>
              <input
                v-model="name"
                v-bind="nameAttrs"
                type="text"
                placeholder="Ex: CDB Banco X, Tesouro IPCA+ 2029..."
                class="w-full px-3 py-3 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:focus:ring-blue-400 bg-gray-50 dark:bg-gray-800 hover:bg-white dark:hover:bg-gray-700 transition-colors"
                required
              />
            </div>

            <!-- Instituição -->
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-100 mb-2">
                <i class="fas fa-university mr-1"></i>
                Instituição Financeira
              </label>
              <input
                v-model="institution"
                v-bind="institutionAttrs"
                type="text"
                placeholder="Ex: Nubank, BTG Pactual, XP Investimentos..."
                class="w-full px-3 py-3 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:focus:ring-blue-400 bg-gray-50 dark:bg-gray-800 hover:bg-white dark:hover:bg-gray-700 transition-colors"
                required
              />
            </div>

            <!-- Valor Inicial -->
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-100 mb-2">
                <i class="fas fa-dollar-sign mr-1"></i>
                Valor do Investimento (R$)
              </label>
              <input
                v-model.number="initialAmount"
                v-bind="initialAmountAttrs"
                type="number"
                step="0.01"
                placeholder="10000.00"
                min="0"
                class="w-full px-3 py-3 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:focus:ring-blue-400 bg-gray-50 dark:bg-gray-800 hover:bg-white dark:hover:bg-gray-700 transition-colors"
                required
              />
              <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">Este será o valor inicial aplicado</p>
            </div>
          </div>
        </div>

        <!-- Card 2: Configurações Avançadas -->
        <div
          class="bg-white dark:bg-gray-900 rounded-xl shadow-sm p-6 border border-gray-100 dark:border-gray-800 transition-colors"
        >
          <div class="flex items-center justify-between mb-4">
            <h4 class="text-md font-semibold text-gray-800 dark:text-white flex items-center">
              <i class="fas fa-cog mr-2 text-green-500 dark:text-green-300"></i>
              Configurações Avançadas
            </h4>
            <span
              class="text-xs bg-green-50 dark:bg-green-900 text-green-600 dark:text-green-200 px-2 py-1 rounded-full"
              >Opcional</span
            >
          </div>

          <div class="space-y-4">
            <!-- Taxa de Rendimento -->
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-100 mb-2">
                <i class="fas fa-percentage mr-1"></i>
                Taxa de Rendimento
              </label>
              <div class="grid grid-cols-2 gap-2">
                <input
                  v-model.number="yieldRate"
                  v-bind="yieldRateAttrs"
                  type="number"
                  step="0.01"
                  placeholder="120"
                  min="0"
                  class="px-3 py-3 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 dark:focus:ring-green-400 bg-gray-50 dark:bg-gray-800 hover:bg-white dark:hover:bg-gray-700 transition-colors"
                />
                <select
                  v-model="yieldType"
                  v-bind="yieldTypeAttrs"
                  class="px-3 py-3 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 dark:focus:ring-green-400 bg-gray-50 dark:bg-gray-800 hover:bg-white dark:hover:bg-gray-700 transition-colors"
                >
                  <option v-for="(label, key) in YIELD_TYPES" :key="key" :value="key">
                    {{ label }}
                  </option>
                </select>
              </div>
              <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">Ex: 120% do CDI, 10% ao ano, etc.</p>
            </div>

            <!-- Data de Aplicação -->
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-100 mb-2">
                <i class="fas fa-calendar-alt mr-1"></i>
                Data de Aplicação
              </label>
              <input
                v-model="startDate"
                v-bind="startDateAttrs"
                type="date"
                class="w-full px-3 py-3 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 dark:focus:ring-green-400 bg-gray-50 dark:bg-gray-800 hover:bg-white dark:hover:bg-gray-700 transition-colors"
              />
            </div>

            <!-- Data de Vencimento -->
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-100 mb-2">
                <i class="fas fa-calendar-check mr-1"></i>
                Data de Vencimento
              </label>
              <input
                v-model="maturityDate"
                v-bind="maturityDateAttrs"
                type="date"
                class="w-full px-3 py-3 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 dark:focus:ring-green-400 bg-gray-50 dark:bg-gray-800 hover:bg-white dark:hover:bg-gray-700 transition-colors"
              />
              <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Deixe em branco se não houver vencimento definido
              </p>
            </div>

            <!-- Reinvestimento Automático -->
            <div class="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg transition-colors">
              <label class="flex items-center space-x-3">
                <input
                  v-model="autoReinvest"
                  v-bind="autoReinvestAttrs"
                  type="checkbox"
                  class="w-4 h-4 text-green-600 dark:text-green-400 bg-gray-100 dark:bg-gray-700 border-gray-300 dark:border-gray-600 rounded focus:ring-green-500 dark:focus:ring-green-400"
                />
                <div>
                  <span class="text-sm font-medium text-gray-700 dark:text-gray-100"> Reinvestimento Automático </span>
                  <p class="text-xs text-gray-500 dark:text-gray-400">Reinvestir automaticamente os rendimentos</p>
                </div>
              </label>
            </div>
          </div>
        </div>

        <!-- Botão de Ação (spanning both columns) -->
        <div class="lg:col-span-2">
          <div
            class="flex items-center justify-between p-6 bg-gradient-to-r from-blue-50 to-green-50 dark:from-blue-900 dark:to-green-900 rounded-xl border border-blue-100 dark:border-blue-900 transition-colors"
          >
            <div>
              <p class="text-sm font-medium text-gray-700 dark:text-gray-100">
                Pronto para adicionar seu investimento?
              </p>
              <p class="text-xs text-gray-500 dark:text-gray-400">
                Verifique se todos os dados estão corretos antes de prosseguir
              </p>
            </div>
            <button
              type="submit"
              :disabled="isAddingInvestment"
              class="bg-gradient-to-r from-blue-500 to-green-500 dark:from-blue-700 dark:to-green-700 text-white py-3 px-8 rounded-lg font-medium hover:from-blue-600 hover:to-green-600 dark:hover:from-blue-800 dark:hover:to-green-800 disabled:from-gray-400 disabled:to-gray-400 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-105 disabled:hover:scale-100 shadow-lg"
            >
              <i v-if="!isAddingInvestment" class="fas fa-plus mr-2"></i>
              <i v-else class="fas fa-spinner fa-spin mr-2"></i>
              {{ isAddingInvestment ? 'Adicionando...' : 'Adicionar Investimento' }}
            </button>
          </div>
        </div>
      </form>
    </div>

    <!-- Filtros -->
    <div class="flex flex-wrap gap-2">
      <button
        @click="setFilter('all')"
        :class="
          filter === 'all'
            ? 'bg-blue-500 text-white dark:bg-blue-600'
            : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 border border-gray-300 dark:border-gray-700'
        "
        class="px-4 py-2 rounded-lg font-medium hover:bg-blue-600 hover:text-white dark:hover:bg-blue-700 dark:hover:text-white transition-colors"
      >
        Todos ({{ investments.length }})
      </button>
      <button
        @click="setFilter('RENDA_FIXA')"
        :class="
          filter === 'RENDA_FIXA'
            ? 'bg-green-500 text-white dark:bg-green-600'
            : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 border border-gray-300 dark:border-gray-700'
        "
        class="px-4 py-2 rounded-lg font-medium hover:bg-green-600 hover:text-white dark:hover:bg-green-700 dark:hover:text-white transition-colors"
      >
        🏦 Renda Fixa
      </button>
      <button
        @click="setFilter('RENDA_VARIAVEL')"
        :class="
          filter === 'RENDA_VARIAVEL'
            ? 'bg-blue-500 text-white dark:bg-blue-600'
            : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 border border-gray-300 dark:border-gray-700'
        "
        class="px-4 py-2 rounded-lg font-medium hover:bg-blue-600 hover:text-white dark:hover:bg-blue-700 dark:hover:text-white transition-colors"
      >
        📊 Renda Variável
      </button>
      <button
        @click="setFilter('FUNDOS')"
        :class="
          filter === 'FUNDOS'
            ? 'bg-yellow-500 text-white dark:bg-yellow-600'
            : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 border border-gray-300 dark:border-gray-700'
        "
        class="px-4 py-2 rounded-lg font-medium hover:bg-yellow-600 hover:text-white dark:hover:bg-yellow-700 dark:hover:text-white transition-colors"
      >
        💼 Fundos
      </button>
    </div>

    <!-- Lista de Investimentos -->
    <div class="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
      <div
        v-for="investment in filteredInvestments"
        :key="investment.id"
        class="bg-white dark:bg-gray-900 rounded-xl shadow-sm p-6 border border-gray-100 dark:border-gray-800 hover:shadow-md transition-shadow cursor-pointer"
        @click="selectInvestment(investment)"
      >
        <div class="flex items-start justify-between mb-4">
          <div class="flex items-center space-x-2">
            <span class="text-2xl">{{ getInvestmentTypeIcon(investment.type) }}</span>
            <div>
              <h4 class="font-semibold text-gray-900 dark:text-white">{{ investment.name }}</h4>
              <p class="text-sm text-gray-600 dark:text-gray-300">{{ investment.institution }}</p>
            </div>
          </div>
          <span
            :class="
              investment.status === 'ACTIVE'
                ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-300'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300'
            "
            class="px-2 py-1 text-xs font-medium rounded-full"
          >
            {{ investment.status === 'ACTIVE' ? 'Ativo' : 'Inativo' }}
          </span>
        </div>

        <div class="space-y-2">
          <div class="flex justify-between">
            <span class="text-sm text-gray-600 dark:text-gray-300">Valor Aplicado:</span>
            <span class="text-sm font-medium text-gray-900 dark:text-white">
              {{
                investment.appliedAmount.toLocaleString('pt-BR', {
                  style: 'currency',
                  currency: 'BRL',
                })
              }}
            </span>
          </div>

          <div class="flex justify-between">
            <span class="text-sm text-gray-600 dark:text-gray-300">Valor Atual:</span>
            <span class="text-sm font-medium text-gray-900 dark:text-white">
              {{
                investment.currentAmount.toLocaleString('pt-BR', {
                  style: 'currency',
                  currency: 'BRL',
                })
              }}
            </span>
          </div>

          <div class="flex justify-between">
            <span class="text-sm text-gray-600 dark:text-gray-300">Rendimento:</span>
            <span
              :class="
                getInvestmentYieldAmount(investment) >= 0
                  ? 'text-green-600 dark:text-green-400'
                  : 'text-red-600 dark:text-red-400'
              "
              class="text-sm font-medium"
            >
              {{
                getInvestmentYieldAmount(investment).toLocaleString('pt-BR', {
                  style: 'currency',
                  currency: 'BRL',
                })
              }}
              ({{ getInvestmentYieldPercentage(investment).toFixed(2) }}%)
            </span>
          </div>

          <div v-if="investment.maturityDate" class="flex justify-between">
            <span class="text-sm text-gray-600 dark:text-gray-300">Vencimento:</span>
            <span class="text-sm font-medium text-gray-900 dark:text-white">
              {{ formatDateForDisplay(investment.maturityDate) }}
            </span>
          </div>
        </div>

        <div class="mt-4 flex space-x-2">
          <button
            @click.stop="editInvestment(investment)"
            class="flex-1 bg-blue-50 dark:bg-blue-900 text-blue-600 dark:text-blue-300 py-2 px-3 rounded-lg text-sm font-medium hover:bg-blue-100 dark:hover:bg-blue-800 transition-colors"
          >
            <i class="fas fa-edit mr-1"></i>
            Editar
          </button>
          <button
            @click.stop="confirmDelete(investment)"
            class="flex-1 bg-red-50 dark:bg-red-900 text-red-600 dark:text-red-300 py-2 px-3 rounded-lg text-sm font-medium hover:bg-red-100 dark:hover:bg-red-800 transition-colors"
          >
            <i class="fas fa-trash mr-1"></i>
            Excluir
          </button>
        </div>
      </div>
    </div>

    <!-- Estado vazio -->
    <div v-if="filteredInvestments.length === 0" class="text-center py-12">
      <div class="w-24 h-24 mx-auto mb-4 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center">
        <i class="fas fa-chart-line text-gray-400 dark:text-gray-600 text-3xl"></i>
      </div>
      <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-2">Nenhum investimento encontrado</h3>
      <p class="text-gray-600 dark:text-gray-300 mb-4">
        {{
          filter === 'all' ? 'Comece adicionando seu primeiro investimento!' : 'Nenhum investimento nesta categoria.'
        }}
      </p>
      <button
        v-if="filter !== 'all'"
        @click="clearFilter"
        class="bg-blue-500 dark:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-600 dark:hover:bg-blue-800 transition-colors"
      >
        Ver todos os investimentos
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { ref, reactive, computed, watch, onMounted, nextTick } from 'vue';
  import { Chart, registerables } from 'chart.js';
  import { useForm } from 'vee-validate';
  import { toTypedSchema } from '@vee-validate/zod';
  import { useInvestments } from '../../composables/useInvestments';
  import { formatDateForDisplay } from '../../utils/dateUtils';
  import {
    investmentSchema,
    transformInvestmentData,
    getDefaultValues,
    YIELD_TYPES,
    INVESTMENT_STATUS,
  } from '../../schemas/investmentSchema';
  import ProjectionPanel from './ProjectionPanel.vue';

  Chart.register(...registerables);

  // Emits
  const emit = defineEmits<{
    'portfolio-updated': [data: { totalValue: number; count: number }];
  }>();

  // Composables
  const {
    investments,
    filteredInvestments,
    totalPortfolioValue,
    totalInvested,
    totalReturn,
    returnPercentage,
    portfolioAllocation,
    filter,
    addInvestment,
    deleteInvestment,
    getInvestmentProjections,
    getPortfolioProjections,
    simulateInvestment,
    setFilter,
    clearFilter,
    getInvestmentTypeIcon,
    getInvestmentYieldAmount,
    getInvestmentYieldPercentage,
    INVESTMENT_TYPES,
  } = useInvestments();

  // State
  const selectedInvestment = ref(null);
  const allocationChartRef = ref<HTMLCanvasElement | null>(null);
  const isAddingInvestment = ref(false);
  let allocationChart: Chart | null = null;

  // Form validation with vee-validate and Zod
  const { defineField, handleSubmit, errors, meta, resetForm, setValues } = useForm({
    validationSchema: toTypedSchema(investmentSchema),
    initialValues: getDefaultValues(),
  });

  // Define campos do formulário com validação
  const [name, nameAttrs] = defineField('name');
  const [type, typeAttrs] = defineField('type');
  const [institution, institutionAttrs] = defineField('institution');
  const [initialAmount, initialAmountAttrs] = defineField('initialAmount');
  const [yieldType, yieldTypeAttrs] = defineField('yieldType');
  const [yieldRate, yieldRateAttrs] = defineField('yieldRate');
  const [startDate, startDateAttrs] = defineField('startDate');
  const [maturityDate, maturityDateAttrs] = defineField('maturityDate');
  const [autoReinvest, autoReinvestAttrs] = defineField('autoReinvest');

  // Inicializar valores padrão
  const initializeFormDefaults = () => {
    const defaults = getDefaultValues();
    setValues(defaults);
  };

  // Resetar formulário com valores padrão
  const resetFormWithDefaults = () => {
    const defaults = getDefaultValues();
    setValues(defaults);
  };

  // Inicializar valores padrão na montagem do componente
  onMounted(() => {
    initializeFormDefaults();
  });

  // Submit handler com validação
  const onSubmit = handleSubmit(async (values) => {
    if (isAddingInvestment.value) return;

    isAddingInvestment.value = true;

    try {
      const investmentData = transformInvestmentData(values);
      await addInvestment(investmentData);

      resetFormWithDefaults();

      await nextTick();
      renderAllocationChart();
    } catch (error) {
      console.error('❌ Erro ao adicionar investimento:', error);
      alert('Erro ao adicionar investimento. Tente novamente.');
    } finally {
      isAddingInvestment.value = false;
    }
  });

  // Computed para validação visual
  const isFormValid = computed(() => meta.value.valid);
  const hasErrors = computed(() => Object.keys(errors.value).length > 0);

  function selectInvestment(investment: any): void {
    selectedInvestment.value = investment;
    // Aqui poderia abrir um modal de detalhes
  }

  function editInvestment(investment: any): void {
    // Implementar edição
  }

  function confirmDelete(investment: any): void {
    if (confirm(`Tem certeza que deseja excluir "${investment.name}"?`)) {
      deleteInvestment(investment.id);
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
        labels: portfolioAllocation.value.map((a) => a.category),
        datasets: [
          {
            data: portfolioAllocation.value.map((a) => a.amount),
            backgroundColor: portfolioAllocation.value.map((a) => a.color),
            borderWidth: 2,
            borderColor: '#ffffff',
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false,
          },
          tooltip: {
            callbacks: {
              label: (context) => {
                const value = context.parsed;
                const total = portfolioAllocation.value.reduce((sum, a) => sum + a.amount, 0);
                const percentage = ((value / total) * 100).toFixed(1);
                return `${context.label}: ${value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} (${percentage}%)`;
              },
            },
          },
        },
      },
    });
  }

  // Computed properties for projections
  const portfolioProjections = computed(() => {
    return getPortfolioProjections();
  });

  // Watch for portfolio changes and emit to parent
  watch(
    [totalPortfolioValue, investments],
    ([newTotal, newInvestments]) => {
      emit('portfolio-updated', {
        totalValue: newTotal,
        count: newInvestments.length,
      });
    },
    { immediate: true }
  );

  onMounted(() => {
    nextTick(() => {
      renderAllocationChart();
    });
  });
</script>

<script lang="ts">
  export default {
    name: 'InvestmentDashboard',
  };
</script>
