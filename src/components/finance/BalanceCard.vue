<template>
  <div class="lg:hidden bg-white rounded-xl shadow-sm p-6 border border-gray-100">
    <div class="text-center">
      <h2 class="text-lg font-semibold text-gray-900 mb-2">Saldo Atual</h2>
      <p :class="saldoFinal < 0 ? 'text-red-600' : 'text-green-600'" class="text-3xl font-bold">
        {{ saldoFinal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) }}
      </p>
      <p class="text-sm text-gray-600 mt-2">
        {{ totalRecords }} transações registradas
      </p>
      <!-- Hidden months indicator -->
      <div v-if="hiddenMonthsCount > 0" class="mt-2">
        <span class="text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded-full">
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
import { useFinance } from '../../composables/useFinance'

const { data, saldoFinal } = useFinance()

// Props from parent
interface Props {
  hiddenMonthsCount?: number
}

const props = withDefaults(defineProps<Props>(), {
  hiddenMonthsCount: 0
})

const totalRecords = computed(() => data.value.length)
</script>