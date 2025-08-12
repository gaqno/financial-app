import type { IFinanceRecord } from '../../types/finance'

/**
 * Auto-correction composable for handling automatic fixes after edits
 */
export function useAutoCorrection() {

  /**
   * Corrige automaticamente lançamentos errôneos futuros após uma edição
   * @param originalRecord O registro original antes da edição
   * @param updatedRecord O registro após a edição
   * @param records Array of all records (reactive)
   * @param saveToStorage Function to save changes
   * @param cleanInvalidRecurrences Function to clean invalid recurrences
   */
  const correctFutureRecordsAfterEdit = (
    originalRecord: IFinanceRecord,
    updatedRecord: IFinanceRecord,
    records: { value: IFinanceRecord[] },
    saveToStorage: () => void,
    cleanInvalidRecurrences: () => void
  ): void => {
    console.log('🔧 [AUTO_CORRECTION] Starting automatic correction of future records...')

    const corrections = {
      removed: 0,
      updated: 0,
      errors: 0
    }

    try {
      // Verificar se houve mudança na data limite de recorrência
      const originalEndDate = originalRecord.recurrence?.endDate
      const newEndDate = updatedRecord.recurrence?.endDate
      const recurrenceId = originalRecord.recurrence?.recurrenceId || updatedRecord.recurrence?.recurrenceId

      if (recurrenceId && originalEndDate !== newEndDate) {
        console.log('🔧 [AUTO_CORRECTION] Detected recurrence end date change:', {
          original: originalEndDate,
          new: newEndDate,
          recurrenceId
        })

        // Se a nova data limite é anterior à original, remover lançamentos além da nova data
        if (newEndDate && originalEndDate && newEndDate < originalEndDate) {
          corrections.removed += removeRecurringRecordsBeyondDate(recurrenceId, newEndDate, records, saveToStorage)
        }

        // Se a nova data limite é posterior, não fazemos nada (usuário pode querer gerar novos)
        if (newEndDate && originalEndDate && newEndDate > originalEndDate) {
          console.log('🔧 [AUTO_CORRECTION] New end date is later, user may want to generate additional records')
        }
      }

      // Verificar se houve mudança em valores/categoria/descrição de registros recorrentes
      if (recurrenceId && (
        originalRecord.Valor !== updatedRecord.Valor ||
        originalRecord.Categoria !== updatedRecord.Categoria ||
        originalRecord.Descrição !== updatedRecord.Descrição ||
        originalRecord.Tipo !== updatedRecord.Tipo
      )) {
        console.log('🔧 [AUTO_CORRECTION] Detected changes in recurring record properties')
        corrections.updated += validateAndCorrectRecurringRecords(recurrenceId, updatedRecord, records, saveToStorage)
      }

      // Sempre executar limpeza geral após edições
      cleanInvalidRecurrences()

      console.log('✅ [AUTO_CORRECTION] Completed automatic correction:', corrections)

      // Notificar usuário se houver correções significativas
      if (corrections.removed > 0 || corrections.updated > 0) {
        const message = []
        if (corrections.removed > 0) {
          message.push(`${corrections.removed} lançamento(s) removido(s) por estarem além da nova data limite`)
        }
        if (corrections.updated > 0) {
          message.push(`${corrections.updated} lançamento(s) futuro(s) corrigido(s)`)
        }

        console.log('ℹ️ [AUTO_CORRECTION] Correções aplicadas: ' + message.join('; '))
      }

    } catch (error) {
      console.error('❌ [AUTO_CORRECTION] Error during automatic correction:', error)
      corrections.errors++
    }
  }

  /**
   * Remove registros recorrentes que estão além de uma data específica
   * @param recurrenceId ID da recorrência
   * @param endDate Data limite (formato YYYY-MM-DD)
   * @param records Array of all records (reactive)
   * @param saveToStorage Function to save changes
   * @returns Número de registros removidos
   */
  const removeRecurringRecordsBeyondDate = (
    recurrenceId: string,
    endDate: string,
    records: { value: IFinanceRecord[] },
    saveToStorage: () => void
  ): number => {
    console.log('🗑️ [AUTO_CORRECTION] Removing recurring records beyond date:', { recurrenceId, endDate })

    // Parse da data limite
    let limitDate: Date
    if (endDate.match(/^\d{4}-\d{2}-\d{2}$/)) {
      const [year, month, day] = endDate.split('-').map(Number)
      limitDate = new Date(year, month - 1, day) // month is 0-based
    } else {
      limitDate = new Date(endDate)
    }

    const initialCount = records.value.length

    // Filtrar registros, removendo os que estão além da data limite
    records.value = records.value.filter(record => {
      // Se não é da mesma recorrência, manter
      if (record.recurrence?.recurrenceId !== recurrenceId) {
        return true
      }

      // Parse da data do registro
      let recordDate: Date
      if (record.Data.match(/^\d{4}-\d{2}-\d{2}$/)) {
        const [year, month, day] = record.Data.split('-').map(Number)
        recordDate = new Date(year, month - 1, day) // month is 0-based
      } else {
        recordDate = new Date(record.Data)
      }

      // Manter apenas se a data do registro está dentro do limite
      const shouldKeep = recordDate <= limitDate

      if (!shouldKeep) {
        console.log('🗑️ [AUTO_CORRECTION] Removing record beyond end date:', {
          description: record.Descrição,
          date: record.Data,
          endDate: endDate
        })
      }

      return shouldKeep
    })

    const removedCount = initialCount - records.value.length

    if (removedCount > 0) {
      saveToStorage()
      console.log(`✅ [AUTO_CORRECTION] Removed ${removedCount} records beyond end date`)
    }

    return removedCount
  }

  /**
   * Valida e corrige registros recorrentes para garantir consistência
   * @param recurrenceId ID da recorrência
   * @param referenceRecord Registro de referência com os dados corretos
   * @param records Array of all records (reactive)
   * @param saveToStorage Function to save changes
   * @returns Número de registros corrigidos
   */
  const validateAndCorrectRecurringRecords = (
    recurrenceId: string,
    referenceRecord: IFinanceRecord,
    records: { value: IFinanceRecord[] },
    saveToStorage: () => void
  ): number => {
    console.log('🔧 [AUTO_CORRECTION] Validating and correcting recurring records for:', recurrenceId)

    let correctedCount = 0

    records.value.forEach((record, index) => {
      if (record.recurrence?.recurrenceId === recurrenceId) {
        let needsCorrection = false
        const updates: Partial<IFinanceRecord> = {}

        // Verificar se categoria, tipo, valor estão consistentes
        if (record.Categoria !== referenceRecord.Categoria) {
          updates.Categoria = referenceRecord.Categoria
          needsCorrection = true
        }

        if (record.Tipo !== referenceRecord.Tipo) {
          updates.Tipo = referenceRecord.Tipo
          needsCorrection = true
        }

        if (record.Valor !== referenceRecord.Valor) {
          updates.Valor = referenceRecord.Valor
          needsCorrection = true
        }

        // Aplicar correções se necessário
        if (needsCorrection) {
          records.value[index] = { ...record, ...updates }
          correctedCount++

          console.log('🔧 [AUTO_CORRECTION] Corrected record:', {
            date: record.Data,
            description: record.Descrição,
            updates
          })
        }
      }
    })

    if (correctedCount > 0) {
      saveToStorage()
      console.log(`✅ [AUTO_CORRECTION] Corrected ${correctedCount} recurring records`)
    }

    return correctedCount
  }

  return {
    correctFutureRecordsAfterEdit,
    removeRecurringRecordsBeyondDate,
    validateAndCorrectRecurringRecords
  }
} 