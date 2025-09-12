import { ref } from 'vue';
import { financeRecordSchema } from '../types/finance';
import { formatDateForStorage } from '../utils/dateUtils';
import type { IFinanceRecord } from '../types/finance';

export function useCSVImport() {
  const isImporting = ref(false);
  const importError = ref<string>('');
  const importSuccess = ref<string>('');

  const clearMessages = () => {
    importError.value = '';
    importSuccess.value = '';
  };

  const parseCSVLine = (line: string): string[] => {
    const values: string[] = [];
    let currentValue = '';
    let insideQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];

      if (char === '"') {
        insideQuotes = !insideQuotes;
      } else if (char === ',' && !insideQuotes) {
        values.push(currentValue.trim());
        currentValue = '';
      } else {
        currentValue += char;
      }
    }

    values.push(currentValue.trim());
    return values.map(value => value.replace(/^"|"$/g, '').trim());
  };

  const parseDate = (dateStr: string): string => {
    // Use the standardized date parser from utils
    const result = formatDateForStorage(dateStr);
    if (!result) {
      throw new Error(`Data inválida: ${dateStr}`);
    }
    return result;
  };

  const parseValue = (valueStr: string): number => {
    // Handle different value formats including negative values with R$ prefix
    let cleanValue = valueStr.trim();

    // Handle negative values that start with -R$
    const isNegative = cleanValue.startsWith('-');
    if (isNegative) {
      cleanValue = cleanValue.substring(1);
    }

    // Remove currency symbols and spaces
    cleanValue = cleanValue
      .replace(/[R$\s]/g, '')
      .replace(/\./g, '')  // Remove thousands separator
      .replace(',', '.');  // Replace decimal comma with dot

    const value = Number(cleanValue);
    if (isNaN(value)) {
      throw new Error(`Valor inválido: ${valueStr}`);
    }

    return isNegative ? -Math.abs(value) : value;
  };

  const normalizeStatus = (statusValue: string): '❌' | '✔️' => {
    const normalized = statusValue.trim().toLowerCase();

    // Handle different status formats
    switch (normalized) {
      case 's':
      case 'sim':
      case 'yes':
      case 'y':
      case '✔️':
      case 'confirmado':
      case 'pago':
        return '✔️';
      case 'n':
      case 'não':
      case 'nao':
      case 'no':
      case '❌':
      case 'pendente':
      case 'não pago':
        return '❌';
      default:
        return '❌'; // Default to pending
    }
  };

  const detectTypeFromValue = (value: number): 'Receita' | 'Despesa' => {
    return value >= 0 ? 'Receita' : 'Despesa';
  };

  const validateHeaders = (headers: string[]): boolean => {
    // More flexible header validation - check for essential columns
    const normalizedHeaders = headers.map(h => h.toLowerCase().trim());

    const hasDate = normalizedHeaders.some(h =>
      h.includes('data') || h === 'date'
    );

    const hasDescription = normalizedHeaders.some(h =>
      h.includes('descrição') || h.includes('descricao') || h === 'description'
    );

    const hasValue = normalizedHeaders.some(h =>
      h.includes('valor') || h === 'value' || h === 'amount'
    );

    return hasDate && hasDescription && hasValue;
  };

  const mapColumnName = (header: string): string => {
    const normalized = header.toLowerCase().trim();

    const mappings: Record<string, string> = {
      'data': 'data',
      'date': 'data',
      'descrição': 'descrição',
      'descricao': 'descrição',
      'description': 'descrição',
      'valor': 'valor',
      'value': 'valor',
      'amount': 'valor',
      'tipo': 'tipo',
      'type': 'tipo',
      'status': 'status',
      'categoria': 'categoria',
      'category': 'categoria',
      'recorrente': 'status', // Map Recorrente to Status
      'dia util': 'ignore', // Ignore Dia Util column
      'dia útil': 'ignore', // Ignore Dia Útil column
      'dia_util': 'ignore', // Alternative format
      'dia_útil': 'ignore', // Alternative format
    };

    return mappings[normalized] || normalized;
  };

  const importCSV = async (file: File, onImport: (records: Omit<IFinanceRecord, 'Saldo'>[]) => void) => {
    isImporting.value = true;
    clearMessages();

    try {
      const content = await file.text();
      const lines = content.split(/\r?\n/).filter(line => line.trim());

      if (lines.length < 2) {
        throw new Error('Arquivo CSV vazio ou inválido');
      }

      const headers = parseCSVLine(lines[0]);
      if (!validateHeaders(headers)) {
        throw new Error('Cabeçalhos essenciais não encontrados (Data, Descrição, Valor)');
      }

      const records: Omit<IFinanceRecord, 'Saldo'>[] = [];
      const mappedHeaders = headers.map(mapColumnName);

      for (let i = 1; i < lines.length; i++) {
        const values = parseCSVLine(lines[i]);
        if (values.length !== headers.length) continue;

        const record: Partial<IFinanceRecord> = {};
        let isRecurring = false;

        // Process each column
        for (let j = 0; j < headers.length; j++) {
          const mappedHeader = mappedHeaders[j];
          const value = values[j];

          if (!value || value.trim() === '' || mappedHeader === 'ignore') continue;

          switch (mappedHeader) {
            case 'data':
              try {
                record.Data = parseDate(value);
              } catch (error) {
                // Invalid date - skip field
                continue;
              }
              break;
            case 'descrição':
              record.Descrição = value;
              break;
            case 'valor':
              try {
                const parsedValue = parseValue(value);
                record.Valor = Math.abs(parsedValue); // Store absolute value

                // Determine type from original value sign
                if (!record.Tipo) {
                  record.Tipo = detectTypeFromValue(parsedValue);
                }
              } catch (error) {
                throw new Error(`Valor inválido na linha ${i + 1}: ${value}`);
              }
              break;
            case 'tipo':
              if (['Receita', 'Despesa'].includes(value)) {
                record.Tipo = value as 'Receita' | 'Despesa';
              }
              break;
            case 'status':
              const normalizedStatus = normalizeStatus(value);
              record.Status = normalizedStatus;

              // Check if this indicates recurrence (S = recurring)
              if (value.toLowerCase().trim() === 's') {
                isRecurring = true;
              }
              break;
            case 'categoria':
              // Only set category if it's not a numeric value and not S/N
              if (value && value !== 'N' && value !== 'S' && isNaN(Number(value))) {
                record.Categoria = value;
              }
              break;
          }
        }

        // Ensure required fields are present
        if (!record.Data || !record.Descrição || record.Valor === undefined) {
          continue; // Skip invalid records instead of failing completely
        }

        // Set defaults for missing fields
        if (!record.Tipo) {
          record.Tipo = 'Despesa'; // Default to expense if not specified
        }
        if (!record.Status) {
          record.Status = '❌'; // Default to pending
        }

        // Adjust value sign based on type
        if (record.Tipo === 'Despesa' && record.Valor > 0) {
          record.Valor = -record.Valor;
        } else if (record.Tipo === 'Receita' && record.Valor < 0) {
          record.Valor = Math.abs(record.Valor);
        }

        // Add recurrence information if marked as recurring
        if (isRecurring) {
          const endDate = new Date(record.Data);
          endDate.setFullYear(endDate.getFullYear() + 1);

          record.recurrence = {
            frequency: 'mensal',
            endDate: endDate.toISOString().split('T')[0],
            isActive: true,
          };
        }

        try {
          financeRecordSchema.parse(record);

          // If recurring, generate all occurrences
          if (isRecurring && record.recurrence) {
            const recurringRecords = generateRecurringRecordsFromImport(record as Omit<IFinanceRecord, 'Saldo'>);
            records.push(...recurringRecords);
          } else {
            records.push(record as Omit<IFinanceRecord, 'Saldo'>);
          }
        } catch (error) {
          continue; // Skip invalid records instead of failing completely
        }
      }

      if (records.length === 0) {
        throw new Error('Nenhum registro válido encontrado no arquivo');
      }

      onImport(records);
      importSuccess.value = `${records.length} registros importados com sucesso!`;
    } catch (error) {
      importError.value = error instanceof Error ? error.message : 'Erro ao importar arquivo';
    } finally {
      isImporting.value = false;
    }
  };

  // Helper function to generate recurring records during import
  function generateRecurringRecordsFromImport(baseRecord: Omit<IFinanceRecord, 'Saldo'>): Omit<IFinanceRecord, 'Saldo'>[] {
    if (!baseRecord.recurrence) return [baseRecord];

    const records: Omit<IFinanceRecord, 'Saldo'>[] = [baseRecord];
    let currentDate = baseRecord.Data;
    const endDate = new Date(baseRecord.recurrence.endDate);
    let occurrenceCount = 1;
    const maxOccurrences = 12;

    while (occurrenceCount < maxOccurrences) {
      const nextDate = new Date(currentDate);
      nextDate.setMonth(nextDate.getMonth() + 1); // Monthly recurrence
      currentDate = nextDate.toISOString().split('T')[0];

      // Stop only if we've reached the end date
      if (nextDate > endDate) break;

      const recurringRecord: Omit<IFinanceRecord, 'Saldo'> = {
        ...baseRecord,
        Data: currentDate,
        recurrence: {
          ...baseRecord.recurrence,
        },
      };

      records.push(recurringRecord);
      occurrenceCount++;
    }

    return records;
  }

  const generateSampleCSV = (): string => {
    const headers = ['Data', 'Descrição', 'Valor', 'Tipo', 'Status', 'Categoria'];
    const sampleData = [
      ['01/08', 'Salário', 'R$ 5000,00', 'Receita', '✔️', 'Renda'],
      ['02/08', 'Aluguel', '-R$ 1500,00', 'Despesa', '✔️', 'Moradia'],
      ['03/08', 'Supermercado', '-R$ 800,00', 'Despesa', '✔️', 'Alimentação'],
      ['04/08', 'Netflix', '-R$ 39,90', 'Despesa', '✔️', 'Lazer'],
      ['05/08', 'Freelance', 'R$ 1200,00', 'Receita', '❌', 'Renda']
    ];

    // Also generate a sample with the new format
    const newFormatHeaders = ['Data', 'Descrição', 'Valor', 'Recorrente', 'Dia Util'];
    const newFormatData = [
      ['06/08', 'Salário', 'R$ 3.946,89', 'S', '5'],
      ['20/06', 'Salário', 'R$ 2.563,11', 'S', '5'],
      ['06/08', 'Salário', 'R$ 1.976,37', 'N', '5'],
      ['07/08', 'Aluguel', '-R$ 1.246,29', 'N', ''],
      ['07/08', 'Condomínio', '-R$ 420', 'N', '']
    ];

    return [
      '# Formato padrão:',
      headers.join(','),
      ...sampleData.map(row => row.join(',')),
      '',
      '# Novo formato também suportado:',
      newFormatHeaders.join(','),
      ...newFormatData.map(row => row.join(','))
    ].join('\n');
  };

  return {
    isImporting,
    importError,
    importSuccess,
    clearMessages,
    importCSV,
    generateSampleCSV
  };
} 