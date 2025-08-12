<template>
  <!-- Vue Component: FinanceTable - Refactored -->
  <div class="min-h-screen bg-gray-50">
    <!-- Main Content -->
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">

      <!-- Balance Card Mobile -->
      <BalanceCard :hiddenMonthsCount="getHiddenMonthsCount()" />

      <!-- CSV Import -->
      <CSVImport :onImport="handleImport" />

      <!-- Month Projection Manager -->
      <MonthProjectionManager :projectionSettings="projectionSettings" :getSmartVisibleMonths="getSmartVisibleMonths"
        :getCurrentMonthKey="getCurrentMonthKey" @update-projection="updateProjectionSettings" />

      <!-- Add Record Form -->
      <AddRecordForm />

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
        class="text-center py-12 bg-white rounded-xl shadow-sm border border-gray-200">
        <div class="text-gray-400 mb-4">
          <i class="fas fa-inbox text-4xl"></i>
        </div>
        <h3 class="text-lg font-medium text-gray-900 mb-2">Nenhum registro encontrado</h3>
        <p class="text-gray-500">Adicione uma transação para começar</p>
      </div>

    </div>

    <!-- Edit Modal/Sheet - Responsive -->
    <Transition name="sheet">
      <div v-if="showEditSheet && editingRecord" class="fixed inset-0 z-50 overflow-hidden">
        <!-- Backdrop -->
        <div class="absolute inset-0 bg-black bg-opacity-50" @click="closeEditSheet"></div>

        <!-- Modal/Sheet Container - Responsive -->
        <div class="absolute
                    bottom-0 left-0 right-0 h-[90vh] 
                    lg:bottom-auto lg:left-1/2 lg:top-1/2 lg:transform lg:-translate-x-1/2 lg:-translate-y-1/2
                    lg:w-full lg:max-w-md lg:h-[80vh]
                    bg-white shadow-xl
                    rounded-t-3xl lg:rounded-xl
                    flex flex-col">

          <!-- Header - Fixed -->
          <div class="bg-white border-b border-gray-200 
                      px-4 py-3 rounded-t-3xl lg:rounded-t-xl
                      flex-shrink-0">
            <div class="flex items-center justify-between">
              <h3 class="text-lg font-semibold text-gray-900">
                <i class="fas fa-edit text-blue-500 mr-2"></i>
                Editar Registro
              </h3>
              <button @click="closeEditSheet"
                class="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100 transition-colors">
                <i class="fas fa-times text-xl"></i>
              </button>
            </div>
          </div>

          <!-- Content - Scrollable (takes remaining space) -->
          <div class="flex-1 overflow-y-auto p-4 min-h-0">
            <!-- Edit Form Content -->
            <div v-if="editingRecord" class="space-y-4">
              <!-- Date Input with Business Day Selector -->
              <div>
                <BusinessDaySelector v-model="editingRecord.Data" label="Data da Transação" :default-business-day="5"
                  @business-day-change="handleEditBusinessDayChange" />
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
                <label class="block text-sm font-medium text-gray-700 mb-1">Descrição</label>
                <input v-model="editingRecord.Descrição" type="text"
                  class="w-full border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required />
              </div>

              <!-- Value Input -->
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Valor</label>
                <CurrencyInput v-model="editingRecord.Valor" :tipo="editingRecord.Tipo" placeholder="R$ 0,00"
                  inputClass="w-full border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
              </div>

              <!-- Type Select -->
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Tipo</label>
                <select v-model="editingRecord.Tipo"
                  class="w-full border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                  <option value="Receita">💰 Receita</option>
                  <option value="Despesa">💸 Despesa</option>
                </select>
              </div>

              <!-- Category Select -->
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Categoria</label>
                <select v-model="editingRecord.Categoria"
                  class="w-full border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                  <option value="">Detectar automaticamente</option>
                  <option v-for="category in getAllCategories()" :key="category" :value="category">
                    {{ getCategoryIcon(category) }} {{ category }}
                  </option>
                </select>
              </div>

              <!-- Status Select -->
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select v-model="editingRecord.Status"
                  class="w-full border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                  <option value="❌">❌ Pendente</option>
                  <option value="✔️">✔️ Confirmado</option>
                </select>
              </div>

              <!-- Recurrence Settings -->
              <div class="border-t border-gray-200 pt-4">
                <div class="flex items-center gap-2 mb-3">
                  <input v-model="editRecurrence.isActive" type="checkbox" class="mr-2 rounded">
                  <label class="text-sm font-medium text-gray-700">Configurar Recorrência</label>
                </div>

                <div v-if="editRecurrence.isActive" class="space-y-3">
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Frequência</label>
                    <select v-model="editRecurrence.frequency"
                      class="w-full border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
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
          <div class="bg-white border-t border-gray-200 
                      px-4 py-3 rounded-b-3xl lg:rounded-b-xl
                      flex-shrink-0">
            <div class="flex gap-3">
              <button @click="closeEditSheet" type="button"
                class="flex-1 bg-gray-100 text-gray-700 py-3 px-4 rounded-lg font-medium hover:bg-gray-200 transition-colors">
                Cancelar
              </button>
              <button @click="saveEditSheet" type="button"
                class="flex-1 bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 transition-colors">
                Salvar
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
        class="fixed bottom-4 right-4 bg-gray-800 text-white px-6 py-3 rounded-lg shadow-lg flex items-center gap-3 z-50">
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

<script lang="ts">
import { defineComponent, computed, watch, ref } from 'vue'
import { useFinanceStore } from '../stores/financeStore'
import { storeToRefs } from 'pinia'
import { useFinanceTableHelpers } from '../composables/finance/useFinanceTableHelpers'
import { useCSVImport } from '../composables/useCSVImport'
import { useBusinessDays } from '../composables/finance/useBusinessDays'
import { useCategoryDetection } from '../composables/useCategoryDetection'
import type { IFinanceRecord } from '../types/finance'

// Component imports
import CSVImport from './CSVImport.vue'
import CurrencyInput from './CurrencyInput.vue'
import DatePicker from './DatePicker.vue'
import MonthVisibilityManager from './MonthVisibilityManager.vue'
import MonthProjectionManager from './MonthProjectionManager.vue'
import MonthSection from './finance/tables/MonthSection.vue'
import YearlyProjection from './finance/summary/YearlyProjection.vue'
import BalanceCard from './finance/BalanceCard.vue'
import AddRecordForm from './finance/AddRecordForm.vue'
import FilterBar from './finance/FilterBar.vue'
import DeleteConfirmModal from './finance/DeleteConfirmModal.vue'
import BusinessDaySelector from './finance/forms/BusinessDaySelector.vue'

export default defineComponent({
  name: 'FinanceTable',
  components: {
    CSVImport,
    CurrencyInput,
    DatePicker,
    MonthVisibilityManager,
    MonthProjectionManager,
    MonthSection,
    YearlyProjection,
    BalanceCard,
    AddRecordForm,
    FilterBar,
    DeleteConfirmModal,
    BusinessDaySelector,
  },
  setup() {
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

    // Business day state for edit modal
    const editBusinessDayInfo = ref({
      isBusinessDayMode: false,
      dayNumber: 5,
      month: new Date().getMonth() + 1,
      year: new Date().getFullYear(),
      calculatedDate: ''
    })

    // Handle business day changes in edit modal
    const handleEditBusinessDayChange = (businessDayInfo: any) => {
      editBusinessDayInfo.value = businessDayInfo
      if (businessDayInfo.calculatedDate && editingRecord.value) {
        editingRecord.value.Data = businessDayInfo.calculatedDate
      }
    }

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

    // Wrapper for save edit that uses store's saveEdit
    const saveEditSheet = () => {
      return saveEdit()
    }

    // Create a wrapper for CSV import
    const handleImport = (records: any[]) => {
      financeStore.importRecords(records)
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

    return {
      // Store data (reactive) - Now properly reactive with storeToRefs
      records,
      filteredData,
      groupedByMonth,
      saldoFinal,

      // Store actions
      toggleMonthVisibility: financeStore.toggleMonthVisibility,
      getHiddenMonthsCount: financeStore.getHiddenMonthsCount,
      getStateSnapshot: financeStore.getStateSnapshot,
      clearAllData: financeStore.clearAllData,
      showAllMonths: financeStore.showAllMonths,
      hideAllMonths: financeStore.hideAllMonths,

      // Table helpers
      collapsedMonths,
      handleMonthToggle,
      handleToggleStatus,
      getMonthStartIndex,
      formatDate,

      // Import
      handleImport,

      // Edit functionality
      editingRecord,
      closeEditSheet,
      saveEditSheet,
      startEdit,
      saveEdit,
      originalEditIndex,

      // Delete & Undo functionality
      showUndoToast,
      undoTimeLeft,
      undoDelete,
      hideUndoToast,

      // Recurrence
      editRecurrence,
      getEditRecurrenceOccurrences,
      getEditRecurrenceDescription,

      // Handlers
      handleEditRecord,
      handleDeleteRecord,

      // Modal states for debug
      showDeleteConfirm,
      itemToDelete,
      showEditSheet,
      confirmDelete,

      // Helper functions
      formatMonthDisplayName,
      editBusinessDayInfo,
      handleEditBusinessDayChange,
      getMonthName,

      // Category functions
      getAllCategories,
      getCategoryIcon,

      // Smart Projection Manager (reactive data)
      projectionSettings,
      getSmartVisibleMonths,

      // Smart Projection Manager (actions)
      getCurrentMonthKey,
      updateProjectionSettings
    }
  }
})
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