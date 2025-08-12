import type { IFinanceRecord, IRecurrence } from '../../types/finance'
import { useRecurrence } from '../useRecurrence'

/**
 * Recurrence helpers composable for batch operations on recurring records
 */
export function useRecurrenceHelpers() {

  /**
   * Updates all recurring records linked to the same recurrenceId
   * @param originalRecord - The original record being edited
   * @param updatedFields - The fields to update (excluding Date and instanceNumber)
   * @param records - Array of all records (reactive)
   * @param saveToStorage - Function to save changes
   * @returns boolean - Success status
   */
  const updateAllLinkedRecurringRecords = (
    originalRecord: IFinanceRecord,
    updatedFields: Partial<IFinanceRecord>,
    records: { value: IFinanceRecord[] },
    saveToStorage: () => void
  ): boolean => {
    try {
      // Check if the original record has recurrence info
      if (!originalRecord.recurrence?.recurrenceId) {
        return false
      }

      const recurrenceId = originalRecord.recurrence.recurrenceId
      let updatedCount = 0

      // Find all records with the same recurrenceId
      const linkedRecords = records.value.filter(record =>
        record.recurrence?.recurrenceId === recurrenceId
      )

      if (linkedRecords.length <= 1) {
        // No other linked records found
        return false
      }

      // Create new records array for reactivity
      const newRecords = [...records.value]

      // Update each linked record (preserve Date and instanceNumber)
      linkedRecords.forEach(linkedRecord => {
        const recordIndex = newRecords.findIndex(r =>
          r.Data === linkedRecord.Data &&
          r.Descrição === linkedRecord.Descrição &&
          r.recurrence?.recurrenceId === recurrenceId
        )

        if (recordIndex !== -1) {
          // Preserve the original Date and instanceNumber for each record
          const preservedDate = newRecords[recordIndex].Data
          const preservedInstanceNumber = newRecords[recordIndex].recurrence?.instanceNumber

          // Apply all updates except Date
          newRecords[recordIndex] = {
            ...newRecords[recordIndex],
            ...updatedFields,
            Data: preservedDate, // Keep original date
            recurrence: updatedFields.recurrence ? {
              ...updatedFields.recurrence,
              instanceNumber: preservedInstanceNumber // Keep original instance number
            } : newRecords[recordIndex].recurrence
          }
          updatedCount++
        }
      })

      // Update the records array for reactivity
      records.value = newRecords
      saveToStorage()

      return updatedCount > 0
    } catch (error) {
      return false
    }
  }

  /**
   * Helper function to generate recurring records for edit context
   * @param baseRecord - The base record to generate from
   * @param recurrenceSettings - The recurrence settings
   * @returns Array of generated records
   */
  const generateRecurringRecordsForEdit = (
    baseRecord: Omit<IFinanceRecord, 'Saldo'>,
    recurrenceSettings: IRecurrence
  ): Omit<IFinanceRecord, 'Saldo'>[] => {
    console.log('🔄 [EDIT_RECURRENCE] Starting edit recurrence generation for:', {
      description: baseRecord.Descrição,
      startDate: baseRecord.Data,
      frequency: recurrenceSettings.frequency,
      endDate: recurrenceSettings.endDate
    })

    // Import business day logic from useRecurrence
    const { generateRecurringRecords } = useRecurrence()

    // Temporarily set the recurrence settings
    const originalIsRecurring = useRecurrence().isRecurring.value
    const originalSettings = { ...useRecurrence().recurrenceSettings.value }

    useRecurrence().isRecurring.value = true
    useRecurrence().recurrenceSettings.value = recurrenceSettings

    // Generate records using the composable logic (which includes business day detection)
    const generatedRecords = generateRecurringRecords(baseRecord)

    // Restore original settings
    useRecurrence().isRecurring.value = originalIsRecurring
    useRecurrence().recurrenceSettings.value = originalSettings

    console.log('🔄 [EDIT_RECURRENCE] Edit generation complete:', {
      totalRecords: generatedRecords.length,
      originalDate: baseRecord.Data
    })

    return generatedRecords
  }

  return {
    updateAllLinkedRecurringRecords,
    generateRecurringRecordsForEdit
  }
} 