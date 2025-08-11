<template>
  <section class="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
    <div class="flex items-center justify-between cursor-pointer p-4 hover:bg-gray-50 transition-colors"
      @click="toggleSection">
      <h2 class="text-lg font-semibold text-gray-900">
        <i class="fas fa-eye mr-2 text-purple-500"></i>
        Gerenciar Visibilidade dos Meses
      </h2>
      <div class="flex items-center gap-2">
        <span v-if="getHiddenMonthsCount() > 0"
          class="text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded-full font-medium">
          {{ getHiddenMonthsCount() }} oculto{{ getHiddenMonthsCount() > 1 ? 's' : '' }}
        </span>
        <i :class="isExpanded ? 'fas fa-chevron-up' : 'fas fa-chevron-down'"
          class="text-gray-400 transition-transform duration-200"></i>
      </div>
    </div>

    <div v-show="isExpanded" class="border-t border-gray-200">
      <div class="p-4 space-y-4">
        <!-- Header com controles globais -->
        <div class="flex items-center justify-between">
          <div class="text-sm text-gray-600">
            <i class="fas fa-info-circle mr-1"></i>
            Oculte meses para excluí-los do cálculo do saldo
          </div>
          <button v-if="getHiddenMonthsCount() > 0" @click="showAllMonths"
            class="text-sm bg-blue-500 text-white px-3 py-1 rounded-lg hover:bg-blue-600 transition-colors">
            <i class="fas fa-eye mr-1"></i>
            Mostrar Todos
          </button>
        </div>

        <!-- Lista de meses -->
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          <div v-for="(monthData, monthKey) in allAvailableMonths" :key="monthKey" :class="[
            monthData.isHidden
              ? 'bg-gray-50 border-gray-300 opacity-60'
              : 'bg-white border-gray-200 hover:bg-gray-50',
            'border rounded-xl p-4 transition-all cursor-pointer'
          ]" @click="toggleMonthVisibility(monthKey)">
            <div class="flex items-center justify-between">
              <div class="flex-1">
                <div class="flex items-center gap-2 mb-1">
                  <i :class="monthData.isHidden ? 'fas fa-eye-slash text-gray-400' : 'fas fa-eye text-green-500'"></i>
                  <h3 class="font-medium text-gray-900 capitalize">
                    {{ monthData.name }}
                  </h3>
                </div>
                <div class="text-sm text-gray-600">
                  {{ monthData.recordCount }} transaç{{ monthData.recordCount === 1 ? 'ão' : 'ões' }}
                </div>
                <div class="text-xs mt-1">
                  <span :class="monthData.isHidden ? 'text-red-600' : 'text-green-600'" class="font-medium">
                    {{ monthData.isHidden ? 'Oculto do saldo' : 'Incluído no saldo' }}
                  </span>
                </div>
              </div>

              <!-- Toggle visual -->
              <div class="ml-3">
                <div :class="[
                  monthData.isHidden ? 'bg-gray-300' : 'bg-green-500',
                  'relative inline-flex h-6 w-11 items-center rounded-full transition-colors'
                ]">
                  <span :class="[
                    monthData.isHidden ? 'translate-x-1' : 'translate-x-6',
                    'inline-block h-4 w-4 transform rounded-full bg-white transition-transform'
                  ]"></span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Resumo no final -->
        <div v-if="Object.keys(allAvailableMonths).length > 0"
          class="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
          <div class="flex items-center justify-between text-sm">
            <div class="text-blue-800">
              <i class="fas fa-chart-line mr-1"></i>
              <strong>Resumo:</strong>
              {{ Object.keys(allAvailableMonths).length - getHiddenMonthsCount() }} de {{
                Object.keys(allAvailableMonths).length }} meses incluídos no saldo
            </div>
            <div class="text-blue-700 font-medium">
              Total de transações visíveis: {{ getTotalVisibleRecords() }}
            </div>
          </div>
        </div>

        <!-- Estado vazio -->
        <div v-if="Object.keys(allAvailableMonths).length === 0" class="text-center py-8">
          <div class="text-gray-400 text-4xl mb-4">📅</div>
          <p class="text-gray-500">Nenhum mês disponível</p>
          <p class="text-gray-400 text-sm">Adicione alguns registros para começar</p>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { ref } from 'vue';

interface Props {
  allAvailableMonths: Record<string, { key: string; name: string; isHidden: boolean; recordCount: number }>;
  toggleMonthVisibility: (monthKey: string) => void;
  showAllMonths: () => void;
  getHiddenMonthsCount: () => number;
}

const props = defineProps<Props>();

const isExpanded = ref(false);

function toggleSection() {
  isExpanded.value = !isExpanded.value;
}

function getTotalVisibleRecords(): number {
  return Object.values(props.allAvailableMonths)
    .filter(month => !month.isHidden)
    .reduce((total, month) => total + month.recordCount, 0);
}
</script>