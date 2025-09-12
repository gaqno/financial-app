<template>
  <div class="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-600 overflow-hidden theme-transition">
    <!-- Header -->
    <div @click="toggleCollapse"
      class="bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-900 dark:to-indigo-900 border-b border-purple-200 dark:border-purple-700 p-4 cursor-pointer hover:from-purple-100 hover:to-indigo-100 dark:hover:from-purple-800 dark:hover:to-indigo-800 transition-all duration-200">
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-3">
          <button class="text-purple-600 dark:text-purple-400 hover:text-purple-800 dark:hover:text-purple-300 transition-colors">
            <i :class="isCollapsed ? 'fas fa-chevron-right' : 'fas fa-chevron-down'"
              class="text-sm transition-transform duration-200"></i>
          </button>
          <div>
            <h2 class="text-lg font-semibold text-purple-900 dark:text-purple-200">
              <i class="fas fa-chart-line mr-2"></i>
              Projeção Anual {{ currentYear }}
            </h2>
            <p class="text-sm text-purple-700 dark:text-purple-300">
              Baseado nos últimos {{ monthsWithData }} meses de dados
            </p>
          </div>
        </div>

        <!-- Quick Stats -->
        <div class="text-right">
          <div class="text-lg font-bold" :class="projectedBalance < 0 ? 'text-red-600' : 'text-green-600'">
            {{ formatCurrency(projectedBalance) }}
          </div>
          <div class="text-xs text-purple-700 dark:text-purple-300">
            Projeção para dezembro
          </div>
        </div>
      </div>
    </div>

    <!-- Content -->
    <Transition name="projection-content" enter-active-class="transition-all duration-300 ease-out"
      enter-from-class="transform -translate-y-2 opacity-0" enter-to-class="transform translate-y-0 opacity-100"
      leave-active-class="transition-all duration-200 ease-in" leave-from-class="transform translate-y-0 opacity-100"
      leave-to-class="transform -translate-y-2 opacity-0">
      <div v-if="!isCollapsed" class="p-6 space-y-6">
        <!-- Monthly Averages -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div class="bg-green-50 dark:bg-green-900 rounded-lg p-4 border border-green-200 dark:border-green-700">
            <div class="flex items-center gap-2 mb-2">
              <i class="fas fa-arrow-up text-green-600 dark:text-green-400"></i>
              <span class="text-sm font-medium text-green-800 dark:text-green-300">Receitas Médias</span>
            </div>
            <div class="text-xl font-bold text-green-700 dark:text-green-200">
              {{ formatCurrency(averageIncome) }}
            </div>
            <div class="text-xs text-green-600 dark:text-green-400 mt-1">
              por mês
            </div>
          </div>

          <div class="bg-red-50 dark:bg-red-900 rounded-lg p-4 border border-red-200 dark:border-red-700">
            <div class="flex items-center gap-2 mb-2">
              <i class="fas fa-arrow-down text-red-600 dark:text-red-400"></i>
              <span class="text-sm font-medium text-red-800 dark:text-red-300">Despesas Médias</span>
            </div>
            <div class="text-xl font-bold text-red-700 dark:text-red-200">
              {{ formatCurrency(Math.abs(averageExpenses)) }}
            </div>
            <div class="text-xs text-red-600 dark:text-red-400 mt-1">
              por mês
            </div>
          </div>

          <div class="bg-blue-50 dark:bg-blue-900 rounded-lg p-4 border border-blue-200 dark:border-blue-700">
            <div class="flex items-center gap-2 mb-2">
              <i class="fas fa-chart-line text-blue-600 dark:text-blue-400"></i>
              <span class="text-sm font-medium text-blue-800 dark:text-blue-300">Saldo Médio</span>
            </div>
            <div class="text-xl font-bold" :class="averageBalance < 0 ? 'text-red-700 dark:text-red-300' : 'text-green-700 dark:text-green-300'">
              {{ formatCurrency(averageBalance) }}
            </div>
            <div class="text-xs text-blue-600 dark:text-blue-400 mt-1">
              por mês
            </div>
          </div>
        </div>

        <!-- Yearly Projection Table -->
        <div class="overflow-x-auto">
          <table class="w-full">
            <thead>
              <tr class="border-b border-gray-200 dark:border-slate-600">
                <th class="text-left py-2 px-3 text-sm font-medium text-gray-600 dark:text-slate-400">Mês</th>
                <th class="text-right py-2 px-3 text-sm font-medium text-gray-600 dark:text-slate-400">Receitas Proj.</th>
                <th class="text-right py-2 px-3 text-sm font-medium text-gray-600 dark:text-slate-400">Despesas Proj.</th>
                <th class="text-right py-2 px-3 text-sm font-medium text-gray-600 dark:text-slate-400">Saldo Mensal</th>
                <th class="text-right py-2 px-3 text-sm font-medium text-gray-600 dark:text-slate-400">Saldo Acumulado</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="month in yearlyProjection" :key="month.month" :class="[
                month.isActual ? 'bg-gray-50 dark:bg-slate-700' : 'bg-purple-50/30 dark:bg-purple-900/30',
                'border-b border-gray-100 dark:border-slate-600'
              ]">
                <td class="py-2 px-3 text-sm">
                  <div class="flex items-center gap-2">
                    <span class="font-medium text-gray-900 dark:text-slate-100">{{ month.monthName }}</span>
                    <span v-if="month.isActual" class="text-xs bg-gray-200 dark:bg-slate-600 text-gray-700 dark:text-slate-300 px-1 rounded">
                      Real
                    </span>
                    <span v-else class="text-xs bg-purple-200 dark:bg-purple-700 text-purple-700 dark:text-purple-300 px-1 rounded">
                      Projeção
                    </span>
                  </div>
                </td>
                <td class="py-2 px-3 text-sm text-right font-medium text-green-600">
                  {{ formatCurrency(month.income) }}
                </td>
                <td class="py-2 px-3 text-sm text-right font-medium text-red-600">
                  {{ formatCurrency(Math.abs(month.expenses)) }}
                </td>
                <td class="py-2 px-3 text-sm text-right font-semibold"
                  :class="month.balance < 0 ? 'text-red-600' : 'text-green-600'">
                  {{ formatCurrency(month.balance) }}
                </td>
                <td class="py-2 px-3 text-sm text-right font-bold"
                  :class="month.cumulativeBalance < 0 ? 'text-red-600' : 'text-green-600'">
                  {{ formatCurrency(month.cumulativeBalance) }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Category Projections -->
        <div v-if="categoryProjections.length > 0">
          <h3 class="text-lg font-semibold text-gray-900 dark:text-slate-100 mb-3">
            <i class="fas fa-chart-pie mr-2 text-purple-600 dark:text-purple-400"></i>
            Projeção por Categoria
          </h3>
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            <div v-for="category in categoryProjections" :key="category.name"
              class="bg-gray-50 dark:bg-slate-700 rounded-lg p-3 border border-gray-200 dark:border-slate-600">
              <div class="flex items-center gap-2 mb-2">
                <span>{{ category.icon }}</span>
                <span class="font-medium text-gray-700 dark:text-slate-300">{{ category.name }}</span>
              </div>
              <div class="space-y-1">
                <div class="flex justify-between text-sm">
                  <span class="text-gray-600 dark:text-slate-400">Mensal médio:</span>
                  <span class="font-semibold" :class="category.monthlyAverage < 0 ? 'text-red-600' : 'text-green-600'">
                    {{ formatCurrency(category.monthlyAverage) }}
                  </span>
                </div>
                <div class="flex justify-between text-sm">
                  <span class="text-gray-600 dark:text-slate-400">Projeção anual:</span>
                  <span class="font-bold" :class="category.yearlyProjection < 0 ? 'text-red-600' : 'text-green-600'">
                    {{ formatCurrency(category.yearlyProjection) }}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useFinanceTable } from '../../../composables/finance/useFinanceTable'
import { useCategoryDetection } from '../../../composables/useCategoryDetection'
import type { IFinanceRecord } from '../../../types/finance'

interface Props {
  records: IFinanceRecord[]
}

const props = defineProps<Props>()

// Use composables
const { formatCurrency } = useFinanceTable()
const { getCategoryIcon } = useCategoryDetection()

// Collapse state
const isCollapsed = ref(true)

// Current year
const currentYear = new Date().getFullYear()

// Group records by month
const monthlyData = computed(() => {
  const groups = new Map<string, IFinanceRecord[]>()

  props.records.forEach(record => {
    const date = new Date(record.Data)
    const monthKey = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`

    if (!groups.has(monthKey)) {
      groups.set(monthKey, [])
    }
    groups.get(monthKey)!.push(record)
  })

  return Array.from(groups.entries())
    .map(([monthKey, records]) => {
      const [year, month] = monthKey.split('-').map(Number)
      const income = records.filter(r => r.Tipo === 'Receita').reduce((sum, r) => sum + r.Valor, 0)
      const expenses = records.filter(r => r.Tipo === 'Despesa').reduce((sum, r) => sum + r.Valor, 0)

      return {
        monthKey,
        year,
        month,
        monthName: new Date(year, month - 1).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' }),
        income,
        expenses,
        balance: income + expenses,
        records
      }
    })
    .sort((a, b) => a.monthKey.localeCompare(b.monthKey))
})

// Calculate averages from existing data
const monthsWithData = computed(() => monthlyData.value.length)

const averageIncome = computed(() => {
  if (monthsWithData.value === 0) return 0
  return monthlyData.value.reduce((sum, month) => sum + month.income, 0) / monthsWithData.value
})

const averageExpenses = computed(() => {
  if (monthsWithData.value === 0) return 0
  return monthlyData.value.reduce((sum, month) => sum + month.expenses, 0) / monthsWithData.value
})

const averageBalance = computed(() => averageIncome.value + averageExpenses.value)

// Generate yearly projection
const yearlyProjection = computed(() => {
  const months = []
  let cumulativeBalance = 0

  // Add actual months data
  const actualMonthsMap = new Map(monthlyData.value.map(m => [m.month, m]))

  for (let month = 1; month <= 12; month++) {
    const actualData = actualMonthsMap.get(month)

    if (actualData) {
      // Use actual data
      cumulativeBalance += actualData.balance
      months.push({
        month,
        monthName: actualData.monthName,
        income: actualData.income,
        expenses: actualData.expenses,
        balance: actualData.balance,
        cumulativeBalance,
        isActual: true
      })
    } else {
      // Use projected data
      const projectedIncome = averageIncome.value
      const projectedExpenses = averageExpenses.value
      const projectedBalance = projectedIncome + projectedExpenses
      cumulativeBalance += projectedBalance

      months.push({
        month,
        monthName: new Date(currentYear, month - 1).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' }),
        income: projectedIncome,
        expenses: projectedExpenses,
        balance: projectedBalance,
        cumulativeBalance,
        isActual: false
      })
    }
  }

  return months
})

const projectedBalance = computed(() => {
  const lastMonth = yearlyProjection.value[yearlyProjection.value.length - 1]
  return lastMonth?.cumulativeBalance || 0
})

// Category projections
const categoryProjections = computed(() => {
  const categoryMap = new Map<string, { total: number; count: number }>()

  props.records.forEach(record => {
    const category = record.Categoria || 'Sem categoria'
    const current = categoryMap.get(category) || { total: 0, count: 0 }
    categoryMap.set(category, {
      total: current.total + record.Valor,
      count: current.count + 1
    })
  })

  return Array.from(categoryMap.entries())
    .map(([name, data]) => ({
      name,
      icon: getCategoryIcon(name),
      monthlyAverage: monthsWithData.value > 0 ? data.total / monthsWithData.value : 0,
      yearlyProjection: monthsWithData.value > 0 ? (data.total / monthsWithData.value) * 12 : 0
    }))
    .sort((a, b) => Math.abs(b.yearlyProjection) - Math.abs(a.yearlyProjection))
    .slice(0, 6) // Show top 6 categories
})

// Methods
const toggleCollapse = () => {
  isCollapsed.value = !isCollapsed.value
}
</script>

<style scoped>
/* Projection content transitions */
.projection-content-enter-active,
.projection-content-leave-active {
  overflow: hidden;
}

.projection-content-enter-from,
.projection-content-leave-to {
  max-height: 0;
}

.projection-content-enter-to,
.projection-content-leave-from {
  max-height: 1000px;
}
</style>