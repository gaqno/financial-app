import { ref } from 'vue';
import type { IFinanceRecord } from '../types/finance';
import { useCategoryDetection } from './useCategoryDetection';

export function useCSVImport() {
  const isImporting = ref(false);
  const importError = ref<string | null>(null);
  const importSuccess = ref<string | null>(null);
  const { detectCategory } = useCategoryDetection();

  function parseCSVLine(line: string): string[] {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    
    result.push(current.trim());
    return result;
  }

  function parseValue(valueString: string): number {
    // Remove "R$", espaços e trata valores negativos
    let cleanValue = valueString.trim();
    
    // Remove prefixo de moeda
    cleanValue = cleanValue.replace(/R\$\s*/g, '');
    
    // Trata valores negativos que podem estar como "-R$ 100,00" ou "R$ -100,00"
    const isNegative = cleanValue.includes('-');
    cleanValue = cleanValue.replace('-', '');
    
    // Remove pontos de milhares e substitui vírgula por ponto decimal
    cleanValue = cleanValue.replace(/\./g, '').replace(',', '.');
    
    const numValue = parseFloat(cleanValue);
    return isNegative ? -Math.abs(numValue) : numValue;
  }

  function normalizeDate(dateString: string): string {
    const date = dateString.trim();
    
    // Se já está no formato YYYY-MM-DD, mantém
    if (date.match(/^\d{4}-\d{2}-\d{2}$/)) {
      return date;
    }
    
    // Se está no formato DD/MM ou DD/MM/YYYY
    if (date.match(/^\d{1,2}\/\d{1,2}(\/\d{4})?$/)) {
      const parts = date.split('/');
      const day = parts[0].padStart(2, '0');
      const month = parts[1].padStart(2, '0');
      const year = parts[2] || new Date().getFullYear().toString();
      return `${year}-${month}-${day}`;
    }
    
    return date; // Retorna como está se não conseguir converter
  }

  function validateRecord(record: any, lineNumber: number): IFinanceRecord | null {
    try {
      // Validar campos obrigatórios
      if (!record.Data || !record.Descrição || record.Valor === undefined) {
        throw new Error(`Linha ${lineNumber}: Campos obrigatórios em falta (Data, Descrição, Valor)`);
      }

      // Validar tipo
      if (!['Receita', 'Despesa'].includes(record.Tipo)) {
        throw new Error(`Linha ${lineNumber}: Tipo deve ser 'Receita' ou 'Despesa'`);
      }

      // Validar status
      if (!['❌', '✔️'].includes(record.Status)) {
        throw new Error(`Linha ${lineNumber}: Status deve ser '❌' ou '✔️'`);
      }

      // Converter valor (suporta formato brasileiro)
      let valor: number;
      try {
        valor = typeof record.Valor === 'string' 
          ? parseValue(record.Valor)
          : Number(record.Valor);
      } catch {
        throw new Error(`Linha ${lineNumber}: Valor deve ser um número válido`);
      }

      if (isNaN(valor)) {
        throw new Error(`Linha ${lineNumber}: Valor deve ser um número válido`);
      }

      // Normalizar data
      const dataNormalizada = normalizeDate(record.Data);

      // Detectar categoria automaticamente se não estiver preenchida
      const categoriaOriginal = record.Categoria?.trim() || '';
      const categoriaDetectada = categoriaOriginal || detectCategory(record.Descrição);

      return {
        Data: dataNormalizada,
        Descrição: record.Descrição.trim(),
        Valor: valor,
        Tipo: record.Tipo as 'Receita' | 'Despesa',
        Categoria: categoriaDetectada,
        Status: record.Status as '❌' | '✔️',
        Saldo: 0 // Será recalculado
      };
    } catch (error) {
      throw error;
    }
  }

  async function parseCSV(file: File): Promise<Omit<IFinanceRecord, 'Saldo'>[]> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        try {
          const text = e.target?.result as string;
          const lines = text.split('\n').filter(line => line.trim());
          
          if (lines.length < 2) {
            throw new Error('Arquivo CSV deve conter pelo menos um cabeçalho e uma linha de dados');
          }

          // Parse header
          const headers = parseCSVLine(lines[0]).map(h => h.replace(/"/g, ''));
          const requiredHeaders = ['Data', 'Descrição', 'Valor', 'Tipo', 'Status'];
          
          for (const required of requiredHeaders) {
            if (!headers.includes(required)) {
              throw new Error(`Cabeçalho obrigatório não encontrado: ${required}`);
            }
          }

          // Ignorar coluna "Saldo" se presente (será recalculada automaticamente)
          const validHeaders = headers.filter(h => h !== 'Saldo');

          const records: Omit<IFinanceRecord, 'Saldo'>[] = [];

          // Parse data lines
          for (let i = 1; i < lines.length; i++) {
            const values = parseCSVLine(lines[i]).map(v => v.replace(/"/g, ''));
            
            if (values.length !== headers.length) {
              console.warn(`Linha ${i + 1}: Número de colunas não corresponde ao cabeçalho`);
              continue;
            }

            const record: any = {};
            headers.forEach((header, index) => {
              // Ignora a coluna Saldo se presente
              if (header !== 'Saldo') {
                record[header] = values[index];
              }
            });

            try {
              const validatedRecord = validateRecord(record, i + 1);
              if (validatedRecord) {
                const { Saldo, ...recordWithoutSaldo } = validatedRecord;
                records.push(recordWithoutSaldo);
              }
            } catch (error) {
              console.warn(`Erro na linha ${i + 1}:`, error);
              // Continua processando outras linhas mesmo se uma falhar
            }
          }

          resolve(records);
        } catch (error) {
          reject(error);
        }
      };

      reader.onerror = () => {
        reject(new Error('Erro ao ler o arquivo'));
      };

      reader.readAsText(file, 'UTF-8');
    });
  }

  async function importCSV(file: File, onImport: (records: Omit<IFinanceRecord, 'Saldo'>[]) => void) {
    try {
      isImporting.value = true;
      importError.value = null;
      importSuccess.value = null;

      const records = await parseCSV(file);
      
      if (records.length === 0) {
        throw new Error('Nenhum registro válido encontrado no arquivo');
      }

      onImport(records);
      importSuccess.value = `${records.length} registros importados com sucesso!`;
      
    } catch (error) {
      importError.value = error instanceof Error ? error.message : 'Erro desconhecido na importação';
    } finally {
      isImporting.value = false;
    }
  }

  function clearMessages() {
    importError.value = null;
    importSuccess.value = null;
  }

  function generateSampleCSV(): string {
    const headers = ['Data', 'Descrição', 'Valor', 'Tipo', 'Status'];
    const sampleData = [
      ['15/01', 'Aluguel apartamento', '-R$ 1.500,00', 'Despesa', '✔️'],
      ['16/01', 'Supermercado Extra', '-R$ 350,00', 'Despesa', '✔️'],
      ['17/01', 'Salário empresa', 'R$ 5.000,00', 'Receita', '✔️'],
      ['18/01', 'Uber para trabalho', '-R$ 25,00', 'Despesa', '❌'],
      ['19/01', 'Farmácia medicamento', '-R$ 80,50', 'Despesa', '✔️'],
      ['20/01', 'Freelance design', 'R$ 800,00', 'Receita', '❌']
    ];

    return [headers, ...sampleData].map(row => row.join(',')).join('\n');
  }

  return {
    isImporting,
    importError,
    importSuccess,
    importCSV,
    clearMessages,
    generateSampleCSV
  };
} 