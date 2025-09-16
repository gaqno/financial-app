import { ref, computed, watch } from 'vue';
import type {
  IInvestment,
  IInvestmentTransaction,
  InvestmentTypeKey,
  IPortfolioAllocation,
  IProjection,
} from '../types/investments';
import { INVESTMENT_TYPES } from '../types/investments';
import {
  calculateReturnPercentage,
  calculateAnnualizedReturn,
  calculateBenchmarkComparison,
  calculateProjections,
  calculateInvestmentProjections,
  calculatePortfolioProjections,
  PROJECTION_INTERVALS,
} from '../utils/investmentCalculators';
import { useSupabaseInvestments } from './useSupabaseInvestments';

export function useInvestments() {
  // Use Supabase instead of localStorage
  const {
    investments: supabaseInvestments,
    selectedInvestment: supabaseSelectedInvestment,
    filter: supabaseFilter,
    filteredInvestments: supabaseFilteredInvestments,
    totalPortfolioValue: supabaseTotalPortfolioValue,
    totalInvested: supabaseTotalInvested,
    totalReturn: supabaseTotalReturn,
    returnPercentage: supabaseReturnPercentage,
    isLoading,
    addInvestment: addSupabaseInvestment,
    updateInvestment: updateSupabaseInvestment,
    deleteInvestment: deleteSupabaseInvestment,
    addTransaction: addSupabaseTransaction,
  } = useSupabaseInvestments();

  // Create reactive refs that sync with Supabase
  const investments = ref<IInvestment[]>([]);
  const selectedInvestment = ref<IInvestment | null>(null);
  const filter = ref<'all' | 'RENDA_FIXA' | 'RENDA_VARIAVEL' | 'FUNDOS'>('all');

  // Sync with Supabase data
  watch(
    supabaseInvestments,
    (newInvestments) => {
      investments.value = [...newInvestments];
    },
    { immediate: true }
  );

  watch(
    supabaseSelectedInvestment,
    (newSelected) => {
      selectedInvestment.value = newSelected;
    },
    { immediate: true }
  );

  watch(
    supabaseFilter,
    (newFilter) => {
      filter.value = newFilter;
    },
    { immediate: true }
  );

  // Gerar ID único (legacy function, now handled by Supabase)
  function generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  // Obter data atual
  function getCurrentDate(): string {
    return new Date().toISOString().split('T')[0];
  }

  // CRUD Operations - Updated to use Supabase
  const addInvestment = async (
    investmentData: Omit<IInvestment, 'id' | 'createdAt' | 'updatedAt' | 'transactions'>
  ): Promise<IInvestment> => {
    return await addSupabaseInvestment(investmentData);
  };

  const updateInvestment = async (investmentId: string, updates: Partial<IInvestment>): Promise<void> => {
    await updateSupabaseInvestment(investmentId, updates);
  };

  const deleteInvestment = async (investmentId: string): Promise<void> => {
    await deleteSupabaseInvestment(investmentId);
  };

  const addTransaction = async (
    investmentId: string,
    transaction: Omit<IInvestmentTransaction, 'id' | 'investmentId'>
  ): Promise<IInvestmentTransaction> => {
    return await addSupabaseTransaction(investmentId, transaction);
  };

  // Calculated properties using Supabase data
  const totalPortfolioValue = computed(() => supabaseTotalPortfolioValue.value);
  const totalInvested = computed(() => supabaseTotalInvested.value);
  const totalReturn = computed(() => supabaseTotalReturn.value);
  const returnPercentage = computed(() => supabaseReturnPercentage.value);

  // Filtered investments
  const filteredInvestments = computed(() => supabaseFilteredInvestments.value);

  // Performance metrics for individual investment
  function getInvestmentMetrics(investment: IInvestment) {
    const returnValue = investment.currentAmount - investment.appliedAmount;
    const returnPercentage = investment.appliedAmount > 0 ? (returnValue / investment.appliedAmount) * 100 : 0;

    const annualizedReturn = calculateAnnualizedReturn(
      investment.appliedAmount,
      investment.currentAmount,
      investment.startDate
    );

    const benchmarkComparison = calculateBenchmarkComparison(
      returnPercentage,
      100 // CDI benchmark placeholder
    );

    return {
      totalReturn: returnValue,
      percentReturn: returnPercentage,
      annualizedReturn,
      benchmarkComparison,
    };
  }

  // Portfolio allocation by category
  const portfolioAllocation = computed((): IPortfolioAllocation[] => {
    const categoryTotals = investments.value.reduce(
      (acc, investment) => {
        const type = INVESTMENT_TYPES[investment.type];

        // ✅ DEFENSIVE PROGRAMMING: Handle undefined investment types
        if (!type) {
          console.warn(`🚨 [INVESTMENTS] Unknown investment type: ${investment.type}`, investment);
          return acc; // Skip this investment if type is not found
        }

        const category = type.category;

        if (!acc[category]) {
          acc[category] = 0;
        }
        acc[category] += investment.currentAmount;

        return acc;
      },
      {} as Record<string, number>
    );

    const total = Object.values(categoryTotals).reduce((sum, value) => sum + value, 0);

    return Object.entries(categoryTotals).map(([category, amount], index) => {
      const colors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];
      return {
        category,
        amount,
        percentage: total > 0 ? (amount / total) * 100 : 0,
        color: colors[index % colors.length],
      };
    });
  });

  // Investment projections
  function getInvestmentProjections(investment: IInvestment): IProjection[] {
    return calculateInvestmentProjections(investment);
  }

  // Portfolio projections
  function getPortfolioProjections(): IProjection[] {
    return calculatePortfolioProjections(investments.value);
  }

  // 🚀 NOVA FUNCIONALIDADE: Simular novo investimento (sem persistir)
  function simulateInvestment(amount: number, yieldType: string, yieldRate: number): IProjection[] {
    return calculateProjections(amount, yieldType, yieldRate);
  }

  // Filter functions
  function setFilter(newFilter: typeof filter.value): void {
    filter.value = newFilter;
  }

  function clearFilter(): void {
    filter.value = 'all';
  }

  // Helper functions for investment display
  function getInvestmentTypeIcon(type: InvestmentTypeKey): string {
    return INVESTMENT_TYPES[type].icon;
  }

  function getInvestmentYieldAmount(investment: IInvestment): number {
    return investment.currentAmount - investment.appliedAmount;
  }

  function getInvestmentYieldPercentage(investment: IInvestment): number {
    if (investment.appliedAmount === 0) return 0;
    return calculateReturnPercentage(investment.appliedAmount, investment.currentAmount);
  }

  return {
    // State
    investments,
    selectedInvestment,
    filter,
    isLoading,

    // Computed
    filteredInvestments,
    totalPortfolioValue,
    totalInvested,
    totalReturn,
    returnPercentage,
    portfolioAllocation,

    // Methods
    addInvestment,
    updateInvestment,
    deleteInvestment,
    addTransaction,
    getInvestmentMetrics,
    getInvestmentProjections,
    getPortfolioProjections,
    simulateInvestment,
    setFilter,
    clearFilter,
    getInvestmentTypeIcon,
    getInvestmentYieldAmount,
    getInvestmentYieldPercentage,

    // Utils
    generateId,
    getCurrentDate,

    // Constants
    INVESTMENT_TYPES,
    PROJECTION_INTERVALS,
  };
}
