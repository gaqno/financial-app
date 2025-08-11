import { z } from 'zod';

// Recurrence types
export type IRecurrenceFrequency = 'mensal' | 'semanal' | 'quinzenal' | 'trimestral';

export interface IRecurrence {
  frequency: IRecurrenceFrequency;
  endDate: string;
  isActive: boolean;
  nextDate?: string;
}

// Base finance record schema
export const financeRecordSchema = z.object({
  Data: z.string(),
  Descrição: z.string().min(1, 'Descrição é obrigatória'),
  Valor: z.number(),
  Tipo: z.enum(['Receita', 'Despesa']),
  Categoria: z.string().optional(),
  Status: z.enum(['❌', '✔️']),
  Saldo: z.number().optional(),
  recurrence: z.object({
    frequency: z.enum(['mensal', 'semanal', 'quinzenal', 'trimestral']),
    endDate: z.string(),
    isActive: z.boolean(),
    nextDate: z.string().optional(),
  }).optional(),
});

// Type for finance record
export type IFinanceRecord = z.infer<typeof financeRecordSchema>;

// Extended type for grouped records with month information
export type IFinanceRecordWithMonth = IFinanceRecord & {
  monthName?: string;
};

// Form data schema with additional validations
export const financeFormSchema = financeRecordSchema.extend({
  Descrição: z.string().min(3, 'Descrição deve ter no mínimo 3 caracteres'),
  Valor: z.number().min(0.01, 'Valor deve ser maior que zero'),
});

// Type for form data
export type IFinanceFormData = z.infer<typeof financeFormSchema>;

// Category type
export type ICategory = {
  name: string;
  icon: string;
};

// Filter type
export type IFilter = 'all' | 'Receita' | 'Despesa';

// Edit record type
export type IEditRecord = {
  index: number;
  record: IFinanceRecord;
};

// Chart data type
export type IChartData = {
  labels: string[];
  datasets: {
    data: number[];
    backgroundColor: string[];
  }[];
};
