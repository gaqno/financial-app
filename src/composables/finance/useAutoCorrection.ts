import type { IFinanceRecord } from '../../types/finance';
import { useDarkMode } from '../useDarkMode';
import { useToast } from '../useToast';

/**
 * Auto-correction composable for handling automatic fixes after edits
 */
export function useAutoCorrection() {
  const { isDarkMode, themeClass } = useDarkMode();
  const toast = useToast();

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
    const corrections = {
      removed: 0,
      updated: 0,
      errors: 0,
    };

    try {
      // Verificar se houve mudança na data limite de recorrência
      const originalEndDate = originalRecord.recurrence?.endDate;
      const newEndDate = updatedRecord.recurrence?.endDate;
      const recurrenceId = originalRecord.recurrence?.recurrenceId || updatedRecord.recurrence?.recurrenceId;

      if (recurrenceId && originalEndDate !== newEndDate) {
        // Se a nova data limite é anterior à original, remover lançamentos além da nova data
        if (newEndDate && originalEndDate && newEndDate < originalEndDate) {
          corrections.removed += removeRecurringRecordsBeyondDate(recurrenceId, newEndDate, records, saveToStorage);
        }

        // Se a nova data limite é posterior, não fazemos nada (usuário pode querer gerar novos)
        if (newEndDate && originalEndDate && newEndDate > originalEndDate) {
          console.log('🔧 [AUTO_CORRECTION] New end date is later, user may want to generate additional records');
        }
      }

      // Verificar se houve mudança em valores/categoria/descrição de registros recorrentes
      if (
        recurrenceId &&
        (originalRecord.Valor !== updatedRecord.Valor ||
          originalRecord.Categoria !== updatedRecord.Categoria ||
          originalRecord.Descrição !== updatedRecord.Descrição ||
          originalRecord.Tipo !== updatedRecord.Tipo)
      ) {
        corrections.updated += validateAndCorrectRecurringRecords(recurrenceId, updatedRecord, records, saveToStorage);
      }

      // Sempre executar limpeza geral após edições
      cleanInvalidRecurrences();

      // Enhanced user notification with better UX feedback
      if (corrections.removed > 0 || corrections.updated > 0) {
        const messages = [];
        if (corrections.removed > 0) {
          messages.push(`${corrections.removed} lançamento(s) removido(s) por estarem além da nova data limite`);
        }
        if (corrections.updated > 0) {
          messages.push(`${corrections.updated} lançamento(s) futuro(s) corrigido(s)`);
        }

        const totalChanges = corrections.removed + corrections.updated;
        toast.success(messages.join(' e '), {
          title: `🔧 ${totalChanges} Correção${totalChanges > 1 ? 'ões' : ''} Automática${totalChanges > 1 ? 's' : ''}`,
          duration: 4000,
        });
      }
    } catch (error) {
      console.error('❌ [AUTO_CORRECTION] Error during automatic correction:', error);
      corrections.errors++;

      toast.error('Erro durante correção automática. Verifique os registros manualmente.', {
        title: '❌ Erro na Correção Automática',
        duration: 5000,
      });
    }
  };

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
    // Parse da data limite
    let limitDate: Date;
    if (endDate.match(/^\d{4}-\d{2}-\d{2}$/)) {
      const [year, month, day] = endDate.split('-').map(Number);
      limitDate = new Date(year, month - 1, day); // month is 0-based
    } else {
      limitDate = new Date(endDate);
    }

    const initialCount = records.value.length;

    // Filtrar registros, removendo os que estão além da data limite
    records.value = records.value.filter((record) => {
      // Se não é da mesma recorrência, manter
      if (record.recurrence?.recurrenceId !== recurrenceId) {
        return true;
      }

      // Parse da data do registro
      let recordDate: Date;
      if (record.Data.match(/^\d{4}-\d{2}-\d{2}$/)) {
        const [year, month, day] = record.Data.split('-').map(Number);
        recordDate = new Date(year, month - 1, day); // month is 0-based
      } else {
        recordDate = new Date(record.Data);
      }

      // Manter apenas se a data do registro está dentro do limite
      const shouldKeep = recordDate <= limitDate;

      if (!shouldKeep) {
      }

      return shouldKeep;
    });

    const removedCount = initialCount - records.value.length;

    if (removedCount > 0) {
      saveToStorage();
    }

    return removedCount;
  };

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
    let correctedCount = 0;

    records.value.forEach((record, index) => {
      if (record.recurrence?.recurrenceId === recurrenceId) {
        let needsCorrection = false;
        const updates: Partial<IFinanceRecord> = {};

        // Verificar se categoria, tipo, valor estão consistentes
        if (record.Categoria !== referenceRecord.Categoria) {
          updates.Categoria = referenceRecord.Categoria;
          needsCorrection = true;
        }

        if (record.Tipo !== referenceRecord.Tipo) {
          updates.Tipo = referenceRecord.Tipo;
          needsCorrection = true;
        }

        if (record.Valor !== referenceRecord.Valor) {
          updates.Valor = referenceRecord.Valor;
          needsCorrection = true;
        }

        // Aplicar correções se necessário
        if (needsCorrection) {
          records.value[index] = { ...record, ...updates };
          correctedCount++;
        }
      }
    });

    if (correctedCount > 0) {
      saveToStorage();
    }

    return correctedCount;
  };

  return {
    // Core functions
    correctFutureRecordsAfterEdit,
    removeRecurringRecordsBeyondDate,
    validateAndCorrectRecurringRecords,

    // Dark mode and styling
    isDarkMode,
    themeClass,

    // Enhanced toast system
    toast,
  };
}
