import { ref, computed, watch } from 'vue'
import { supabase } from '../lib/supabase'
import { useAuth } from './useAuth'
import type { IInvestment, IInvestmentTransaction, InvestmentTypeKey } from '../types/investments'

// 🚀 ANTI-DUPLICATION: Global flags to prevent multiple initializations
let investmentsDataLoadingFlag = false
let investmentsDataInitialized = false
let lastInvestmentUserId = ''

export function useSupabaseInvestments() {
  const { user } = useAuth()

  // Reactive state
  const investments = ref<IInvestment[]>([])
  const selectedInvestment = ref<IInvestment | null>(null)
  const filter = ref<'all' | 'RENDA_FIXA' | 'RENDA_VARIAVEL' | 'FUNDOS'>('all')
  const isLoading = ref(true)
  const error = ref<string | null>(null)

  // Load investments from Supabase with anti-duplication protection
  const loadInvestments = async () => {
    if (!user.value?.id) {
      console.warn('💼 [SUPABASE_INVESTMENTS] Usuário não autenticado')
      isLoading.value = false
      return
    }

    // 🚀 ANTI-DUPLICATION: Prevent multiple simultaneous loads
    const currentUserId = user.value.id
    if (investmentsDataLoadingFlag && lastInvestmentUserId === currentUserId) {
      return
    }

    if (investmentsDataInitialized && lastInvestmentUserId === currentUserId) {
      return
    }

    try {
      investmentsDataLoadingFlag = true
      lastInvestmentUserId = currentUserId
      isLoading.value = true
      error.value = null


      const { data, error: fetchError } = await supabase
        .from('investments')
        .select('*')
        .eq('user_id', user.value.id)
        .order('created_at', { ascending: false })

      if (fetchError) {
        throw fetchError
      }

      // Transform data to match IInvestment interface
      investments.value = (data || []).map(investment => ({
        id: investment.id,
        name: investment.name,
        type: investment.type as InvestmentTypeKey,
        institution: investment.institution,
        initialAmount: Number(investment.initial_amount),
        currentAmount: Number(investment.current_amount),
        appliedAmount: Number(investment.applied_amount),
        yieldType: investment.yield_type as 'PERCENTAGE' | 'CDI_PERCENTAGE' | 'SELIC_PERCENTAGE' | 'FIXED',
        yieldRate: Number(investment.yield_rate),
        startDate: investment.start_date,
        maturityDate: investment.maturity_date || undefined,
        lastUpdate: investment.last_update,
        status: investment.status as 'ACTIVE' | 'MATURED' | 'REDEEMED' | 'PAUSED',
        autoReinvest: investment.auto_reinvest || false,
        transactions: investment.transactions || [],
        createdAt: investment.created_at,
        updatedAt: investment.updated_at
      }))


    } catch (err) {
      console.error('❌ [SUPABASE_INVESTMENTS] Erro ao carregar investimentos:', err)
      error.value = err instanceof Error ? err.message : 'Erro desconhecido'
      investmentsDataInitialized = false // Reset flag on error
    } finally {
      isLoading.value = false
      investmentsDataLoadingFlag = false
      if (!error.value) {
        investmentsDataInitialized = true
      }
    }
  }

  // Add investment to Supabase
  const addInvestment = async (investmentData: Omit<IInvestment, 'id' | 'createdAt' | 'updatedAt' | 'transactions'>) => {
    if (!user.value?.id) {
      throw new Error('Usuário não autenticado')
    }

    try {
      const { data, error: insertError } = await supabase
        .from('investments')
        .insert({
          user_id: user.value.id,
          name: investmentData.name,
          type: investmentData.type,
          institution: investmentData.institution,
          initial_amount: investmentData.initialAmount,
          current_amount: investmentData.currentAmount,
          applied_amount: investmentData.appliedAmount,
          yield_type: investmentData.yieldType,
          yield_rate: investmentData.yieldRate,
          start_date: investmentData.startDate,
          maturity_date: investmentData.maturityDate || null,
          last_update: new Date().toISOString(),
          status: investmentData.status,
          auto_reinvest: investmentData.autoReinvest,
          transactions: []
        })
        .select()
        .single()

      if (insertError) {
        throw insertError
      }

      // Add to local state
      const newInvestment: IInvestment = {
        id: data.id,
        name: data.name,
        type: data.type,
        institution: data.institution,
        initialAmount: Number(data.initial_amount),
        currentAmount: Number(data.current_amount),
        appliedAmount: Number(data.applied_amount),
        yieldType: data.yield_type,
        yieldRate: Number(data.yield_rate),
        startDate: data.start_date,
        maturityDate: data.maturity_date || undefined,
        lastUpdate: data.last_update,
        status: data.status,
        autoReinvest: data.auto_reinvest || false,
        transactions: [],
        createdAt: data.created_at,
        updatedAt: data.updated_at
      }

      investments.value.unshift(newInvestment)

      return newInvestment

    } catch (err) {
      console.error('❌ [SUPABASE_INVESTMENTS] Erro ao adicionar investimento:', err)
      throw err
    }
  }

  // Update investment in Supabase
  const updateInvestment = async (investmentId: string, updates: Partial<IInvestment>) => {
    if (!user.value?.id) {
      throw new Error('Usuário não autenticado')
    }

    try {
      const updateData: Record<string, any> = {}

      if (updates.name !== undefined) updateData.name = updates.name
      if (updates.institution !== undefined) updateData.institution = updates.institution
      if (updates.initialAmount !== undefined) updateData.initial_amount = updates.initialAmount
      if (updates.currentAmount !== undefined) updateData.current_amount = updates.currentAmount
      if (updates.appliedAmount !== undefined) updateData.applied_amount = updates.appliedAmount
      if (updates.yieldType !== undefined) updateData.yield_type = updates.yieldType
      if (updates.yieldRate !== undefined) updateData.yield_rate = updates.yieldRate
      if (updates.maturityDate !== undefined) updateData.maturity_date = updates.maturityDate
      if (updates.status !== undefined) updateData.status = updates.status
      if (updates.autoReinvest !== undefined) updateData.auto_reinvest = updates.autoReinvest
      if (updates.transactions !== undefined) updateData.transactions = updates.transactions

      updateData.last_update = new Date().toISOString()
      updateData.updated_at = new Date().toISOString()

      const { error: updateError } = await supabase
        .from('investments')
        .update(updateData)
        .eq('id', investmentId)
        .eq('user_id', user.value.id)

      if (updateError) {
        throw updateError
      }

      // Update local state
      const index = investments.value.findIndex(inv => inv.id === investmentId)
      if (index !== -1) {
        investments.value[index] = { ...investments.value[index], ...updates }
      }


    } catch (err) {
      console.error('❌ [SUPABASE_INVESTMENTS] Erro ao atualizar investimento:', err)
      throw err
    }
  }

  // Delete investment from Supabase
  const deleteInvestment = async (investmentId: string) => {
    if (!user.value?.id) {
      throw new Error('Usuário não autenticado')
    }

    try {
      const { error: deleteError } = await supabase
        .from('investments')
        .delete()
        .eq('id', investmentId)
        .eq('user_id', user.value.id)

      if (deleteError) {
        throw deleteError
      }

      // Remove from local state
      const index = investments.value.findIndex(inv => inv.id === investmentId)
      if (index !== -1) {
        investments.value.splice(index, 1)
      }


    } catch (err) {
      console.error('❌ [SUPABASE_INVESTMENTS] Erro ao remover investimento:', err)
      throw err
    }
  }

  // Add transaction to investment
  const addTransaction = async (investmentId: string, transaction: Omit<IInvestmentTransaction, 'id' | 'investmentId'>) => {
    const investment = investments.value.find(inv => inv.id === investmentId)
    if (!investment) {
      throw new Error('Investimento não encontrado')
    }

    const newTransaction: IInvestmentTransaction = {
      id: Date.now().toString(36) + Math.random().toString(36).substr(2),
      investmentId,
      ...transaction
    }

    const updatedTransactions = [...investment.transactions, newTransaction]

    await updateInvestment(investmentId, {
      transactions: updatedTransactions,
      lastUpdate: new Date().toISOString()
    })

    return newTransaction
  }

  // Computed properties
  const filteredInvestments = computed(() => {
    if (filter.value === 'all') {
      return investments.value
    }

    return investments.value.filter(investment => {
      // This would need INVESTMENT_TYPES mapping to determine category
      // For now, simple string matching
      return investment.type.includes(filter.value)
    })
  })

  const totalPortfolioValue = computed(() => {
    return investments.value.reduce((total, investment) => {
      return total + investment.currentAmount
    }, 0)
  })

  const totalInvested = computed(() => {
    return investments.value.reduce((total, investment) => {
      return total + investment.appliedAmount
    }, 0)
  })

  const totalReturn = computed(() => {
    return totalPortfolioValue.value - totalInvested.value
  })

  const returnPercentage = computed(() => {
    if (totalInvested.value === 0) return 0
    return ((totalReturn.value / totalInvested.value) * 100)
  })

  // Initialize data when user changes (with anti-duplication)
  watch(
    () => user.value?.id,
    (newUserId, oldUserId) => {
      // Reset flags when user changes
      if (newUserId !== oldUserId) {
        investmentsDataInitialized = false
        investmentsDataLoadingFlag = false
        lastInvestmentUserId = ''
      }

      if (newUserId) {
        // Debounce rapid successive calls
        setTimeout(() => {
          if (user.value?.id === newUserId) { // Still the same user
            loadInvestments()
          }
        }, 150) // Slightly different delay to avoid conflicts
      } else {
        investments.value = []
        selectedInvestment.value = null
        investmentsDataInitialized = false
        investmentsDataLoadingFlag = false
        lastInvestmentUserId = ''
      }
    },
    { immediate: true }
  )

  return {
    // State
    investments: computed(() => investments.value),
    selectedInvestment,
    filter,
    isLoading: computed(() => isLoading.value),
    error: computed(() => error.value),

    // Computed
    filteredInvestments,
    totalPortfolioValue,
    totalInvested,
    totalReturn,
    returnPercentage,

    // Methods
    loadInvestments,
    addInvestment,
    updateInvestment,
    deleteInvestment,
    addTransaction
  }
}
