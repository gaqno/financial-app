/**
 * Utilitários para formatação e manipulação de datas
 * Garantem formato consistente DD/MM/YYYY em toda a aplicação
 */

export const DATE_FORMAT = {
  // Formato brasileiro padrão
  DISPLAY: 'dd/MM/yyyy',
  // Formato ISO para armazenamento
  ISO: 'yyyy-MM-dd',
  // Opções para toLocaleDateString
  LOCALE_OPTIONS: {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  } as const,
};

/**
 * Formata uma data para exibição no formato DD/MM/YYYY
 * @param dateInput - Data como string (YYYY-MM-DD) ou objeto Date
 * @returns String no formato DD/MM/YYYY
 */
export function formatDateForDisplay(dateInput: string | Date): string {
  if (!dateInput) return '';

  try {
    let date: Date;

    if (typeof dateInput === 'string') {
      // Para strings no formato YYYY-MM-DD, parse como data local para evitar problemas de timezone
      if (dateInput.match(/^\d{4}-\d{2}-\d{2}$/)) {
        const [year, month, day] = dateInput.split('-').map(Number);
        date = new Date(year, month - 1, day); // month é 0-based no constructor
      } else {
        date = new Date(dateInput);
      }
    } else {
      date = dateInput;
    }

    // Verifica se a data é válida
    if (isNaN(date.getTime())) {
      console.warn('📅 [DATE_UTILS] Data inválida:', dateInput);
      return '';
    }

    return date.toLocaleDateString('pt-BR', DATE_FORMAT.LOCALE_OPTIONS);
  } catch (error) {
    console.error('📅 [DATE_UTILS] Erro ao formatar data:', error, dateInput);
    return '';
  }
}

/**
 * Converte data do formato DD/MM/YYYY para YYYY-MM-DD (ISO)
 * @param displayDate - Data no formato DD/MM/YYYY
 * @returns String no formato YYYY-MM-DD
 */
export function formatDateForStorage(displayDate: string): string {
  if (!displayDate) return '';

  try {
    // Remove espaços e caracteres especiais
    const cleanDate = displayDate.trim();

    // Tenta diferentes formatos de entrada
    const patterns = [
      // DD/MM/YYYY ou DD-MM-YYYY
      /^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/,
      // DD/MM/YY ou DD-MM-YY
      /^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2})$/,
    ];

    for (const pattern of patterns) {
      const match = cleanDate.match(pattern);
      if (match) {
        const [, day, month, year] = match;
        const fullYear = year.length === 2 ? `20${year}` : year;

        const dayNum = parseInt(day);
        const monthNum = parseInt(month);
        const yearNum = parseInt(fullYear);

        // Valida os valores
        if (dayNum < 1 || dayNum > 31 || monthNum < 1 || monthNum > 12 || yearNum < 1900) {
          throw new Error('Data fora dos limites válidos');
        }

        // Formata para YYYY-MM-DD
        return `${fullYear}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
      }
    }

    // Se não reconheceu o formato, tenta parsing direto
    const date = new Date(cleanDate);
    if (!isNaN(date.getTime())) {
      return date.toISOString().split('T')[0];
    }

    throw new Error('Formato de data não reconhecido');
  } catch (error) {
    console.error('📅 [DATE_UTILS] Erro ao converter data para armazenamento:', error, displayDate);
    return '';
  }
}

/**
 * Valida se uma string representa uma data válida
 * @param dateString - String de data para validar
 * @returns true se a data for válida
 */
export function isValidDate(dateString: string): boolean {
  if (!dateString) return false;

  try {
    const isoDate = formatDateForStorage(dateString);
    if (!isoDate) return false;

    const date = new Date(isoDate);
    return !isNaN(date.getTime()) && date.toISOString().startsWith(isoDate);
  } catch {
    return false;
  }
}

/**
 * Obtém a data atual no formato YYYY-MM-DD
 * @returns String da data atual no formato ISO
 */
export function getCurrentDateISO(): string {
  return new Date().toISOString().split('T')[0];
}

/**
 * Obtém a data atual no formato DD/MM/YYYY
 * @returns String da data atual no formato brasileiro
 */
export function getCurrentDateDisplay(): string {
  return formatDateForDisplay(new Date());
}

/**
 * Configuração do input HTML para mostrar formato brasileiro
 * Aplica configurações CSS e JavaScript para forçar formato DD/MM/YYYY
 */
export function configureBrowserDateFormat(): void {
  try {
    if (typeof window === 'undefined') return;

    // Aplicar estilo CSS para inputs de data
    const style = document.createElement('style');
    style.textContent = `
      /* Força formato brasileiro em inputs de data */
      input[type="date"] {
        font-family: "Courier New", monospace;
      }
      
      /* Personalização adicional para melhor experiência */
      input[type="date"]::-webkit-calendar-picker-indicator {
        cursor: pointer;
        filter: invert(0.8);
      }
      
      input[type="date"]::-webkit-datetime-edit-text {
        padding: 0 0.3em;
      }
    `;
    document.head.appendChild(style);
  } catch (error) {
    console.warn('📅 [DATE_UTILS] Não foi possível configurar estilos de data:', error);
  }
}

/**
 * Converte valor do input HTML5 date (sempre YYYY-MM-DD) para formato de exibição
 * @param htmlInputValue - Valor do input type="date"
 * @returns Data formatada para exibição
 */
export function parseHTMLDateInput(htmlInputValue: string): string {
  return formatDateForDisplay(htmlInputValue);
}

/**
 * Converte data de exibição para valor do input HTML5 date
 * @param displayDate - Data no formato DD/MM/YYYY
 * @returns Data no formato YYYY-MM-DD para input HTML
 */
export function formatForHTMLDateInput(displayDate: string): string {
  return formatDateForStorage(displayDate);
}
