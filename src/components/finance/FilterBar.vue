<template>
  <section
    class="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden theme-transition"
  >
    <!-- Basic Filters -->
    <div class="p-4 border-b border-gray-200 dark:border-gray-700">
      <div class="flex flex-wrap gap-2">
        <button
          @click="setFilter('all')"
          :class="[
            filter === 'all'
              ? 'bg-blue-500 text-white'
              : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700',
            'px-4 py-2 rounded-full text-sm font-medium transition-colors',
          ]"
        >
          📊 Todos
        </button>
        <button
          @click="setFilter('Receita')"
          :class="[
            filter === 'Receita'
              ? 'bg-green-500 text-white'
              : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700',
            'px-4 py-2 rounded-full text-sm font-medium transition-colors',
          ]"
        >
          💰 Receitas
        </button>
        <button
          @click="setFilter('Despesa')"
          :class="[
            filter === 'Despesa'
              ? 'bg-red-500 text-white'
              : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700',
            'px-4 py-2 rounded-full text-sm font-medium transition-colors',
          ]"
        >
          💸 Despesas
        </button>
      </div>

      <!-- Active Category Filter Indicator -->
      <div
        v-if="categoryFilter"
        class="mt-3 flex items-center gap-2 px-3 py-2 bg-orange-50 dark:bg-orange-900 border border-orange-200 dark:border-orange-700 rounded-lg"
      >
        <span class="text-sm text-orange-800 dark:text-orange-300">
          🔍
          <strong>{{ getCategoryIcon(categoryFilter) }} {{ categoryFilter }}</strong>
        </span>
        <button
          @click="clearCategoryFilter"
          class="text-orange-600 dark:text-orange-400 hover:text-orange-800 dark:hover:text-orange-200 ml-auto"
        >
          <i class="fas fa-times"></i>
        </button>
      </div>

      <!-- Success message -->
      <div
        v-if="categorizationSuccess"
        class="mt-3 px-4 py-3 bg-green-50 dark:bg-green-900 border border-green-200 dark:border-green-700 rounded-lg flex items-center gap-2"
      >
        <i class="fas fa-check-circle text-green-600 dark:text-green-400"></i>
        <span class="text-sm text-green-800 dark:text-green-300">
          ✅ {{ categorizationSuccess }} registro{{ categorizationSuccess > 1 ? 's categorizados' : ' categorizado' }}
          com sucesso!
        </span>
      </div>
    </div>

    <!-- Desktop Controls -->
    <div class="hidden lg:flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800">
      <span class="text-sm text-gray-600 dark:text-gray-300"> {{ filteredRecordsCount }} registros encontrados </span>
      <div class="flex gap-2">
        <button
          @click="refreshCategorization"
          class="px-3 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-1"
          :disabled="recordsWithoutCategory.length === 0"
          :title="`Detectar categorias para ${recordsWithoutCategory.length} registros sem categoria`"
        >
          <i class="fas fa-robot text-xs"></i>
          <span>Auto-categorizar ({{ recordsWithoutCategory.length }})</span>
        </button>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
  import { computed, ref } from 'vue';
  import { useFinanceFilters } from '../../composables/finance/useFinanceFilters';
  import { useCategoryDetection } from '../../composables/useCategoryDetection';
  import { useFinanceStore } from '../../stores/financeStore';
  import type { IFinanceRecord } from '../../types/finance';

  const { filter, categoryFilter, setFilter, clearCategoryFilter } = useFinanceFilters();

  const { getCategoryIcon, detectCategory } = useCategoryDetection();
  const financeStore = useFinanceStore();

  // Computed
  const filteredRecordsCount = computed(() => financeStore.filteredData.length);

  const recordsWithoutCategory = computed(() => {
    return financeStore.records.filter(
      (record) => !record.Categoria || record.Categoria === '' || record.Categoria === 'Outros'
    );
  });

  // Auto-categorization state
  const isAutoCategorizing = ref(false);
  const categorizationSuccess = ref(0);

  const refreshCategorization = async () => {
    if (isAutoCategorizing.value) return;

    isAutoCategorizing.value = true;
    categorizationSuccess.value = 0('🤖 [AUTO_CATEGORIZE] Starting auto-categorization process...');

    const updates: Array<{ index: number; updates: Partial<IFinanceRecord> }> = [];

    recordsWithoutCategory.value.forEach((record) => {
      // Find the record index in the store
      const recordIndex = financeStore.records.findIndex(
        (r) =>
          r.Data === record.Data &&
          r.Descrição === record.Descrição &&
          r.Valor === record.Valor &&
          r.Tipo === record.Tipo
      );

      if (recordIndex !== -1) {
        const detectedCategory = detectCategory(record.Descrição);

        if (detectedCategory && detectedCategory !== 'Outros') {
          ('🔄 [AUTO_CATEGORIZE] Will categorize:', record.Descrição, '->', detectedCategory);

          updates.push({
            index: recordIndex,
            updates: { Categoria: detectedCategory },
          });
        }
      }
    });

    if (updates.length === 0) {
      ('📝 [AUTO_CATEGORIZE] No records need categorization');
      isAutoCategorizing.value = false;
      return;
    }

    try {
      `🚀 [AUTO_CATEGORIZE] Batch updating ${updates.length} records...`;

      // Use optimized batch update
      const results = await financeStore.updateRecordsBatch(updates)(
        `✅ [AUTO_CATEGORIZE] Auto-categorization complete: ${results.length} records updated`
      );

      if (results.length > 0) {
        categorizationSuccess.value = results.length(
          `🎉 [AUTO_CATEGORIZE] Successfully categorized ${results.length} record${results.length > 1 ? 's' : ''}!`
        );

        // Hide success message after 3 seconds
        setTimeout(() => {
          categorizationSuccess.value = 0;
        }, 3000);
      }
    } catch (error) {
      console.error('❌ [AUTO_CATEGORIZE] Error during batch categorization:', error);
      alert('Erro durante a auto-categorização. Tente novamente.');
    } finally {
      isAutoCategorizing.value = false;
    }
  };
</script>
