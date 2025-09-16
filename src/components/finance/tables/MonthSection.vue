<template>
  <div class="month-section">
    <!-- Month Header -->
    <div
      @click="toggleCollapse"
      class="bg-white dark:bg-gray-900 rounded-xl shadow-sm p-6 border border-gray-100 dark:border-gray-800 transition-colors mb-2 cursor-pointer"
    >
      <div class="flex items-center justify-between">
        <!-- Month Title and Summary -->
        <div class="flex items-center gap-3">
          <button
            class="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 transition-colors"
            :title="isCollapsed ? 'Expandir mês' : 'Recolher mês'"
          >
            <i
              :class="isCollapsed ? 'fas fa-chevron-right' : 'fas fa-chevron-down'"
              class="text-sm transition-transform duration-200"
            ></i>
          </button>

          <div>
            <h3 class="text-lg font-semibold text-gray-900 dark:text-gray-100">
              {{ monthDisplayName }}
            </h3>
            <p class="text-sm text-gray-600 dark:text-gray-300">
              {{ recordsCount }} registro{{ recordsCount !== 1 ? 's' : '' }}
              <span v-if="completedCount > 0" class="ml-2">
                • {{ completedCount }} concluído{{ completedCount !== 1 ? 's' : '' }}
              </span>
            </p>
          </div>
        </div>

        <!-- Month Summary -->
        <div class="text-right">
          <div class="text-lg font-bold" :class="totalBalanceColor">
            {{ formatCurrency(monthSummary.saldo) }}
          </div>
          <div class="text-xs text-gray-600 dark:text-gray-400 space-x-2">
            <span class="text-green-600">↑ {{ formatCurrency(monthSummary.receitas) }}</span>
            <span class="text-red-600"> ↓ {{ formatCurrency(Math.abs(monthSummary.despesas)) }} </span>
          </div>
        </div>
      </div>

      <!-- Progress Bar -->
      <div v-if="!isCollapsed" class="mt-3">
        <div class="flex items-center justify-between text-xs text-gray-600 dark:text-gray-400 mb-1">
          <div class="flex items-center gap-2">
            <span>Progresso do mês</span>
            <span class="text-gray-400 dark:text-gray-500"> {{ completedCount }}/{{ recordsCount }} </span>
          </div>
          <div v-if="pendingCount > 0" class="flex items-center gap-1 text-orange-600 dark:text-orange-400">
            <i class="fas fa-clock text-xs"></i>
            <span class="font-medium">{{ formatCurrency(pendingAmount) }} pendente</span>
            <span class="text-gray-400 dark:text-gray-500">({{ pendingCount }})</span>
          </div>
        </div>
        <div class="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2">
          <div
            class="bg-gradient-to-r from-green-400 to-green-600 h-2 rounded-full transition-all duration-300"
            :style="{ width: `${completionPercentage}%` }"
          ></div>
        </div>
      </div>

      <!-- Category Summary -->
      <div
        v-if="!isCollapsed && categorySummary.length > 0"
        class="mt-4 pt-3 border-t border-blue-200 dark:border-blue-700"
      >
        <div class="flex items-center gap-2 text-xs text-blue-700 dark:text-blue-300 mb-2">
          <i class="fas fa-chart-pie"></i>
          <span>Resumo por Categoria</span>
        </div>
        <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
          <div
            v-for="category in categorySummary"
            :key="category.name"
            class="bg-white/60 dark:bg-gray-700/60 rounded-md p-2 text-xs"
          >
            <div class="flex items-center gap-1 mb-1">
              <span>{{ category.icon }}</span>
              <span class="font-medium text-gray-700 dark:text-gray-300 truncate">
                {{ category.name }}
              </span>
            </div>
            <div class="flex justify-between items-center">
              <span class="text-gray-500 dark:text-gray-400">{{ category.count }}x</span>
              <span class="font-semibold" :class="category.total < 0 ? 'text-red-600' : 'text-green-600'">
                {{ formatCurrency(category.total) }}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Records Table (Collapsible) -->
    <Transition
      name="month-content"
      enter-active-class="transition-all duration-300 ease-out"
      enter-from-class="transform -translate-y-2 opacity-0"
      enter-to-class="transform translate-y-0 opacity-100"
      leave-active-class="transition-all duration-200 ease-in"
      leave-from-class="transform translate-y-0 opacity-100"
      leave-to-class="transform -translate-y-2 opacity-0"
    >
      <div v-if="!isCollapsed" class="month-content">
        <!-- Desktop Table -->
        <div
          class="hidden lg:block bg-white dark:bg-gray-900 rounded-xl shadow-sm p-6 border border-gray-100 dark:border-gray-800 transition-colors overflow-hidden mb-6 theme-transition"
        >
          <table class="min-w-full divide-y divide-gray-200 dark:divide-slate-600">
            <thead class="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th
                  @click="handleSort('Data')"
                  class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                >
                  <div class="flex items-center gap-1">
                    <span>Data</span>
                    <i :class="getSortIcon('Data')" class="text-xs"></i>
                  </div>
                </th>
                <th
                  @click="handleSort('Descrição')"
                  class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                >
                  <div class="flex items-center gap-1">
                    <span>Descrição</span>
                    <i :class="getSortIcon('Descrição')" class="text-xs"></i>
                  </div>
                </th>
                <th
                  @click="handleSort('Valor')"
                  class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                >
                  <div class="flex items-center gap-1">
                    <span>Valor</span>
                    <i :class="getSortIcon('Valor')" class="text-xs"></i>
                  </div>
                </th>
                <th
                  @click="handleSort('Tipo')"
                  class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                >
                  <div class="flex items-center gap-1">
                    <span>Tipo</span>
                    <i :class="getSortIcon('Tipo')" class="text-xs"></i>
                  </div>
                </th>
                <th
                  @click="handleSort('Categoria')"
                  class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                >
                  <div class="flex items-center gap-1">
                    <span>Categoria</span>
                    <i :class="getSortIcon('Categoria')" class="text-xs"></i>
                  </div>
                </th>
                <th
                  @click="handleSort('Status')"
                  class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                >
                  <div class="flex items-center gap-1">
                    <span>Status</span>
                    <i :class="getSortIcon('Status')" class="text-xs"></i>
                  </div>
                </th>
                <th
                  class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                >
                  Ações
                </th>
              </tr>
            </thead>
            <tbody class="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-slate-600">
              <RecordRow
                v-for="(record, index) in records"
                :key="`${record.Data}-${record.Descrição}-${record.Status}-${index}`"
                :record="record"
                :index="getGlobalIndex(index)"
                @edit="(record, globalIndex) => handleEdit(record, globalIndex)"
                @delete="(record, globalIndex) => handleDelete(record, globalIndex)"
                @toggle-status="(record, globalIndex) => handleToggleStatus(record, globalIndex)"
              />
            </tbody>
          </table>
        </div>

        <!-- Mobile Cards -->
        <div class="lg:hidden space-y-3 mb-6">
          <div
            v-for="(record, index) in records"
            :key="`mobile-${record.Data}-${record.Descrição}-${record.Status}-${index}`"
            class="bg-white dark:bg-gray-900 rounded-xl shadow-sm p-6 border border-gray-100 dark:border-gray-800 transition-colors theme-transition"
          >
            <div class="space-y-2 text-sm">
              <div class="flex justify-between items-start">
                <span class="font-medium text-gray-900 dark:text-gray-100">
                  {{ record.Descrição }}
                </span>
                <div class="flex gap-2">
                  <button
                    @click="handleEdit(record, getGlobalIndex(index))"
                    class="text-blue-600 dark:text-blue-400 hover:text-blue-900 dark:hover:text-blue-300 p-1"
                  >
                    <i class="fas fa-edit"></i>
                  </button>
                  <button
                    @click="handleDelete(record, getGlobalIndex(index))"
                    class="text-red-600 dark:text-red-400 hover:text-red-900 dark:hover:text-red-300 p-1"
                  >
                    <i class="fas fa-trash"></i>
                  </button>
                </div>
              </div>
              <div class="text-lg font-bold" :class="record.Valor < 0 ? 'text-red-600' : 'text-green-600'">
                {{ formatCurrency(record.Valor) }}
              </div>
              <div class="flex justify-between items-center">
                <span class="text-gray-600 dark:text-gray-300">
                  {{ record.Categoria || 'Sem categoria' }}
                </span>
                <button
                  @click="handleToggleStatus(record, getGlobalIndex(index))"
                  class="px-2 py-1 rounded text-xs"
                  :class="
                    record.Status === '✔️'
                      ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-300'
                      : 'bg-orange-100 dark:bg-orange-900 text-orange-800 dark:text-orange-300'
                  "
                >
                  {{ record.Status }} {{ record.Status === '✔️' ? 'Concluído' : 'Pendente' }}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
  import { ref, computed, watch } from 'vue';
  import { useFinanceTable } from '../../../composables/finance/useFinanceTable';
  import { useCategoryDetection } from '../../../composables/useCategoryDetection';
  import { useFinanceStore } from '../../../stores/financeStore';
  import RecordRow from './RecordRow.vue';
  import type { IFinanceRecord } from '../../../types/finance';

  interface Props {
    monthKey: string;
    monthDisplayName: string;
    records: IFinanceRecord[];
    startIndex: number;
    isCollapsed?: boolean;
  }

  interface Emits {
    edit: [record: IFinanceRecord, index: number];
    delete: [record: IFinanceRecord, index: number];
    'toggle-status': [record: IFinanceRecord, index: number];
    'month-toggle': [monthKey: string, isCollapsed: boolean];
  }

  const props = defineProps<Props>();
  const emit = defineEmits<Emits>();

  // Use composables
  const { formatCurrency } = useFinanceTable();
  const { getCategoryIcon } = useCategoryDetection();
  const financeStore = useFinanceStore();

  // Collapse state from parent or local fallback
  const isCollapsed = computed(() => props.isCollapsed ?? false);

  // Computed properties
  const recordsCount = computed(() => props.records.length);

  const completedCount = computed(() => props.records.filter((record) => record.Status === '✔️').length);

  const completionPercentage = computed(() =>
    recordsCount.value > 0 ? Math.round((completedCount.value / recordsCount.value) * 100) : 0
  );

  const pendingCount = computed(() => props.records.filter((record) => record.Status === '❌').length);

  const pendingAmount = computed(() => {
    return props.records.filter((record) => record.Status === '❌').reduce((sum, record) => sum + record.Valor, 0);
  });

  const monthSummary = computed(() => {
    const receitas = props.records.filter((r) => r.Tipo === 'Receita').reduce((sum, r) => sum + r.Valor, 0);

    const despesas = props.records.filter((r) => r.Tipo === 'Despesa').reduce((sum, r) => sum + r.Valor, 0);

    return {
      receitas,
      despesas,
      saldo: receitas + despesas, // despesas já são negativas
    };
  });

  const totalBalanceColor = computed(() => (monthSummary.value.saldo < 0 ? 'text-red-600' : 'text-green-600'));

  const categorySummary = computed(() => {
    const categoryMap = new Map<string, { count: number; total: number }>();

    props.records.forEach((record) => {
      const category = record.Categoria || 'Sem categoria';
      const current = categoryMap.get(category) || { count: 0, total: 0 };
      categoryMap.set(category, {
        count: current.count + 1,
        total: current.total + record.Valor,
      });
    });

    return Array.from(categoryMap.entries())
      .map(([name, data]) => ({
        name,
        icon: getCategoryIcon(name),
        count: data.count,
        total: data.total,
      }))
      .sort((a, b) => Math.abs(b.total) - Math.abs(a.total)); // Sort by absolute value descending
  });

  // Methods
  const toggleCollapse = () => {
    const newCollapsedState = !isCollapsed.value;
    emit('month-toggle', props.monthKey, newCollapsedState);
  };

  const getGlobalIndex = (localIndex: number): number => {
    return props.startIndex + localIndex;
  };

  // Event handlers with proper typing
  const handleEdit = (record: IFinanceRecord, index: number) => {
    emit('edit', record, index);
  };

  const handleDelete = (record: IFinanceRecord, index: number) => {
    emit('delete', record, index);
  };

  const handleToggleStatus = (record: IFinanceRecord, index: number) => {
    emit('toggle-status', record, index);
  };

  // Sorting methods
  const handleSort = (field: 'Data' | 'Descrição' | 'Valor' | 'Tipo' | 'Categoria' | 'Status') => {
    const currentField = financeStore.sortField;
    const currentDirection = financeStore.sortDirection;

    // If clicking the same field, toggle direction
    const newDirection = currentField === field && currentDirection === 'asc' ? 'desc' : 'asc';

    financeStore.setSorting(field, newDirection);
  };

  const getSortIcon = (field: 'Data' | 'Descrição' | 'Valor' | 'Tipo' | 'Categoria' | 'Status'): string => {
    return financeStore.getSortIcon(field);
  };
</script>

<style scoped>
  /* Month content transitions */
  .month-content-enter-active,
  .month-content-leave-active {
    overflow: hidden;
  }

  .month-content-enter-from,
  .month-content-leave-to {
    max-height: 0;
  }

  .month-content-enter-to,
  .month-content-leave-from {
    max-height: 2000px;
  }

  /* Smooth height transition */
  .month-section {
    @apply transition-all duration-200;
  }

  /* Hover effects */
  .month-section:hover .fas {
    @apply transform scale-110;
  }
</style>
