<template>
  <section class="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
    <!-- Basic Filters -->
    <div class="p-4 border-b border-gray-200">
      <div class="flex flex-wrap gap-2">
        <button @click="setFilter('all')" :class="[
          filter === 'all'
            ? 'bg-blue-500 text-white'
            : 'bg-gray-100 text-gray-700 hover:bg-gray-200',
          'px-4 py-2 rounded-full text-sm font-medium transition-colors'
        ]">
          📊 Todos
        </button>
        <button @click="setFilter('Receita')" :class="[
          filter === 'Receita'
            ? 'bg-green-500 text-white'
            : 'bg-gray-100 text-gray-700 hover:bg-gray-200',
          'px-4 py-2 rounded-full text-sm font-medium transition-colors'
        ]">
          💰 Receitas
        </button>
        <button @click="setFilter('Despesa')" :class="[
          filter === 'Despesa'
            ? 'bg-red-500 text-white'
            : 'bg-gray-100 text-gray-700 hover:bg-gray-200',
          'px-4 py-2 rounded-full text-sm font-medium transition-colors'
        ]">
          💸 Despesas
        </button>
      </div>

      <!-- Active Category Filter Indicator -->
      <div v-if="categoryFilter"
        class="mt-3 flex items-center gap-2 px-3 py-2 bg-orange-50 border border-orange-200 rounded-lg">
        <span class="text-sm text-orange-800">
          🔍 <strong>{{ getCategoryIcon(categoryFilter) }} {{ categoryFilter }}</strong>
        </span>
        <button @click="clearCategoryFilter" class="text-orange-600 hover:text-orange-800 ml-auto">
          <i class="fas fa-times"></i>
        </button>
      </div>

      <!-- Auto-categorization button -->
      <div v-if="recordsWithoutCategory.length > 0" class="mt-3">
        <button @click="refreshCategorization"
          class="w-full lg:w-auto px-4 py-3 bg-purple-500 hover:bg-purple-600 text-white rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2">
          <i class="fas fa-robot"></i>
          <span>Auto-categorizar {{ recordsWithoutCategory.length }} registro{{
            recordsWithoutCategory.length > 1 ? 's' : '' }}</span>
        </button>
      </div>
    </div>

    <!-- Desktop Controls -->
    <div class="hidden lg:flex items-center justify-between p-4 bg-gray-50">
      <span class="text-sm text-gray-600">{{ filteredRecordsCount }} registros encontrados</span>
      <div class="flex gap-2">
        <button @click="refreshCategorization"
          class="px-3 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-1"
          :disabled="recordsWithoutCategory.length === 0"
          :title="`Detectar categorias para ${recordsWithoutCategory.length} registros sem categoria`">
          <i class="fas fa-robot text-xs"></i>
          <span>Auto-categorizar ({{ recordsWithoutCategory.length }})</span>
        </button>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useFinanceFilters } from '../../composables/finance/useFinanceFilters'
import { useCategoryDetection } from '../../composables/useCategoryDetection'
import { useFinanceStore } from '../../stores/financeStore'

const {
  filter,
  categoryFilter,
  setFilter,
  clearCategoryFilter
} = useFinanceFilters()

const { getCategoryIcon, detectCategory } = useCategoryDetection()
const financeStore = useFinanceStore()

// Computed
const filteredRecordsCount = computed(() => financeStore.filteredData.length)

const recordsWithoutCategory = computed(() => {
  return financeStore.records.filter(record => !record.Categoria || record.Categoria === '' || record.Categoria === 'Outros')
})

const refreshCategorization = () => {
  console.log('🤖 [AUTO_CATEGORIZE] Starting auto-categorization process...')

  let updatedCount = 0

  recordsWithoutCategory.value.forEach(record => {
    // Find the record index in the store
    const recordIndex = financeStore.records.findIndex(r =>
      r.Data === record.Data &&
      r.Descrição === record.Descrição &&
      r.Valor === record.Valor &&
      r.Tipo === record.Tipo
    )

    if (recordIndex !== -1) {
      const detectedCategory = detectCategory(record.Descrição)

      if (detectedCategory && detectedCategory !== 'Outros') {
        console.log('🔄 [AUTO_CATEGORIZE] Categorizing:', record.Descrição, '->', detectedCategory)

        // Update the record in the store
        const success = financeStore.updateRecord(recordIndex, {
          Categoria: detectedCategory
        })

        if (success) {
          updatedCount++
        }
      }
    }
  })

  console.log(`✅ [AUTO_CATEGORIZE] Auto-categorization complete: ${updatedCount} records updated`)

  if (updatedCount > 0) {
    // Show a success message or toast
    console.log(`🎉 [AUTO_CATEGORIZE] Successfully categorized ${updatedCount} record${updatedCount > 1 ? 's' : ''}!`)
  }
}
</script>