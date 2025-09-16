import { ref } from 'vue';
import type { IExportOptions } from '../../types/profile';
import { useToast } from '../useToast';
import { useFinanceStore } from '../../stores/financeStore';

export function useDataManagement() {
  const { success: showSuccess, error: showError, warning: showWarning } = useToast();
  const financeStore = useFinanceStore();

  // Estado
  const isExporting = ref(false);
  const isResetting = ref(false);
  const exportProgress = ref(0);

  // Opções padrão de exportação
  const defaultExportOptions: IExportOptions = {
    format: 'csv',
    dateRange: {
      start: new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0], // Início do ano
      end: new Date().toISOString().split('T')[0], // Hoje
    },
    includeCategories: true,
    includeRecurrence: true,
    includeInvestments: false,
  };

  const exportOptions = ref<IExportOptions>({ ...defaultExportOptions });

  // Métodos
  const exportAllData = async (): Promise<boolean> => {
    try {
      isExporting.value = true;
      exportProgress.value = 0;

      // Simular progresso de exportação
      const steps = [
        { step: 'Coletando transações...', progress: 20 },
        { step: 'Processando categorias...', progress: 40 },
        { step: 'Incluindo recorrências...', progress: 60 },
        { step: 'Formatando dados...', progress: 80 },
        { step: 'Gerando arquivo...', progress: 100 },
      ];

      for (const step of steps) {
        await new Promise((resolve) => setTimeout(resolve, 500));
        exportProgress.value = step.progress;
      }

      // TODO: Implementar exportação real
      // const exportedData = await dataService.exportAllData(exportOptions.value)

      // Mock: Coletar dados do store
      const mockData = {
        transactions: financeStore.records || [],
        categories: ['Alimentação', 'Transporte', 'Moradia', 'Saúde', 'Lazer'],
        settings: exportOptions.value,
        exportDate: new Date().toISOString(),
        totalRecords: financeStore.records?.length || 0,
      };

      // Gerar arquivo para download
      const fileName = `por-quinho-backup-${new Date().toISOString().split('T')[0]}`;
      const fileContent =
        exportOptions.value.format === 'csv' ? generateCSV(mockData) : JSON.stringify(mockData, null, 2);

      const blob = new Blob([fileContent], {
        type: exportOptions.value.format === 'csv' ? 'text/csv' : 'application/json',
      });
      const url = URL.createObjectURL(blob);

      const link = document.createElement('a');
      link.href = url;
      link.download = `${fileName}.${exportOptions.value.format}`;
      link.click();

      URL.revokeObjectURL(url);

      showSuccess(`Dados exportados com sucesso! ${mockData.totalRecords} registros incluídos.`, {
        title: '📁 Exportação Concluída',
        duration: 4000,
      });

      return true;
    } catch (error) {
      console.error('Erro ao exportar dados:', error);
      showError('Erro ao exportar dados. Tente novamente.', {
        title: '❌ Erro na Exportação',
      });
      return false;
    } finally {
      isExporting.value = false;
      exportProgress.value = 0;
    }
  };

  const generateCSV = (data: any): string => {
    const headers = ['Data', 'Descrição', 'Valor', 'Tipo', 'Categoria', 'Status'];
    const rows = data.transactions.map((transaction: any) => [
      transaction.Data || '',
      transaction.Descrição || '',
      transaction.Valor || '',
      transaction.Tipo || '',
      transaction.Categoria || '',
      transaction.Status || '',
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map((row: any[]) => row.map((field) => `"${field}"`).join(',')),
    ].join('\n');

    return csvContent;
  };

  const resetAllData = async (): Promise<boolean> => {
    try {
      isResetting.value = true;

      // TODO: Implementar reset real no backend
      // await dataService.resetAllData()

      // Simular delay
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Mock: Limpar dados do store local
      financeStore.records = [];

      // Limpar localStorage se necessário
      localStorage.removeItem('por-quinho-data');
      localStorage.removeItem('por-quinho-settings');

      showWarning('Todos os dados foram removidos permanentemente!', {
        title: '🗑️ Reset Completo',
        duration: 5000,
      });

      return true;
    } catch (error) {
      console.error('Erro ao resetar dados:', error);
      showError('Erro ao resetar dados. Tente novamente.', {
        title: '❌ Erro no Reset',
      });
      return false;
    } finally {
      isResetting.value = false;
    }
  };

  const getDataStatistics = () => {
    const stats = {
      totalTransactions: financeStore.records?.length || 0,
      totalCategories: new Set(financeStore.records?.map((r) => r.Categoria)).size || 0,
      dateRange: {
        oldest:
          financeStore.records?.reduce((oldest, record) => {
            const recordDate = new Date(record.Data || '');
            const oldestDate = new Date(oldest);
            return recordDate < oldestDate ? record.Data : oldest;
          }, new Date().toISOString().split('T')[0]) || '',
        newest:
          financeStore.records?.reduce((newest, record) => {
            const recordDate = new Date(record.Data || '');
            const newestDate = new Date(newest);
            return recordDate > newestDate ? record.Data : newest;
          }, '1900-01-01') || '',
      },
      totalRevenue: financeStore.records?.filter((r) => r.Tipo === 'Receita').length || 0,
      totalExpenses: financeStore.records?.filter((r) => r.Tipo === 'Despesa').length || 0,
      storageSize: calculateStorageSize(),
    };

    return stats;
  };

  const calculateStorageSize = (): string => {
    try {
      const data = JSON.stringify(financeStore.records || []);
      const bytes = new Blob([data]).size;

      if (bytes < 1024) return `${bytes} bytes`;
      if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
      return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    } catch {
      return '0 bytes';
    }
  };

  const updateExportOptions = (newOptions: Partial<IExportOptions>) => {
    exportOptions.value = { ...exportOptions.value, ...newOptions };
  };

  const resetExportOptions = () => {
    exportOptions.value = { ...defaultExportOptions };
  };

  const validateDateRange = (): boolean => {
    const startDate = new Date(exportOptions.value.dateRange.start);
    const endDate = new Date(exportOptions.value.dateRange.end);

    if (startDate > endDate) {
      showError('Data de início deve ser anterior à data de fim', {
        title: '📅 Datas Inválidas',
      });
      return false;
    }

    const maxRange = 365 * 2 * 24 * 60 * 60 * 1000; // 2 anos em ms
    if (endDate.getTime() - startDate.getTime() > maxRange) {
      showWarning('Período muito longo. Considere exportar em intervalos menores.', {
        title: '⚠️ Período Extenso',
      });
    }

    return true;
  };

  return {
    // Estado
    isExporting,
    isResetting,
    exportProgress,
    exportOptions,

    // Métodos
    exportAllData,
    resetAllData,
    getDataStatistics,
    updateExportOptions,
    resetExportOptions,
    validateDateRange,
  };
}
