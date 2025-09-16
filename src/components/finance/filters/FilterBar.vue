<template>
  <section class="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
    <!-- Basic Filters -->
    <div class="p-4 border-b border-gray-200">
      <div class="flex flex-wrap gap-2">
        <button
          @click="setFilter('all')"
          :class="getFilterButtonClass('all')"
          class="px-4 py-2 rounded-full text-sm font-medium transition-colors"
        >
          📊 Todos
        </button>
        <button
          @click="setFilter('Receita')"
          :class="getFilterButtonClass('Receita')"
          class="px-4 py-2 rounded-full text-sm font-medium transition-colors"
        >
          💰 Receitas
        </button>
        <button
          @click="setFilter('Despesa')"
          :class="getFilterButtonClass('Despesa')"
          class="px-4 py-2 rounded-full text-sm font-medium transition-colors"
        >
          💸 Despesas
        </button>
      </div>

      <!-- Active category filter indicator -->
      <div
        v-if="categoryFilter"
        class="mt-3 flex items-center gap-2 px-3 py-2 bg-orange-50 border border-orange-200 rounded-lg"
      >
        <span class="text-sm text-orange-800">
          🔍
          <strong>{{ getCategoryIcon(categoryFilter) }} {{ categoryFilter }}</strong>
        </span>
        <button @click="clearCategoryFilter" class="text-orange-600 hover:text-orange-800 ml-auto">
          <i class="fas fa-times"></i>
        </button>
      </div>

      <!-- Auto-categorization button -->
      <div v-if="recordsWithoutCategory.length > 0" class="mt-3">
        <button
          @click="refreshCategorization"
          class="px-3 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-1"
          :title="`Detectar categorias para ${recordsWithoutCategory.length} registros sem categoria`"
        >
          <i class="fas fa-robot text-xs"></i>
          Categorizar ({{ recordsWithoutCategory.length }})
        </button>
      </div>

      <!-- Advanced filters toggle -->
      <div v-if="showAdvanced" class="mt-4">
        <button
          @click="toggleAdvancedFilters"
          class="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1"
        >
          <i :class="showAdvancedFilters ? 'fas fa-chevron-up' : 'fas fa-chevron-down'"></i>
          Filtros Avançados
        </button>
      </div>
    </div>

    <!-- Advanced Filters -->
    <div v-if="showAdvanced && showAdvancedFilters" class="p-4 bg-gray-50">
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <!-- Search -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Buscar</label>
          <input
            v-model="searchTerm"
            type="text"
            placeholder="Descrição ou categoria..."
            class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <!-- Status Filter -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Status</label>
          <select
            v-model="statusFilter"
            class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">Todos</option>
            <option value="❌">❌ Pendente</option>
            <option value="✔️">✔️ Concluído</option>
          </select>
        </div>

        <!-- Quick Date Presets -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Período</label>
          <div class="flex gap-1">
            <button
              @click="showRecentTransactions(7)"
              class="flex-1 px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded"
            >
              7 dias
            </button>
            <button
              @click="showRecentTransactions(30)"
              class="flex-1 px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded"
            >
              30 dias
            </button>
            <button @click="setDateRange()" class="flex-1 px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded">
              Limpar
            </button>
          </div>
        </div>
      </div>

      <!-- Active filters summary -->
      <div v-if="hasActiveFilters" class="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
        <div class="flex items-center justify-between">
          <div class="text-sm text-blue-800">
            <strong>{{ activeFiltersCount }}</strong>
            filtro{{ activeFiltersCount > 1 ? 's' : '' }} ativo{{ activeFiltersCount > 1 ? 's' : '' }}:
            {{ activeFiltersDescription }}
          </div>
          <button @click="clearAllFilters" class="text-xs text-blue-600 hover:text-blue-800 font-medium">
            Limpar todos
          </button>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
  import { ref } from 'vue';
  import { useFinanceFilters } from '../../../composables/finance/useFinanceFilters';
  import { useCategoryDetection } from '../../../composables/useCategoryDetection';

  interface Props {
    showAdvanced?: boolean;
  }

  const props = withDefaults(defineProps<Props>(), {
    showAdvanced: true,
  });

  // Use composables
  const {
    filter,
    categoryFilter,
    searchTerm,
    statusFilter,
    recordsWithoutCategory,
    hasActiveFilters,
    activeFiltersCount,
    activeFiltersDescription,
    setFilter,
    filterByCategory,
    clearCategoryFilter,
    clearAllFilters,
    setDateRange,
    showRecentTransactions,
  } = useFinanceFilters();

  const { getCategoryIcon, detectCategory } = useCategoryDetection();

  // Local state
  const showAdvancedFilters = ref(false);

  // Methods
  const getFilterButtonClass = (filterType: 'all' | 'Receita' | 'Despesa') => {
    const isActive = filter.value === filterType;

    if (isActive) {
      if (filterType === 'all') return 'bg-blue-500 text-white';
      if (filterType === 'Receita') return 'bg-green-500 text-white';
      if (filterType === 'Despesa') return 'bg-red-500 text-white';
    }

    return 'bg-gray-100 text-gray-700 hover:bg-gray-200';
  };

  const toggleAdvancedFilters = () => {
    showAdvancedFilters.value = !showAdvancedFilters.value;
  };

  const refreshCategorization = () => {
    let updatedCount = 0;

    recordsWithoutCategory.value.forEach((record) => {
      const detectedCategory = detectCategory(record.Descrição);

      if (detectedCategory && detectedCategory !== 'Outros') {
        // In a real implementation, this would update the record
        // For now, we'll just log it
        updatedCount++;
      }
    });
  };
</script>
