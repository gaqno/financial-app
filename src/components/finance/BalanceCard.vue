<template>
  <div class="lg:hidden bg-white dark:bg-slate-800 rounded-xl shadow-sm p-6 border border-gray-100 dark:border-slate-600 theme-transition">
    <div class="text-center">
      <h2 class="text-lg font-semibold text-gray-900 dark:text-slate-100 mb-2">Saldo Atual</h2>
      <p :class="store.saldoFinal < 0 ? 'text-red-600' : 'text-green-600'" class="text-3xl font-bold">
        {{ store.saldoFinal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) }}
      </p>
      <p class="text-sm text-gray-600 dark:text-slate-300 mt-2">
        {{ totalRecords }} transações registradas
      </p>
      <!-- Hidden months indicator -->
      <div v-if="hiddenMonthsCount > 0" class="mt-2">
        <span class="text-xs bg-orange-100 dark:bg-orange-900 text-orange-700 dark:text-orange-300 px-2 py-1 rounded-full">
          <i class="fas fa-eye-slash mr-1"></i>
          {{ hiddenMonthsCount }} mês{{ hiddenMonthsCount > 1 ? 'es' : '' }} oculto{{
            hiddenMonthsCount > 1 ? 's' : '' }} do cálculo
        </span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useFinanceStore } from '../../stores/financeStore'

// FIXED: Use store instead of composable to respect smart projection
const store = useFinanceStore()

// Props from parent
interface Props {
  hiddenMonthsCount?: number
}

const props = withDefaults(defineProps<Props>(), {
  hiddenMonthsCount: 0
})

const totalRecords = computed(() => store.records.length)
</script>