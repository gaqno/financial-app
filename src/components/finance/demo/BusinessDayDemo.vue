<template>
  <div class="business-day-demo p-6 max-w-2xl mx-auto">
    <div class="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
      <h1 class="text-2xl font-bold text-gray-900 mb-6">
        <i class="fas fa-calendar-week text-blue-500 mr-2"></i>
        Demonstração: Seletor de Dias Úteis
      </h1>

      <div class="space-y-6">
        <!-- Business Day Selector -->
        <div>
          <BusinessDaySelector v-model="selectedDate" label="Teste o Seletor de Dias Úteis" :default-business-day="1"
            :show-calendar-preview="true" @business-day-change="handleBusinessDayChange" />
        </div>

        <!-- Results Display -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <!-- Current Selection -->
          <div class="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 class="text-sm font-semibold text-blue-800 mb-2">
              <i class="fas fa-calendar-check mr-1"></i>
              Data Selecionada
            </h3>
            <div class="space-y-2 text-sm">
              <div><strong>Data:</strong> {{ formatSelectedDate }}</div>
              <div><strong>Dia da Semana:</strong> {{ dayOfWeek }}</div>
              <div v-if="businessDayInfo.isBusinessDayMode" class="text-blue-700">
                <strong>Modo:</strong> Dia Útil
              </div>
              <div v-else class="text-gray-700">
                <strong>Modo:</strong> Data Normal
              </div>
            </div>
          </div>

          <!-- Business Day Info -->
          <div v-if="businessDayInfo.isBusinessDayMode" class="bg-green-50 border border-green-200 rounded-lg p-4">
            <h3 class="text-sm font-semibold text-green-800 mb-2">
              <i class="fas fa-briefcase mr-1"></i>
              Informações do Dia Útil
            </h3>
            <div class="space-y-2 text-sm">
              <div><strong>Número:</strong> {{ businessDayInfo.dayNumber }}º dia útil</div>
              <div><strong>Mês:</strong> {{ getMonthName(businessDayInfo.month) }}</div>
              <div><strong>Ano:</strong> {{ businessDayInfo.year }}</div>
              <div v-if="businessDayInfo.calculatedDate" class="text-green-700">
                <strong>Calculado:</strong> {{ formatDate(businessDayInfo.calculatedDate) }}
              </div>
            </div>
          </div>
        </div>

        <!-- Raw Data (for debugging) -->
        <details class="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <summary class="cursor-pointer text-sm font-medium text-gray-700">
            <i class="fas fa-code mr-1"></i>
            Dados Técnicos (Debug)
          </summary>
          <div class="mt-3 space-y-2 text-xs">
            <div>
              <strong>selectedDate:</strong>
              <code class="bg-gray-200 px-1 rounded">{{ selectedDate }}</code>
            </div>
            <div>
              <strong>businessDayInfo:</strong>
              <pre
                class="bg-gray-200 p-2 rounded mt-1 overflow-x-auto">{{ JSON.stringify(businessDayInfo, null, 2) }}</pre>
            </div>
            <div>
              <strong>Timestamp:</strong>
              <code class="bg-gray-200 px-1 rounded">{{ new Date().toISOString() }}</code>
            </div>
          </div>
        </details>

        <!-- Quick Tests -->
        <div class="border border-gray-200 rounded-lg p-4">
          <h3 class="text-sm font-semibold text-gray-800 mb-3">
            <i class="fas fa-flask mr-1"></i>
            Testes Rápidos
          </h3>
          <div class="flex flex-wrap gap-2">
            <button @click="testToday"
              class="px-3 py-1 bg-blue-100 text-blue-700 rounded-md text-xs hover:bg-blue-200 transition-colors">
              Hoje
            </button>
            <button @click="testFirstBusinessDay"
              class="px-3 py-1 bg-green-100 text-green-700 rounded-md text-xs hover:bg-green-200 transition-colors">
              1º Dia Útil
            </button>
            <button @click="testFifthBusinessDay"
              class="px-3 py-1 bg-orange-100 text-orange-700 rounded-md text-xs hover:bg-orange-200 transition-colors">
              5º Dia Útil
            </button>
            <button @click="testNextMonth"
              class="px-3 py-1 bg-purple-100 text-purple-700 rounded-md text-xs hover:bg-purple-200 transition-colors">
              Próximo Mês
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import BusinessDaySelector from '../forms/BusinessDaySelector.vue'

// State
const selectedDate = ref(new Date().toISOString().split('T')[0])

const businessDayInfo = ref<{
  isBusinessDayMode: boolean
  dayNumber?: number
  month?: number
  year?: number
  calculatedDate?: string
}>({
  isBusinessDayMode: false,
  dayNumber: undefined,
  month: undefined,
  year: undefined,
  calculatedDate: undefined
})

// Computed
const formatSelectedDate = computed(() => {
  if (!selectedDate.value) return 'Não selecionada'

  try {
    const date = new Date(selectedDate.value)
    return date.toLocaleDateString('pt-BR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  } catch {
    return 'Data inválida'
  }
})

const dayOfWeek = computed(() => {
  if (!selectedDate.value) return ''

  try {
    const date = new Date(selectedDate.value)
    const days = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado']
    const dayIndex = date.getDay()
    const dayName = days[dayIndex]

    if (dayIndex === 0 || dayIndex === 6) {
      return `${dayName} (fim de semana)`
    } else {
      return `${dayName} (dia útil)`
    }
  } catch {
    return 'Inválido'
  }
})

// Methods
const handleBusinessDayChange = (info: typeof businessDayInfo.value) => {
  businessDayInfo.value = info
    ('📅 [BUSINESS_DAY_DEMO] Business day info updated:', info)
}

const formatDate = (dateStr: string): string => {
  try {
    const date = new Date(dateStr)
    return date.toLocaleDateString('pt-BR')
  } catch {
    return 'Data inválida'
  }
}

const getMonthName = (monthNumber?: number): string => {
  if (!monthNumber) return ''
  const months = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ]
  return months[monthNumber - 1] || ''
}

// Test methods
const testToday = () => {
  selectedDate.value = new Date().toISOString().split('T')[0]
    ('🧪 [TEST] Set to today:', selectedDate.value)
}

const testFirstBusinessDay = () => {
  // This would trigger business day mode with 1st business day
  ('🧪 [TEST] Testing 1st business day - use the toggle in the component')
}

const testFifthBusinessDay = () => {
  ('🧪 [TEST] Testing 5th business day - use the toggle in the component')
}

const testNextMonth = () => {
  const nextMonth = new Date()
  nextMonth.setMonth(nextMonth.getMonth() + 1)
  nextMonth.setDate(1)
  selectedDate.value = nextMonth.toISOString().split('T')[0]
    ('🧪 [TEST] Set to next month:', selectedDate.value)
}
</script>

<style scoped>
/* Custom scrollbar for code blocks */
pre {
  scrollbar-width: thin;
  scrollbar-color: #cbd5e0 #f7fafc;
}

pre::-webkit-scrollbar {
  height: 4px;
}

pre::-webkit-scrollbar-track {
  background: #f7fafc;
}

pre::-webkit-scrollbar-thumb {
  background-color: #cbd5e0;
  border-radius: 2px;
}
</style>