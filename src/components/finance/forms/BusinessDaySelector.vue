<template>
  <div class="business-day-selector">
    <!-- Toggle between date input and business day mode -->
    <div class="flex items-center gap-2 mb-3">
      <label class="block text-sm font-medium text-gray-700">
        {{ label }}
      </label>
      <button @click="toggleMode" type="button" class="text-xs px-2 py-1 rounded-md transition-colors"
        :class="isBusinessDayMode ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'"
        :title="isBusinessDayMode ? 'Voltar para data normal' : 'Usar dia útil'">
        <i class="fas fa-calendar-week mr-1"></i>
        {{ isBusinessDayMode ? 'Dia Útil' : 'Data Normal' }}
      </button>
    </div>

    <!-- Normal Date Input -->
    <div v-if="!isBusinessDayMode" class="space-y-2">
      <input :value="modelValue" @input="handleDateInput" type="date"
        class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        :disabled="disabled" />
    </div>

    <!-- Business Day Mode -->
    <div v-else class="space-y-3">
      <!-- Business Day Configuration -->
      <div class="bg-blue-50 border border-blue-200 rounded-lg p-3">
        <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
          <!-- Business Day Number -->
          <div>
            <label class="block text-xs font-medium text-gray-700 mb-1">
              Dia Útil
            </label>
            <select v-model="businessDayNumber" @change="calculateAndEmitDate"
              class="w-full border border-gray-300 rounded-md px-2 py-1 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent">
              <option v-for="day in businessDayOptions" :key="day" :value="day">
                {{ day }}º dia útil
              </option>
            </select>
          </div>

          <!-- Month -->
          <div>
            <label class="block text-xs font-medium text-gray-700 mb-1">
              Mês
            </label>
            <select v-model="selectedMonth" @change="calculateAndEmitDate"
              class="w-full border border-gray-300 rounded-md px-2 py-1 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent">
              <option v-for="(month, index) in monthOptions" :key="index" :value="index + 1">
                {{ month }}
              </option>
            </select>
          </div>

          <!-- Year -->
          <div>
            <label class="block text-xs font-medium text-gray-700 mb-1">
              Ano
            </label>
            <select v-model="selectedYear" @change="calculateAndEmitDate"
              class="w-full border border-gray-300 rounded-md px-2 py-1 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent">
              <option v-for="year in yearOptions" :key="year" :value="year">
                {{ year }}
              </option>
            </select>
          </div>
        </div>

        <!-- Calculated Date Preview -->
        <div class="mt-3 p-2 bg-white border border-blue-200 rounded-md">
          <div class="flex items-center justify-between text-sm">
            <span class="text-gray-600">Data calculada:</span>
            <span class="font-semibold text-blue-700">
              {{ calculatedDateFormatted }}
            </span>
          </div>
          <div class="text-xs text-gray-500 mt-1">
            {{ businessDayDescription }}
          </div>
        </div>

        <!-- Business Day Calendar Preview -->
        <div v-if="showCalendarPreview" class="mt-3">
          <button @click="toggleCalendarPreview" type="button"
            class="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1">
            <i :class="showCalendar ? 'fas fa-chevron-up' : 'fas fa-chevron-down'"></i>
            {{ showCalendar ? 'Ocultar' : 'Ver' }} calendário
          </button>

          <div v-if="showCalendar" class="mt-2 bg-white border border-gray-200 rounded-md p-3">
            <BusinessDayCalendar :year="selectedYear" :month="selectedMonth" :business-day-number="businessDayNumber"
              :calculated-date="calculatedDate" />
          </div>
        </div>
      </div>

      <!-- Quick Business Day Presets -->
      <div class="flex flex-wrap gap-1">
        <button v-for="preset in quickPresets" :key="preset.label" @click="applyPreset(preset)" type="button"
          class="text-xs px-2 py-1 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors">
          {{ preset.label }}
        </button>
      </div>
    </div>

    <!-- Validation Message -->
    <div v-if="validationMessage" class="mt-2 text-xs text-red-600">
      <i class="fas fa-exclamation-triangle mr-1"></i>
      {{ validationMessage }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { useBusinessDays } from '../../../composables/finance/useBusinessDays'
import BusinessDayCalendar from './BusinessDayCalendar.vue'

interface Props {
  modelValue: string
  label?: string
  disabled?: boolean
  showCalendarPreview?: boolean
  defaultBusinessDay?: number
}

interface Emits {
  'update:modelValue': [value: string]
  'business-day-change': [businessDayInfo: {
    isBusinessDayMode: boolean
    dayNumber?: number
    month?: number
    year?: number
    calculatedDate?: string
  }]
}

const props = withDefaults(defineProps<Props>(), {
  label: 'Data',
  disabled: false,
  showCalendarPreview: true,
  defaultBusinessDay: 1
})

const emit = defineEmits<Emits>()

// Use business days composable
const { calculateBusinessDay, getMonthName, getYearOptions } = useBusinessDays()

// Local state
const isBusinessDayMode = ref(false)
const businessDayNumber = ref(props.defaultBusinessDay)
const selectedMonth = ref(new Date().getMonth() + 1)
const selectedYear = ref(new Date().getFullYear())
const showCalendar = ref(false)
const validationMessage = ref('')

// Options
const businessDayOptions = computed(() => {
  return Array.from({ length: 22 }, (_, i) => i + 1) // Up to 22 business days
})

const monthOptions = computed(() => {
  return [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ]
})

const yearOptions = computed(() => getYearOptions())

// Quick presets for common business days
const quickPresets = computed(() => [
  { label: '1º dia útil', dayNumber: 1, monthOffset: 0 },
  { label: '5º dia útil', dayNumber: 5, monthOffset: 0 },
  { label: '10º dia útil', dayNumber: 10, monthOffset: 0 },
  { label: '15º dia útil', dayNumber: 15, monthOffset: 0 },
  { label: 'Último dia útil', dayNumber: -1, monthOffset: 0 }, // Special case
  { label: '1º do próximo', dayNumber: 1, monthOffset: 1 }
])

// Calculated date
const calculatedDate = computed(() => {
  if (!isBusinessDayMode.value) return props.modelValue

  try {
    if (businessDayNumber.value === -1) {
      // Last business day logic
      return calculateLastBusinessDay(selectedYear.value, selectedMonth.value)
    }

    return calculateBusinessDay(selectedYear.value, selectedMonth.value, businessDayNumber.value)
  } catch (error) {
    validationMessage.value = 'Erro ao calcular dia útil'
    return ''
  }
})

const calculatedDateFormatted = computed(() => {
  if (!calculatedDate.value) return 'Data inválida'

  try {
    let date: Date
    
    // For date-only strings (YYYY-MM-DD), parse as local date to avoid timezone issues
    if (calculatedDate.value.match(/^\d{4}-\d{2}-\d{2}$/)) {
      const [year, month, day] = calculatedDate.value.split('-').map(Number)
      date = new Date(year, month - 1, day) // month is 0-based in constructor
    } else {
      // For other date formats, use regular parsing
      date = new Date(calculatedDate.value)
    }
    
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

const businessDayDescription = computed(() => {
  if (businessDayNumber.value === -1) {
    return `Último dia útil de ${getMonthName(selectedMonth.value)}/${selectedYear.value}`
  }

  return `${businessDayNumber.value}º dia útil de ${getMonthName(selectedMonth.value)}/${selectedYear.value}`
})

// Methods
const toggleMode = () => {
  isBusinessDayMode.value = !isBusinessDayMode.value
  validationMessage.value = ''

  if (isBusinessDayMode.value) {
    // Initialize with current date context
    initializeFromCurrentDate()
    calculateAndEmitDate()
  } else {
    // Emit current calculated date when switching back to normal mode
    if (calculatedDate.value) {
      emit('update:modelValue', calculatedDate.value)
    }
  }

  emitBusinessDayChange()
}

const handleDateInput = (event: Event) => {
  const target = event.target as HTMLInputElement
  emit('update:modelValue', target.value)
  emitBusinessDayChange()
}

const calculateAndEmitDate = () => {
  if (!isBusinessDayMode.value) return

  validationMessage.value = ''

  const calculated = calculatedDate.value
  if (calculated) {
    emit('update:modelValue', calculated)
  }

  emitBusinessDayChange()
}

const initializeFromCurrentDate = () => {
  const currentDate = props.modelValue ? new Date(props.modelValue) : new Date()
  selectedMonth.value = currentDate.getMonth() + 1
  selectedYear.value = currentDate.getFullYear()
}

const calculateLastBusinessDay = (year: number, month: number): string => {
  // Get last day of month
  const lastDay = new Date(year, month, 0)

  // Go backwards to find last business day
  while (lastDay.getDay() === 0 || lastDay.getDay() === 6) {
    lastDay.setDate(lastDay.getDate() - 1)
  }

  return lastDay.toISOString().split('T')[0]
}

const applyPreset = (preset: typeof quickPresets.value[0]) => {
  if (preset.monthOffset !== 0) {
    const newDate = new Date(selectedYear.value, selectedMonth.value - 1 + preset.monthOffset)
    selectedMonth.value = newDate.getMonth() + 1
    selectedYear.value = newDate.getFullYear()
  }

  businessDayNumber.value = preset.dayNumber
  calculateAndEmitDate()
}

const toggleCalendarPreview = () => {
  showCalendar.value = !showCalendar.value
}

const emitBusinessDayChange = () => {
  emit('business-day-change', {
    isBusinessDayMode: isBusinessDayMode.value,
    dayNumber: isBusinessDayMode.value ? businessDayNumber.value : undefined,
    month: isBusinessDayMode.value ? selectedMonth.value : undefined,
    year: isBusinessDayMode.value ? selectedYear.value : undefined,
    calculatedDate: isBusinessDayMode.value ? calculatedDate.value : undefined
  })
}

// Initialize on mount
onMounted(() => {
  if (props.modelValue) {
    initializeFromCurrentDate()
  }
})

// Watch for external model value changes
watch(() => props.modelValue, (newValue) => {
  if (!isBusinessDayMode.value && newValue) {
    initializeFromCurrentDate()
  }
})
</script>

<style scoped>
.business-day-selector {
  @apply space-y-2;
}

/* Custom focus styles */
.business-day-selector select:focus,
.business-day-selector input:focus {
  @apply ring-2 ring-blue-500 border-transparent;
}

/* Improved button hover effects */
.business-day-selector button:hover:not(:disabled) {
  @apply transform scale-105;
  transition: all 0.15s ease-in-out;
}
</style>