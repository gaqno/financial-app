<template>
  <div
    class="bg-white dark:bg-dark-900 rounded-xl shadow-sm p-6 border border-gray-100 dark:border-gray-700 transition-colors"
  >
    <div class="flex items-center justify-between mb-6">
      <h3 class="text-lg font-semibold text-gray-900 dark:text-gray-100">
        <i class="fas fa-crystal-ball mr-2 text-purple-600 dark:text-purple-400"></i>
        Projeções de Rendimento
      </h3>
      <div class="flex items-center space-x-2">
        <span class="text-sm text-gray-600 dark:text-gray-300">Total da carteira:</span>
        <span class="text-sm font-semibold text-gray-900 dark:text-gray-100">
          {{ totalPortfolioValue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) }}
        </span>
      </div>
    </div>

    <!-- Estados -->
    <div v-if="projections.length === 0" class="text-center py-8">
      <div
        class="w-16 h-16 mx-auto mb-4 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center transition-colors"
      >
        <i class="fas fa-chart-line text-gray-400 dark:text-gray-500 text-xl"></i>
      </div>
      <p class="text-gray-600 dark:text-gray-300">Adicione investimentos para ver as projeções</p>
    </div>

    <!-- Grid de Projeções -->
    <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 gap-4">
      <div
        v-for="projection in projections"
        :key="projection.period"
        class="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-dark-800 dark:to-dark-900 rounded-lg p-4 border border-blue-100 dark:border-dark-700 hover:shadow-md transition-all duration-200 cursor-pointer"
        @click="selectProjection(projection)"
      >
        <div class="text-center">
          <!-- Período -->
          <div class="text-sm font-medium text-blue-800 dark:text-blue-300 mb-2">
            {{ projection.period }}
          </div>

          <!-- Valor Total Projetado -->
          <div class="text-lg font-bold text-gray-900 dark:text-gray-100 mb-1">
            {{ projection.netValue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) }}
          </div>

          <!-- Rendimento Líquido -->
          <div
            class="text-sm font-semibold mb-2"
            :class="projection.netYield >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'"
          >
            +{{ projection.netYield.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) }}
          </div>

          <!-- Percentual -->
          <div class="flex items-center justify-center space-x-2 text-xs">
            <span
              :class="
                projection.yieldPercentage >= 0
                  ? 'text-green-600 dark:text-green-400'
                  : 'text-red-600 dark:text-red-400'
              "
              class="font-medium"
            >
              {{ projection.yieldPercentage.toFixed(2) }}%
            </span>
            <span class="text-gray-500 dark:text-gray-300"> ({{ projection.annualizedReturn.toFixed(1) }}% a.a.) </span>
          </div>

          <!-- Impostos (se houver) -->
          <div
            v-if="projection.irAmount > 0 || projection.iofAmount > 0"
            class="mt-2 text-xs text-gray-500 dark:text-gray-300"
          >
            <div v-if="projection.irAmount > 0">
              IR:
              {{ projection.irAmount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) }}
            </div>
            <div v-if="projection.iofAmount > 0">
              IOF:
              {{ projection.iofAmount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) }}
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Detalhes da Projeção Selecionada -->
    <div
      v-if="selectedProjection"
      class="mt-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 transition-colors"
    >
      <h4 class="font-semibold text-gray-900 dark:text-gray-100 mb-3">Detalhes - {{ selectedProjection.period }}</h4>

      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <!-- Valor Bruto -->
        <div
          class="bg-white dark:bg-dark-900 p-3 rounded-lg border border-gray-100 dark:border-dark-700 transition-colors"
        >
          <p class="text-xs text-gray-600 dark:text-gray-300 mb-1">Valor Bruto</p>
          <p class="text-lg font-semibold text-gray-900 dark:text-gray-100">
            {{
              selectedProjection.grossValue.toLocaleString('pt-BR', {
                style: 'currency',
                currency: 'BRL',
              })
            }}
          </p>
          <p class="text-xs text-gray-500 dark:text-gray-300">
            Rendimento:
            {{
              selectedProjection.yieldAmount.toLocaleString('pt-BR', {
                style: 'currency',
                currency: 'BRL',
              })
            }}
          </p>
        </div>

        <!-- Impostos -->
        <div
          class="bg-white dark:bg-dark-900 p-3 rounded-lg border border-gray-100 dark:border-dark-700 transition-colors"
        >
          <p class="text-xs text-gray-600 dark:text-gray-300 mb-1">Impostos</p>
          <p class="text-lg font-semibold text-red-600 dark:text-red-400">
            -{{
              (selectedProjection.irAmount + selectedProjection.iofAmount).toLocaleString('pt-BR', {
                style: 'currency',
                currency: 'BRL',
              })
            }}
          </p>
          <p class="text-xs text-gray-500 dark:text-gray-300">
            IR:
            {{
              selectedProjection.irAmount.toLocaleString('pt-BR', {
                style: 'currency',
                currency: 'BRL',
              })
            }}
            | IOF:
            {{
              selectedProjection.iofAmount.toLocaleString('pt-BR', {
                style: 'currency',
                currency: 'BRL',
              })
            }}
          </p>
        </div>

        <!-- Valor Líquido -->
        <div
          class="bg-white dark:bg-dark-900 p-3 rounded-lg border border-gray-100 dark:border-dark-700 transition-colors"
        >
          <p class="text-xs text-gray-600 dark:text-gray-300 mb-1">Valor Líquido</p>
          <p class="text-lg font-semibold text-green-600 dark:text-green-400">
            {{
              selectedProjection.netValue.toLocaleString('pt-BR', {
                style: 'currency',
                currency: 'BRL',
              })
            }}
          </p>
          <p class="text-xs text-gray-500 dark:text-gray-300">
            Líquido:
            {{
              selectedProjection.netYield.toLocaleString('pt-BR', {
                style: 'currency',
                currency: 'BRL',
              })
            }}
          </p>
        </div>

        <!-- Performance -->
        <div
          class="bg-white dark:bg-dark-900 p-3 rounded-lg border border-gray-100 dark:border-dark-700 transition-colors"
        >
          <p class="text-xs text-gray-600 dark:text-gray-300 mb-1">Performance</p>
          <p class="text-lg font-semibold text-blue-600 dark:text-blue-400">
            {{ selectedProjection.yieldPercentage.toFixed(2) }}%
          </p>
          <p class="text-xs text-gray-500 dark:text-gray-300">
            {{ selectedProjection.annualizedReturn.toFixed(2) }}% ao ano
          </p>
        </div>
      </div>

      <!-- Comparação com CDI -->
      <div
        class="mt-4 p-3 bg-blue-50 dark:bg-dark-900 rounded-lg border border-blue-100 dark:border-blue-800 transition-colors"
      >
        <div class="flex items-center justify-between">
          <span class="text-sm font-medium text-blue-800 dark:text-blue-300">Comparação com CDI</span>
          <span
            class="text-sm font-semibold"
            :class="cdiComparison >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'"
          >
            {{ cdiComparison >= 0 ? '+' : '' }}{{ cdiComparison.toFixed(2) }}% vs CDI
          </span>
        </div>
        <p class="text-xs text-blue-600 dark:text-blue-300 mt-1">
          CDI projetado: {{ ((cdiRate * selectedProjection.days) / 365).toFixed(2) }}% no período
        </p>
      </div>
    </div>

    <!-- Simulador Rápido -->
    <div
      class="mt-6 p-4 bg-yellow-50 dark:bg-dark-900 rounded-lg border border-yellow-200 dark:border-yellow-700 transition-colors"
    >
      <h4 class="font-semibold text-yellow-800 dark:text-yellow-300 mb-3">
        <i class="fas fa-calculator mr-2 dark:text-yellow-300"></i>
        Simulador de Investimento
      </h4>

      <div class="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">Valor (R$)</label>
          <input
            v-model.number="simulatorValue"
            type="number"
            step="100"
            min="0"
            placeholder="10.000"
            class="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 bg-white dark:bg-dark-800 text-gray-900 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 transition-colors"
          />
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">Tipo</label>
          <select
            v-model="simulatorType"
            class="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 bg-white dark:bg-dark-800 text-gray-900 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 transition-colors"
          >
            <option value="CDI_PERCENTAGE">% do CDI</option>
            <option value="SELIC_PERCENTAGE">% da Selic</option>
            <option value="PERCENTAGE">Taxa Fixa</option>
            <option value="FIXED">Valor Fixo</option>
          </select>
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">Taxa (%)</label>
          <input
            v-model.number="simulatorRate"
            type="number"
            step="0.1"
            min="0"
            placeholder="120"
            class="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 bg-white dark:bg-dark-800 text-gray-900 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 transition-colors"
          />
        </div>

        <div>
          <button
            @click="runSimulation"
            :disabled="!canSimulate"
            class="w-full bg-yellow-500 dark:bg-yellow-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-yellow-600 dark:hover:bg-yellow-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <i class="fas fa-play mr-2"></i>
            Simular
          </button>
        </div>
      </div>

      <!-- Resultado da Simulação -->
      <div v-if="simulationResult" class="mt-4 grid grid-cols-2 md:grid-cols-4 gap-2">
        <div
          v-for="result in simulationResult.slice(0, 4)"
          :key="result.period"
          class="bg-white dark:bg-dark-800 p-2 rounded text-center border border-gray-100 dark:border-dark-700 transition-colors"
        >
          <p class="text-xs text-gray-600 dark:text-gray-300">{{ result.period }}</p>
          <p class="text-sm font-semibold text-green-600 dark:text-green-400">
            {{ result.netYield.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) }}
          </p>
          <p class="text-xs text-gray-500 dark:text-gray-300">{{ result.yieldPercentage.toFixed(1) }}%</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { ref, computed } from 'vue';
  import type { IProjection } from '../../types/investments';
  import { calculateBenchmarkComparison, REFERENCE_RATES } from '../../utils/investmentCalculators';

  // Props
  interface Props {
    projections: IProjection[];
    totalPortfolioValue: number;
    simulateInvestment: (amount: number, yieldType: string, yieldRate: number) => IProjection[];
  }

  const props = withDefaults(defineProps<Props>(), {
    projections: () => [],
    totalPortfolioValue: 0,
  });

  // State
  const selectedProjection = ref<IProjection | null>(null);
  const simulatorValue = ref(10000);
  const simulatorType = ref('CDI_PERCENTAGE');
  const simulatorRate = ref(120);
  const simulationResult = ref<IProjection[] | null>(null);

  // Computed
  const cdiRate = computed(() => REFERENCE_RATES.CDI);

  const cdiComparison = computed(() => {
    if (!selectedProjection.value) return 0;
    return calculateBenchmarkComparison(selectedProjection.value.yieldPercentage, selectedProjection.value.days);
  });

  const canSimulate = computed(() => {
    return simulatorValue.value > 0 && simulatorRate.value > 0;
  });

  // Methods
  function selectProjection(projection: IProjection) {
    selectedProjection.value = selectedProjection.value?.period === projection.period ? null : projection;
  }

  function runSimulation() {
    if (!canSimulate.value) return;

    simulationResult.value = props.simulateInvestment(simulatorValue.value, simulatorType.value, simulatorRate.value);
  }

  // Auto-select first projection
  if (props.projections.length > 0) {
    selectedProjection.value = props.projections[3]; // 1 ano como padrão
  }
</script>

<script lang="ts">
  export default {
    name: 'ProjectionPanel',
  };
</script>
