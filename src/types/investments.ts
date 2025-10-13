// Tipos de investimento disponíveis
export const INVESTMENT_TYPES = {
  CDB: { name: 'CDB', category: 'RENDA_FIXA', icon: '🏦', description: 'Certificado de Depósito Bancário' },
  CDI: { name: 'CDI', category: 'RENDA_FIXA', icon: '📊', description: 'Certificado de Depósito Interbancário' },
  TESOURO_SELIC: { name: 'Tesouro Selic', category: 'RENDA_FIXA', icon: '🏛️', description: 'Tesouro Nacional Selic' },
  TESOURO_PREFIXADO: {
    name: 'Tesouro Prefixado',
    category: 'RENDA_FIXA',
    icon: '📈',
    description: 'Tesouro Nacional Prefixado',
  },
  TESOURO_IPCA: { name: 'Tesouro IPCA+', category: 'RENDA_FIXA', icon: '🛡️', description: 'Tesouro Nacional IPCA+' },
  // Novos tipos encontrados no banco de dados
  'Tesouro Direto': { name: 'Tesouro Direto', category: 'RENDA_FIXA', icon: '🏛️', description: 'Tesouro Direto (genérico)' },
  'Poupança': { name: 'Poupança', category: 'RENDA_FIXA', icon: '💰', description: 'Caderneta de Poupança' },
  LCI_LCA: {
    name: 'LCI/LCA',
    category: 'RENDA_FIXA',
    icon: '🏠',
    description: 'Letra de Crédito Imobiliário/Agronegócio',
  },
  ACOES: { name: 'Ações', category: 'RENDA_VARIAVEL', icon: '📊', description: 'Ações de empresas' },
  FIIS: { name: 'FIIs', category: 'RENDA_VARIAVEL', icon: '🏢', description: 'Fundos de Investimento Imobiliário' },
  FUNDOS: { name: 'Fundos de Investimento', category: 'FUNDOS', icon: '💼', description: 'Fundos de Investimento' },
  CRIPTO: { name: 'Criptomoedas', category: 'RENDA_VARIAVEL', icon: '₿', description: 'Criptomoedas' },
} as const;

export type InvestmentTypeKey = keyof typeof INVESTMENT_TYPES;

export interface IInvestmentType {
  name: string;
  category: 'RENDA_FIXA' | 'RENDA_VARIAVEL' | 'FUNDOS';
  icon: string;
  description: string;
}

// Transações de investimento
export interface IInvestmentTransaction {
  id: string;
  investmentId: string;
  type: 'DEPOSIT' | 'WITHDRAWAL' | 'YIELD' | 'TAX' | 'FEE';
  amount: number;
  date: string;
  description: string;
  taxAmount?: number;
}

// Interface principal do investimento
export interface IInvestment {
  id: string;
  name: string;
  type: InvestmentTypeKey;
  institution: string;

  // Valores financeiros
  initialAmount: number;
  currentAmount: number;
  appliedAmount: number;

  // Rendimento
  yieldType: 'PERCENTAGE' | 'CDI_PERCENTAGE' | 'SELIC_PERCENTAGE' | 'FIXED';
  yieldRate: number;

  // Datas
  startDate: string;
  maturityDate?: string;
  lastUpdate: string;

  // Status
  status: 'ACTIVE' | 'MATURED' | 'REDEEMED' | 'PAUSED';

  // Configurações
  autoReinvest: boolean;

  // Histórico
  transactions: IInvestmentTransaction[];

  // Metadados
  createdAt: string;
  updatedAt: string;
}

// Projeção de rendimento
export interface IProjection {
  period: string;
  days: number;
  grossValue: number;
  yieldAmount: number;
  irAmount: number;
  iofAmount: number;
  netValue: number;
  netYield: number;
  yieldPercentage: number;
  annualizedReturn: number;
}

// Métricas de performance
export interface IPerformanceMetrics {
  totalReturn: number;
  percentReturn: number;
  annualizedReturn: number;
  volatility: number;
  sharpeRatio: number;
  maxDrawdown: number;
  benchmarkComparison: number;
}

// Alocação da carteira
export interface IPortfolioAllocation {
  category: string;
  amount: number;
  percentage: number;
  color: string;
}

// Dados para gráficos
export interface IChartData {
  labels: string[];
  datasets: {
    label: string;
    data: number[];
    backgroundColor?: string | string[];
    borderColor?: string;
    borderWidth?: number;
  }[];
}
