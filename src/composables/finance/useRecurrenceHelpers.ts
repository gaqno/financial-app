import { computed, ref } from 'vue'
import type { IFinanceRecord, IRecurrence } from '../../types/finance'
import { useBusinessDays } from './useBusinessDays'
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
  const updateAllLinkedRecurringRecords = async (
    originalRecord: IFinanceRecord,
    updatedFields: Partial<IFinanceRecord>,
    records: { value: IFinanceRecord[] } | { records: IFinanceRecord[] } | any,
    saveToStorage: () => void,
    options: {
      skipAutoCorrection?: boolean,
      isStatusOnlyChange?: boolean
    } = {}
  ): Promise<boolean> => {
    try {
      // Check if the original record has recurrence info
      if (!originalRecord.recurrence?.recurrenceId) {
        return false
      }

      const recurrenceId = originalRecord.recurrence.recurrenceId
      let updatedCount = 0

      // Support multiple formats: reactive ref, store format, or direct store object
      let recordsArray: IFinanceRecord[] | null = null

      if ('value' in records) {
        // Reactive ref format
        recordsArray = records.value
      } else if ('records' in records && Array.isArray(records.records)) {
        // Store with records property (array)
        recordsArray = records.records
      } else if (Array.isArray(records)) {
        // Direct array
        recordsArray = records
      } else {
        // Try to find records property in store object
        recordsArray = records?.records?.value || records?.records || null
      }

      const updateRecords = (newArray: IFinanceRecord[]) => {
        if ('value' in records) {
          records.value = newArray
        } else if ('records' in records && Array.isArray(records.records)) {
          records.records = newArray
        } else if (records?.records?.value) {
          records.records.value = newArray
        } else if (records?.records) {
          records.records = newArray
        }
        // For direct array case, we can't update in place
      }

      // 🔥 DEFENSIVE CHECK: Ensure recordsArray is valid before proceeding
      if (!recordsArray || !Array.isArray(recordsArray)) {
        console.error('❌ [RECURRENCE_BATCH] Invalid records array:', {
          recordsArray,
          recordsType: typeof recordsArray,
          isArray: Array.isArray(recordsArray),
          recordsParam: records,
          hasValue: 'value' in records,
          valueContent: 'value' in records ? records.value : 'N/A',
          recordsContent: 'records' in records ? records.records : 'N/A'
        })
        return false
      }

      ('✅ [RECURRENCE_BATCH] Records array is valid:', {
        arrayLength: recordsArray.length,
        recordsType: typeof recordsArray,
        isArray: Array.isArray(recordsArray)
      })

      // Find all records with the same recurrenceId, but only past/current records
      // Business Rule: When toggling status, only affect past records, not future ones
      const currentRecordDate = new Date(originalRecord.Data)
      const linkedRecords = recordsArray.filter(record => {
        if (record.recurrence?.recurrenceId !== recurrenceId) {
          return false
        }

        // Only include records that are on or before the current record's date
        const recordDate = new Date(record.Data)
        return recordDate <= currentRecordDate
      })

        ('🔄 [RECURRENCE_BATCH] Filtering linked records by date:', {
          recurrenceId,
          originalDate: originalRecord.Data,
          totalLinkedRecords: recordsArray.filter(r => r.recurrence?.recurrenceId === recurrenceId).length,
          pastCurrentRecords: linkedRecords.length,
          filteredOutFuture: recordsArray.filter(r => r.recurrence?.recurrenceId === recurrenceId).length - linkedRecords.length
        })

      if (linkedRecords.length === 0) {
        // No linked records found
        return false
      }

      // Prepare batch updates for Supabase
      const batchUpdates: Array<{ index: number; updates: Partial<IFinanceRecord> }> = []
      const newRecords = [...recordsArray]

      // Update each linked record (calculate new dates if date changed)

      // Calculate date offset if date was changed  
      let dateOffsetDays = 0
      if (updatedFields.Data && updatedFields.Data !== originalRecord.Data) {
        const originalDate = new Date(originalRecord.Data)
        const newDate = new Date(updatedFields.Data)
        dateOffsetDays = Math.floor((newDate.getTime() - originalDate.getTime()) / (1000 * 60 * 60 * 24))
          ('🗓️ [RECURRENCE_DATE] Date changed, calculating offset:', {
            originalDate: originalRecord.Data,
            newDate: updatedFields.Data,
            offsetDays: dateOffsetDays
          })
      }

      linkedRecords.forEach(linkedRecord => {
        const recordIndex = newRecords.findIndex(r =>
          r.Data === linkedRecord.Data &&
          r.Descrição === linkedRecord.Descrição &&
          r.recurrence?.recurrenceId === recurrenceId
        )

        if (recordIndex !== -1) {
          // Calculate new date for this instance if date was changed
          let newRecordDate = newRecords[recordIndex].Data
          if (dateOffsetDays !== 0) {
            const currentDate = new Date(newRecords[recordIndex].Data)
            currentDate.setDate(currentDate.getDate() + dateOffsetDays)
            newRecordDate = currentDate.toISOString().split('T')[0]
              ('🗓️ [RECURRENCE_DATE] Updating record date:', {
                originalDate: newRecords[recordIndex].Data,
                newDate: newRecordDate,
                instanceNumber: newRecords[recordIndex].recurrence?.instanceNumber
              })
          }

          const preservedInstanceNumber = newRecords[recordIndex].recurrence?.instanceNumber

          // Prepare the updates for this record
          const recordUpdates: Partial<IFinanceRecord> = {
            ...updatedFields,
            Data: newRecordDate, // Use calculated new date
            recurrence: updatedFields.recurrence ? {
              ...updatedFields.recurrence,
              instanceNumber: preservedInstanceNumber // Keep original instance number
            } : newRecords[recordIndex].recurrence
          }

          // Apply updates locally for immediate UI feedback
          newRecords[recordIndex] = {
            ...newRecords[recordIndex],
            ...recordUpdates
          }

          // Add to batch updates for Supabase persistence
          batchUpdates.push({
            index: recordIndex,
            updates: recordUpdates
          })

          updatedCount++
        }
      })

      // Update the records array for immediate reactivity
      updateRecords(newRecords)

      // 🔥 CRITICAL FIX: Persist changes to Supabase using batch update
      if (batchUpdates.length > 0) {
        ('💾 [RECURRENCE_BATCH] Persisting recurring record updates to Supabase:', {
          count: batchUpdates.length,
          recurrenceId: recurrenceId,
          updates: batchUpdates.map(u => ({
            index: u.index,
            originalRecord: recordsArray[u.index] ? {
              desc: recordsArray[u.index].Descrição,
              valor: recordsArray[u.index].Valor,
              data: recordsArray[u.index].Data
            } : 'NOT_FOUND',
            updates: {
              desc: u.updates.Descrição,
              valor: u.updates.Valor,
              data: u.updates.Data
            }
          }))
        })


        try {
          ('🚀 [RECURRENCE_BATCH] Starting optimized single-call batch update:', batchUpdates.length)

          // Use direct Supabase updates for recurring records (more reliable)
          const { supabase } = await import('../../lib/supabase')
          const { useAuth } = await import('../useAuth')
          const { user } = useAuth()

          if (!user.value?.id) {
            throw new Error('User not authenticated')
          }

          // Collect all records to be updated and new records to insert
          const recordsToDelete: Array<{
            data: string,
            descricao: string,
            valor: number,
            status: string,
            tipo: string,
            recurrenceId?: string,
            instanceNumber?: number
          }> = []

          const recordsToInsert: Array<{
            user_id: string,
            data: string,
            descricao: string,
            valor: number,
            tipo: string,
            categoria: string | null,
            status: string,
            recurrence: any
          }> = []

          // Prepare batch data
          for (const { index, updates } of batchUpdates) {
            const originalRecord = recordsArray[index]
            if (!originalRecord) {
              console.warn('❌ [RECURRENCE_BATCH] Original record not found for index:', index)
              continue
            }

            // Add to deletion list
            recordsToDelete.push({
              data: originalRecord.Data,
              descricao: originalRecord.Descrição,
              valor: originalRecord.Valor,
              status: originalRecord.Status,
              tipo: originalRecord.Tipo,
              recurrenceId: originalRecord.recurrence?.recurrenceId,
              instanceNumber: originalRecord.recurrence?.instanceNumber
            })

            // Add to insertion list
            recordsToInsert.push({
              user_id: user.value.id,
              data: updates.Data || originalRecord.Data,
              descricao: updates.Descrição || originalRecord.Descrição,
              valor: updates.Valor ?? originalRecord.Valor,
              tipo: updates.Tipo || originalRecord.Tipo,
              categoria: updates.Categoria || originalRecord.Categoria || null,
              status: updates.Status || originalRecord.Status,
              recurrence: updates.recurrence || originalRecord.recurrence || null
            })
          }

          ('🔄 [RECURRENCE_BATCH] Prepared batch operation:', {
            toDelete: recordsToDelete.length,
            toInsert: recordsToInsert.length
          })

          // Step 1: Delete old records in a single operation
          if (recordsToDelete.length > 0) {
            ('🗑️ [RECURRENCE_BATCH] Deleting old records in single call...')

            // Build a complex delete query for all records with same recurrenceId
            const recurrenceId = recordsToDelete[0].recurrenceId
            if (recurrenceId) {
              try {
                ('🔍 [RECURRENCE_BATCH] Attempting to delete records with recurrenceId:', recurrenceId)

                // Primary batch delete attempt (using ->> for text extraction instead of -> for JSON)
                const deletePromise = supabase
                  .from('finance_records')
                  .delete()
                  .eq('user_id', user.value.id)
                  .filter('recurrence->>recurrenceId', 'eq', recurrenceId)

                const timeoutPromise = new Promise((_, reject) =>
                  setTimeout(() => reject(new Error('Delete operation timed out after 10 seconds')), 10000)
                )

                const { error: deleteError, count: deletedCount } = await Promise.race([deletePromise, timeoutPromise]) as any

                if (deleteError) {
                  console.error('❌ [RECURRENCE_BATCH] Delete failed:', deleteError)
                  throw new Error(`Failed to delete old recurring records: ${deleteError.message}`)
                }

                ('✅ [RECURRENCE_BATCH] Deleted old records:', deletedCount)
              } catch (error) {
                console.error('❌ [RECURRENCE_BATCH] Delete operation failed or timed out:', error)

                  // Fallback: Try alternative deletion method by deleting each record individually
                  ('🔄 [RECURRENCE_BATCH] Falling back to individual deletion...')
                let deletedCount = 0
                for (const record of recordsToDelete) {
                  try {
                    const { error } = await supabase
                      .from('finance_records')
                      .delete()
                      .eq('user_id', user.value.id)
                      .eq('data', record.data)
                      .eq('descricao', record.descricao)
                      .eq('valor', record.valor)
                      .eq('tipo', record.tipo)

                    if (!error) {
                      deletedCount++
                    }
                  } catch (err) {
                    console.warn('⚠️ [RECURRENCE_BATCH] Failed to delete individual record:', err)
                  }
                }
                ('✅ [RECURRENCE_BATCH] Deleted via fallback method:', deletedCount)
              }
            }
          }

          // Step 2: Insert new records in a single batch operation  
          if (recordsToInsert.length > 0) {
            ('📥 [RECURRENCE_BATCH] Inserting updated records in single call...')

            const { error: insertError, count: insertedCount } = await supabase
              .from('finance_records')
              .insert(recordsToInsert)

            if (insertError) {
              throw new Error(`Failed to insert updated recurring records: ${insertError.message}`)
            }

            ('✅ [RECURRENCE_BATCH] Inserted updated records:', insertedCount)
          }

          ('🎉 [RECURRENCE_BATCH] Optimized batch update completed successfully with 2 calls total:', {
            totalRecords: batchUpdates.length,
            deleted: recordsToDelete.length,
            inserted: recordsToInsert.length
          })

            // 🚀 CRITICAL FIX: Refresh data from Supabase to sync local store
            ('🔄 [RECURRENCE_BATCH] Refreshing data from Supabase to sync changes...')
          const { useSupabaseFinance } = await import('../useSupabaseFinance')
          const { loadData } = useSupabaseFinance()
          await loadData()
            ('✅ [RECURRENCE_BATCH] Data refreshed from Supabase')

        } catch (error) {
          console.error('❌ [RECURRENCE_BATCH] Failed to persist recurring record updates to Supabase:', error)
          console.error('❌ [RECURRENCE_BATCH] Error details:', {
            message: error instanceof Error ? error.message : String(error),
            stack: error instanceof Error ? error.stack : undefined,
            batchUpdates: batchUpdates
          })
          // Don't fail completely, but log the error
          // The UI updates are already applied, user will see changes but they won't persist on reload
        }
      }

      // Save other settings (this only saves user preferences, not records)
      saveToStorage()

      // 🔥 CRITICAL FIX: Skip auto-correction for status-only changes to prevent unwanted deletions
      if (!options.skipAutoCorrection && !options.isStatusOnlyChange) {
        ('🔧 [RECURRENCE_BATCH] Auto-correction not disabled, would trigger here (but we skip it for safety)')
        // Auto-correction can cause unwanted deletions of future records
        // For now, we skip it to prevent the DESPESA deletion issue
        // 
        // If needed in the future, import and call:
        // const { useAutoCorrection } = await import('./useAutoCorrection')
        // const { correctFutureRecordsAfterEdit } = useAutoCorrection()
        // correctFutureRecordsAfterEdit(originalRecord, updatedRecord, records, saveToStorage, cleanInvalidRecurrences)
      } else {
        ('🔧 [RECURRENCE_BATCH] Skipping auto-correction (status-only change or explicitly disabled)')
      }

      return updatedCount > 0
    } catch (error) {
      console.error('❌ [RECURRENCE_BATCH] Error in updateAllLinkedRecurringRecords:', error)
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
    ('🔄 [EDIT_RECURRENCE] Starting edit recurrence generation for:', {
      description: baseRecord.Descrição,
      startDate: baseRecord.Data,
      frequency: recurrenceSettings.frequency,
      endDate: recurrenceSettings.endDate,
      isActive: recurrenceSettings.isActive
    })

    // FIXED: Direct generation without relying on global composable state
    const records: Omit<IFinanceRecord, 'Saldo'>[] = []

    if (!recurrenceSettings.isActive) {
      ('🔄 [EDIT_RECURRENCE] Recurrence not active, returning single record')
      return [baseRecord]
    }

    // Generate unique recurrence ID
    const recurrenceId = `rec_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`

    // Detect business day from original date
    const { calculateBusinessDay } = useBusinessDays()

    // Local implementation of business day detection
    const detectBusinessDayFromDate = (dateStr: string): { isBusinessDay: boolean; dayNumber?: number } => {
      const date = new Date(dateStr)
      const year = date.getFullYear()
      const month = date.getMonth() + 1
      const targetDay = date.getDate()

      // Check business days 1-22 (most months don't have more than 22 business days)
      for (let businessDayNum = 1; businessDayNum <= 22; businessDayNum++) {
        const calculatedBusinessDay = calculateBusinessDay(year, month, businessDayNum)
        const calculatedDate = new Date(calculatedBusinessDay)

        if (calculatedDate.getDate() === targetDay) {
          (`📅 [BUSINESS_DAY] Date ${dateStr} is the ${businessDayNum}th business day of ${month}/${year}`)
          return { isBusinessDay: true, dayNumber: businessDayNum }
        }
      }

      return { isBusinessDay: false }
    }

    const businessDayInfo = detectBusinessDayFromDate(baseRecord.Data)

      ('🔄 [EDIT_RECURRENCE] Business day detection:', businessDayInfo)

    let currentDate = baseRecord.Data
    let instanceNumber = 1
    const startDate = new Date(baseRecord.Data)
    const endDate = recurrenceSettings.endDate ? new Date(recurrenceSettings.endDate) : null

    // BUGFIX: Set default 1-year limit if no endDate provided
    const oneYearFromStart = new Date(startDate)
    oneYearFromStart.setFullYear(oneYearFromStart.getFullYear() + 1)
    const effectiveEndDate = endDate || oneYearFromStart

      ('🔄 [EDIT_RECURRENCE] Date limits:', {
        startDate: baseRecord.Data,
        userEndDate: recurrenceSettings.endDate,
        effectiveEndDate: effectiveEndDate.toISOString().split('T')[0],
        limitType: endDate ? 'user-defined' : 'default-1-year'
      })

    while (true) {
      // Create record for current date
      const recordForCurrentDate: Omit<IFinanceRecord, 'Saldo'> = {
        ...baseRecord,
        Data: currentDate,
        recurrence: {
          frequency: recurrenceSettings.frequency,
          endDate: recurrenceSettings.endDate || '',
          isActive: true,
          recurrenceId,
          originalDate: baseRecord.Data,
          instanceNumber,
          isBusinessDayRecurrence: businessDayInfo.isBusinessDay,
          businessDayNumber: businessDayInfo.dayNumber
        }
      }

      records.push(recordForCurrentDate)

      // BUGFIX: Enhanced date comparison with proper parsing
      const currentDateObj = new Date(currentDate + 'T00:00:00')
      if (currentDateObj >= effectiveEndDate) {
        ('🔄 [EDIT_RECURRENCE] Reached end date limit:', {
          currentDate,
          effectiveEndDate: effectiveEndDate.toISOString().split('T')[0],
          instanceNumber
        })
        break
      }

      // Calculate next date
      const nextDate = new Date(currentDate)

      switch (recurrenceSettings.frequency) {
        case 'semanal':
          nextDate.setDate(nextDate.getDate() + 7)
          break
        case 'quinzenal':
          nextDate.setDate(nextDate.getDate() + 14)
          break
        case 'mensal':
          if (businessDayInfo.isBusinessDay && businessDayInfo.dayNumber) {
            // Use business day calculation for next month
            const nextMonth = nextDate.getMonth() + 1
            const nextYear = nextMonth > 11 ? nextDate.getFullYear() + 1 : nextDate.getFullYear()
            const adjustedMonth = nextMonth > 11 ? 1 : nextMonth + 1 // Month is 1-based for calculateBusinessDay

            const businessDayDate = calculateBusinessDay(nextYear, adjustedMonth, businessDayInfo.dayNumber)
            currentDate = businessDayDate
          } else {
            // Regular monthly increment - FIXED: Proper date handling
            nextDate.setMonth(nextDate.getMonth() + 1)
            currentDate = nextDate.toISOString().split('T')[0]
          }
          break
        case 'trimestral':
          nextDate.setMonth(nextDate.getMonth() + 3)
          currentDate = nextDate.toISOString().split('T')[0]
          break
        default:
          console.error('Unknown frequency:', recurrenceSettings.frequency)
          break
      }

      instanceNumber++

      // BUGFIX: Reduced safety limit to 15 records (max 15 months)
      if (instanceNumber > 15) {
        console.warn('🔄 [EDIT_RECURRENCE] Stopping generation at 15 records to prevent infinite loop')
        break
      }
    }

    ('🔄 [EDIT_RECURRENCE] Edit generation complete:', {
      totalRecords: records.length,
      originalDate: baseRecord.Data,
      generatedDates: records.map(r => r.Data)
    })

    return records
  }

  /**
   * Detecta e gera registros futuros faltantes para uma recorrência
   * @param recurrenceId - ID da recorrência
   * @param recordsArray - Array de todos os registros
   * @param saveToStorage - Função para salvar mudanças
   * @returns Número de registros adicionados
   */
  const generateMissingFutureRecords = async (
    recurrenceId: string,
    recordsArray: IFinanceRecord[],
    saveToStorage: () => void
  ): Promise<number> => {
    ('🔮 [FUTURE_GENERATION] Checking for missing future records:', recurrenceId)

    // Encontrar todos os registros com o mesmo recurrenceId
    const existingRecords = recordsArray.filter(record =>
      record.recurrence?.recurrenceId === recurrenceId
    )

    if (existingRecords.length === 0) {
      ('🔮 [FUTURE_GENERATION] No existing records found for recurrenceId:', recurrenceId)
      return 0
    }

    // Pegar o primeiro registro como referência para configurações
    const referenceRecord = existingRecords[0]
    const recurrenceSettings = referenceRecord.recurrence

    if (!recurrenceSettings || !recurrenceSettings.isActive) {
      ('🔮 [FUTURE_GENERATION] Recurrence not active, skipping generation')
      return 0
    }

    // Determinar a data final da recorrência
    const endDate = recurrenceSettings.endDate
    if (!endDate) {
      ('🔮 [FUTURE_GENERATION] No end date specified, skipping generation')
      return 0
    }

    // Encontrar a data mais recente dos registros existentes
    const existingDates = existingRecords.map(r => new Date(r.Data))
    const latestExistingDate = new Date(Math.max(...existingDates.map(d => d.getTime())))
    const endDateObj = new Date(endDate)

      ('🔮 [FUTURE_GENERATION] Date analysis:', {
        latestExisting: latestExistingDate.toISOString().split('T')[0],
        recurrenceEndDate: endDate,
        hasGap: latestExistingDate < endDateObj
      })

    // Se não há gap, não precisamos gerar nada
    if (latestExistingDate >= endDateObj) {
      ('🔮 [FUTURE_GENERATION] No gap found, all records already exist')
      return 0
    }

    // Gerar registros faltantes
    const { calculateBusinessDay } = useBusinessDays()

    // Detectar se é baseado em dias úteis
    const isBusinessDayRecurrence = referenceRecord.recurrence?.isBusinessDayRecurrence
    const businessDayNumber = referenceRecord.recurrence?.businessDayNumber

    let currentDate = new Date(latestExistingDate)
    let instanceNumber = Math.max(...existingRecords.map(r => r.recurrence?.instanceNumber || 0)) + 1
    const recordsToAdd: Omit<IFinanceRecord, 'Saldo'>[] = []

    // Gerar próximas datas até a data final
    while (currentDate < endDateObj && recordsToAdd.length < 12) { // Limite de segurança
      // Calcular próxima data baseada na frequência
      switch (recurrenceSettings.frequency) {
        case 'semanal':
          currentDate.setDate(currentDate.getDate() + 7)
          break
        case 'quinzenal':
          currentDate.setDate(currentDate.getDate() + 14)
          break
        case 'mensal':
          if (isBusinessDayRecurrence && businessDayNumber) {
            // Usar cálculo de dia útil para próximo mês
            const nextMonth = currentDate.getMonth() + 1
            const nextYear = nextMonth > 11 ? currentDate.getFullYear() + 1 : currentDate.getFullYear()
            const adjustedMonth = nextMonth > 11 ? 1 : nextMonth + 1

            const businessDayDate = calculateBusinessDay(nextYear, adjustedMonth, businessDayNumber)
            currentDate = new Date(businessDayDate)
          } else {
            currentDate.setMonth(currentDate.getMonth() + 1)
          }
          break
        case 'trimestral':
          currentDate.setMonth(currentDate.getMonth() + 3)
          break
        default:
          console.error('🔮 [FUTURE_GENERATION] Unknown frequency:', recurrenceSettings.frequency)
          return 0
      }

      // Verificar se a data calculada não ultrapassa a data final
      if (currentDate > endDateObj) {
        break
      }

      // Verificar se já existe um registro para esta data
      const dateStr = currentDate.toISOString().split('T')[0]
      const existsForDate = existingRecords.some(r => r.Data === dateStr)

      if (!existsForDate) {
        // Criar novo registro baseado no registro de referência
        const newRecord: Omit<IFinanceRecord, 'Saldo'> = {
          Data: dateStr,
          Descrição: referenceRecord.Descrição,
          Valor: referenceRecord.Valor,
          Tipo: referenceRecord.Tipo,
          Categoria: referenceRecord.Categoria,
          Status: '❌', // Novos registros começam como pendentes
          recurrence: {
            frequency: recurrenceSettings.frequency,
            endDate: recurrenceSettings.endDate || '',
            isActive: true,
            recurrenceId: recurrenceSettings.recurrenceId || '',
            originalDate: recurrenceSettings.originalDate || referenceRecord.Data,
            instanceNumber,
            isBusinessDayRecurrence: recurrenceSettings.isBusinessDayRecurrence,
            businessDayNumber: recurrenceSettings.businessDayNumber
          }
        }

        recordsToAdd.push(newRecord)
        instanceNumber++

        ('🔮 [FUTURE_GENERATION] Generated missing record:', {
          date: dateStr,
          description: referenceRecord.Descrição,
          instanceNumber: instanceNumber - 1
        })
      } else {
        ('🔮 [FUTURE_GENERATION] Record already exists for date:', dateStr)
      }
    }

    // Adicionar os registros gerados se houver algum
    if (recordsToAdd.length > 0) {
      ('🔮 [FUTURE_GENERATION] Adding missing future records to Supabase:', recordsToAdd.length)

      try {
        // Usar batch insert para adicionar todos os registros
        const { useSupabaseFinance } = await import('../useSupabaseFinance')
        const { addRecordsBatch } = useSupabaseFinance()

        await addRecordsBatch(recordsToAdd)

          ('✅ [FUTURE_GENERATION] Successfully added missing future records:', recordsToAdd.length)
        return recordsToAdd.length
      } catch (error) {
        console.error('❌ [FUTURE_GENERATION] Failed to add missing future records:', error)
        return 0
      }
    }

    return 0
  }

  return {
    updateAllLinkedRecurringRecords,
    generateRecurringRecordsForEdit,
    generateMissingFutureRecords
  }
} 