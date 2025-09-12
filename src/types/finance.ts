import { z } from 'zod';

// Recurrence types
export type IRecurrenceFrequency = 'mensal' | 'semanal' | 'quinzenal' | 'trimestral';

export interface IRecurrence {
  frequency: IRecurrenceFrequency;
  endDate: string;
  isActive: boolean;
  nextDate?: string;
  // New fields for better tracking
  recurrenceId?: string; // Unique ID to link all records in the same recurrence
  originalDate?: string; // The original date when the recurrence was created
  instanceNumber?: number; // Which instance in the sequence (1st, 2nd, 3rd, etc.)
  // Business day recurrence fields
  isBusinessDayRecurrence?: boolean; // Indicates if this recurrence uses business day logic
  businessDayNumber?: number; // Which business day (1st, 2nd, 3rd, etc.)
}

// Base finance record schema
export const financeRecordSchema = z.object({
  Data: z.string(),
  Descrição: z.string().min(1, 'Descrição é obrigatória'),
  Valor: z.number(),
  Tipo: z.enum(['Receita', 'Despesa']),
  Categoria: z.string().optional(),
  Status: z.enum(['❌', '✔️', '⏰']),
  Saldo: z.number().optional(),
  recurrence: z.object({
    frequency: z.enum(['mensal', 'semanal', 'quinzenal', 'trimestral']),
    endDate: z.string(),
    isActive: z.boolean(),
    nextDate: z.string().optional(),
    // New fields for better tracking
    recurrenceId: z.string().optional(),
    originalDate: z.string().optional(),
    instanceNumber: z.number().optional(),
    // Business day recurrence fields
    isBusinessDayRecurrence: z.boolean().optional(),
    businessDayNumber: z.number().optional(),
  }).nullable().optional(),
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
