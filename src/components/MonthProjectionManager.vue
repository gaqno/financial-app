<template>
  <div class="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
    <!-- Header -->
    <button @click="isExpanded = !isExpanded"
      class="w-full flex items-center justify-between p-4 text-left hover:bg-gray-50 transition-colors">
      <div class="flex items-center space-x-3">
        <i class="fas fa-calendar-days text-blue-600"></i>
        <h3 class="text-lg font-semibold text-gray-800">📅 Projeção de Meses</h3>
        <span class="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-700 rounded-full">
          {{ activeMonthsCount }} meses ativos
        </span>
      </div>
      <div class="flex items-center space-x-3">
        <span class="text-sm text-gray-600">
          {{ currentMonthName }} + {{ futureMonths }} {{ futureMonths === 1 ? 'mês' : 'meses' }}
        </span>
        <i :class="isExpanded ? 'fas fa-chevron-up' : 'fas fa-chevron-down'" class="text-gray-400"></i>
      </div>
    </button>

    <!-- Expandable content -->
    <div v-if="isExpanded" class="border-t border-gray-200">
      <!-- Quick controls -->
      <div class="p-4 bg-gray-50">
        <div class="flex items-center justify-between mb-4">
          <div>
            <h4 class="font-medium text-gray-800">🎯 Meses Futuros</h4>
            <p class="text-sm text-gray-600">Quantos meses à frente você quer projetar?</p>
          </div>
          <div class="flex items-center space-x-3">
            <button @click="changeFutureMonths(-1)" :disabled="futureMonths <= 1"
              class="w-8 h-8 flex items-center justify-center bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed">
              <i class="fas fa-minus text-xs"></i>
            </button>
            <span class="w-12 text-center font-semibold text-lg">{{ futureMonths }}</span>
            <button @click="changeFutureMonths(1)" :disabled="futureMonths >= 12"
              class="w-8 h-8 flex items-center justify-center bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed">
              <i class="fas fa-plus text-xs"></i>
            </button>
          </div>
        </div>

        <!-- Quick presets -->
        <div class="flex flex-wrap gap-2 mb-4">
          <button v-for="preset in quickPresets" :key="preset.months" @click="setFutureMonths(preset.months)" :class="[
            'px-3 py-1.5 text-sm font-medium rounded-md transition-colors',
            futureMonths === preset.months
              ? 'bg-blue-600 text-white'
              : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
          ]">
            {{ preset.label }}
          </button>
        </div>

        <!-- Include past months toggle -->
        <div class="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200">
          <div class="flex items-center space-x-3">
            <input v-model="includePastMonths" type="checkbox"
              class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded">
            <div>
              <label class="font-medium text-gray-800 cursor-pointer" @click="includePastMonths = !includePastMonths">
                📊 Incluir Meses Passados
              </label>
              <div class="text-sm text-gray-600">Para comparação com períodos anteriores</div>
            </div>
          </div>
          <div v-if="includePastMonths" class="flex items-center space-x-2">
            <button @click="changePastMonths(-1)" :disabled="pastMonths <= 1"
              class="w-6 h-6 flex items-center justify-center bg-gray-100 border border-gray-300 rounded text-xs hover:bg-gray-200 disabled:opacity-50">
              <i class="fas fa-minus"></i>
            </button>
            <span class="w-6 text-center text-sm font-medium">{{ pastMonths }}</span>
            <button @click="changePastMonths(1)" :disabled="pastMonths >= 6"
              class="w-6 h-6 flex items-center justify-center bg-gray-100 border border-gray-300 rounded text-xs hover:bg-gray-200 disabled:opacity-50">
              <i class="fas fa-plus"></i>
            </button>
          </div>
        </div>
      </div>

      <!-- Active months preview -->
      <div class="border-t border-gray-200 p-4">
        <h4 class="font-medium text-gray-800 mb-3">📅 Meses Ativos na Projeção</h4>
        <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
          <div v-for="monthKey in visibleMonthKeys" :key="monthKey" :class="[
            'px-3 py-2 text-sm font-medium rounded-lg text-center border',
            isCurrentMonth(monthKey)
              ? 'bg-green-100 text-green-800 border-green-300 ring-2 ring-green-200'
              : isPastMonth(monthKey)
                ? 'bg-gray-100 text-gray-700 border-gray-300'
                : 'bg-blue-100 text-blue-800 border-blue-300'
          ]">
            <div class="flex items-center justify-center space-x-1">
              <span>{{ formatMonthKey(monthKey) }}</span>
              <i v-if="isCurrentMonth(monthKey)" class="fas fa-star text-green-600 text-xs"></i>
              <i v-else-if="isPastMonth(monthKey)" class="fas fa-history text-gray-500 text-xs"></i>
              <i v-else class="fas fa-arrow-right text-blue-600 text-xs"></i>
            </div>
          </div>
        </div>

        <!-- Summary info -->
        <div class="mt-4 p-3 bg-blue-50 rounded-lg">
          <div class="flex items-center justify-center space-x-6 text-sm">
            <div v-if="includePastMonths" class="text-center">
              <div class="font-semibold text-gray-700">{{ pastMonths }}</div>
              <div class="text-gray-600">Passados</div>
            </div>
            <div class="text-center">
              <div class="font-semibold text-green-700">1</div>
              <div class="text-green-600">Atual</div>
            </div>
            <div class="text-center">
              <div class="font-semibold text-blue-700">{{ futureMonths }}</div>
              <div class="text-blue-600">Futuros</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'

interface Props {
  projectionSettings: {
    includePastMonths: number
    includeFutureMonths: number
    maxFutureMonths: number
  }
  getSmartVisibleMonths: Set<string>
  getCurrentMonthKey: () => string
}

interface Emits {
  (e: 'update-projection', settings: { includePastMonths: number; includeFutureMonths: number }): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const isExpanded = ref(false)

// Local reactive state
const futureMonths = ref(props.projectionSettings.includeFutureMonths)
const pastMonths = ref(props.projectionSettings.includePastMonths)
const includePastMonths = ref(props.projectionSettings.includePastMonths > 0)

// Quick presets
const quickPresets = [
  { months: 1, label: '📅 1 Mês' },
  { months: 3, label: '🎯 Trimestre' },
  { months: 6, label: '📊 Semestre' },
  { months: 12, label: '📈 Ano' }
]

// Computed properties
const currentMonthName = computed(() => {
  const currentKey = props.getCurrentMonthKey()
  const [year, month] = currentKey.split('-').map(Number)
  const date = new Date(year, month - 1, 1)
  return date.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
})

const activeMonthsCount = computed(() => {
  return (includePastMonths.value ? pastMonths.value : 0) + 1 + futureMonths.value
})

const visibleMonthKeys = computed(() => {
  const currentKey = props.getCurrentMonthKey()
  const [currentYear, currentMonth] = currentKey.split('-').map(Number)
  const keys: string[] = []

  // Add past months if enabled
  if (includePastMonths.value) {
    for (let i = pastMonths.value; i >= 1; i--) {
      const pastDate = new Date(currentYear, currentMonth - 1 - i, 1)
      const pastKey = `${pastDate.getFullYear()}-${(pastDate.getMonth() + 1).toString().padStart(2, '0')}`
      keys.push(pastKey)
    }
  }

  // Add current month
  keys.push(currentKey)

  // Add future months
  for (let i = 1; i <= futureMonths.value; i++) {
    const futureDate = new Date(currentYear, currentMonth - 1 + i, 1)
    const futureKey = `${futureDate.getFullYear()}-${(futureDate.getMonth() + 1).toString().padStart(2, '0')}`
    keys.push(futureKey)
  }

  return keys
})

// Helper functions
const isCurrentMonth = (monthKey: string): boolean => {
  return monthKey === props.getCurrentMonthKey()
}

const isPastMonth = (monthKey: string): boolean => {
  return monthKey < props.getCurrentMonthKey()
}

const formatMonthKey = (monthKey: string): string => {
  const [year, month] = monthKey.split('-').map(Number)
  const date = new Date(year, month - 1, 1)
  return date.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' })
}

// Actions
const changeFutureMonths = (delta: number) => {
  const newValue = Math.max(1, Math.min(12, futureMonths.value + delta))
  futureMonths.value = newValue
  emitUpdate()
}

const changePastMonths = (delta: number) => {
  const newValue = Math.max(1, Math.min(6, pastMonths.value + delta))
  pastMonths.value = newValue
  emitUpdate()
}

const setFutureMonths = (months: number) => {
  futureMonths.value = months
  emitUpdate()
}

const emitUpdate = () => {
  emit('update-projection', {
    includePastMonths: includePastMonths.value ? pastMonths.value : 0,
    includeFutureMonths: futureMonths.value
  })
}

// Watch for changes in includePastMonths checkbox
watch(includePastMonths, () => {
  emitUpdate()
})

// Watch for prop changes
watch(() => props.projectionSettings, (newSettings) => {
  futureMonths.value = newSettings.includeFutureMonths
  pastMonths.value = newSettings.includePastMonths
  includePastMonths.value = newSettings.includePastMonths > 0
}, { deep: true })
</script>