import { reactive, computed } from 'vue'

interface IBusinessDayMode {
  enabled: boolean
  dayNumber: number
  month: number
  year: number
}

export function useBusinessDays() {
  // Business day mode states for different contexts
  const businessDayMode = reactive<IBusinessDayMode>({
    enabled: false,
    dayNumber: 1,
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear()
  })

  const businessDayModeMultiple = reactive<IBusinessDayMode>({
    enabled: false,
    dayNumber: 1,
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear()
  })

  const businessDayModeEdit = reactive<IBusinessDayMode>({
    enabled: false,
    dayNumber: 1,
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear()
  })

  // Calculate business day for a given month and year
  const calculateBusinessDay = (year: number, month: number, dayNumber: number): string => {
    const date = new Date(year, month - 1, 1)
    let businessDaysCount = 0

    while (businessDaysCount < dayNumber) {
      const dayOfWeek = date.getDay()

      // Skip weekends (0 = Sunday, 6 = Saturday)
      if (dayOfWeek !== 0 && dayOfWeek !== 6) {
        businessDaysCount++
      }

      if (businessDaysCount < dayNumber) {
        date.setDate(date.getDate() + 1)

        // If we've moved to the next month, stop
        if (date.getMonth() !== month - 1) {
          break
        }
      }
    }

    return date.toISOString().split('T')[0]
  }

  // Update date from business day for main form
  const updateDateFromBusinessDay = (): string => {
    if (businessDayMode.enabled) {
      const calculatedDate = calculateBusinessDay(
        businessDayMode.year,
        businessDayMode.month,
        businessDayMode.dayNumber
      )
      console.log('📅 [BUSINESS_DAY] Main form date updated:', calculatedDate)
      return calculatedDate
    }
    return ''
  }

  // Update date from business day for multiple records
  const updateDateFromBusinessDayMultiple = (): string => {
    if (businessDayModeMultiple.enabled) {
      const calculatedDate = calculateBusinessDay(
        businessDayModeMultiple.year,
        businessDayModeMultiple.month,
        businessDayModeMultiple.dayNumber
      )
      console.log('📅 [BUSINESS_DAY] Multiple records date updated:', calculatedDate)
      return calculatedDate
    }
    return ''
  }

  // Update date from business day for edit form
  const updateDateFromBusinessDayEdit = (): string => {
    if (businessDayModeEdit.enabled) {
      const calculatedDate = calculateBusinessDay(
        businessDayModeEdit.year,
        businessDayModeEdit.month,
        businessDayModeEdit.dayNumber
      )
      console.log('📅 [BUSINESS_DAY] Edit form date updated:', calculatedDate)
      return calculatedDate
    }
    return ''
  }

  // Get business day description
  const getBusinessDayDescription = (mode: IBusinessDayMode): string => {
    if (!mode.enabled) return ''

    const monthNames = [
      'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
      'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
    ]

    const monthName = monthNames[mode.month - 1]
    const ordinal = getOrdinalNumber(mode.dayNumber)

    return `${ordinal} dia útil de ${monthName}/${mode.year}`
  }

  // Get ordinal number (1º, 2º, 3º, etc.)
  const getOrdinalNumber = (num: number): string => {
    return `${num}º`
  }

  // Month helpers
  const getMonthName = (monthNumber: number): string => {
    const months = [
      'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
      'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
    ]
    return months[monthNumber - 1] || ''
  }

  const getYearOptions = (): number[] => {
    const currentYear = new Date().getFullYear()
    const years = []
    for (let year = currentYear - 2; year <= currentYear + 5; year++) {
      years.push(year)
    }
    return years
  }

  // Initialize business day mode with current date values
  const initBusinessDayMode = (currentDate?: string) => {
    const date = new Date(currentDate || new Date())
    businessDayMode.month = date.getMonth() + 1
    businessDayMode.year = date.getFullYear()
    console.log('🔧 [BUSINESS_DAY] Main mode initialized:', businessDayMode)
  }

  const initBusinessDayModeMultiple = (currentDate?: string) => {
    const date = new Date(currentDate || new Date())
    businessDayModeMultiple.month = date.getMonth() + 1
    businessDayModeMultiple.year = date.getFullYear()
    console.log('🔧 [BUSINESS_DAY] Multiple mode initialized:', businessDayModeMultiple)
  }

  const initBusinessDayModeEdit = (currentDate?: string) => {
    const date = new Date(currentDate || new Date())
    businessDayModeEdit.month = date.getMonth() + 1
    businessDayModeEdit.year = date.getFullYear()
    console.log('🔧 [BUSINESS_DAY] Edit mode initialized:', businessDayModeEdit)
  }

  // Reset to normal date input mode
  const resetToDateInput = () => {
    businessDayMode.enabled = false
    console.log('🔄 [BUSINESS_DAY] Main mode reset to date input')
  }

  const resetToDateInputMultiple = () => {
    businessDayModeMultiple.enabled = false
    console.log('🔄 [BUSINESS_DAY] Multiple mode reset to date input')
  }

  const resetToDateInputEdit = () => {
    businessDayModeEdit.enabled = false
    console.log('🔄 [BUSINESS_DAY] Edit mode reset to date input')
  }

  // Computed descriptions for each mode
  const businessDayDescription = computed(() =>
    getBusinessDayDescription(businessDayMode)
  )

  const businessDayDescriptionMultiple = computed(() =>
    getBusinessDayDescription(businessDayModeMultiple)
  )

  const businessDayDescriptionEdit = computed(() =>
    getBusinessDayDescription(businessDayModeEdit)
  )

  // Toggle business day mode
  const toggleBusinessDayMode = () => {
    businessDayMode.enabled = !businessDayMode.enabled
    if (businessDayMode.enabled) {
      initBusinessDayMode()
    }
    console.log('🔀 [BUSINESS_DAY] Main mode toggled:', businessDayMode.enabled)
  }

  const toggleBusinessDayModeMultiple = () => {
    businessDayModeMultiple.enabled = !businessDayModeMultiple.enabled
    if (businessDayModeMultiple.enabled) {
      initBusinessDayModeMultiple()
    }
    console.log('🔀 [BUSINESS_DAY] Multiple mode toggled:', businessDayModeMultiple.enabled)
  }

  const toggleBusinessDayModeEdit = () => {
    businessDayModeEdit.enabled = !businessDayModeEdit.enabled
    if (businessDayModeEdit.enabled) {
      initBusinessDayModeEdit()
    }
    console.log('🔀 [BUSINESS_DAY] Edit mode toggled:', businessDayModeEdit.enabled)
  }

  return {
    // State
    businessDayMode,
    businessDayModeMultiple,
    businessDayModeEdit,

    // Computed
    businessDayDescription,
    businessDayDescriptionMultiple,
    businessDayDescriptionEdit,

    // Core functions
    calculateBusinessDay,
    updateDateFromBusinessDay,
    updateDateFromBusinessDayMultiple,
    updateDateFromBusinessDayEdit,
    getBusinessDayDescription,

    // Initialization
    initBusinessDayMode,
    initBusinessDayModeMultiple,
    initBusinessDayModeEdit,

    // Reset functions
    resetToDateInput,
    resetToDateInputMultiple,
    resetToDateInputEdit,

    // Toggle functions
    toggleBusinessDayMode,
    toggleBusinessDayModeMultiple,
    toggleBusinessDayModeEdit,

    // Helpers
    getMonthName,
    getYearOptions,
    getOrdinalNumber
  }
} 