import { ref, computed, watch } from 'vue';
import type { IFinanceRecord, IRecurrence, IRecurrenceFrequency } from '../types/finance';
import { useLocalStorage } from './useLocalStorage';
import { useBusinessDays } from './finance/useBusinessDays'

export function useRecurrence() {
  const { calculateBusinessDay } = useBusinessDays()

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

  // Generate unique recurrence ID
  function generateRecurrenceId(): string {
    return `rec_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }

  // Find all records that belong to the same recurrence
  function findRecurrenceGroup(records: IFinanceRecord[], recurrenceId: string): IFinanceRecord[] {
    return records.filter(record =>
      record.recurrence?.recurrenceId === recurrenceId
    );
  }

  // Update all records in a recurrence group
  function updateRecurrenceGroup(
    allRecords: IFinanceRecord[],
    recurrenceId: string,
    updates: Partial<Omit<IFinanceRecord, 'Data' | 'recurrence'>>
  ): IFinanceRecord[] {

    const updatedRecords = allRecords.map(record => {
      if (record.recurrence?.recurrenceId === recurrenceId) {
        return {
          ...record,
          ...updates,
          // Keep the original date and recurrence info
          Data: record.Data,
          recurrence: record.recurrence
        };
      }
      return record;
    });

    const updatedCount = updatedRecords.filter(r =>
      r.recurrence?.recurrenceId === recurrenceId
    ).length;


    return updatedRecords;
  }

  // Remove all records in a recurrence group
  function removeRecurrenceGroup(allRecords: IFinanceRecord[], recurrenceId: string): IFinanceRecord[] {

    const recordsToRemove = allRecords.filter(r => r.recurrence?.recurrenceId === recurrenceId);

    const remainingRecords = allRecords.filter(record =>
      record.recurrence?.recurrenceId !== recurrenceId
    );


    return remainingRecords;
  }

  // Get default end date (1 year from now)
  function getDefaultEndDate(): string {
    const date = new Date();
    date.setFullYear(date.getFullYear() + 1);
    return date.toISOString().split('T')[0];
  }

  // Detect if a date is a specific business day of the month
  function detectBusinessDayFromDate(dateStr: string): { isBusinessDay: boolean; dayNumber?: number } {
    const date = new Date(dateStr)
    const year = date.getFullYear()
    const month = date.getMonth() + 1
    const targetDay = date.getDate()

    // Check business days 1-22 (most months don't have more than 22 business days)
    for (let businessDayNum = 1; businessDayNum <= 22; businessDayNum++) {
      const calculatedBusinessDay = calculateBusinessDay(year, month, businessDayNum)
      const calculatedDate = new Date(calculatedBusinessDay)

      if (calculatedDate.getDate() === targetDay) {
        return { isBusinessDay: true, dayNumber: businessDayNum }
      }
    }

    return { isBusinessDay: false }
  }

  // Calculate next occurrence date based on frequency
  function getNextOccurrence(currentDate: string, frequency: IRecurrenceFrequency, businessDayNumber?: number): string {
    const date = new Date(currentDate);

    // If this is a business day recurrence, calculate the business day for the next period
    if (businessDayNumber) {
      switch (frequency) {
        case 'mensal':
          date.setMonth(date.getMonth() + 1);
          break;
        case 'trimestral':
          date.setMonth(date.getMonth() + 3);
          break;
        case 'semanal':
        case 'quinzenal':
          // For weekly/biweekly, business day logic doesn't apply - use regular date increment
          switch (frequency) {
            case 'semanal':
              date.setDate(date.getDate() + 7);
              break;
            case 'quinzenal':
              date.setDate(date.getDate() + 15);
              break;
          }
          return date.toISOString().split('T')[0];
      }

      // Calculate the business day for the new month/quarter
      const year = date.getFullYear();
      const month = date.getMonth() + 1;
      const businessDayDate = calculateBusinessDay(year, month, businessDayNumber);

      return businessDayDate;
    }

    // Regular date increment for non-business day recurrence
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

    // If recurrence is not active, return only the base record
    if (!isRecurring.value || !recurrenceSettings.value.isActive) {
      return [baseRecord];
    }

    // Detect if the base record uses business day logic
    const businessDayInfo = detectBusinessDayFromDate(baseRecord.Data);
    const isBusinessDayRecurrence = businessDayInfo.isBusinessDay;
    const businessDayNumber = businessDayInfo.dayNumber;


    const records: Omit<IFinanceRecord, 'Saldo'>[] = [];
    let currentDate = baseRecord.Data;
    const recurrenceId = generateRecurrenceId();
    const originalDate = baseRecord.Data;

    // CRITICAL FIX: Properly handle end date comparison
    const endDateStr = recurrenceSettings.value.endDate;
    let endDate: Date;

    if (!endDateStr) {
      // If no end date, generate for 1 year from now
      endDate = new Date();
      endDate.setFullYear(endDate.getFullYear() + 1);
    } else {
      // Parse end date as local date to avoid timezone issues
      if (endDateStr.match(/^\d{4}-\d{2}-\d{2}$/)) {
        const [year, month, day] = endDateStr.split('-').map(Number);
        endDate = new Date(year, month - 1, day); // month is 0-based
      } else {
        endDate = new Date(endDateStr);
      }
    }


    const maxOccurrences = 50; // Safety limit
    let occurrenceCount = 1;

    // Add the original record with recurrence metadata
    const baseRecordWithRecurrence: Omit<IFinanceRecord, 'Saldo'> = {
      ...baseRecord,
      recurrence: {
        ...recurrenceSettings.value,
        recurrenceId,
        originalDate,
        instanceNumber: 1,
        isBusinessDayRecurrence,
        businessDayNumber,
        nextDate: getNextOccurrence(currentDate, recurrenceSettings.value.frequency, businessDayNumber),
      },
    };

    records.push(baseRecordWithRecurrence);

    occurrenceCount++;

    while (occurrenceCount < maxOccurrences) {
      currentDate = getNextOccurrence(currentDate, recurrenceSettings.value.frequency, businessDayNumber);

      // CRITICAL FIX: Parse next date properly for comparison
      let nextDate: Date;
      if (currentDate.match(/^\d{4}-\d{2}-\d{2}$/)) {
        const [year, month, day] = currentDate.split('-').map(Number);
        nextDate = new Date(year, month - 1, day); // month is 0-based
      } else {
        nextDate = new Date(currentDate);
      }



      // CRITICAL FIX: Stop if next date is after end date (inclusive comparison)
      if (nextDate > endDate) {
        console.log('🔄 [RECURRENCE] Reached end date, stopping generation');
        break;
      }

      // Create recurring record with business day info
      const recurringRecord: Omit<IFinanceRecord, 'Saldo'> = {
        ...baseRecord,
        Data: currentDate,
        recurrence: {
          ...recurrenceSettings.value,
          recurrenceId,
          originalDate,
          instanceNumber: occurrenceCount,
          isBusinessDayRecurrence,
          businessDayNumber,
          nextDate: getNextOccurrence(currentDate, recurrenceSettings.value.frequency, businessDayNumber),
        },
      };

      console.log('🔄 [RECURRENCE] Created recurring record:', {
        date: recurringRecord.Data,
        description: recurringRecord.Descrição,
        value: recurringRecord.Valor,
        instanceNumber: recurringRecord.recurrence?.instanceNumber,
        isBusinessDay: isBusinessDayRecurrence,
        businessDayNumber
      });

      records.push(recurringRecord);
      occurrenceCount++;
    }

    console.log('🔄 [RECURRENCE] Generation complete:', {
      totalRecords: records.length,
      originalDate,
      recurrenceId,
      isBusinessDayRecurrence,
      businessDayNumber,
      finalEndDate: endDate.toISOString().split('T')[0]
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
    // New recurrence group management functions
    generateRecurrenceId,
    findRecurrenceGroup,
    updateRecurrenceGroup,
    removeRecurrenceGroup,
  };
} 