<template>
  <div v-if="totalAvailableMonths > 0" class="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
    <!-- Header with toggle -->
    <button @click="isExpanded = !isExpanded"
      class="w-full flex items-center justify-between p-4 text-left hover:bg-gray-50 transition-colors">
      <div class="flex items-center space-x-3">
        <i class="fas fa-calendar-alt text-blue-600"></i>
        <h3 class="text-lg font-semibold text-gray-800">
          Gerenciar Visibilidade dos Meses
        </h3>
        <span class="text-sm text-gray-500">
          ({{ currentPageInfo.start }}-{{ currentPageInfo.end }} de {{ currentPageInfo.total }} meses)
        </span>
      </div>
      <div class="flex items-center space-x-2">
        <span v-if="hiddenCount > 0" class="text-sm text-red-600 font-medium">
          {{ hiddenCount }} oculto{{ hiddenCount !== 1 ? 's' : '' }}
        </span>
        <i :class="isExpanded ? 'fas fa-chevron-up' : 'fas fa-chevron-down'" class="text-gray-400"></i>
      </div>
    </button>

    <!-- Expandable content -->
    <div v-if="isExpanded" class="border-t border-gray-200">
      <!-- Pagination controls -->
      <div v-if="totalMonthPages > 1" class="flex items-center justify-between p-4 bg-gray-50 border-b border-gray-200">
        <button @click="goToPreviousMonthPage" :disabled="!canGoToPreviousMonthPage"
          class="flex items-center space-x-2 px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
          <i class="fas fa-chevron-left text-xs"></i>
          <span>Anteriores</span>
        </button>

        <div class="flex items-center space-x-2">
          <span class="text-sm text-gray-600">
            Página {{ monthsVisibilityPage + 1 }} de {{ totalMonthPages }}
          </span>
          <div class="flex space-x-1">
            <button v-for="page in Math.min(totalMonthPages, 5)" :key="page" @click="goToMonthPage(page - 1)" :class="[
              'w-8 h-8 text-sm font-medium rounded-md transition-colors',
              monthsVisibilityPage === page - 1
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
            ]">
              {{ page }}
            </button>
            <span v-if="totalMonthPages > 5" class="px-2 text-gray-400">...</span>
          </div>
        </div>

        <button @click="goToNextMonthPage" :disabled="!canGoToNextMonthPage"
          class="flex items-center space-x-2 px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
          <span>Próximos</span>
          <i class="fas fa-chevron-right text-xs"></i>
        </button>
      </div>

      <!-- Month list for current page -->
      <div class="p-4 space-y-3">
        <div v-for="(month, monthKey) in paginatedAvailableMonths" :key="monthKey"
          class="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
          <div class="flex items-center space-x-3">
            <div class="w-3 h-3 rounded-full" :class="month.isHidden ? 'bg-red-500' : 'bg-green-500'"></div>
            <span class="font-medium text-gray-800">{{ month.name }}</span>
            <span class="text-sm text-gray-500">({{ month.recordCount }} registro{{ month.recordCount !== 1 ? 's' : ''
              }})</span>
          </div>
          <div class="flex items-center space-x-2">
            <span class="text-sm font-medium" :class="month.isHidden ? 'text-red-600' : 'text-green-600'">
              {{ month.isHidden ? 'Oculto do saldo' : 'Incluído no saldo' }}
            </span>
            <button @click="toggleMonthVisibility(monthKey)"
              class="flex items-center space-x-1 px-3 py-1.5 text-sm font-medium rounded-md transition-colors" :class="month.isHidden
                ? 'text-green-700 bg-green-100 hover:bg-green-200'
                : 'text-red-700 bg-red-100 hover:bg-red-200'
                ">
              <i :class="month.isHidden ? 'fas fa-eye' : 'fas fa-eye-slash'" class="text-xs"></i>
              <span>{{ month.isHidden ? 'Mostrar' : 'Ocultar' }}</span>
            </button>
          </div>
        </div>
      </div>

      <!-- Footer with summary and actions -->
      <div class="flex items-center justify-between p-4 bg-gray-50 border-t border-gray-200">
        <div class="text-sm text-gray-600">
          <span class="font-medium">{{ visibleMonthsCount }}</span> de
          <span class="font-medium">{{ totalAvailableMonths }}</span> meses incluídos no saldo
        </div>
        <div class="flex items-center space-x-2">
          <button v-if="hiddenCount > 0" @click="showAllMonths"
            class="flex items-center space-x-2 px-3 py-1.5 text-sm font-medium text-blue-700 bg-blue-100 rounded-md hover:bg-blue-200 transition-colors">
            <i class="fas fa-eye text-xs"></i>
            <span>Mostrar Todos</span>
          </button>
          <button v-if="visibleMonthsCount > 0" @click="hideAllMonths"
            class="flex items-center space-x-2 px-3 py-1.5 text-sm font-medium text-red-700 bg-red-100 rounded-md hover:bg-red-200 transition-colors">
            <i class="fas fa-eye-slash text-xs"></i>
            <span>Ocultar Todos</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'

interface IMonthData {
  key: string
  name: string
  isHidden: boolean
  recordCount: number
}

interface Props {
  paginatedAvailableMonths: Record<string, IMonthData>
  totalAvailableMonths: number
  totalMonthPages: number
  canGoToPreviousMonthPage: boolean
  canGoToNextMonthPage: boolean
  currentPageInfo: { start: number; end: number; total: number }
  monthsVisibilityPage: number
}

interface Emits {
  (e: 'toggle-month-visibility', monthKey: string): void
  (e: 'show-all-months'): void
  (e: 'hide-all-months'): void
  (e: 'go-to-next-page'): void
  (e: 'go-to-previous-page'): void
  (e: 'go-to-page', page: number): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const isExpanded = ref(false)

const hiddenCount = computed(() => {
  return Object.values(props.paginatedAvailableMonths).filter(month => month.isHidden).length
})

const visibleMonthsCount = computed(() => {
  return props.totalAvailableMonths - Object.values(props.paginatedAvailableMonths).filter(month => month.isHidden).length
})

const toggleMonthVisibility = (monthKey: string) => {
  emit('toggle-month-visibility', monthKey)
}

const showAllMonths = () => {
  emit('show-all-months')
}

const hideAllMonths = () => {
  emit('hide-all-months')
}

const goToNextMonthPage = () => {
  emit('go-to-next-page')
}

const goToPreviousMonthPage = () => {
  emit('go-to-previous-page')
}

const goToMonthPage = (page: number) => {
  emit('go-to-page', page)
}
</script>