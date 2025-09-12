<template>
  <!-- Mobile Search Overlay -->
  <Transition name="search-overlay">
    <div v-if="isOpen" class="fixed inset-0 z-50 bg-white dark:bg-slate-900">

      <!-- Search Header -->
      <div
        class="flex items-center px-4 py-3 relative after:absolute after:bottom-0 after:left-4 after:right-4 after:h-px after:bg-gradient-to-r after:from-transparent after:via-gray-200 after:to-transparent dark:after:via-slate-600">
        <button @click="close" class="mr-3 p-2 -ml-2 text-gray-600 dark:text-slate-400">
          <i class="fas fa-arrow-left text-lg"></i>
        </button>

        <!-- Search Input -->
        <div class="flex-1 relative">
          <input ref="searchInput" v-model="searchQuery" @input="handleSearch" @keyup.enter="performSearch" type="text"
            placeholder="Buscar transações..."
            class="w-full pl-10 pr-10 py-3 bg-gray-100 dark:bg-slate-800 border-0 rounded-xl text-lg focus:ring-2 focus:ring-blue-500 focus:bg-white dark:focus:bg-slate-700 transition-colors" />
          <i class="fas fa-search absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"></i>

          <!-- Clear Button -->
          <button v-if="searchQuery" @click="clearSearch"
            class="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600">
            <i class="fas fa-times"></i>
          </button>
        </div>

        <!-- Voice Search -->
        <button @click="startVoiceSearch" :class="[
          'ml-3 p-3 rounded-xl transition-colors',
          isListening
            ? 'bg-red-500 text-white animate-pulse'
            : 'bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-slate-400'
        ]">
          <i :class="isListening ? 'fas fa-stop' : 'fas fa-microphone'"></i>
        </button>
      </div>

      <!-- Quick Filters -->
      <div class="px-4 py-3 bg-gray-50/30 dark:bg-slate-800/30">
        <div class="flex items-center space-x-2 overflow-x-auto pb-2">

          <!-- Filter Chips -->
          <button v-for="filter in quickFilters" :key="filter.key" @click="toggleFilter(filter.key)" :class="[
            'flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-all duration-200',
            activeFilters.includes(filter.key)
              ? 'bg-blue-500 text-white shadow-md'
              : 'bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-slate-300 hover:bg-gray-200 dark:hover:bg-slate-700'
          ]">
            <i :class="filter.icon" class="mr-2"></i>
            {{ filter.label }}
            <span v-if="filter.count" class="ml-2 px-2 py-0.5 bg-white bg-opacity-25 rounded-full text-xs">
              {{ filter.count }}
            </span>
          </button>

        </div>
      </div>

      <!-- Search Suggestions -->
      <div v-if="searchQuery && suggestions.length > 0"
        class="px-4 py-2 shadow-[0_1px_0_0_rgba(0,0,0,0.05)] dark:shadow-[0_1px_0_0_rgba(255,255,255,0.05)]">
        <h3 class="text-sm font-medium text-gray-500 dark:text-slate-400 mb-2">Sugestões</h3>
        <div class="space-y-2">
          <button v-for="suggestion in suggestions" :key="suggestion.text" @click="applySuggestion(suggestion)"
            class="w-full flex items-center p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors text-left">
            <i :class="suggestion.icon" class="mr-3 text-gray-400"></i>
            <div>
              <div class="font-medium text-gray-900 dark:text-slate-100">{{ suggestion.text }}</div>
              <div class="text-sm text-gray-500 dark:text-slate-400">{{ suggestion.description }}</div>
            </div>
            <i class="fas fa-arrow-up-right ml-auto text-gray-400"></i>
          </button>
        </div>
      </div>

      <!-- Recent Searches -->
      <div v-if="!searchQuery && recentSearches.length > 0"
        class="px-4 py-2 mb-4 bg-gray-50/50 dark:bg-slate-800/50 rounded-2xl mx-4">
        <div class="flex items-center justify-between mb-2">
          <h3 class="text-sm font-medium text-gray-500 dark:text-slate-400">Buscas Recentes</h3>
          <button @click="clearRecentSearches" class="text-sm text-blue-500 hover:text-blue-600">
            Limpar
          </button>
        </div>
        <div class="space-y-2">
          <button v-for="recent in recentSearches" :key="recent" @click="applyRecentSearch(recent)"
            class="w-full flex items-center p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors text-left">
            <i class="fas fa-clock mr-3 text-gray-400"></i>
            <span class="text-gray-700 dark:text-slate-300">{{ recent }}</span>
            <button @click.stop="removeRecentSearch(recent)" class="ml-auto p-1 text-gray-400 hover:text-gray-600">
              <i class="fas fa-times text-xs"></i>
            </button>
          </button>
        </div>
      </div>

      <!-- Search Results -->
      <div class="flex-1 overflow-y-auto">
        <div v-if="isSearching" class="flex items-center justify-center py-12">
          <div class="text-center">
            <div class="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full mx-auto mb-3">
            </div>
            <p class="text-gray-500 dark:text-slate-400">Procurando...</p>
          </div>
        </div>

        <div v-else-if="searchResults.length === 0 && searchQuery" class="flex items-center justify-center py-12">
          <div class="text-center">
            <i class="fas fa-search text-4xl text-gray-300 dark:text-slate-600 mb-3"></i>
            <p class="text-gray-500 dark:text-slate-400 mb-2">Nenhum resultado encontrado</p>
            <p class="text-sm text-gray-400 dark:text-slate-500">Tente buscar por descrição, categoria ou valor</p>
          </div>
        </div>

        <div v-else-if="searchResults.length > 0" class="p-4 space-y-3">
          <div class="flex items-center justify-between mb-3">
            <span class="text-sm text-gray-500 dark:text-slate-400">
              {{ searchResults.length }} resultado{{ searchResults.length !== 1 ? 's' : '' }} encontrado{{
                searchResults.length !== 1 ? 's' : '' }}
            </span>
            <button @click="sortResults" class="text-sm text-blue-500 hover:text-blue-600">
              Ordenar <i class="fas fa-sort ml-1"></i>
            </button>
          </div>

          <!-- Search Result Cards -->
          <div v-for="(result, index) in searchResults" :key="result.id" @click="selectResult(result)"
            class="bg-white dark:bg-slate-800 rounded-xl p-4 border border-gray-200 dark:border-slate-600 hover:shadow-md transition-all duration-200 active:scale-95">

            <div class="flex items-start justify-between mb-2">
              <div class="flex-1">
                <h3 class="font-medium text-gray-900 dark:text-slate-100"
                  v-html="highlightSearchTerm(result.Descrição)"></h3>
                <p class="text-sm text-gray-500 dark:text-slate-400">{{ formatDate(result.Data) }}</p>
              </div>
              <div class="text-right">
                <div :class="[
                  'text-lg font-bold',
                  result.Valor < 0 ? 'text-red-600' : 'text-green-600'
                ]">
                  {{ formatCurrency(result.Valor) }}
                </div>
                <span :class="[
                  'text-xs px-2 py-1 rounded-full',
                  result.Status === '✔️'
                    ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-300'
                    : 'bg-orange-100 dark:bg-orange-900 text-orange-800 dark:text-orange-300'
                ]">
                  {{ result.Status === '✔️' ? 'Concluído' : 'Pendente' }}
                </span>
              </div>
            </div>

            <div class="flex items-center justify-between text-sm">
              <span class="text-gray-600 dark:text-slate-400">
                <i :class="getCategoryIcon(result.Categoria)" class="mr-1"></i>
                {{ result.Categoria || 'Sem categoria' }}
              </span>
              <span :class="[
                'px-2 py-1 rounded-full text-xs',
                result.Tipo === 'Receita'
                  ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-300'
                  : 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-300'
              ]">
                {{ result.Tipo === 'Receita' ? '💰' : '💸' }} {{ result.Tipo }}
              </span>
            </div>
          </div>
        </div>

        <!-- Empty State -->
        <div v-else-if="!searchQuery" class="flex items-center justify-center py-12">
          <div class="text-center">
            <i class="fas fa-search text-4xl text-gray-300 dark:text-slate-600 mb-3"></i>
            <p class="text-gray-500 dark:text-slate-400 mb-2">Digite para buscar suas transações</p>
            <p class="text-sm text-gray-400 dark:text-slate-500">Procure por descrição, categoria, valor ou data</p>
          </div>
        </div>
      </div>

    </div>
  </Transition>
</template>

<script setup lang="ts">
import { ref, computed, nextTick, watch } from 'vue'
import { useFinanceStore } from '../../stores/financeStore'
import { useFinanceTable } from '../../composables/finance/useFinanceTable'
import { useCategoryDetection } from '../../composables/useCategoryDetection'
import type { IFinanceRecord } from '../../types/finance'

// Props & Emits
interface Props {
  isOpen: boolean
}

interface Emits {
  'close': []
  'select-result': [record: IFinanceRecord]
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

// Composables
const financeStore = useFinanceStore()
const { formatDate, formatCurrency } = useFinanceTable()
const { getCategoryIcon } = useCategoryDetection()

// Reactive State
const searchInput = ref<HTMLInputElement>()
const searchQuery = ref('')
const isSearching = ref(false)
const isListening = ref(false)
const activeFilters = ref<string[]>([])
const recentSearches = ref<string[]>(['Supermercado', 'Gasolina', 'Salário'])
const sortOrder = ref<'date' | 'amount' | 'relevance'>('relevance')

// Quick Filters
const quickFilters = computed(() => [
  {
    key: 'pending',
    label: 'Pendentes',
    icon: 'fas fa-clock',
    count: financeStore.records.filter(r => r.Status === '❌').length
  },
  {
    key: 'income',
    label: 'Receitas',
    icon: 'fas fa-arrow-up',
    count: financeStore.records.filter(r => r.Tipo === 'Receita').length
  },
  {
    key: 'expense',
    label: 'Despesas',
    icon: 'fas fa-arrow-down',
    count: financeStore.records.filter(r => r.Tipo === 'Despesa').length
  },
  {
    key: 'this-month',
    label: 'Este Mês',
    icon: 'fas fa-calendar',
    count: financeStore.records.filter(r => {
      const today = new Date()
      const recordDate = new Date(r.Data)
      return recordDate.getMonth() === today.getMonth() && recordDate.getFullYear() === today.getFullYear()
    }).length
  },
  {
    key: 'high-value',
    label: 'Alto Valor',
    icon: 'fas fa-dollar-sign',
    count: financeStore.records.filter(r => Math.abs(r.Valor) > 500).length
  }
])

// Search Suggestions
const suggestions = computed(() => {
  if (!searchQuery.value) return []

  const query = searchQuery.value.toLowerCase()
  const uniqueDescriptions = [...new Set(financeStore.records.map(r => r.Descrição))]
  const uniqueCategories = [...new Set(financeStore.records.map(r => r.Categoria).filter(Boolean))]

  const descriptionSuggestions = uniqueDescriptions
    .filter(desc => desc.toLowerCase().includes(query))
    .slice(0, 3)
    .map(desc => ({
      text: desc,
      description: 'Descrição',
      icon: 'fas fa-tag'
    }))

  const categorySuggestions = uniqueCategories
    .filter(cat => cat.toLowerCase().includes(query))
    .slice(0, 2)
    .map(cat => ({
      text: cat,
      description: 'Categoria',
      icon: 'fas fa-folder'
    }))

  return [...descriptionSuggestions, ...categorySuggestions]
})

// Search Results
const searchResults = computed(() => {
  if (!searchQuery.value && activeFilters.value.length === 0) return []

  let filtered = financeStore.records

  // Apply text search
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    filtered = filtered.filter(record =>
      record.Descrição.toLowerCase().includes(query) ||
      record.Categoria?.toLowerCase().includes(query) ||
      record.Valor.toString().includes(query) ||
      formatCurrency(record.Valor).includes(query)
    )
  }

  // Apply filters
  activeFilters.value.forEach(filter => {
    switch (filter) {
      case 'pending':
        filtered = filtered.filter(r => r.Status === '❌')
        break
      case 'income':
        filtered = filtered.filter(r => r.Tipo === 'Receita')
        break
      case 'expense':
        filtered = filtered.filter(r => r.Tipo === 'Despesa')
        break
      case 'this-month':
        const today = new Date()
        filtered = filtered.filter(r => {
          const recordDate = new Date(r.Data)
          return recordDate.getMonth() === today.getMonth() && recordDate.getFullYear() === today.getFullYear()
        })
        break
      case 'high-value':
        filtered = filtered.filter(r => Math.abs(r.Valor) > 500)
        break
    }
  })

  // Sort results
  switch (sortOrder.value) {
    case 'date':
      return filtered.sort((a, b) => new Date(b.Data).getTime() - new Date(a.Data).getTime())
    case 'amount':
      return filtered.sort((a, b) => Math.abs(b.Valor) - Math.abs(a.Valor))
    default:
      return filtered
  }
})

// Methods
const handleSearch = () => {
  isSearching.value = true
  // Simulate search delay
  setTimeout(() => {
    isSearching.value = false
  }, 300)
}

const performSearch = () => {
  if (searchQuery.value && !recentSearches.value.includes(searchQuery.value)) {
    recentSearches.value.unshift(searchQuery.value)
    recentSearches.value = recentSearches.value.slice(0, 5) // Keep only 5 recent searches
  }
}

const clearSearch = () => {
  searchQuery.value = ''
  activeFilters.value = []
}

const close = () => {
  emit('close')
}

const toggleFilter = (filterKey: string) => {
  const index = activeFilters.value.indexOf(filterKey)
  if (index > -1) {
    activeFilters.value.splice(index, 1)
  } else {
    activeFilters.value.push(filterKey)
  }
  handleSearch()
}

const applySuggestion = (suggestion: any) => {
  searchQuery.value = suggestion.text
  handleSearch()
}

const applyRecentSearch = (search: string) => {
  searchQuery.value = search
  handleSearch()
}

const removeRecentSearch = (search: string) => {
  const index = recentSearches.value.indexOf(search)
  if (index > -1) {
    recentSearches.value.splice(index, 1)
  }
}

const clearRecentSearches = () => {
  recentSearches.value = []
}

const selectResult = (result: IFinanceRecord) => {
  emit('select-result', result)
  close()
}

const sortResults = () => {
  const orders = ['relevance', 'date', 'amount'] as const
  const currentIndex = orders.indexOf(sortOrder.value)
  sortOrder.value = orders[(currentIndex + 1) % orders.length]
}

const highlightSearchTerm = (text: string) => {
  if (!searchQuery.value) return text
  const regex = new RegExp(`(${searchQuery.value})`, 'gi')
  return text.replace(regex, '<mark class="bg-yellow-200 dark:bg-yellow-800">$1</mark>')
}

const startVoiceSearch = () => {
  if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
    alert('Reconhecimento de voz não suportado')
    return
  }

  isListening.value = !isListening.value
  // TODO: Implement actual voice recognition
}

// Watch for open state to focus input
watch(() => props.isOpen, async (isOpen) => {
  if (isOpen) {
    await nextTick()
    searchInput.value?.focus()
  }
})
</script>

<style scoped>
.search-overlay-enter-active,
.search-overlay-leave-active {
  transition: all 0.3s ease;
}

.search-overlay-enter-from {
  transform: translateY(100%);
  opacity: 0;
}

.search-overlay-leave-to {
  transform: translateY(100%);
  opacity: 0;
}

mark {
  @apply px-1 rounded;
}
</style>
