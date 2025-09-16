import { z } from 'zod';

// Categorias válidas para transações
const validCategories = [
  'Alimentação',
  'Transporte',
  'Saúde',
  'Educação',
  'Lazer',
  'Moradia',
  'Roupas',
  'Tecnologia',
  'Investimentos',
  'Salário',
  'Freelance',
  'Vendas',
  'Outros',
  'Família',
  'Pets',
  'Viagem',
  'Academia',
  'Beleza',
  'Presentes',
  'Doações',
  'Impostos',
  'Seguros',
  'Combustível',
  'Manutenção',
  'Supermercado',
  'Farmácia',
  'Streaming',
  'Internet',
] as const;

// Schema para validação de transações financeiras
export const transactionSchema = z.object({
  // Data obrigatória
  Data: z
    .string()
    .min(1, 'Data é obrigatória')
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Formato de data inválido (YYYY-MM-DD)')
    .refine((date) => {
      const parsed = new Date(date);
      const now = new Date();
      const fiveYearsAgo = new Date(now.getFullYear() - 5, now.getMonth(), now.getDate());
      const twoYearsFromNow = new Date(now.getFullYear() + 2, now.getMonth(), now.getDate());

      return parsed >= fiveYearsAgo && parsed <= twoYearsFromNow;
    }, 'Data deve estar entre 5 anos atrás e 2 anos no futuro'),

  // Descrição obrigatória
  Descrição: z
    .string()
    .min(3, 'Descrição deve ter pelo menos 3 caracteres')
    .max(100, 'Descrição não pode exceder 100 caracteres')
    .regex(/^[a-zA-Z0-9\sÀ-ÿ\-\.\,\(\)\+\%\&\/\*\#\@\!]+$/, 'Descrição contém caracteres inválidos')
    .refine((desc) => desc.trim().length >= 3, 'Descrição não pode ser apenas espaços'),

  // Valor obrigatório
  Valor: z
    .number({
      required_error: 'Valor é obrigatório',
      invalid_type_error: 'Valor deve ser um número',
    })
    .refine((val) => val !== 0, 'Valor não pode ser zero')
    .refine((val) => Math.abs(val) >= 0.01, 'Valor mínimo é R$ 0,01')
    .refine((val) => Math.abs(val) <= 999999.99, 'Valor máximo é R$ 999.999,99')
    .refine((val) => {
      // Converte para string e verifica as casas decimais de forma mais robusta
      const stringVal = Math.abs(val).toFixed(10); // Precisão suficiente
      const decimalPart = stringVal.split('.')[1];
      // Remove zeros à direita e verifica se sobram mais de 2 dígitos
      const significantDecimalDigits = decimalPart.replace(/0+$/, '');
      return significantDecimalDigits.length <= 2;
    }, 'Valor deve ter no máximo 2 casas decimais'),

  // Tipo obrigatório
  Tipo: z.enum(['Receita', 'Despesa'], {
    errorMap: () => ({ message: 'Selecione Receita ou Despesa' }),
  }),

  // Categoria opcional mas validada
  Categoria: z
    .string()
    .max(50, 'Categoria não pode exceder 50 caracteres')
    .optional()
    .or(z.literal(''))
    .refine(
      (cat) => !cat || validCategories.includes(cat as any) || cat.length <= 50,
      'Categoria deve ser válida ou personalizada (máx. 50 caracteres)'
    ),

  // Status obrigatório
  Status: z.enum(['✔️', '❌', '⏰'], {
    errorMap: () => ({ message: 'Status deve ser: ✔️ (Confirmado), ❌ (Pendente) ou ⏰ (Agendado)' }),
  }),
});

// Schema para recorrência
export const recurrenceSchema = z
  .object({
    isActive: z.boolean().default(false),

    frequency: z
      .enum(['semanal', 'mensal', 'trimestral', 'semestral', 'anual'], {
        errorMap: () => ({ message: 'Frequência deve ser: semanal, mensal, trimestral, semestral ou anual' }),
      })
      .default('mensal'),

    endDate: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, 'Formato de data inválido (YYYY-MM-DD)')
      .optional()
      .or(z.literal('')),
  })
  .refine(
    (data) => {
      if (!data.isActive) return true; // Se não ativo, não precisa de validação
      if (!data.endDate || data.endDate === '') return false; // Se ativo, precisa de data fim

      const endDate = new Date(data.endDate);
      const now = new Date();
      const maxFutureDate = new Date(now.getFullYear() + 5, now.getMonth(), now.getDate());

      return endDate > now && endDate <= maxFutureDate;
    },
    {
      message: 'Para recorrência ativa, data fim deve estar entre hoje e 5 anos no futuro',
      path: ['endDate'],
    }
  );

// Schema completo com transação + recorrência
export const completeTransactionSchema = z
  .object({
    transaction: transactionSchema,
    recurrence: recurrenceSchema.optional(),
  })
  .refine(
    (data) => {
      // Validação cruzada: se recorrência ativa, verificar compatibilidade
      if (data.recurrence?.isActive && data.recurrence.endDate) {
        const transactionDate = new Date(data.transaction.Data);
        const endDate = new Date(data.recurrence.endDate);
        return endDate > transactionDate;
      }
      return true;
    },
    {
      message: 'Data fim da recorrência deve ser posterior à data da transação',
      path: ['recurrence', 'endDate'],
    }
  );

// Schema para edição (alguns campos podem ser readonly)
export const editTransactionSchema = transactionSchema.extend({
  // Manter ID para edição
  id: z.string().optional(),

  // Dados de recorrência (se aplicável)
  recurrence: z
    .object({
      recurrenceId: z.string().optional(),
      instanceNumber: z.number().optional(),
      originalDate: z.string().optional(),
      frequency: z.string().optional(),
      endDate: z.string().optional(),
      isActive: z.boolean().optional(),
    })
    .optional(),
});

// Schema para múltiplas transações (bulk)
export const multipleTransactionsSchema = z.object({
  transactions: z
    .array(transactionSchema)
    .min(1, 'Deve haver pelo menos uma transação')
    .max(50, 'Máximo de 50 transações por vez')
    .refine((transactions) => {
      // Verificar se não há transações duplicadas (mesma data, descrição e valor)
      const unique = new Set();
      for (const t of transactions) {
        const key = `${t.Data}-${t.Descrição}-${t.Valor}`;
        if (unique.has(key)) return false;
        unique.add(key);
      }
      return true;
    }, 'Não é possível ter transações duplicadas (mesma data, descrição e valor)'),

  applyToAll: z
    .object({
      Categoria: z.string().optional(),
      Status: z.enum(['✔️', '❌', '⏰']).optional(),
    })
    .optional(),
});

// Tipos inferidos dos schemas
export type TransactionFormData = z.infer<typeof transactionSchema>;
export type RecurrenceFormData = z.infer<typeof recurrenceSchema>;
export type CompleteTransactionData = z.infer<typeof completeTransactionSchema>;
export type EditTransactionData = z.infer<typeof editTransactionSchema>;
export type MultipleTransactionsData = z.infer<typeof multipleTransactionsSchema>;

// Valores iniciais para formulários
export const transactionInitialValues: Partial<TransactionFormData> = {
  Data: new Date().toISOString().split('T')[0],
  Descrição: '',
  Valor: undefined,
  Tipo: 'Despesa',
  Categoria: '',
  Status: '❌',
};

export const recurrenceInitialValues: RecurrenceFormData = {
  isActive: false,
  frequency: 'mensal',
  endDate: '',
};

// Função para validar valor monetário em tempo real
export const validateCurrency = (value: string): boolean => {
  const numValue = parseFloat(value.replace(/[^0-9.-]/g, ''));
  return !isNaN(numValue) && numValue !== 0 && Math.abs(numValue) <= 999999.99;
};

// Função para formatar valor monetário
export const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(Math.abs(value));
};

// Função para transformar dados do formulário para o formato esperado
export const transformTransactionData = (data: TransactionFormData) => ({
  ...data,
  Valor: data.Tipo === 'Despesa' ? -Math.abs(data.Valor) : Math.abs(data.Valor),
  Categoria: data.Categoria || '', // Converter undefined para string vazia
});

// Validação específica para categoria personalizada
export const validateCustomCategory = (category: string): boolean => {
  if (!category) return true; // Categoria vazia é válida
  if (validCategories.includes(category as any)) return true; // Categoria padrão
  return /^[a-zA-Z0-9\sÀ-ÿ\-]+$/.test(category) && category.length <= 50; // Categoria personalizada válida
};

// Função para verificar se transação é de renda variável
export const isIncomeTransaction = (tipo: string): boolean => tipo === 'Receita';

// Função para verificar se transação é despesa
export const isExpenseTransaction = (tipo: string): boolean => tipo === 'Despesa';

// Mapa de erros customizado em português
export const transactionErrorMap: z.ZodErrorMap = (issue, ctx) => {
  switch (issue.code) {
    case z.ZodIssueCode.invalid_type:
      if (issue.expected === 'number') {
        return { message: 'Deve ser um valor numérico válido' };
      }
      if (issue.expected === 'string') {
        return { message: 'Campo obrigatório' };
      }
      break;
    case z.ZodIssueCode.too_small:
      if (issue.type === 'string') {
        return { message: `Mínimo de ${issue.minimum} caracteres` };
      }
      if (issue.type === 'number') {
        return { message: `Valor deve ser maior que ${issue.minimum}` };
      }
      break;
    case z.ZodIssueCode.too_big:
      if (issue.type === 'string') {
        return { message: `Máximo de ${issue.maximum} caracteres` };
      }
      if (issue.type === 'number') {
        return { message: `Valor deve ser menor que ${issue.maximum}` };
      }
      break;
    case z.ZodIssueCode.invalid_string:
      if (issue.validation === 'regex') {
        return { message: 'Formato inválido' };
      }
      break;
    case z.ZodIssueCode.invalid_enum_value:
      return { message: 'Selecione uma opção válida' };
  }
  return { message: ctx?.defaultError || 'Campo inválido' };
};
