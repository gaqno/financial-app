import { ref, computed, watch } from 'vue';
import { useFinanceStore } from '../../stores/financeStore';
import { formatDateForDisplay } from '../../utils/dateUtils';
import { useDarkMode } from '../useDarkMode';
import { useToast } from '../useToast';
import type { IFinanceRecord } from '../../types/finance';
import { useRecurrenceHelpers } from './useRecurrenceHelpers';

const isDevelopment = computed(() => typeof window !== 'undefined' && window.location.hostname === 'localhost');

export function useFinanceTableHelpers() {
  const financeStore = useFinanceStore();
  const { updateAllLinkedRecurringRecords } = useRecurrenceHelpers();
  const { isDarkMode, themeClass } = useDarkMode();
  const toast = useToast();

  // Enhanced loading states for better UX
  const isToggling = ref<boolean>(false);
  const toggleInProgress = ref<Set<string>>(new Set());

  // Local state for UI interactions
  const collapsedMonths = ref(new Set<string>());

  // Dark mode aware table styling
  const tableClasses = computed(() => ({
    row: {
      even: isDarkMode.value ? 'bg-gray-800/50 hover:bg-gray-700' : 'bg-gray-50 hover:bg-gray-100',
      odd: isDarkMode.value ? 'bg-gray-800/30 hover:bg-gray-700' : 'bg-white hover:bg-gray-50',
      selected: isDarkMode.value ? 'bg-blue-900/20 border-blue-700' : 'bg-blue-50 border-blue-200',
    },
    cell: {
      text: isDarkMode.value ? 'text-gray-100' : 'text-gray-900',
      subtext: isDarkMode.value ? 'text-gray-300' : 'text-gray-600',
      muted: isDarkMode.value ? 'text-gray-400' : 'text-gray-500',
    },
    status: {
      completed: isDarkMode.value ? 'text-green-400 bg-green-900/20' : 'text-green-600 bg-green-50',
      pending: isDarkMode.value ? 'text-yellow-400 bg-yellow-900/20' : 'text-yellow-600 bg-yellow-50',
    },
    value: {
      positive: isDarkMode.value ? 'text-green-400 font-semibold' : 'text-green-600 font-semibold',
      negative: isDarkMode.value ? 'text-red-400 font-semibold' : 'text-red-600 font-semibold',
    },
    monthHeader: isDarkMode.value
      ? 'bg-gray-800 text-gray-100 border-gray-700'
      : 'bg-gray-100 text-gray-900 border-gray-300',
    button: {
      toggle: isDarkMode.value
        ? 'hover:bg-gray-700 text-gray-300 disabled:text-gray-500'
        : 'hover:bg-gray-100 text-gray-600 disabled:text-gray-400',
    },
  }));

  // Month collapse functionality
  const handleMonthToggle = (monthKey: string, isCollapsed: boolean) => {
    // Manage local collapse state, not month visibility
    if (isCollapsed) {
      collapsedMonths.value.add(monthKey);
    } else {
      collapsedMonths.value.delete(monthKey);
    }
    // Month collapsed state updated locally
  };

  // Enhanced status toggle with better UX and feedback
  const handleToggleStatus = async (record: IFinanceRecord, displayIndex: number) => {
    const recordId = `${record.Data}-${record.Descrição}-${record.Valor}`;

    // Prevent multiple simultaneous toggles on the same record
    if (toggleInProgress.value.has(recordId)) {
      toast.warning('Operação em andamento para este registro', {
        title: '⏳ Aguarde',
        duration: 2000,
      });
      return;
    }

    const originalStatus = record.Status;
    const targetStatus: '❌' | '✔️' = originalStatus === '✔️' ? '❌' : '✔️';
    const statusText = targetStatus === '✔️' ? 'Concluído' : 'Pendente';
    const statusEmoji = targetStatus === '✔️' ? '✅' : '⏳';

    // Add to in-progress set
    toggleInProgress.value.add(recordId);
    isToggling.value = true;

    try {
      // Check if this is a recurring record
      if (record.recurrence?.recurrenceId) {
        console.log('🔄 [TOGGLE_STATUS] Handling recurring record status change:', {
          date: record.Data,
          description: record.Descrição,
          recurrenceId: record.recurrence.recurrenceId,
          instanceNumber: record.recurrence.instanceNumber,
          statusChange: `${originalStatus} → ${targetStatus}`,
        });

        // Enhanced confirmation dialog for recurring records
        const shouldUpdateAll = confirm(
          `🔄 REGISTRO RECORRENTE\n\n` +
            `📝 ${record.Descrição}\n` +
            `💰 ${Math.abs(record.Valor).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}\n\n` +
            `Deseja atualizar o status de todas as ocorrências PASSADAS desta recorrência?\n\n` +
            `✅ SIM - Atualizar ocorrências passadas e atual (recomendado)\n` +
            `❌ NÃO - Atualizar apenas este registro\n\n` +
            `⚠️ Registros futuros não serão afetados.`
        );

        if (shouldUpdateAll) {
          toast.info('Atualizando registros recorrentes...', {
            title: '🔄 Processando Recorrência',
            duration: 2000,
          });

          // Use batch update system for recurring records
          try {
            const success = await updateAllLinkedRecurringRecords(
              record,
              {
                Status: targetStatus,
              },
              financeStore,
              financeStore.saveToStorage,
              {
                isStatusOnlyChange: true,
                skipAutoCorrection: true,
              }
            );

            if (success) {
              toast.success(`Status atualizado para todas as ocorrências passadas`, {
                title: `${statusEmoji} Recorrência Atualizada`,
                duration: 3000,
              });
            } else {
              toast.error('Falha na atualização dos registros recorrentes', {
                title: '❌ Erro na Recorrência',
                duration: 4000,
              });
            }
            return;
          } catch (error) {
            if (isDevelopment.value) {
              console.error('❌ [TOGGLE_STATUS] Error with batch update, falling back to single record:', error);
            }
            toast.warning('Erro na atualização em lote, tentando registro individual', {
              title: '⚠️ Fallback',
              duration: 2500,
            });
            // Fall through to individual update
          }
        }
      }

      // Individual record update (for non-recurring or when user chose single update)
      toast.info(`Atualizando status para: ${statusText}`, {
        title: '🔄 Atualizando',
        duration: 1500,
      });

      const recordIndex = financeStore.records.findIndex((r) => {
        // Basic properties must match
        const basicMatch =
          r.Data === record.Data &&
          r.Descrição === record.Descrição &&
          r.Valor === record.Valor &&
          r.Tipo === record.Tipo &&
          r.Status === originalStatus;

        // For recurring records, also match recurrence metadata
        if (record.recurrence?.recurrenceId) {
          return (
            basicMatch &&
            r.recurrence?.recurrenceId === record.recurrence.recurrenceId &&
            r.recurrence?.instanceNumber === record.recurrence.instanceNumber
          );
        }

        // For non-recurring records, ensure recurrence is null/undefined on both
        return basicMatch && !record.recurrence === !r.recurrence;
      });

      if (recordIndex !== -1) {
        const updatedRecord = { ...record, Status: targetStatus };

        console.log('🔄 [TOGGLE_STATUS] Updating single record:', {
          recordIndex,
          date: record.Data,
          description: record.Descrição,
          isRecurring: !!record.recurrence?.recurrenceId,
          statusChange: `${originalStatus} → ${targetStatus}`,
        });

        try {
          const success = await financeStore.updateRecord(recordIndex, updatedRecord);

          if (success) {
            const recordType = record.Tipo === 'Receita' ? '💰' : '💸';
            const formattedValue = Math.abs(record.Valor).toLocaleString('pt-BR', {
              style: 'currency',
              currency: 'BRL',
            });

            toast.success(`${recordType} ${record.Descrição} (${formattedValue})`, {
              title: `${statusEmoji} Status: ${statusText}`,
              duration: 2500,
            });
          } else {
            toast.error('Falha ao atualizar o status do registro', {
              title: '❌ Erro na Atualização',
              duration: 3000,
            });
          }
        } catch (error) {
          if (isDevelopment.value) {
            console.error('❌ [TABLE_HELPERS] Erro ao alterar status:', error);
          }
          toast.error('Erro inesperado ao alterar status', {
            title: '❌ Erro Interno',
            duration: 3000,
          });
        }
      } else {
        toast.error('Registro não encontrado para atualização', {
          title: '❌ Registro não encontrado',
          duration: 3000,
        });

        if (isDevelopment.value) {
          console.warn('Record not found in store for status toggle:', {
            searchedFor: {
              date: record.Data,
              description: record.Descrição,
              value: record.Valor,
              type: record.Tipo,
              status: originalStatus,
              recurrenceId: record.recurrence?.recurrenceId,
              instanceNumber: record.recurrence?.instanceNumber,
            },
            totalRecords: financeStore.records.length,
          });
        }
      }
    } catch (error) {
      console.error('❌ [TABLE_HELPERS] Unexpected error in handleToggleStatus:', error);
      toast.error('Erro inesperado ao alterar status', {
        title: '❌ Erro Interno',
        duration: 3000,
      });
    } finally {
      // Clean up loading states
      toggleInProgress.value.delete(recordId);
      if (toggleInProgress.value.size === 0) {
        isToggling.value = false;
      }
    }
  };

  // Get starting index for a month in the flat record list
  const getMonthStartIndex = (monthKey: string): number => {
    let currentIndex = 0;
    const monthKeys = Object.keys(financeStore.groupedByMonth);

    for (const key of monthKeys) {
      if (key === monthKey) {
        break;
      }
      currentIndex += financeStore.groupedByMonth[key].length;
    }

    return currentIndex;
  };

  // Environment detection
  const isDevelopment = computed(() => {
    if (typeof window !== 'undefined') {
      return window.location.hostname === 'localhost';
    }
    return false;
  });

  // Format date helper
  const formatDate = (dateString: string): string => {
    return formatDateForDisplay(dateString);
  };

  return {
    // State
    collapsedMonths,
    isDevelopment,

    // Enhanced loading states
    isToggling,
    toggleInProgress,

    // Store references for easy access
    data: financeStore.records,
    filteredData: financeStore.filteredData,
    groupedByMonth: financeStore.groupedByMonth,
    saldoFinal: financeStore.saldoFinal,

    // Dark mode and styling
    isDarkMode,
    themeClass,
    tableClasses,

    // Enhanced toast system
    toast,

    // Methods
    handleMonthToggle,
    handleToggleStatus,
    getMonthStartIndex,
    formatDate,
  };
}
