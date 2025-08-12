<template>
  <div class="business-day-calendar">
    <!-- Month/Year Header -->
    <div class="flex items-center justify-between mb-3">
      <h3 class="text-sm font-semibold text-gray-800">
        {{ monthName }} {{ year }}
      </h3>
      <div class="text-xs text-gray-600">
        <span class="inline-flex items-center gap-1">
          <span class="w-2 h-2 bg-blue-500 rounded-full"></span>
          {{ businessDayNumber }}º dia útil
        </span>
      </div>
    </div>

    <!-- Calendar Grid -->
    <div class="grid grid-cols-7 gap-1 text-xs">
      <!-- Day Headers -->
      <div v-for="day in dayHeaders" :key="day" class="text-center font-medium text-gray-500 py-1">
        {{ day }}
      </div>

      <!-- Calendar Days -->
      <div v-for="day in calendarDays" :key="`${day.date}-${day.isCurrentMonth}`"
        class="text-center py-1 rounded-md transition-colors" :class="getDayClasses(day)">
        <span class="block">{{ day.dayNumber }}</span>
        <div v-if="day.businessDayNumber" class="text-xs text-blue-600 font-bold">
          {{ day.businessDayNumber }}º
        </div>
      </div>
    </div>

    <!-- Legend -->
    <div class="mt-3 flex flex-wrap gap-2 text-xs">
      <div class="flex items-center gap-1">
        <span class="w-2 h-2 bg-blue-500 rounded-full"></span>
        <span>Dia útil selecionado</span>
      </div>
      <div class="flex items-center gap-1">
        <span class="w-2 h-2 bg-green-100 border border-green-300 rounded-full"></span>
        <span>Dias úteis</span>
      </div>
      <div class="flex items-center gap-1">
        <span class="w-2 h-2 bg-gray-200 rounded-full"></span>
        <span>Fins de semana</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  year: number
  month: number
  businessDayNumber: number
  calculatedDate?: string
}

const props = defineProps<Props>()

interface CalendarDay {
  date: string
  dayNumber: number
  isCurrentMonth: boolean
  isBusinessDay: boolean
  isWeekend: boolean
  businessDayNumber?: number
  isSelected: boolean
  isToday: boolean
}

// Calendar computation
const dayHeaders = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']

const monthName = computed(() => {
  const months = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ]
  return months[props.month - 1]
})

const calendarDays = computed((): CalendarDay[] => {
  const days: CalendarDay[] = []
  const today = new Date()
  const todayStr = today.toISOString().split('T')[0]

  // Get first day of month and how many days in month
  const firstDay = new Date(props.year, props.month - 1, 1)
  const lastDay = new Date(props.year, props.month, 0)
  const daysInMonth = lastDay.getDate()

  // Get first day of week (0 = Sunday)
  const firstDayOfWeek = firstDay.getDay()

  // Add previous month's trailing days
  const prevMonth = new Date(props.year, props.month - 2, 0)
  const daysInPrevMonth = prevMonth.getDate()

  for (let i = firstDayOfWeek - 1; i >= 0; i--) {
    const dayNumber = daysInPrevMonth - i
    const date = new Date(props.year, props.month - 2, dayNumber)
    const dateStr = date.toISOString().split('T')[0]

    days.push({
      date: dateStr,
      dayNumber,
      isCurrentMonth: false,
      isBusinessDay: false,
      isWeekend: date.getDay() === 0 || date.getDay() === 6,
      isSelected: false,
      isToday: dateStr === todayStr
    })
  }

  // Add current month's days
  let businessDayCount = 0

  for (let dayNumber = 1; dayNumber <= daysInMonth; dayNumber++) {
    const date = new Date(props.year, props.month - 1, dayNumber)
    const dateStr = date.toISOString().split('T')[0]
    const isWeekend = date.getDay() === 0 || date.getDay() === 6
    const isBusinessDay = !isWeekend

    if (isBusinessDay) {
      businessDayCount++
    }

    const isSelected = props.calculatedDate === dateStr

    days.push({
      date: dateStr,
      dayNumber,
      isCurrentMonth: true,
      isBusinessDay,
      isWeekend,
      businessDayNumber: isBusinessDay ? businessDayCount : undefined,
      isSelected,
      isToday: dateStr === todayStr
    })
  }

  // Add next month's leading days to complete the grid
  const remainingDays = 42 - days.length // 6 weeks * 7 days

  for (let dayNumber = 1; dayNumber <= remainingDays; dayNumber++) {
    const date = new Date(props.year, props.month, dayNumber)
    const dateStr = date.toISOString().split('T')[0]

    days.push({
      date: dateStr,
      dayNumber,
      isCurrentMonth: false,
      isBusinessDay: false,
      isWeekend: date.getDay() === 0 || date.getDay() === 6,
      isSelected: false,
      isToday: dateStr === todayStr
    })
  }

  return days
})

// Style helpers
const getDayClasses = (day: CalendarDay): string => {
  const classes = []

  // Base styles
  classes.push('relative')

  // Current month vs other months
  if (!day.isCurrentMonth) {
    classes.push('text-gray-300')
  } else {
    classes.push('text-gray-700')
  }

  // Weekend styling
  if (day.isWeekend) {
    classes.push('bg-gray-100')
  }

  // Business day styling
  if (day.isBusinessDay && day.isCurrentMonth) {
    classes.push('bg-green-50', 'border', 'border-green-200')
  }

  // Selected day (calculated business day)
  if (day.isSelected) {
    classes.push('bg-blue-500', 'text-white', 'font-bold', 'border-2', 'border-blue-600')
  }

  // Today
  if (day.isToday && !day.isSelected) {
    classes.push('ring-2', 'ring-orange-400', 'ring-offset-1')
  }

  // Hover effects for current month
  if (day.isCurrentMonth && !day.isSelected) {
    classes.push('hover:bg-gray-200', 'cursor-pointer')
  }

  return classes.join(' ')
}
</script>

<style scoped>
.business-day-calendar {
  @apply select-none;
}

/* Smooth transitions for day changes */
.business-day-calendar>div>div {
  transition: all 0.15s ease-in-out;
}
</style>