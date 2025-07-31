import { ref, computed, watch } from 'vue';
import type { IInvestment, IInvestmentTransaction, InvestmentTypeKey, IPortfolioAllocation, IProjection } from '../types/investments';
import { INVESTMENT_TYPES } from '../types/investments';
import { 
  calculateCurrentValue, 
  calculateReturnPercentage, 
  calculateAnnualizedReturn, 
  calculateBenchmarkComparison,
  calculateProjections,
  calculateInvestmentProjections,
  calculatePortfolioProjections,
  PROJECTION_INTERVALS
} from '../utils/investmentCalculators';

const STORAGE_KEY = 'investmentData';

export function useInvestments() {
  // Estado reativo
  const investments = ref<IInvestment[]>((() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) return JSON.parse(stored);
    return [];
  })());

  const selectedInvestment = ref<IInvestment | null>(null);
  const filter = ref<'all' | 'RENDA_FIXA' | 'RENDA_VARIAVEL' | 'FUNDOS'>('all');

  // Persistir no localStorage
  watch(
    investments,
    (newData) => {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newData));
    },
    { deep: true }
  );

  // Gerar ID único
  function generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  // Obter data atual
  function getCurrentDate(): string {
    return new Date().toISOString().split('T')[0];
  }

  // CRUD Operations
  function addInvestment(investmentData: Omit<IInvestment, 'id' | 'createdAt' | 'updatedAt' | 'transactions'>): void {
    const now = getCurrentDate();
    
    // Calcular valor atual
    const { currentAmount } = calculateCurrentValue(
      investmentData.initialAmount,
      investmentData.yieldType,
      investmentData.yieldRate,
      investmentData.startDate
    );

    const newInvestment: IInvestment = {
      ...investmentData,
      id: generateId(),
      currentAmount,
      appliedAmount: investmentData.initialAmount,
      lastUpdate: now,
      transactions: [{
        id: generateId(),
        investmentId: '', // Will be set after investment is created
        type: 'DEPOSIT',
        amount: investmentData.initialAmount,
        date: investmentData.startDate,
        description: 'Investimento inicial'
      }],
      createdAt: now,
      updatedAt: now
    };

    // Atualizar o investmentId na transação
    newInvestment.transactions[0].investmentId = newInvestment.id;

    investments.value.push(newInvestment);
  }

  function updateInvestment(id: string, updates: Partial<IInvestment>): void {
    const index = investments.value.findIndex(inv => inv.id === id);
    if (index !== -1) {
      investments.value[index] = {
        ...investments.value[index],
        ...updates,
        updatedAt: getCurrentDate()
      };
    }
  }

  function removeInvestment(id: string): void {
    const index = investments.value.findIndex(inv => inv.id === id);
    if (index !== -1) {
      investments.value.splice(index, 1);
    }
  }

  function getInvestmentById(id: string): IInvestment | undefined {
    return investments.value.find(inv => inv.id === id);
  }

  // Adicionar transação
  function addTransaction(investmentId: string, transaction: Omit<IInvestmentTransaction, 'id' | 'investmentId'>): void {
    const investment = getInvestmentById(investmentId);
    if (investment) {
      const newTransaction: IInvestmentTransaction = {
        ...transaction,
        id: generateId(),
        investmentId
      };

      investment.transactions.push(newTransaction);

      // Atualizar valores se for depósito ou resgate
      if (transaction.type === 'DEPOSIT') {
        investment.appliedAmount += transaction.amount;
      } else if (transaction.type === 'WITHDRAWAL') {
        investment.appliedAmount -= transaction.amount;
      }

      investment.updatedAt = getCurrentDate();
    }
  }

  // Atualizar valores atuais dos investimentos
  function updateCurrentValues(): void {
    investments.value.forEach(investment => {
      const { currentAmount } = calculateCurrentValue(
        investment.initialAmount,
        investment.yieldType,
        investment.yieldRate,
        investment.startDate
      );
      
      investment.currentAmount = currentAmount;
      investment.lastUpdate = getCurrentDate();
    });
  }

  // Computed Properties
  const filteredInvestments = computed(() => {
    if (filter.value === 'all') {
      return investments.value;
    }
    
    return investments.value.filter(investment => {
      const investmentType = INVESTMENT_TYPES[investment.type];
      return investmentType.category === filter.value;
    });
  });

  const totalPortfolioValue = computed(() => {
    return investments.value.reduce((total, investment) => {
      return total + investment.currentAmount;
    }, 0);
  });

  const totalInvested = computed(() => {
    return investments.value.reduce((total, investment) => {
      return total + investment.appliedAmount;
    }, 0);
  });

  const totalYield = computed(() => {
    return totalPortfolioValue.value - totalInvested.value;
  });

  const totalYieldPercentage = computed(() => {
    if (totalInvested.value === 0) return 0;
    return (totalYield.value / totalInvested.value) * 100;
  });

  const portfolioAllocation = computed((): IPortfolioAllocation[] => {
    const allocation: { [key: string]: number } = {};
    const categoryColors = {
      'RENDA_FIXA': '#22c55e',
      'RENDA_VARIAVEL': '#3b82f6',
      'FUNDOS': '#f59e0b'
    };

    // Agrupar por categoria
    investments.value.forEach(investment => {
      const category = INVESTMENT_TYPES[investment.type].category;
      allocation[category] = (allocation[category] || 0) + investment.currentAmount;
    });

    // Converter para array com percentuais
    return Object.entries(allocation).map(([category, amount]) => ({
      category: category.replace('_', ' '),
      amount,
      percentage: totalPortfolioValue.value > 0 ? (amount / totalPortfolioValue.value) * 100 : 0,
      color: categoryColors[category as keyof typeof categoryColors] || '#6b7280'
    }));
  });

  const monthlyPerformance = computed(() => {
    const performance: { [key: string]: number } = {};
    
    investments.value.forEach(investment => {
      const startDate = new Date(investment.startDate);
      const monthKey = `${startDate.getFullYear()}-${String(startDate.getMonth() + 1).padStart(2, '0')}`;
      
      const yieldAmount = investment.currentAmount - investment.appliedAmount;
      performance[monthKey] = (performance[monthKey] || 0) + yieldAmount;
    });

    return performance;
  });

  const activeInvestments = computed(() => {
    return investments.value.filter(inv => inv.status === 'ACTIVE');
  });

  const maturedInvestments = computed(() => {
    return investments.value.filter(inv => inv.status === 'MATURED');
  });

  // 🚀 NOVA FUNCIONALIDADE: Projeções de rendimento da carteira
  const portfolioProjections = computed((): IProjection[] => {
    if (investments.value.length === 0) return [];
    return calculatePortfolioProjections(investments.value);
  });

  // Funções de filtro
  function setFilter(newFilter: typeof filter.value): void {
    filter.value = newFilter;
  }

  function clearFilter(): void {
    filter.value = 'all';
  }

  // Funções auxiliares
  function getInvestmentTypeIcon(type: InvestmentTypeKey): string {
    return INVESTMENT_TYPES[type].icon;
  }

  function getInvestmentTypeName(type: InvestmentTypeKey): string {
    return INVESTMENT_TYPES[type].name;
  }

  function getInvestmentYieldAmount(investment: IInvestment): number {
    return investment.currentAmount - investment.appliedAmount;
  }

  function getInvestmentYieldPercentage(investment: IInvestment): number {
    if (investment.appliedAmount === 0) return 0;
    return calculateReturnPercentage(investment.appliedAmount, investment.currentAmount);
  }

  // 🚀 NOVA FUNCIONALIDADE: Obter projeções de um investimento específico
  function getInvestmentProjections(investment: IInvestment): IProjection[] {
    return calculateInvestmentProjections(investment);
  }

  // 🚀 NOVA FUNCIONALIDADE: Obter projeção de um investimento em período específico
  function getInvestmentProjectionByPeriod(investment: IInvestment, period: string): IProjection | null {
    const projections = getInvestmentProjections(investment);
    return projections.find(p => p.period === period) || null;
  }

  // 🚀 NOVA FUNCIONALIDADE: Simular novo investimento (sem persistir)
  function simulateInvestment(
    amount: number,
    yieldType: string,
    yieldRate: number
  ): IProjection[] {
    return calculateProjections(amount, yieldType, yieldRate);
  }

  // Funções de análise
  function getBestPerformer(): IInvestment | null {
    if (investments.value.length === 0) return null;
    
    return investments.value.reduce((best, current) => {
      const currentPercentage = getInvestmentYieldPercentage(current);
      const bestPercentage = getInvestmentYieldPercentage(best);
      return currentPercentage > bestPercentage ? current : best;
    });
  }

  function getWorstPerformer(): IInvestment | null {
    if (investments.value.length === 0) return null;
    
    return investments.value.reduce((worst, current) => {
      const currentPercentage = getInvestmentYieldPercentage(current);
      const worstPercentage = getInvestmentYieldPercentage(worst);
      return currentPercentage < worstPercentage ? current : worst;
    });
  }

  // 🚀 NOVA FUNCIONALIDADE: Obter melhor projeção (maior rendimento)
  function getBestProjection(period: string = '1a'): { investment: IInvestment; projection: IProjection } | null {
    if (investments.value.length === 0) return null;
    
    let bestResult: { investment: IInvestment; projection: IProjection } | null = null;
    let bestYield = -Infinity;

    investments.value.forEach(investment => {
      const projection = getInvestmentProjectionByPeriod(investment, period);
      if (projection && projection.yieldPercentage > bestYield) {
        bestYield = projection.yieldPercentage;
        bestResult = { investment, projection };
      }
    });

    return bestResult;
  }

  // Limpar todos os dados
  function clearAllData(): void {
    investments.value = [];
  }

  // Importar dados
  function importData(data: IInvestment[]): void {
    investments.value = data;
  }

  // Export para API externa (futura funcionalidade)
  function exportData(): IInvestment[] {
    return investments.value;
  }

  return {
    // State
    investments,
    selectedInvestment,
    filter,
    
    // Computed
    filteredInvestments,
    totalPortfolioValue,
    totalInvested,
    totalYield,
    totalYieldPercentage,
    portfolioAllocation,
    monthlyPerformance,
    activeInvestments,
    maturedInvestments,
    portfolioProjections, // 🚀 NOVA
    
    // Methods
    addInvestment,
    updateInvestment,
    removeInvestment,
    getInvestmentById,
    addTransaction,
    updateCurrentValues,
    setFilter,
    clearFilter,
    
    // Helpers
    getInvestmentTypeIcon,
    getInvestmentTypeName,
    getInvestmentYieldAmount,
    getInvestmentYieldPercentage,
    getBestPerformer,
    getWorstPerformer,
    
    // 🚀 NOVAS FUNCIONALIDADES: Projeções
    getInvestmentProjections,
    getInvestmentProjectionByPeriod,
    simulateInvestment,
    getBestProjection,
    
    // Data management
    clearAllData,
    importData,
    exportData
  };
} 