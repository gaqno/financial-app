<template>
  <!-- Vue Component: FinanceTable - Refactored -->
  <div class="min-h-screen bg-gray-50 dark:bg-slate-900 theme-transition">
    <!-- Main Content -->
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">

      <!-- Balance Card Mobile -->
      <BalanceCard :hiddenMonthsCount="getHiddenMonthsCount()" />

      <!-- CSV Import -->
      <CSVImport :onImport="handleImport" />

      <!-- Month Projection Manager -->
      <MonthProjectionManager :projectionSettings="projectionSettings" :getSmartVisibleMonths="getSmartVisibleMonths"
        :getCurrentMonthKey="getCurrentMonthKey" @update-projection="updateProjectionSettings" />


      <!-- Filter Bar -->
      <FilterBar />

      <!-- Yearly Projection -->
      <YearlyProjection :records="filteredData" />

      <!-- Records by Month -->
      <div class="space-y-4">
        <MonthSection v-for="[monthKey, monthData] in Object.entries(groupedByMonth)" :key="monthKey"
          :monthKey="monthKey" :monthDisplayName="formatMonthDisplayName(monthKey)" :records="monthData"
          :startIndex="getMonthStartIndex(monthKey)" :isCollapsed="collapsedMonths.has(monthKey)"
          @edit="handleEditRecord" @delete="handleDeleteRecord" @toggle-status="handleToggleStatus"
          @month-toggle="handleMonthToggle" />
      </div>

      <!-- No Records Message -->
      <div v-if="Object.keys(groupedByMonth).length === 0"
        class="text-center py-12 bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-600 theme-transition">
        <div class="text-gray-400 dark:text-slate-500 mb-4">
          <i class="fas fa-inbox text-4xl"></i>
        </div>
        <h3 class="text-lg font-medium text-gray-900 dark:text-slate-100 mb-2">Nenhum registro encontrado</h3>
        <p class="text-gray-500 dark:text-slate-400">Adicione uma transação para começar</p>
      </div>

    </div>

    <!-- Edit/Create Modal/Sheet - Responsive -->
    <Transition name="sheet">
      <div v-if="(showEditSheet && editingRecord) || showCreateSheet" class="fixed inset-0 z-50 overflow-hidden">
        <!-- Backdrop -->
        <div class="absolute inset-0 bg-black bg-opacity-50" @click="closeSheet"></div>

        <!-- Modal/Sheet Container - Responsive -->
        <div class="absolute
                bottom-0 left-0 right-0 h-[90vh] 
                lg:bottom-auto lg:left-1/2 lg:top-1/2 lg:transform lg:-translate-x-1/2 lg:-translate-y-1/2
                lg:w-full lg:max-w-md lg:h-[80vh]
                bg-white dark:bg-slate-800 shadow-xl
                rounded-t-3xl lg:rounded-xl
                flex flex-col theme-transition">

          <!-- Header - Fixed -->
          <div class="bg-white dark:bg-slate-800 border-b border-gray-200 dark:border-slate-600 
                  px-4 py-3 rounded-t-3xl lg:rounded-t-xl
                  flex-shrink-0 theme-transition">
            <div class="flex items-center justify-between">
              <h3 class="text-lg font-semibold text-gray-900 dark:text-slate-100">
                <i :class="isCreating ? 'fas fa-plus-circle text-green-500' : 'fas fa-edit text-blue-500'"
                  class="mr-2"></i>
                {{ isCreating ? 'Novo Registro' : 'Editar Registro' }}
              </h3>
              <button @click="closeSheet"
                class="text-gray-400 dark:text-slate-400 hover:text-gray-600 dark:hover:text-slate-200 p-1 rounded-full hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors">
                <i class="fas fa-times text-xl"></i>
              </button>
            </div>
          </div>

          <!-- Content - Scrollable (takes remaining space) -->
          <div class="flex-1 overflow-y-auto p-4 min-h-0">
            <!-- Edit Form Content -->
            <div v-if="currentRecord" class="space-y-4">
              <!-- Date Input with Business Day Selector -->
              <div>
                <BusinessDaySelector v-model="dateFieldValue" label="Data da Transação" :default-business-day="5"
                  @business-day-change="isCreating ? handleCreateBusinessDayChange : handleEditBusinessDayChange" />
                <div v-if="isCreating ? transactionForm.errors.value.Data : editForm.errors.value.Data"
                  class="text-red-500 text-xs mt-1">
                  {{ isCreating ? transactionForm.errors.value.Data : editForm.errors.value.Data }}
                </div>
              </div>

              <!-- Business Day Info Display -->
              <div v-if="editBusinessDayInfo.isBusinessDayMode"
                class="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <div class="text-sm text-blue-800">
                  <i class="fas fa-calendar-week mr-1"></i>
                  <strong>Modo Dia Útil Ativo:</strong>
                  {{ editBusinessDayInfo.dayNumber }}º dia útil de
                  {{ getMonthName(editBusinessDayInfo.month) }}/{{ editBusinessDayInfo.year }}
                </div>
                <div v-if="editBusinessDayInfo.calculatedDate" class="text-xs text-blue-600 mt-1">
                  Data calculada: {{ formatDate(editBusinessDayInfo.calculatedDate) }}
                </div>
              </div>

              <!-- Description Input -->
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-100 mb-1">Descrição</label>
                <input :value="isCreating ? transactionForm.fields.descricao?.value : editForm.fields.descricao?.value"
                  @input="isCreating ? (transactionForm.fields.descricao.value = ($event.target as HTMLInputElement).value) : (editForm.fields.descricao.value = ($event.target as HTMLInputElement).value)"
                  type="text"
                  class="w-full border border-gray-300 dark:border-gray-700 p-3 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  :class="{ 'border-red-500': isCreating ? transactionForm.errors.value.Descrição : editForm.errors.value.Descrição }"
                  required />
                <div v-if="isCreating ? transactionForm.errors.value.Descrição : editForm.errors.value.Descrição"
                  class="text-red-500 text-xs mt-1">
                  {{ isCreating ? transactionForm.errors.value.Descrição : editForm.errors.value.Descrição }}
                </div>
              </div>

              <!-- Value Input -->
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-100 mb-1">Valor</label>
                <CurrencyInput
                  :modelValue="isCreating ? transactionForm.fields.valor?.value : editForm.fields.valor?.value"
                  @update:modelValue="isCreating ? (transactionForm.fields.valor.value = $event) : (editForm.fields.valor.value = $event)"
                  :tipo="isCreating ? transactionForm.fields.tipo?.value : editForm.fields.tipo?.value"
                  placeholder="R$ 0,00"
                  inputClass="w-full border border-gray-300 dark:border-gray-700 p-3 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  :class="{ 'border-red-500': isCreating ? transactionForm.errors.value.Valor : editForm.errors.value.Valor }" />
                <div v-if="isCreating ? transactionForm.errors.value.Valor : editForm.errors.value.Valor"
                  class="text-red-500 text-xs mt-1">
                  {{ isCreating ? transactionForm.errors.value.Valor : editForm.errors.value.Valor }}
                </div>
              </div>

              <!-- Type Select -->
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-100 mb-1">Tipo</label>
                <select :value="isCreating ? transactionForm.fields.tipo?.value : editForm.fields.tipo?.value"
                  @change="isCreating ? (transactionForm.fields.tipo.value = ($event.target as HTMLSelectElement).value as 'Receita' | 'Despesa') : (editForm.fields.tipo.value = ($event.target as HTMLSelectElement).value as 'Receita' | 'Despesa')"
                  class="w-full border border-gray-300 dark:border-gray-700 p-3 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  :class="{ 'border-red-500': isCreating ? transactionForm.errors.value.Tipo : editForm.errors.value.Tipo }">
                  <option value="Receita">💰 Receita</option>
                  <option value="Despesa">💸 Despesa</option>
                </select>
                <div v-if="isCreating ? transactionForm.errors.value.Tipo : editForm.errors.value.Tipo"
                  class="text-red-500 text-xs mt-1">
                  {{ isCreating ? transactionForm.errors.value.Tipo : editForm.errors.value.Tipo }}
                </div>
              </div>

              <!-- Category Select -->
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-100 mb-1">Categoria</label>
                <select :value="isCreating ? transactionForm.fields.categoria?.value : editForm.fields.categoria?.value"
                  @change="isCreating ? (transactionForm.fields.categoria.value = ($event.target as HTMLSelectElement).value) : (editForm.fields.categoria.value = ($event.target as HTMLSelectElement).value)"
                  class="w-full border border-gray-300 dark:border-gray-700 p-3 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  :class="{ 'border-red-500': isCreating ? transactionForm.errors.value.Categoria : editForm.errors.value.Categoria }">
                  <option value="">Detectar automaticamente</option>
                  <option v-for="category in getAllCategories()" :key="category" :value="category">
                    {{ getCategoryIcon(category) }} {{ category }}
                  </option>
                </select>
                <div v-if="isCreating ? transactionForm.errors.value.Categoria : editForm.errors.value.Categoria"
                  class="text-red-500 text-xs mt-1">
                  {{ isCreating ? transactionForm.errors.value.Categoria : editForm.errors.value.Categoria }}
                </div>
              </div>

              <!-- Status Select -->
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-100 mb-1">Status</label>
                <select :value="isCreating ? transactionForm.fields.status?.value : editForm.fields.status?.value"
                  @change="isCreating ? (transactionForm.fields.status.value = ($event.target as HTMLSelectElement).value as '❌' | '✔️' | '⏰') : (editForm.fields.status.value = ($event.target as HTMLSelectElement).value as '❌' | '✔️' | '⏰')"
                  class="w-full border border-gray-300 dark:border-gray-700 p-3 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  :class="{ 'border-red-500': isCreating ? transactionForm.errors.value.Status : editForm.errors.value.Status }">
                  <option value="❌">❌ Pendente</option>
                  <option value="✔️">✔️ Confirmado</option>
                </select>
                <div v-if="isCreating ? transactionForm.errors.value.Status : editForm.errors.value.Status"
                  class="text-red-500 text-xs mt-1">
                  {{ isCreating ? transactionForm.errors.value.Status : editForm.errors.value.Status }}
                </div>
              </div>

              <!-- Recurrence Settings -->
              <div class="border-t border-gray-200 dark:border-gray-700 pt-4">
                <div class="flex items-center gap-2 mb-3">
                  <input v-model="editRecurrence.isActive" type="checkbox" class="mr-2 rounded">
                  <label class="text-sm font-medium text-gray-700 dark:text-gray-100">Configurar Recorrência</label>
                </div>

                <div v-if="editRecurrence.isActive" class="space-y-3">
                  <div>
                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-100 mb-1">Frequência</label>
                    <select v-model="editRecurrence.frequency"
                      class="w-full border border-gray-300 dark:border-gray-700 p-3 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                      <option value="semanal">Semanal</option>
                      <option value="quinzenal">Quinzenal</option>
                      <option value="mensal">Mensal</option>
                      <option value="trimestral">Trimestral</option>
                    </select>
                  </div>

                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Data Final</label>
                    <input v-model="editRecurrence.endDate" type="date"
                      class="w-full border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
                  </div>

                  <div class="text-sm text-gray-600 bg-blue-50 p-3 rounded-lg">
                    <i class="fas fa-info-circle text-blue-500 mr-2"></i>
                    {{ getEditRecurrenceOccurrences() }} ocorrências programadas
                    <div class="text-xs mt-1">{{ getEditRecurrenceDescription() }}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Action Buttons - Fixed at Bottom -->
          <div class="bg-white dark:bg-slate-800 border-t border-gray-200 dark:border-slate-600 
                  px-4 py-3 rounded-b-3xl lg:rounded-b-xl
                  flex-shrink-0 theme-transition">
            <!-- Validation Errors Summary -->
            <div v-if="validation.hasTransactionErrors.value && validation.showValidationErrors.value"
              class="mb-3 p-3 bg-red-50 border border-red-200 rounded-lg">
              <div class="flex items-center text-red-700 text-sm">
                <i class="fas fa-exclamation-triangle mr-2"></i>
                <span class="font-medium">Corrija os erros abaixo:</span>
              </div>
              <ul class="mt-2 text-xs text-red-600 list-disc list-inside">
                <li v-for="(error, field) in transactionForm.errors.value" :key="field">
                  {{ field }}: {{ Array.isArray(error) ? error[0] : error }}
                </li>
              </ul>
            </div>

            <div class="flex gap-3">
              <button @click="closeSheet" type="button"
                class="flex-1 bg-gray-100 text-gray-700 py-3 px-4 rounded-lg font-medium hover:bg-gray-200 transition-colors">
                Cancelar
              </button>
              <button @click="isCreating ? handleValidatedCreate() : handleValidatedEdit()" type="button"
                :disabled="isCreating ? !validation.isTransactionValid.value : !validation.isEditValid.value" :class="[
                  'flex-1 py-3 px-4 rounded-lg font-medium transition-all duration-200',
                  (isCreating && validation.isTransactionValid.value) || (!isCreating && validation.isEditValid.value)
                    ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-lg transform hover:scale-105'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                ]">
                <i v-if="(isCreating && validation.isTransactionValid.value) || (!isCreating && validation.isEditValid.value)"
                  class="fas fa-check mr-2"></i>
                <i v-else class="fas fa-exclamation-triangle mr-2"></i>
                {{ isCreating ? 'Criar' : 'Salvar' }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </Transition>

    <!-- Delete Confirmation Modal -->
    <DeleteConfirmModal />

    <!-- Undo Toast -->
    <Transition name="toast">
      <div v-if="showUndoToast"
        class="fixed bottom-4 right-4 bg-gray-800 dark:bg-slate-700 text-white dark:text-slate-100 px-6 py-3 rounded-lg shadow-lg flex items-center gap-3 z-50 theme-transition">
        <span>Registro excluído</span>
        <button @click="undoDelete" class="bg-blue-600 hover:bg-blue-700 px-3 py-1 rounded text-sm font-medium">
          Desfazer ({{ undoTimeLeft }}s)
        </button>
        <button @click="hideUndoToast" class="text-gray-300 hover:text-white">
          <i class="fas fa-times"></i>
        </button>
      </div>
    </Transition>

  </div>
</template>

<script setup lang="ts">
import { computed, watch, ref } from 'vue'
import { useFinanceStore } from '../stores/financeStore'
import { storeToRefs } from 'pinia'
import { useFinanceTableHelpers } from '../composables/finance/useFinanceTableHelpers'
import { useCSVImport } from '../composables/useCSVImport'
import { useBusinessDays } from '../composables/finance/useBusinessDays'
import { useCategoryDetection } from '../composables/useCategoryDetection'
import { useFinanceForms } from '../composables/finance/useFinanceForms'
import { useTransactionValidation } from '../composables/finance/useTransactionValidation'

// Component imports
import CSVImport from './CSVImport.vue'
import CurrencyInput from './CurrencyInput.vue'
import DatePicker from './DatePicker.vue'
import MonthVisibilityManager from './MonthVisibilityManager.vue'
import MonthProjectionManager from './MonthProjectionManager.vue'
import MonthSection from './finance/tables/MonthSection.vue'
import YearlyProjection from './finance/summary/YearlyProjection.vue'
import BalanceCard from './finance/BalanceCard.vue'
import FilterBar from './finance/FilterBar.vue'
import DeleteConfirmModal from './finance/DeleteConfirmModal.vue'
import BusinessDaySelector from './finance/forms/BusinessDaySelector.vue'

// Main store
const financeStore = useFinanceStore()

// Get reactive refs from store - CRITICAL: Use storeToRefs for ALL reactive data
const {
  records,
  filteredData,
  groupedByMonth,
  saldoFinal,
  showDeleteConfirm,
  itemToDelete,
  showEditSheet,
  editingRecord,
  editRecurrence,
  originalEditIndex,
  showUndoToast,
  undoTimeLeft,
  projectionSettings,
  getSmartVisibleMonths
} = storeToRefs(financeStore)

// Store actions (these don't need refs)
const {
  confirmDelete,
  openEditSheet,
  closeEditSheet,
  startEdit,
  saveEdit,
  undoDelete,
  hideUndoToast,
  getCurrentMonthKey,
  updateProjectionSettings
} = financeStore

// Store functions that need to be callable from template
const getHiddenMonthsCount = financeStore.getHiddenMonthsCount

// Table helpers with store integration
const {
  collapsedMonths,
  handleMonthToggle,
  handleToggleStatus,
  getMonthStartIndex,
  formatDate
} = useFinanceTableHelpers()

// CSV Import functionality
const { importCSV } = useCSVImport()

// Business days functionality for edit modal
const { calculateBusinessDay, getMonthName } = useBusinessDays()

// Category detection functionality
const { getAllCategories, getCategoryIcon } = useCategoryDetection()

// Finance forms functionality for edit modal
const { saveEditSheet: saveEditFromForms } = useFinanceForms()

// Transaction validation functionality
const {
  transactionForm,
  recurrenceForm,
  completeForm,
  editForm,
  validation,
  utils
} = useTransactionValidation()

// Create/Edit modal state
const showCreateSheet = ref(false)
const isCreating = computed(() => showCreateSheet.value)

// Use validated form fields instead of reactive object
const newRecord = computed(() => ({
  Data: transactionForm.fields.data.value || new Date().toISOString().split('T')[0],
  Descrição: transactionForm.fields.descricao.value || '',
  Valor: transactionForm.fields.valor.value || 0,
  Tipo: transactionForm.fields.tipo.value || 'Receita',
  Categoria: transactionForm.fields.categoria.value || '',
  Status: transactionForm.fields.status.value || '❌',
  Saldo: 0
}))

// Business day state for edit modal
const editBusinessDayInfo = ref({
  isBusinessDayMode: false,
  dayNumber: 5,
  month: new Date().getMonth() + 1,
  year: new Date().getFullYear(),
  calculatedDate: ''
})

// Computed property for current record (either editing or creating)
const currentRecord = computed(() => {
  if (isCreating.value) {
    return newRecord.value
  } else {
    // For editing, use validated form fields
    return {
      Data: editForm.fields.data?.value || editingRecord.value?.Data || '',
      Descrição: editForm.fields.descricao?.value || editingRecord.value?.Descrição || '',
      Valor: editForm.fields.valor?.value || editingRecord.value?.Valor || 0,
      Tipo: editForm.fields.tipo?.value || editingRecord.value?.Tipo || 'Receita',
      Categoria: editForm.fields.categoria?.value || editingRecord.value?.Categoria || '',
      Status: editForm.fields.status?.value || editingRecord.value?.Status || '❌',
      Saldo: editingRecord.value?.Saldo || 0,
      recurrence: editingRecord.value?.recurrence
    }
  }
})

// Computed for date field value to handle v-model correctly
const dateFieldValue = computed({
  get: () => {
    return (isCreating.value ? transactionForm.fields.data.value : editForm.fields.data.value) || ''
  },
  set: (value: string) => {
    if (isCreating.value) {
      transactionForm.fields.data.value = value
    } else {
      editForm.fields.data.value = value
    }
  }
})

// Handle business day changes in edit modal
const handleEditBusinessDayChange = (businessDayInfo: any) => {
  editBusinessDayInfo.value = businessDayInfo
  if (businessDayInfo.calculatedDate) {
    editForm.fields.data.value = businessDayInfo.calculatedDate
  }
}

// Handle business day changes in create modal
const handleCreateBusinessDayChange = (businessDayInfo: any) => {
  // For creation, we can use the same editBusinessDayInfo for UI display
  editBusinessDayInfo.value = businessDayInfo
  if (businessDayInfo.calculatedDate) {
    transactionForm.fields.data.value = businessDayInfo.calculatedDate
  }
}

// Watch for editingRecord changes to sync with editForm
watch(editingRecord, (newRecord) => {
  if (newRecord) {
    console.log('🔄 [EDIT_SYNC] Syncing editingRecord to editForm:', newRecord)
    editForm.setValues({
      Data: newRecord.Data,
      Descrição: newRecord.Descrição,
      Valor: newRecord.Valor,
      Tipo: newRecord.Tipo,
      Categoria: newRecord.Categoria || '',
      Status: newRecord.Status
    })
  }
}, { immediate: true })

// Simplified handlers that work with the store
const handleEditRecord = (record: any, index: number) => {
  // Find the actual index in the main records array by matching record properties
  const actualIndex = financeStore.records.findIndex(r =>
    r.Data === record.Data &&
    r.Descrição === record.Descrição &&
    r.Valor === record.Valor &&
    r.Tipo === record.Tipo &&
    r.Status === record.Status
  )

  if (actualIndex === -1) {
    return
  }

  startEdit(record, actualIndex)
}

const handleDeleteRecord = (record: any, index: number) => {
  // Find the actual index in the main records array by matching record properties
  // This ensures we delete the correct record regardless of filtering/sorting
  const actualIndex = financeStore.records.findIndex(r =>
    r.Data === record.Data &&
    r.Descrição === record.Descrição &&
    r.Valor === record.Valor &&
    r.Tipo === record.Tipo &&
    r.Status === record.Status
  )

  if (actualIndex === -1) {
    return
  }

  confirmDelete(record, actualIndex)
}

// Create sheet functions
const openCreateSheet = () => {
  // Reset transaction form to defaults
  transactionForm.reset()
  showCreateSheet.value = true
}

const saveCreateSheet = async () => {
  try {
    const recordToSave = { ...newRecord.value }

    // Process recurrence if enabled
    if (editRecurrence.value.isActive) {
      console.log('🔄 [CREATE] Processing recurrence:', editRecurrence.value)

      // Import recurrence helper
      const { useRecurrenceHelpers } = await import('../composables/finance/useRecurrenceHelpers')
      const { generateRecurringRecordsForEdit } = useRecurrenceHelpers()

      // Create recurrence settings
      const recurrenceSettings = {
        frequency: editRecurrence.value.frequency,
        endDate: editRecurrence.value.endDate || new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split('T')[0],
        isActive: true
      }

      // Generate all recurring records
      const recordsToAdd = generateRecurringRecordsForEdit(recordToSave, recurrenceSettings)
      console.log('🔄 [CREATE] Generated recurring records:', recordsToAdd.length)

      // Use batch insert for multiple records
      await financeStore.addRecordsBatch(recordsToAdd)
    } else {
      // Add single record
      await financeStore.addRecord(recordToSave)
    }

    // Close sheet and reset form
    showCreateSheet.value = false

    // Reset recurrence settings after successful creation
    editRecurrence.value = {
      isActive: false,
      frequency: 'mensal',
      endDate: ''
    }
  } catch (error) {
    console.error('Error creating record:', error)
  }
}

// Enhanced close function to handle both create and edit
const closeSheet = () => {
  if (showCreateSheet.value) {
    showCreateSheet.value = false
  } else {
    closeEditSheet()
  }
}

// Validated form handlers
const handleValidatedCreate = async () => {
  validation.showValidationErrors.value = true

  if (!validation.isTransactionValid.value) {
    console.warn('❌ Formulário inválido, não é possível criar transação')
    return
  }

  try {
    const transactionData = await transactionForm.submit()
    if (transactionData) {
      // ✅ RECURRENCE FIX: Check for recurrence before adding record (usar a mesma variável que funciona em saveCreateSheet)
      if (editRecurrence.value.isActive) {
        console.log('🔄 [CREATE] Processing recurrence in handleValidatedCreate:', editRecurrence.value)

        // Import recurrence helper
        const { useRecurrenceHelpers } = await import('../composables/finance/useRecurrenceHelpers')
        const { generateRecurringRecordsForEdit } = useRecurrenceHelpers()

        // Create recurrence settings from validated form (usar a mesma estrutura que funciona)
        const recurrenceSettings = {
          frequency: editRecurrence.value.frequency,
          endDate: editRecurrence.value.endDate || new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split('T')[0],
          isActive: true
        }

        console.log('🔄 [CREATE] Recurrence settings:', recurrenceSettings)

        // Generate all recurring records  
        const recordsToAdd = generateRecurringRecordsForEdit(transactionData, recurrenceSettings)
        console.log('🔄 [CREATE] Generated recurring records:', recordsToAdd.length)

        // Use batch insert for multiple records
        await financeStore.addRecordsBatch(recordsToAdd)
      } else {
        // Add single record (no recurrence)
        await financeStore.addRecord(transactionData)
      }

      transactionForm.reset()
      recurrenceForm.reset()
      validation.showValidationErrors.value = false
      closeSheet()
    }
  } catch (error) {
    console.error('❌ Erro ao criar transação:', error)
    alert('Erro ao criar transação. Verifique os dados e tente novamente.')
  }
}

const handleValidatedEdit = async () => {
  validation.showValidationErrors.value = true

  if (!validation.isEditValid.value) {
    console.warn('❌ Formulário de edição inválido, não é possível salvar')
    return
  }

  try {
    // ✅ BUG FIX: Sync editForm data to store's editingRecord before saving
    if (editingRecord.value) {
      editingRecord.value.Data = editForm.fields.data?.value || editingRecord.value.Data
      editingRecord.value.Descrição = editForm.fields.descricao?.value || editingRecord.value.Descrição
      editingRecord.value.Valor = editForm.fields.valor?.value || editingRecord.value.Valor
      editingRecord.value.Tipo = editForm.fields.tipo?.value || editingRecord.value.Tipo
      editingRecord.value.Categoria = editForm.fields.categoria?.value || editingRecord.value.Categoria
      editingRecord.value.Status = editForm.fields.status?.value || editingRecord.value.Status

      console.log('🔄 [EDIT_SYNC] Synced editForm data to store editingRecord:', editingRecord.value)
    }

    // Sync recurrence settings from editRecurrence to store's editRecurrence
    if (editRecurrence.value) {
      // Get recurrence state from the reactive editRecurrence ref
      console.log('🔄 [EDIT_RECURRENCE] Current editRecurrence state:', editRecurrence.value)
    }

    // Use store's saveEdit function that handles recurrence properly
    const success = await saveEdit()

    if (success) {
      validation.showValidationErrors.value = false
      console.log('✅ [EDIT] Record saved successfully')
    } else {
      console.error('❌ [EDIT] Failed to save record')
    }

  } catch (error) {
    console.error('❌ Erro ao editar transação:', error)
    alert('Erro ao editar transação. Verifique os dados e tente novamente.')
  }
}

// Remove local wrapper - use saveEditSheet from useFinanceForms composable instead
// The composable properly handles recurrence settings
// const saveEditSheet = () => {
//   return saveEdit()
// }

// Create a wrapper for CSV import
const handleImport = async (records: any[]) => {
  try {
    console.log('📥 [CSV] Starting import of', records.length, 'records')
    await financeStore.importRecords(records)
    console.log('✅ [CSV] Import completed successfully')
  } catch (error) {
    console.error('❌ [CSV] Import failed:', error)
  }
}

// Create placeholder functions for recurrence
const getEditRecurrenceOccurrences = (): number => {
  return 0 // Placeholder
}

const getEditRecurrenceDescription = (): string => {
  return '' // Placeholder
}

// Helper function to format month key to Portuguese month name
const formatMonthDisplayName = (monthKey: string): string => {
  try {
    // monthKey format: "YYYY-MM"
    const [year, month] = monthKey.split('-')
    const date = new Date(parseInt(year), parseInt(month) - 1, 1)
    return date.toLocaleDateString('pt-BR', {
      month: 'long',
      year: 'numeric'
    })
  } catch {
    return monthKey // Fallback to original key if parsing fails
  }
}

// Expose functions for parent component access
defineExpose({
  openCreateSheet
})
</script>

<script lang="ts">
// Component name for debugging and DevTools
export default {
  name: 'FinanceTable'
}
</script>

<style scoped>
button {
  cursor: pointer;
}

/* Animações do modal */
.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.3s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

.modal-enter-active .modal-content {
  animation: modalSlideIn 0.3s ease;
}

@keyframes modalSlideIn {
  from {
    transform: scale(0.9) translateY(-20px);
    opacity: 0;
  }

  to {
    transform: scale(1) translateY(0);
    opacity: 1;
  }
}

/* Animações do toast */
.toast-enter-active {
  animation: toastSlideIn 0.3s ease;
}

.toast-leave-active {
  animation: toastSlideOut 0.3s ease;
}

@keyframes toastSlideIn {
  from {
    transform: translateX(100%);
    opacity: 0;
  }

  to {
    transform: translateX(0);
    opacity: 1;
  }
}

@keyframes toastSlideOut {
  from {
    transform: translateX(0);
    opacity: 1;
  }

  to {
    transform: translateX(100%);
    opacity: 0;
  }
}

/* Animações do sheet drawer */
.sheet-enter-active,
.sheet-leave-active {
  transition: opacity 0.3s ease;
}

.sheet-enter-from,
.sheet-leave-to {
  opacity: 0;
}

/* Mobile: Sheet slides up from bottom */
@media (max-width: 1023px) {
  .sheet-enter-active>div:last-child {
    animation: sheetSlideUp 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
  }

  .sheet-leave-active>div:last-child {
    animation: sheetSlideDown 0.3s ease-in;
  }

  @keyframes sheetSlideUp {
    from {
      transform: translateY(100%);
      opacity: 0;
    }

    to {
      transform: translateY(0);
      opacity: 1;
    }
  }

  @keyframes sheetSlideDown {
    from {
      transform: translateY(0);
      opacity: 1;
    }

    to {
      transform: translateY(100%);
      opacity: 0;
    }
  }
}

/* Desktop: Modal fades and scales in center */
@media (min-width: 1024px) {
  .sheet-enter-active>div:last-child {
    animation: modalFadeIn 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
  }

  .sheet-leave-active>div:last-child {
    animation: modalFadeOut 0.3s ease-in;
  }

  @keyframes modalFadeIn {
    from {
      transform: translate(-50%, -50%) scale(0.9);
      opacity: 0;
    }

    to {
      transform: translate(-50%, -50%) scale(1);
      opacity: 1;
    }
  }

  @keyframes modalFadeOut {
    from {
      transform: translate(-50%, -50%) scale(1);
      opacity: 1;
    }

    to {
      transform: translate(-50%, -50%) scale(0.9);
      opacity: 0;
    }
  }
}

/* Melhorar touch targets */
@media (max-width: 1024px) {
  button {
    min-height: 44px;
    min-width: 44px;
  }
}

/* Month content transitions */
.month-content-enter-active,
.month-content-leave-active {
  overflow: hidden;
}

.month-content-enter-from,
.month-content-leave-to {
  max-height: 0;
}

.month-content-enter-to,
.month-content-leave-from {
  max-height: 2000px;
}
</style>