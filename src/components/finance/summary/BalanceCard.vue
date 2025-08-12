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
import { useFinance } from '../../../composables/useFinance'

interface Props {
  title?: string
  showQuickStats?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  title: 'Saldo Atual',
  showQuickStats: true
})

// Use composables
const { saldoFinal, totalRecords, formatCurrency } = useFinanceTable()
const { getHiddenMonthsCount } = useFinance()

// Balance formatting and color
const formattedBalance = computed(() => formatCurrency(saldoFinal.value))

const balanceColorClass = computed(() =>
  saldoFinal.value < 0 ? 'text-red-600' : 'text-green-600'
)

// Record count text
const recordCountText = computed(() => {
  const count = totalRecords.value
  if (count === 0) return 'Nenhuma transação registrada'
  if (count === 1) return '1 transação registrada'
  return `${count} transações registradas`
})

// Hidden months
const hiddenMonthsCount = computed(() => getHiddenMonthsCount())

const hiddenMonthsText = computed(() => {
  const count = hiddenMonthsCount.value
  if (count === 1) return '1 mês oculto do cálculo'
  return `${count} meses ocultos do cálculo`
})

// Quick stats calculations
const totalReceitas = computed(() => {
  return useFinanceTable().data.value
    .filter(record => record.Tipo === 'Receita')
    .reduce((sum, record) => sum + record.Valor, 0)
})

const totalDespesas = computed(() => {
  return useFinanceTable().data.value
    .filter(record => record.Tipo === 'Despesa')
    .reduce((sum, record) => sum + record.Valor, 0)
})
</script>