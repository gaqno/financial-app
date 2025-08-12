<template>
  <div class="lg:hidden bg-white rounded-xl shadow-sm p-6 border border-gray-100">
    <div class="text-center">
      <h2 class="text-lg font-semibold text-gray-900 mb-2">
        {{ title }}
      </h2>
      <p :class="balanceColorClass" class="text-3xl font-bold">
        {{ formattedBalance }}
      </p>
      <p class="text-sm text-gray-600 mt-2">
        {{ recordCountText }}
      </p>

      <!-- Hidden months indicator -->
      <div v-if="hiddenMonthsCount > 0" class="mt-2">
        <span class="text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded-full">
          <i class="fas fa-eye-slash mr-1"></i>
          {{ hiddenMonthsText }}
        </span>
      </div>

      <!-- Quick stats -->
      <div v-if="showQuickStats" class="mt-4 grid grid-cols-2 gap-4">
        <div class="text-center">
          <div class="text-xs text-gray-500">Receitas</div>
          <div class="text-green-600 font-semibold">
            {{ formatCurrency(totalReceitas) }}
          </div>
        </div>
        <div class="text-center">
          <div class="text-xs text-gray-500">Despesas</div>
          <div class="text-red-600 font-semibold">
            {{ formatCurrency(Math.abs(totalDespesas)) }}
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useFinanceTable } from '../../../composables/finance/useFinanceTable'
import { useFinanceStore } from '../../../stores/financeStore'

interface Props {
  title?: string
  showQuickStats?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  title: 'Saldo Atual',
  showQuickStats: true
})

// Use composables - FIXED: Use store for hidden months count
const { formatCurrency, totalRecords } = useFinanceTable()
const store = useFinanceStore()

// Balance formatting and color
const formattedBalance = computed(() => formatCurrency(store.saldoFinal))

const balanceColorClass = computed(() =>
  store.saldoFinal < 0 ? 'text-red-600' : 'text-green-600'
)

// Record count text
const recordCountText = computed(() => {
  const count = totalRecords.value
  if (count === 0) return 'Nenhuma transação registrada'
  if (count === 1) return '1 transação registrada'
  return `${count} transações registradas`
})

// Hidden months - FIXED: Use store method
const hiddenMonthsCount = computed(() => store.getHiddenMonthsCount())

const hiddenMonthsText = computed(() => {
  const count = hiddenMonthsCount.value
  if (count === 1) return '1 mês oculto do cálculo'
  return `${count} meses ocultos do cálculo`
})

// Quick stats calculations - FIXED: Use store data directly
const totalReceitas = computed(() => {
  return store.filteredData
    .filter((record: any) => record.Tipo === 'Receita')
    .reduce((sum: number, record: any) => sum + record.Valor, 0)
})

const totalDespesas = computed(() => {
  return store.filteredData
    .filter((record: any) => record.Tipo === 'Despesa')
    .reduce((sum: number, record: any) => sum + record.Valor, 0)
})
</script>