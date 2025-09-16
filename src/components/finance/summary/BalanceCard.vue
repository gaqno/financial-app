<template>
  <Card variant="default" size="lg" class="lg:hidden text-center" :hoverable="true">
    <template #header>
      <h2 class="text-lg font-semibold">{{ title }}</h2>
    </template>

    <div class="space-y-4">
      <p :class="balanceColorClass" class="text-3xl font-bold">
        {{ formattedBalance }}
      </p>

      <p class="text-sm text-gray-600 dark:text-gray-300">
        {{ recordCountText }}
      </p>

      <Badge v-if="hiddenMonthsCount > 0" variant="warning" size="sm" class="mt-2">
        <i class="fas fa-eye-slash mr-1"></i>
        {{ hiddenMonthsText }}
      </Badge>

      <div v-if="showQuickStats" class="grid grid-cols-2 gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
        <div class="text-center">
          <div class="text-xs text-gray-500 dark:text-gray-400">Receitas</div>
          <div class="text-green-600 dark:text-green-400 font-semibold">
            {{ formatCurrency(totalReceitas) }}
          </div>
        </div>
        <div class="text-center">
          <div class="text-xs text-gray-500 dark:text-gray-400">Despesas</div>
          <div class="text-red-600 dark:text-red-400 font-semibold">
            {{ formatCurrency(Math.abs(totalDespesas)) }}
          </div>
        </div>
      </div>
    </div>
  </Card>
</template>

<script setup lang="ts">
  import { computed } from 'vue';
  import { useFinanceTable } from '../../../composables/finance/useFinanceTable';
  import { useFinanceStore } from '../../../stores/financeStore';
  import { Card } from '@/components/ui/card/Card.vue';
  import { Badge } from '@/components/ui/badge/Badge.vue';

  interface Props {
    title?: string;
    showQuickStats?: boolean;
  }

  const props = withDefaults(defineProps<Props>(), {
    title: 'Saldo Atual',
    showQuickStats: true,
  });

  // Use composables - FIXED: Use store for hidden months count
  const { formatCurrency, totalRecords } = useFinanceTable();
  const store = useFinanceStore();

  // Balance formatting and color
  const formattedBalance = computed(() => formatCurrency(store.saldoFinal));

  const balanceColorClass = computed(() => (store.saldoFinal < 0 ? 'text-red-600' : 'text-green-600'));

  // Record count text
  const recordCountText = computed(() => {
    const count = totalRecords.value;
    if (count === 0) return 'Nenhuma transação registrada';
    if (count === 1) return '1 transação registrada';
    return `${count} transações registradas`;
  });

  // Hidden months - FIXED: Use store method
  const hiddenMonthsCount = computed(() => store.getHiddenMonthsCount());

  const hiddenMonthsText = computed(() => {
    const count = hiddenMonthsCount.value;
    if (count === 1) return '1 mês oculto do cálculo';
    return `${count} meses ocultos do cálculo`;
  });

  // Quick stats calculations - FIXED: Use store data directly
  const totalReceitas = computed(() => {
    return store.filteredData
      .filter((record: any) => record.Tipo === 'Receita')
      .reduce((sum: number, record: any) => sum + record.Valor, 0);
  });

  const totalDespesas = computed(() => {
    return store.filteredData
      .filter((record: any) => record.Tipo === 'Despesa')
      .reduce((sum: number, record: any) => sum + record.Valor, 0);
  });
</script>
