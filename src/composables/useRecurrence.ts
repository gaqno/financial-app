import { ref, computed, watch } from 'vue';
import type { IFinanceRecord, IRecurrence, IRecurrenceFrequency } from '../types/finance';
import { useLocalStorage } from './useLocalStorage';

export function useRecurrence() {
  const { data: storedRecurrenceSettings, clearStorage: clearRecurrenceStorage } = useLocalStorage<IRecurrence>('recurrenceSettings', {
    frequency: 'mensal',
    endDate: getDefaultEndDate(),
    isActive: true,
  });

  const { data: storedIsRecurring, clearStorage: clearIsRecurringStorage } = useLocalStorage<boolean>('isRecurring', false);

  const isRecurring = ref(storedIsRecurring.value);
  const recurrenceSettings = ref<IRecurrence>(storedRecurrenceSettings.value);

  // Watch for changes and sync to localStorage
  watch(isRecurring, (newValue) => {
    storedIsRecurring.value = newValue;
  });

  watch(recurrenceSettings, (newValue) => {
    storedRecurrenceSettings.value = newValue;
  }, { deep: true });

  // Get default end date (1 year from now)
  function getDefaultEndDate(): string {
    const date = new Date();
    date.setFullYear(date.getFullYear() + 1);
    return date.toISOString().split('T')[0];
  }

  // Calculate next occurrence date based on frequency
  function getNextOccurrence(currentDate: string, frequency: IRecurrenceFrequency): string {
    const date = new Date(currentDate);

    switch (frequency) {
      case 'semanal':
        date.setDate(date.getDate() + 7);
        break;
      case 'quinzenal':
        date.setDate(date.getDate() + 15);
        break;
      case 'mensal':
        date.setMonth(date.getMonth() + 1);
        break;
      case 'trimestral':
        date.setMonth(date.getMonth() + 3);
        break;
    }

    return date.toISOString().split('T')[0];
  }

  // Generate all recurring records up to end date
  function generateRecurringRecords(baseRecord: Omit<IFinanceRecord, 'Saldo'>): Omit<IFinanceRecord, 'Saldo'>[] {
    console.log('🔄 [RECURRENCE] Starting recurrence generation for:', {
      description: baseRecord.Descrição,
      startDate: baseRecord.Data,
      isRecurringActive: isRecurring.value,
      settingsActive: recurrenceSettings.value.isActive,
      frequency: recurrenceSettings.value.frequency,
      endDate: recurrenceSettings.value.endDate
    });

    if (!isRecurring.value || !recurrenceSettings.value.isActive) {
      console.log('🔄 [RECURRENCE] Recurrence not active, returning single record');
      return [baseRecord];
    }

    const records: Omit<IFinanceRecord, 'Saldo'>[] = [baseRecord];
    let currentDate = baseRecord.Data; // Use the record's actual date as starting point
    const endDate = new Date(recurrenceSettings.value.endDate);
    const startDate = new Date(baseRecord.Data);
    let occurrenceCount = 1;
    const maxOccurrences = 24; // Increased to 24 occurrences for more flexibility

    console.log('🔄 [RECURRENCE] Generation parameters:', {
      startDate: startDate.toISOString().split('T')[0],
      endDate: endDate.toISOString().split('T')[0],
      maxOccurrences,
      frequency: recurrenceSettings.value.frequency
    });

    while (occurrenceCount < maxOccurrences) {
      currentDate = getNextOccurrence(currentDate, recurrenceSettings.value.frequency);
      const nextDate = new Date(currentDate);

      console.log('🔄 [RECURRENCE] Checking occurrence #' + (occurrenceCount + 1) + ':', {
        currentDate,
        nextDate: nextDate.toISOString().split('T')[0],
        isAfterEndDate: nextDate > endDate,
        willStop: nextDate > endDate
      });

      // Stop only if we've reached the end date
      if (nextDate > endDate) {
        console.log('🔄 [RECURRENCE] Reached end date, stopping generation');
        break;
      }

      // Create recurring record
      const recurringRecord: Omit<IFinanceRecord, 'Saldo'> = {
        ...baseRecord,
        Data: currentDate,
        recurrence: {
          ...recurrenceSettings.value,
          nextDate: getNextOccurrence(currentDate, recurrenceSettings.value.frequency),
        },
      };

      console.log('🔄 [RECURRENCE] Created recurring record:', {
        date: recurringRecord.Data,
        description: recurringRecord.Descrição,
        value: recurringRecord.Valor
      });

      records.push(recurringRecord);
      occurrenceCount++;
    }

    console.log('🔄 [RECURRENCE] Generation complete:', {
      totalRecords: records.length,
      originalRecord: baseRecord.Data,
      generatedDates: records.slice(1).map(r => r.Data)
    });

    return records;
  }

  // Get recurrence description for UI
  const recurrenceDescription = computed(() => {
    if (!isRecurring.value) return '';

    const frequencyNames = {
      semanal: 'Semanal',
      quinzenal: 'Quinzenal',
      mensal: 'Mensal',
      trimestral: 'Trimestral'
    };

    const endDate = new Date(recurrenceSettings.value.endDate);
    const currentMonth = new Date();
    const effectiveEndDate = endDate < currentMonth ? endDate : currentMonth;

    const formattedDate = effectiveEndDate.toLocaleDateString('pt-BR');
    const isLimitedByCurrentMonth = endDate > currentMonth;

    return `${frequencyNames[recurrenceSettings.value.frequency]} até ${formattedDate}${isLimitedByCurrentMonth ? ' (limitado ao mês atual)' : ''}`;
  });

  // Calculate total occurrences (limited to current month)
  const totalOccurrences = computed(() => {
    if (!isRecurring.value) return 1;

    const start = new Date();
    const end = new Date(recurrenceSettings.value.endDate);
    const currentMonth = new Date();

    // Use the earlier of end date or current month
    const effectiveEndDate = end < currentMonth ? end : currentMonth;

    const diffTime = Math.abs(effectiveEndDate.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    switch (recurrenceSettings.value.frequency) {
      case 'semanal':
        return Math.min(Math.floor(diffDays / 7), 52);
      case 'quinzenal':
        return Math.min(Math.floor(diffDays / 15), 26);
      case 'mensal':
        return Math.min(Math.floor(diffDays / 30), 12);
      case 'trimestral':
        return Math.min(Math.floor(diffDays / 90), 4);
      default:
        return 1;
    }
  });

  // Check if a record is recurring
  function isRecurringRecord(record: IFinanceRecord): boolean {
    return !!record.recurrence?.isActive;
  }

  // Get next due date for a recurring record
  function getNextDueDate(record: IFinanceRecord): string | null {
    if (!record.recurrence?.isActive) return null;
    return record.recurrence.nextDate || null;
  }

  // Update recurrence settings
  function updateRecurrenceSettings(settings: Partial<IRecurrence>) {
    recurrenceSettings.value = {
      ...recurrenceSettings.value,
      ...settings,
    };
  }

  // Clear all recurrence data
  function clearRecurrenceData() {
    clearRecurrenceStorage();
    clearIsRecurringStorage();
    isRecurring.value = false;
    recurrenceSettings.value = {
      frequency: 'mensal',
      endDate: getDefaultEndDate(),
      isActive: true,
    };
  }

  return {
    isRecurring,
    recurrenceSettings,
    recurrenceDescription,
    totalOccurrences,
    generateRecurringRecords,
    isRecurringRecord,
    getNextDueDate,
    updateRecurrenceSettings,
    getDefaultEndDate,
    clearRecurrenceData,
  };
} 