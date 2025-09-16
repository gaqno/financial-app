import type { IFinanceRecord, IRecurrence } from '../../types/finance';
import { useBusinessDays } from './useBusinessDays';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../useAuth';
import { useSupabaseFinance } from '../useSupabaseFinance';

/**
 * Recurrence helpers composable for batch operations on recurring records
 */
export function useRecurrenceHelpers() {
  // Initialize composables
  const { user } = useAuth();
  const { loadData, addRecordsBatch } = useSupabaseFinance();

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
    records: { value: IFinanceRecord[] } | { records: IFinanceRecord[] } | { records: { value: IFinanceRecord[] } } | any,
    saveToStorage: () => void,
    options: {
      skipAutoCorrection?: boolean;
      isStatusOnlyChange?: boolean;
    } = {}
  ): Promise<boolean> => {
    try {
      // Check if the original record has recurrence info
      if (!originalRecord.recurrence?.recurrenceId) {
        return false;
      }

      const recurrenceId = originalRecord.recurrence.recurrenceId;
      let updatedCount = 0;

      // Support multiple formats: reactive ref, store format, or direct store object
      let recordsArray: IFinanceRecord[] | null = null;

      if ('value' in records) {
        // Reactive ref format
        recordsArray = records.value;
      } else if ('records' in records && Array.isArray(records.records)) {
        // Store with records property (array)
        recordsArray = records.records;
      } else if (Array.isArray(records)) {
        // Direct array
        recordsArray = records;
      } else {
        // Try to find records property in store object
        recordsArray = records?.records?.value || records?.records || null;
      }

      const updateRecords = (newArray: IFinanceRecord[]) => {
        if ('value' in records) {
          records.value = newArray;
        } else if ('records' in records && Array.isArray(records.records)) {
          records.records = newArray;
        } else if (records?.records?.value) {
          records.records.value = newArray;
        } else if (records?.records) {
          records.records = newArray;
        }
        // For direct array case, we can't update in place
      };

      // 🔥 DEFENSIVE CHECK: Ensure recordsArray is valid before proceeding
      if (!recordsArray || !Array.isArray(recordsArray)) {
        console.error('❌ [RECURRENCE_BATCH] Invalid records array:', {
          recordsArray,
          recordsType: typeof recordsArray,
          isArray: Array.isArray(recordsArray),
          recordsParam: records,
          hasValue: 'value' in records,
          valueContent: 'value' in records ? records.value : 'N/A',
          recordsContent: 'records' in records ? records.records : 'N/A',
        });
        return false;
      }

      // Find all records with the same recurrenceId
      // 🔥 CRITICAL FIX: Include ALL linked records (past AND future) for proper editingclear
      const currentRecordDate = new Date(originalRecord.Data);
      const linkedRecords = recordsArray.filter((record) => {
        if (record.recurrence?.recurrenceId !== recurrenceId) {
          return false;
        }

        // 🔥 FIX: For status-only changes, only affect past/current records
        // For all other edits, affect ALL records (including future ones)
        if (options.isStatusOnlyChange) {
          const recordDate = new Date(record.Data);
          return recordDate <= currentRecordDate;
        }
        
        // For non-status changes (description, amount, etc.), affect ALL linked records
        return true;
      });

      if (linkedRecords.length === 0) {
        // No linked records found
        return false;
      }

      // Prepare batch updates for Supabase
      const batchUpdates: Array<{ index: number; updates: Partial<IFinanceRecord> }> = [];
      const newRecords = [...recordsArray];

      // Update each linked record (calculate new dates if date changed)

      // Calculate date offset if date was changed
      let dateOffsetDays = 0;
      if (updatedFields.Data && updatedFields.Data !== originalRecord.Data) {
        const originalDate = new Date(originalRecord.Data);
        const newDate = new Date(updatedFields.Data);
        dateOffsetDays = Math.floor((newDate.getTime() - originalDate.getTime()) / (1000 * 60 * 60 * 24));
      }

      linkedRecords.forEach((linkedRecord) => {
        const recordIndex = newRecords.findIndex(
          (r) =>
            r.Data === linkedRecord.Data &&
            r.Descrição === linkedRecord.Descrição &&
            r.recurrence?.recurrenceId === recurrenceId
        );

        if (recordIndex !== -1) {
          // Calculate new date for this instance if date was changed
          let newRecordDate = newRecords[recordIndex].Data;
          if (dateOffsetDays !== 0) {
            const currentDate = new Date(newRecords[recordIndex].Data);
            currentDate.setDate(currentDate.getDate() + dateOffsetDays);
            newRecordDate = currentDate.toISOString().split('T')[0];
          }

          const preservedInstanceNumber = newRecords[recordIndex].recurrence?.instanceNumber;

          // Prepare the updates for this record
          const recordUpdates: Partial<IFinanceRecord> = {
            ...updatedFields,
            Data: newRecordDate, // Use calculated new date
            recurrence: updatedFields.recurrence
              ? {
                  ...updatedFields.recurrence,
                  instanceNumber: preservedInstanceNumber, // Keep original instance number
                }
              : newRecords[recordIndex].recurrence,
          };

          // Apply updates locally for immediate UI feedback
          newRecords[recordIndex] = {
            ...newRecords[recordIndex],
            ...recordUpdates,
          };

          // Add to batch updates for Supabase persistence
          batchUpdates.push({
            index: recordIndex,
            updates: recordUpdates,
          });

          updatedCount++;
        }
      });

      // Update the records array for immediate reactivity
      updateRecords(newRecords);

      // 🔥 CRITICAL FIX: Persist changes to Supabase using batch update
      if (batchUpdates.length > 0) {
        try {
          // Use direct Supabase updates for recurring records (more reliable)
          if (!user.value?.id) {
            throw new Error('User not authenticated');
          }

          // Collect all records to be updated and new records to insert
          const recordsToDelete: Array<{
            data: string;
            descricao: string;
            valor: number;
            status: string;
            tipo: string;
            recurrenceId?: string;
            instanceNumber?: number;
          }> = [];

          const recordsToInsert: Array<{
            user_id: string;
            data: string;
            descricao: string;
            valor: number;
            tipo: string;
            categoria: string | null;
            status: string;
            recurrence: IRecurrence | null;
          }> = [];

          // Prepare batch data
          for (const { index, updates } of batchUpdates) {
            const originalRecord = recordsArray[index];
            if (!originalRecord) {
              console.warn('❌ [RECURRENCE_BATCH] Original record not found for index:', index);
              continue;
            }

            // Add to deletion list
            recordsToDelete.push({
              data: originalRecord.Data,
              descricao: originalRecord.Descrição,
              valor: originalRecord.Valor,
              status: originalRecord.Status,
              tipo: originalRecord.Tipo,
              recurrenceId: originalRecord.recurrence?.recurrenceId,
              instanceNumber: originalRecord.recurrence?.instanceNumber,
            });

            // Add to insertion list
            recordsToInsert.push({
              user_id: user.value.id,
              data: updates.Data || originalRecord.Data,
              descricao: updates.Descrição || originalRecord.Descrição,
              valor: updates.Valor ?? originalRecord.Valor,
              tipo: updates.Tipo || originalRecord.Tipo,
              categoria: updates.Categoria || originalRecord.Categoria || null,
              status: updates.Status || originalRecord.Status,
              recurrence: updates.recurrence || originalRecord.recurrence || null,
            });
          }

          // Step 1: Delete old records in a single operation
          if (recordsToDelete.length > 0) {

            // Build a complex delete query for all records with same recurrenceId
            const recurrenceId = recordsToDelete[0].recurrenceId;
            if (recurrenceId) {
              try {

                // Primary batch delete attempt (using ->> for text extraction instead of -> for JSON)
                const deletePromise = supabase
                  .from('finance_records')
                  .delete()
                  .eq('user_id', user.value.id)
                  .filter('recurrence->>recurrenceId', 'eq', recurrenceId);

                const timeoutPromise = new Promise((_, reject) =>
                  setTimeout(() => reject(new Error('Delete operation timed out after 10 seconds')), 10000)
                );

                const { error: deleteError } = (await Promise.race([
                  deletePromise,
                  timeoutPromise,
                ])) as { error: Error | null };

                if (deleteError) {
                  console.error('❌ [RECURRENCE_BATCH] Delete failed:', deleteError);
                  throw new Error(`Failed to delete old recurring records: ${deleteError.message}`);
                }

              } catch (error){
                console.error(
                  '❌ [RECURRENCE_BATCH] Delete operation failed or timed out:',
                  error
                );
                for (const record of recordsToDelete) {
                  try {
                    const { error } = await supabase
                      .from('finance_records')
                      .delete()
                      .eq('user_id', user.value.id)
                      .eq('data', record.data)
                      .eq('descricao', record.descricao)
                      .eq('valor', record.valor)
                      .eq('tipo', record.tipo);

                    if (error) {
                      console.warn('⚠️ [RECURRENCE_BATCH] Failed to delete record:', error);
                    }
                  } catch (err) {
                    console.warn('⚠️ [RECURRENCE_BATCH] Failed to delete individual record:', err);
                  }
                }
              }
            }
          }

          // Step 2: Insert new records in a single batch operation
          if (recordsToInsert.length > 0) {

            const { error: insertError } = await supabase
              .from('finance_records')
              .insert(recordsToInsert);

            if (insertError) {
              throw new Error(`Failed to insert updated recurring records: ${insertError.message}`);
            }

          }

          await loadData();
        } catch (error) {
          console.error('❌ [RECURRENCE_BATCH] Failed to persist recurring record updates to Supabase:', error);
          console.error('❌ [RECURRENCE_BATCH] Error details:', {
            message: error instanceof Error ? error.message : String(error),
            stack: error instanceof Error ? error.stack : undefined,
            batchUpdates: batchUpdates,
          });
          // Don't fail completely, but log the error
          // The UI updates are already applied, user will see changes but they won't persist on reload
        }
      }

      // Save other settings (this only saves user preferences, not records)
      saveToStorage();

      // 🔥 CRITICAL FIX: Skip auto-correction for status-only changes to prevent unwanted deletions
      if (!options.skipAutoCorrection && !options.isStatusOnlyChange) {
        // Auto-correction can cause unwanted deletions of future records
        // For now, we skip it to prevent the DESPESA deletion issue
        //
        // If needed in the future, import and call:
        // const { useAutoCorrection } = await import('./useAutoCorrection')
        // const { correctFutureRecordsAfterEdit } = useAutoCorrection()
        // correctFutureRecordsAfterEdit(originalRecord, updatedRecord, records, saveToStorage, cleanInvalidRecurrences)
      } else {
        console.log('🔧 [RECURRENCE_BATCH] Skipping auto-correction (status-only change or explicitly disabled)');
      }

      return updatedCount > 0;
    } catch (error) {
      console.error('❌ [RECURRENCE_BATCH] Error in updateAllLinkedRecurringRecords:', error);
      return false;
    }
  };

  /**
   * Helper function to generate recurring records for edit context
   * @param baseRecord - The base record to generate from
   * @param recurrenceSettings - The recurrence settings
   * @returns Array of generated records
   */
  const generateRecurringRecordsForEdit = (
    baseRecord: IFinanceRecord,
    recurrenceSettings: IRecurrence
  ): IFinanceRecord[] => {
    console.log('🔄 [EDIT_RECURRENCE] Starting recurring records generation for edit context');

    // FIXED: Direct generation without relying on global composable state
    const records: IFinanceRecord[] = [];

    if (!recurrenceSettings.isActive) {
      console.log('🔄 [EDIT_RECURRENCE] Recurrence not active, returning single record');
      return [baseRecord];
    }

    // Generate unique recurrence ID
    const recurrenceId = `rec_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

    // Detect business day from original date
    const { calculateBusinessDay } = useBusinessDays();

    // Local implementation of business day detection
    const detectBusinessDayFromDate = (dateStr: string): { isBusinessDay: boolean; dayNumber?: number } => {
      const date = new Date(dateStr);
      const year = date.getFullYear();
      const month = date.getMonth() + 1;
      const targetDay = date.getDate();

      // Check business days 1-22 (most months don't have more than 22 business days)
      for (let businessDayNum = 1; businessDayNum <= 22; businessDayNum++) {
        const calculatedBusinessDay = calculateBusinessDay(year, month, businessDayNum);
        const calculatedDate = new Date(calculatedBusinessDay);

        if (calculatedDate.getDate() === targetDay) {
          console.log(`📅 [BUSINESS_DAY] Date ${dateStr} is the ${businessDayNum}th business day of ${month}/${year}`);
          return { isBusinessDay: true, dayNumber: businessDayNum };
        }
      }

      return { isBusinessDay: false };
    };

    const businessDayInfo = detectBusinessDayFromDate(baseRecord.Data);

    let currentDate = baseRecord.Data;
    let instanceNumber = 1;
    const startDate = new Date(baseRecord.Data);
    const endDate = recurrenceSettings.endDate ? new Date(recurrenceSettings.endDate) : null;

    // BUGFIX: Set default 1-year limit if no endDate provided
    const oneYearFromStart = new Date(startDate);
    oneYearFromStart.setFullYear(oneYearFromStart.getFullYear() + 1);
    const effectiveEndDate = endDate || oneYearFromStart;
    
    console.log('📅 [RECURRENCE_GENERATION]', {
      startDate: baseRecord.Data,
      userEndDate: recurrenceSettings.endDate,
      effectiveEndDate: effectiveEndDate.toISOString().split('T')[0],
      limitType: endDate ? 'user-defined' : 'default-1-year',
    });

    while (true) {
      // Create record for current date
      const recordForCurrentDate: IFinanceRecord = {
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
          businessDayNumber: businessDayInfo.dayNumber,
        },
      };

      records.push(recordForCurrentDate);

      // BUGFIX: Enhanced date comparison with proper parsing
      const currentDateObj = new Date(currentDate + 'T00:00:00');
      if (currentDateObj >= effectiveEndDate) {
        console.log('📅 [RECURRENCE_GENERATION] Reached end date, stopping generation');
        break;
      }

      // Calculate next date
      const nextDate = new Date(currentDate);

      switch (recurrenceSettings.frequency) {
        case 'semanal':
          nextDate.setDate(nextDate.getDate() + 7);
          break;
        case 'quinzenal':
          nextDate.setDate(nextDate.getDate() + 14);
          break;
        case 'mensal':
          if (businessDayInfo.isBusinessDay && businessDayInfo.dayNumber) {
            // Use business day calculation for next month
            const nextMonth = nextDate.getMonth() + 1;
            const nextYear = nextMonth > 11 ? nextDate.getFullYear() + 1 : nextDate.getFullYear();
            const adjustedMonth = nextMonth > 11 ? 1 : nextMonth + 1; // Month is 1-based for calculateBusinessDay

            const businessDayDate = calculateBusinessDay(nextYear, adjustedMonth, businessDayInfo.dayNumber);
            currentDate = businessDayDate;
          } else {
            // Regular monthly increment - FIXED: Proper date handling
            nextDate.setMonth(nextDate.getMonth() + 1);
            currentDate = nextDate.toISOString().split('T')[0];
          }
          break;
        case 'trimestral':
          nextDate.setMonth(nextDate.getMonth() + 3);
          currentDate = nextDate.toISOString().split('T')[0];
          break;
        default:
          console.error('Unknown frequency:', recurrenceSettings.frequency);
          break;
      }

      instanceNumber++;

      // BUGFIX: Reduced safety limit to 15 records (max 15 months)
      if (instanceNumber > 15) {
        console.warn('🔄 [EDIT_RECURRENCE] Stopping generation at 15 records to prevent infinite loop');
        break;
      }
    }
    
    console.log(`📊 [RECURRENCE_GENERATION] Generated ${records.length} records for recurrence`);
    return records;
  };

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
    _saveToStorage: () => void
  ): Promise<number> => {
    console.log('🔄 [FUTURE_GENERATION] Starting missing future records generation for recurrenceId:', recurrenceId);
    
    // Encontrar todos os registros com o mesmo recurrenceId
    const existingRecords = recordsArray.filter((record) => record.recurrence?.recurrenceId === recurrenceId);

    if (existingRecords.length === 0) {
      return 0;
    }

    // Pegar o primeiro registro como referência para configurações
    const referenceRecord = existingRecords[0];
    const recurrenceSettings = referenceRecord.recurrence;

    if (!recurrenceSettings || !recurrenceSettings.isActive) {
      return 0;
    }

    // Determinar a data final da recorrência
    const endDate = recurrenceSettings.endDate;
    if (!endDate) {
      return 0;
    }

    // Encontrar a data mais recente dos registros existentes
    const existingDates = existingRecords.map((r) => new Date(r.Data));
    const latestExistingDate = new Date(Math.max(...existingDates.map((d) => d.getTime())));
    const endDateObj = new Date(endDate);

    // Se não há gap, não precisamos gerar nada
    if (latestExistingDate >= endDateObj) {
      return 0;
    }

    // Gerar registros faltantes
    const { calculateBusinessDay } = useBusinessDays();

    // Detectar se é baseado em dias úteis
    const isBusinessDayRecurrence = referenceRecord.recurrence?.isBusinessDayRecurrence;
    const businessDayNumber = referenceRecord.recurrence?.businessDayNumber;

    let currentDate = new Date(latestExistingDate);
    let instanceNumber = Math.max(...existingRecords.map((r) => r.recurrence?.instanceNumber || 0)) + 1;
    const recordsToAdd: IFinanceRecord[] = [];

    // Gerar próximas datas até a data final
    while (currentDate < endDateObj && recordsToAdd.length < 12) {
      // Limite de segurança
      // Calcular próxima data baseada na frequência
      switch (recurrenceSettings.frequency) {
        case 'semanal':
          currentDate.setDate(currentDate.getDate() + 7);
          break;
        case 'quinzenal':
          currentDate.setDate(currentDate.getDate() + 14);
          break;
        case 'mensal':
          if (isBusinessDayRecurrence && businessDayNumber) {
            // Usar cálculo de dia útil para próximo mês
            const nextMonth = currentDate.getMonth() + 1;
            const nextYear = nextMonth > 11 ? currentDate.getFullYear() + 1 : currentDate.getFullYear();
            const adjustedMonth = nextMonth > 11 ? 1 : nextMonth + 1;

            const businessDayDate = calculateBusinessDay(nextYear, adjustedMonth, businessDayNumber);
            currentDate = new Date(businessDayDate);
          } else {
            currentDate.setMonth(currentDate.getMonth() + 1);
          }
          break;
        case 'trimestral':
          currentDate.setMonth(currentDate.getMonth() + 3);
          break;
        default:
          console.error('Unknown frequency:', recurrenceSettings.frequency);
          return 0;
      }

      // Verificar se a data calculada não ultrapassa a data final
      if (currentDate > endDateObj) {
        break;
      }

      // Verificar se já existe um registro para esta data
      const dateStr = currentDate.toISOString().split('T')[0];
      const existsForDate = existingRecords.some((r) => r.Data === dateStr);

      if (!existsForDate) {
        // Criar novo registro baseado no registro de referência
        const newRecord: IFinanceRecord = {
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
            businessDayNumber: recurrenceSettings.businessDayNumber,
          },
        };

        recordsToAdd.push(newRecord);
        instanceNumber++;

        console.log('📅 [FUTURE_GENERATION] Added missing record for date:', dateStr);
      } else {
        console.log('📅 [FUTURE_GENERATION] Record already exists for date:', dateStr);
      }
    }

    // Adicionar os registros gerados se houver algum
    if (recordsToAdd.length > 0) {

      try {
        // Usar batch insert para adicionar todos os registros
        await addRecordsBatch(recordsToAdd);
        return recordsToAdd.length;
      } catch (error) {
        console.error('❌ [FUTURE_GENERATION] Failed to add missing future records:', error);
        return 0;
      }
    }

    return 0;
  };

  /**
   * Deletes recurring records with user choice options
   * @param recordToDelete - The record being deleted
   * @param deleteOption - 'current' | 'future' | 'all' 
   * @param records - Array of all records (reactive)
   * @param saveToStorage - Function to save changes
   * @returns Promise<{ success: boolean; deletedCount: number }>
   */
  const deleteRecurringRecord = async (
    recordToDelete: IFinanceRecord,
    deleteOption: 'current' | 'future' | 'all',
    records: { value: IFinanceRecord[] } | { records: IFinanceRecord[] } | { records: { value: IFinanceRecord[] } } | any,
    saveToStorage: () => void
  ): Promise<{ success: boolean; deletedCount: number }> => {
    try {
      if (!recordToDelete.recurrence?.recurrenceId) {
        // Not a recurring record, delete normally
        return { success: false, deletedCount: 0 };
      }

      const recurrenceId = recordToDelete.recurrence.recurrenceId;
      const recordDate = new Date(recordToDelete.Data);

      // Get records array in consistent format
      let recordsArray: IFinanceRecord[] | null = null;
      if ('value' in records) {
        recordsArray = records.value;
      } else if ('records' in records && Array.isArray(records.records)) {
        recordsArray = records.records;
      } else if (Array.isArray(records)) {
        recordsArray = records;
      } else {
        recordsArray = records?.records?.value || records?.records || null;
      }

      if (!recordsArray || !Array.isArray(recordsArray)) {
        console.error('❌ [DELETE_RECURRING] Invalid records array');
        return { success: false, deletedCount: 0 };
      }

      // Find records to delete based on option
      let recordsToDelete: IFinanceRecord[] = [];
      
      switch (deleteOption) {
        case 'current':
          // Delete only the current record
          recordsToDelete = recordsArray.filter((record) => 
            record.recurrence?.recurrenceId === recurrenceId &&
            record.Data === recordToDelete.Data &&
            record.recurrence?.instanceNumber === recordToDelete.recurrence?.instanceNumber
          );
          break;
          
        case 'future':
          // Delete current and all future records
          recordsToDelete = recordsArray.filter((record) => {
            if (record.recurrence?.recurrenceId !== recurrenceId) return false;
            const thisRecordDate = new Date(record.Data);
            return thisRecordDate >= recordDate;
          });
          break;
          
        case 'all':
          // Delete all records in the recurrence series
          recordsToDelete = recordsArray.filter((record) => 
            record.recurrence?.recurrenceId === recurrenceId
          );
          break;
      }

      if (recordsToDelete.length === 0) {
        return { success: false, deletedCount: 0 };
      }

      console.log(`🗑️ [DELETE_RECURRING] Deleting ${recordsToDelete.length} records (${deleteOption})`);

      // Delete from Supabase
      if (!user.value?.id) {
        throw new Error('User not authenticated');
      }

      // Build deletion promises for each record
      const deletePromises = recordsToDelete.map(async (record) => {
        try {
          let deleteQuery = supabase
            .from('finance_records')
            .delete()
            .eq('user_id', user.value!.id)
            .eq('data', record.Data)
            .eq('descricao', record.Descrição)
            .eq('valor', record.Valor)
            .eq('status', record.Status)
            .eq('tipo', record.Tipo);

          if (record.recurrence?.recurrenceId) {
            deleteQuery = deleteQuery
              .eq('recurrence->>recurrenceId', record.recurrence.recurrenceId)
              .eq('recurrence->>instanceNumber', record.recurrence.instanceNumber);
          }

          const { error } = await deleteQuery;
          if (error) {
            console.error('❌ [DELETE_RECURRING] Failed to delete record:', error);
            return false;
          }
          return true;
        } catch (error) {
          console.error('❌ [DELETE_RECURRING] Error deleting record:', error);
          return false;
        }
      });

      // Execute all deletions
      const results = await Promise.all(deletePromises);
      const successCount = results.filter(Boolean).length;

      // Update local records array
      const idsToDelete = new Set(
        recordsToDelete.map(r => `${r.Data}-${r.Descrição}-${r.recurrence?.instanceNumber}`)
      );
      
      const newRecords = recordsArray.filter((record) => {
        const recordId = `${record.Data}-${record.Descrição}-${record.recurrence?.instanceNumber}`;
        return !idsToDelete.has(recordId);
      });

      // Update records using the same logic as updateAllLinkedRecurringRecords
      if ('value' in records) {
        records.value = newRecords;
      } else if ('records' in records && Array.isArray(records.records)) {
        records.records = newRecords;
      } else if (records?.records?.value) {
        records.records.value = newRecords;
      } else if (records?.records) {
        records.records = newRecords;
      }

      saveToStorage();

      return { success: successCount > 0, deletedCount: successCount };
    } catch (error) {
      console.error('❌ [DELETE_RECURRING] Error in deleteRecurringRecord:', error);
      return { success: false, deletedCount: 0 };
    }
  };

  return {
    updateAllLinkedRecurringRecords,
    generateRecurringRecordsForEdit,
    generateMissingFutureRecords,
    deleteRecurringRecord,
  };
}
