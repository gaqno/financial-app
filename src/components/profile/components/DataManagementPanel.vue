<template>
  <div class="space-y-6">
    <!-- Estatísticas dos Dados -->
    <div class="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-600">
      <div class="px-6 py-4 border-b border-gray-200 dark:border-slate-600">
        <h3 class="text-lg font-semibold text-gray-900 dark:text-slate-100 flex items-center gap-2">
          📊 Resumo dos Seus Dados
        </h3>
        <p class="text-sm text-gray-600 dark:text-slate-400 mt-1">
          Veja um resumo de todos os seus dados no por.quinho
        </p>
      </div>

      <div class="p-6">
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
          <!-- Total de Transações -->
          <div class="text-center p-4 bg-pink-50 dark:bg-pink-900/20 rounded-lg">
            <div class="text-2xl font-bold text-pink-600 dark:text-pink-400">
              {{ dataStats.totalTransactions }}
            </div>
            <div class="text-sm text-gray-600 dark:text-slate-400">Transações</div>
          </div>

          <!-- Total de Categorias -->
          <div class="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <div class="text-2xl font-bold text-blue-600 dark:text-blue-400">
              {{ dataStats.totalCategories }}
            </div>
            <div class="text-sm text-gray-600 dark:text-slate-400">Categorias</div>
          </div>

          <!-- Receitas -->
          <div class="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
            <div class="text-2xl font-bold text-green-600 dark:text-green-400">
              {{ dataStats.totalRevenue }}
            </div>
            <div class="text-sm text-gray-600 dark:text-slate-400">Receitas</div>
          </div>

          <!-- Despesas -->
          <div class="text-center p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
            <div class="text-2xl font-bold text-red-600 dark:text-red-400">
              {{ dataStats.totalExpenses }}
            </div>
            <div class="text-sm text-gray-600 dark:text-slate-400">Despesas</div>
          </div>
        </div>

        <!-- Informações Adicionais -->
        <div class="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600 dark:text-slate-400">
          <div class="flex items-center gap-2">
            <i class="fas fa-calendar text-pink-500"></i>
            <span>Período: {{ formatDateRange() }}</span>
          </div>
          <div class="flex items-center gap-2">
            <i class="fas fa-database text-pink-500"></i>
            <span>Tamanho: {{ dataStats.storageSize }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Exportar Dados -->
    <div class="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-600">
      <div class="px-6 py-4 border-b border-gray-200 dark:border-slate-600">
        <h3 class="text-lg font-semibold text-gray-900 dark:text-slate-100 flex items-center gap-2">
          📤 Exportar Dados
        </h3>
        <p class="text-sm text-gray-600 dark:text-slate-400 mt-1">
          Faça backup de todas as suas informações financeiras
        </p>
      </div>

      <div class="p-6">
        <!-- Opções de Exportação -->
        <div class="space-y-4">
          <!-- Formato -->
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
              Formato do Arquivo
            </label>
            <div class="grid grid-cols-2 gap-3">
              <label class="relative">
                <input v-model="exportOptions.format" type="radio" value="csv" class="sr-only peer" />
                <div
                  class="p-3 border border-gray-200 dark:border-slate-600 rounded-lg cursor-pointer peer-checked:border-pink-500 peer-checked:bg-pink-50 dark:peer-checked:bg-pink-900/20 transition-colors">
                  <div class="flex items-center gap-2">
                    <i class="fas fa-file-csv text-green-500"></i>
                    <div>
                      <p class="font-medium text-gray-900 dark:text-slate-100">CSV</p>
                      <p class="text-xs text-gray-500 dark:text-slate-400">Excel, Sheets</p>
                    </div>
                  </div>
                </div>
              </label>

              <label class="relative">
                <input v-model="exportOptions.format" type="radio" value="xlsx" class="sr-only peer" />
                <div
                  class="p-3 border border-gray-200 dark:border-slate-600 rounded-lg cursor-pointer peer-checked:border-pink-500 peer-checked:bg-pink-50 dark:peer-checked:bg-pink-900/20 transition-colors">
                  <div class="flex items-center gap-2">
                    <i class="fas fa-file-excel text-green-600"></i>
                    <div>
                      <p class="font-medium text-gray-900 dark:text-slate-100">Excel</p>
                      <p class="text-xs text-gray-500 dark:text-slate-400">XLSX</p>
                    </div>
                  </div>
                </div>
              </label>
            </div>
          </div>

          <!-- Período -->
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
              Período
            </label>
            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="block text-xs text-gray-500 dark:text-slate-400 mb-1">Data Inicial</label>
                <input v-model="exportOptions.dateRange.start" type="date"
                  class="w-full px-3 py-2 border border-gray-300 dark:border-slate-500 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500 dark:bg-slate-700 dark:text-slate-100 transition-colors" />
              </div>
              <div>
                <label class="block text-xs text-gray-500 dark:text-slate-400 mb-1">Data Final</label>
                <input v-model="exportOptions.dateRange.end" type="date"
                  class="w-full px-3 py-2 border border-gray-300 dark:border-slate-500 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500 dark:bg-slate-700 dark:text-slate-100 transition-colors" />
              </div>
            </div>
          </div>

          <!-- Incluir -->
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
              Incluir nos Dados
            </label>
            <div class="space-y-2">
              <label class="flex items-center gap-2">
                <input v-model="exportOptions.includeCategories" type="checkbox"
                  class="rounded border-gray-300 text-pink-600 focus:ring-pink-500" />
                <span class="text-sm text-gray-700 dark:text-slate-300">Categorias</span>
              </label>
              <label class="flex items-center gap-2">
                <input v-model="exportOptions.includeRecurrence" type="checkbox"
                  class="rounded border-gray-300 text-pink-600 focus:ring-pink-500" />
                <span class="text-sm text-gray-700 dark:text-slate-300">Transações Recorrentes</span>
              </label>
              <label class="flex items-center gap-2">
                <input v-model="exportOptions.includeInvestments" type="checkbox"
                  class="rounded border-gray-300 text-pink-600 focus:ring-pink-500" />
                <span class="text-sm text-gray-700 dark:text-slate-300">Investimentos</span>
              </label>
            </div>
          </div>
        </div>

        <!-- Botão de Exportar -->
        <div class="mt-6">
          <button @click="exportData" :disabled="isExporting"
            class="w-full bg-gradient-to-r from-green-500 to-emerald-500 text-white py-3 px-4 rounded-lg hover:from-green-600 hover:to-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2">
            <i v-if="isExporting" class="fas fa-spinner fa-spin"></i>
            <i v-else class="fas fa-download"></i>
            {{ isExporting ? 'Exportando...' : 'Exportar Dados' }}
          </button>

          <!-- Progresso -->
          <div v-if="isExporting" class="mt-3">
            <div class="flex justify-between text-sm text-gray-600 dark:text-slate-400 mb-1">
              <span>Progresso</span>
              <span>{{ exportProgress }}%</span>
            </div>
            <div class="w-full bg-gray-200 dark:bg-slate-600 rounded-full h-2">
              <div class="bg-green-500 h-2 rounded-full transition-all duration-300"
                :style="{ width: `${exportProgress}%` }"></div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Reset de Dados -->
    <div class="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-red-200 dark:border-red-800">
      <div class="px-6 py-4 border-b border-red-200 dark:border-red-800">
        <h3 class="text-lg font-semibold text-red-700 dark:text-red-400 flex items-center gap-2">
          🗑️ Zona de Perigo
        </h3>
        <p class="text-sm text-red-600 dark:text-red-400 mt-1">
          Ações irreversíveis que afetam seus dados
        </p>
      </div>

      <div class="p-6 space-y-4">
        <!-- Reset de Dados -->
        <div class="border border-red-200 dark:border-red-800 rounded-lg p-4">
          <div class="flex items-start justify-between">
            <div>
              <h4 class="font-medium text-red-700 dark:text-red-400">Resetar Todos os Dados</h4>
              <p class="text-sm text-red-600 dark:text-red-400 mt-1">
                Remove permanentemente todas as transações, categorias e configurações.
                <br />
                <strong>Esta ação não pode ser desfeita!</strong>
              </p>
              <p class="text-xs text-gray-500 dark:text-slate-400 mt-2">
                💡 Dica: Exporte seus dados antes de resetar para fazer backup
              </p>
            </div>
            <button @click="confirmReset" :disabled="isResetting"
              class="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800 px-4 py-2 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2 text-sm">
              <i v-if="isResetting" class="fas fa-spinner fa-spin"></i>
              <i v-else class="fas fa-trash"></i>
              {{ isResetting ? 'Resetando...' : 'Resetar' }}
            </button>
          </div>
        </div>

        <!-- Informações importantes -->
        <div class="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
          <div class="flex items-start gap-3">
            <i class="fas fa-exclamation-triangle text-yellow-600 dark:text-yellow-400 mt-1"></i>
            <div class="text-sm">
              <p class="font-medium text-yellow-800 dark:text-yellow-200 mb-1">
                ⚠️ Antes de resetar, considere:
              </p>
              <ul class="text-yellow-700 dark:text-yellow-300 space-y-1">
                <li>• Exportar seus dados para backup</li>
                <li>• Verificar se realmente precisa resetar tudo</li>
                <li>• Talvez seja melhor apenas limpar transações específicas</li>
                <li>• Esta ação remove TODOS os dados, incluindo configurações</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal de Confirmação de Reset -->
    <div v-if="showResetModal" class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div class="bg-white dark:bg-slate-800 rounded-xl shadow-xl max-w-md w-full">
        <div class="p-6">
          <div class="flex items-center gap-3 mb-4">
            <div class="w-12 h-12 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center">
              <i class="fas fa-exclamation-triangle text-red-600 dark:text-red-400 text-xl"></i>
            </div>
            <div>
              <h3 class="text-lg font-semibold text-gray-900 dark:text-slate-100">
                Confirmar Reset
              </h3>
              <p class="text-sm text-gray-600 dark:text-slate-400">
                Esta ação é irreversível
              </p>
            </div>
          </div>

          <div class="mb-6">
            <p class="text-gray-700 dark:text-slate-300 mb-4">
              Tem certeza que deseja resetar <strong>TODOS</strong> os seus dados? Isso inclui:
            </p>
            <ul class="text-sm text-gray-600 dark:text-slate-400 space-y-1 mb-4">
              <li>• Todas as transações</li>
              <li>• Todas as categorias</li>
              <li>• Todas as configurações</li>
              <li>• Todos os dados de investimentos</li>
            </ul>
            <p class="text-sm text-red-600 dark:text-red-400 font-medium">
              ⚠️ Esta ação não pode ser desfeita!
            </p>
          </div>

          <div class="flex gap-3">
            <button @click="showResetModal = false"
              class="flex-1 bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-slate-300 py-2 px-4 rounded-lg hover:bg-gray-200 dark:hover:bg-slate-600 transition-colors">
              Cancelar
            </button>
            <button @click="executeReset"
              class="flex-1 bg-red-600 text-white py-2 px-4 rounded-lg hover:bg-red-700 transition-colors">
              Sim, Resetar Tudo
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useDataManagement } from '../../../composables/profile/useDataManagement'

// Hooks
const {
  isExporting,
  isResetting,
  exportProgress,
  exportOptions,
  exportAllData,
  resetAllData,
  getDataStatistics,
  validateDateRange
} = useDataManagement()

// Estado local
const showResetModal = ref(false)

// Dados estatísticos
const dataStats = ref(getDataStatistics())

// Computed
const formatDateRange = () => {
  const start = dataStats.value.dateRange.oldest
  const end = dataStats.value.dateRange.newest

  if (!start || start === '1900-01-01') return 'Nenhum dado'

  try {
    const startDate = new Date(start)
    const endDate = new Date(end)

    const formatOptions: Intl.DateTimeFormatOptions = {
      month: 'short',
      year: 'numeric'
    }

    const startFormatted = startDate.toLocaleDateString('pt-BR', formatOptions)
    const endFormatted = endDate.toLocaleDateString('pt-BR', formatOptions)

    return `${startFormatted} - ${endFormatted}`
  } catch {
    return 'Período inválido'
  }
}

// Métodos
const exportData = async () => {
  if (!validateDateRange()) return

  const success = await exportAllData()
  if (success) {
    // Atualizar estatísticas após export
    dataStats.value = getDataStatistics()
  }
}

const confirmReset = () => {
  showResetModal.value = true
}

const executeReset = async () => {
  showResetModal.value = false

  const success = await resetAllData()
  if (success) {
    // Atualizar estatísticas após reset
    dataStats.value = getDataStatistics()
  }
}

// Lifecycle
onMounted(() => {
  // Atualizar estatísticas ao montar o componente
  dataStats.value = getDataStatistics()
})
</script>

<script lang="ts">
export default {
  name: 'DataManagementPanel'
}
</script>

<style scoped>
/* Transições suaves */
.transition-colors {
  transition: color 0.2s ease, background-color 0.2s ease, border-color 0.2s ease;
}

.transition-all {
  transition: all 0.2s ease;
}

/* Focus states */
input:focus {
  box-shadow: 0 0 0 3px rgba(236, 72, 153, 0.1);
}

/* Estilização do checkbox e radio */
input[type="checkbox"]:checked,
input[type="radio"]:checked {
  background-color: #ec4899;
  border-color: #ec4899;
}

/* Modal backdrop */
.fixed.inset-0 {
  backdrop-filter: blur(4px);
}
</style>
