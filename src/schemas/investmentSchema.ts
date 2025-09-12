import { z } from 'zod'
import { INVESTMENT_TYPES, type InvestmentTypeKey, type IInvestment } from '../types/investments'

// Schema simples e compatível com vee-validate
export const investmentSchema = z.object({
  name: z.string().min(3, 'Nome deve ter pelo menos 3 caracteres'),

  type: z.string().min(1, 'Selecione um tipo de investimento'),

  institution: z.string().min(2, 'Instituição deve ter pelo menos 2 caracteres'),

  initialAmount: z.coerce.number().min(0.01, 'Valor deve ser maior que zero'),

  yieldType: z.string().min(1, 'Tipo de rendimento é obrigatório'),

  yieldRate: z.coerce.number().min(0, 'Taxa não pode ser negativa'),

  startDate: z.string().min(1, 'Data de aplicação é obrigatória'),

  maturityDate: z.string().optional(),

  autoReinvest: z.boolean(),

  status: z.string().min(1, 'Status é obrigatório')
})

// Tipo inferido do schema
export type InvestmentFormData = z.infer<typeof investmentSchema>

// Valores padrão para o formulário
export const getDefaultValues = () => ({
  name: '',
  type: '',
  institution: '',
  initialAmount: 0,
  yieldType: 'CDI_PERCENTAGE',
  yieldRate: 100,
  startDate: new Date().toISOString().split('T')[0],
  maturityDate: '',
  autoReinvest: false,
  status: 'ACTIVE'
})

// Função utilitária para transformar dados do formulário
export const transformInvestmentData = (data: InvestmentFormData): Omit<IInvestment, 'id' | 'createdAt' | 'updatedAt' | 'transactions'> => {
  // Validar que o tipo não é string vazia
  if (!data.type || data.type === '') {
    throw new Error('Tipo de investimento é obrigatório')
  }

  return {
    ...data,
    type: data.type as InvestmentTypeKey,
    currentAmount: data.initialAmount,
    appliedAmount: data.initialAmount,
    lastUpdate: new Date().toISOString(),
    maturityDate: data.maturityDate || undefined
  }
}

// Lista de tipos de rendimento válidos
export const YIELD_TYPES = {
  PERCENTAGE: 'Percentual fixo',
  CDI_PERCENTAGE: 'Percentual do CDI',
  SELIC_PERCENTAGE: 'Percentual da Selic',
  FIXED: 'Valor fixo'
} as const

// Lista de status válidos
export const INVESTMENT_STATUS = {
  ACTIVE: 'Ativo',
  MATURED: 'Vencido',
  REDEEMED: 'Resgatado',
  PAUSED: 'Pausado'
} as const