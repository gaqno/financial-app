<template>
  <!-- Vue Component: FinanceTable - Refactored -->
  <div class="min-h-screen theme-transition">
    <!-- Main Content -->
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      <!-- Balance Card Mobile -->
      <BalanceCard :hidden-months-count="getHiddenMonthsCount()" />

      <!-- CSV Import -->
      <CSVImport :on-import="handleImport" />

      <!-- Month Projection Manager -->
      <MonthProjectionManager
        :projection-settings="projectionSettings"
        :get-smart-visible-months="getSmartVisibleMonths"
        :get-current-month-key="getCurrentMonthKey"
        @update-projection="updateProjectionSettings"
      />

      <!-- Filter Bar -->
      <FilterBar />

      <!-- Yearly Projection -->
      <YearlyProjection :records="filteredData" />

      <!-- Records by Month -->
      <div class="space-y-4">
        <MonthSection
          v-for="[monthKey, monthData] in Object.entries(groupedByMonth)"
          :key="monthKey"
          :month-key="monthKey"
          :month-display-name="formatMonthDisplayName(monthKey)"
          :records="monthData"
          :start-index="getMonthStartIndex(monthKey)"
          :is-collapsed="collapsedMonths.has(monthKey)"
          @edit="handleEditRecord"
          @delete="handleDeleteRecord"
          @toggle-status="handleToggleStatus"
          @month-toggle="handleMonthToggle"
        />
      </div>

      <!-- No Records Message -->
      <div
        v-if="Object.keys(groupedByMonth).length === 0"
        class="text-center bg-white dark:bg-gray-900 rounded-xl shadow-sm p-6 border border-gray-100 dark:border-gray-800 transition-colors"
      >
        <div class="text-gray-400 dark:text-gray-500 mb-4">
          <i class="fas fa-inbox text-4xl"></i>
        </div>
        <h3 class="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">Nenhum registro encontrado</h3>
        <p class="text-gray-500 dark:text-gray-400">Adicione uma transação para começar</p>
      </div>
    </div>

    <!-- Edit/Create Modal/Sheet - Responsive -->
    <Transition name="sheet">
      <div v-if="(showEditSheet && editingRecord) || showCreateSheet" class="fixed inset-0 z-50 overflow-hidden">
        <!-- Backdrop -->
        <div class="absolute inset-0 bg-black bg-opacity-60 dark:bg-opacity-80" @click="closeSheet"></div>

        <!-- Modal/Sheet Container - Responsive -->
        <div
          class="absolute bottom-0 left-0 right-0 h-[90vh] lg:bottom-auto lg:left-1/2 lg:top-1/2 lg:transform lg:-translate-x-1/2 lg:-translate-y-1/2 lg:w-full lg:max-w-md lg:h-[80vh] bg-white dark:bg-gray-900 rounded-t-3xl lg:rounded-xl shadow-sm p-6 border border-gray-100 dark:border-gray-800 transition-colors flex flex-col"
        >
          <!-- Header - Fixed -->
          <div
            class="bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 px-4 py-3 rounded-t-3xl lg:rounded-t-xl flex-shrink-0 transition-colors"
          >
            <div class="flex items-center justify-between">
              <h3 class="text-lg font-semibold text-gray-900 dark:text-gray-100">
                <i
                  :class="
                    isCreating ? 'fas fa-plus-circle text-green-500' : 'fas fa-edit text-blue-400 dark:text-blue-300'
                  "
                  class="mr-2"
                ></i>
                {{ isCreating ? 'Novo Registro' : 'Editar Registro' }}
              </h3>
              <button
                @click="closeSheet"
                class="text-gray-400 dark:text-gray-400 hover:text-gray-600 dark:hover:text-slate-200 p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
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
                <BusinessDaySelector
                  v-model="dateFieldValue"
                  label="Data da Transação"
                  :default-business-day="5"
                  @business-day-change="isCreating ? handleCreateBusinessDayChange : handleEditBusinessDayChange"
                />
                <div
                  v-if="isCreating ? transactionForm.errors.value.Data : editForm.errors.value.Data"
                  class="text-red-500 text-xs mt-1"
                >
                  {{ isCreating ? transactionForm.errors.value.Data : editForm.errors.value.Data }}
                </div>
              </div>

              <!-- Business Day Info Display -->
              <div
                v-if="editBusinessDayInfo.isBusinessDayMode"
                class="p-3 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-900 rounded-lg"
              >
                <div class="text-sm text-blue-800 dark:text-blue-200">
                  <i class="fas fa-calendar-week mr-1"></i>
                  <strong>Modo Dia Útil Ativo:</strong>
                  {{ editBusinessDayInfo.dayNumber }}º dia útil de {{ getMonthName(editBusinessDayInfo.month) }}/{{
                    editBusinessDayInfo.year
                  }}
                </div>
                <div v-if="editBusinessDayInfo.calculatedDate" class="text-xs text-blue-600 dark:text-blue-300 mt-1">
                  Data calculada: {{ formatDate(editBusinessDayInfo.calculatedDate) }}
                </div>
              </div>

              <!-- Description Input -->
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1"> Descrição </label>
                <input
                  :value="isCreating ? transactionForm.fields.descricao?.value : editForm.fields.descricao?.value"
                  @input="
                    isCreating
                      ? (transactionForm.fields.descricao.value = ($event.target as HTMLInputElement).value)
                      : (editForm.fields.descricao.value = ($event.target as HTMLInputElement).value)
                  "
                  type="text"
                  class="w-full border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 p-3 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  :class="{
                    'border-red-500': isCreating
                      ? transactionForm.errors.value.Descrição
                      : editForm.errors.value.Descrição,
                  }"
                  required
                />
                <div
                  v-if="isCreating ? transactionForm.errors.value.Descrição : editForm.errors.value.Descrição"
                  class="text-red-500 text-xs mt-1"
                >
                  {{ isCreating ? transactionForm.errors.value.Descrição : editForm.errors.value.Descrição }}
                </div>
              </div>

              <!-- Value Input -->
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1"> Valor </label>
                <CurrencyInput
                  :model-value="isCreating ? transactionForm.fields.valor?.value : editForm.fields.valor?.value"
                  @update:model-value="
                    isCreating ? (transactionForm.fields.valor.value = $event) : (editForm.fields.valor.value = $event)
                  "
                  :tipo="isCreating ? transactionForm.fields.tipo?.value : editForm.fields.tipo?.value"
                  placeholder="R$ 0,00"
                  input-class="w-full border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 p-3 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  :class="{
                    'border-red-500': isCreating ? transactionForm.errors.value.Valor : editForm.errors.value.Valor,
                  }"
                />
                <div
                  v-if="isCreating ? transactionForm.errors.value.Valor : editForm.errors.value.Valor"
                  class="text-red-500 text-xs mt-1"
                >
                  {{ isCreating ? transactionForm.errors.value.Valor : editForm.errors.value.Valor }}
                </div>
              </div>

              <!-- Type Select -->
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1"> Tipo </label>
                <select
                  :value="isCreating ? transactionForm.fields.tipo?.value : editForm.fields.tipo?.value"
                  @change="
                    isCreating
                      ? (transactionForm.fields.tipo.value = ($event.target as HTMLSelectElement).value as
                          | 'Receita'
                          | 'Despesa')
                      : (editForm.fields.tipo.value = ($event.target as HTMLSelectElement).value as
                          | 'Receita'
                          | 'Despesa')
                  "
                  class="w-full border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 p-3 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  :class="{
                    'border-red-500': isCreating ? transactionForm.errors.value.Tipo : editForm.errors.value.Tipo,
                  }"
                >
                  <option value="Receita">💰 Receita</option>
                  <option value="Despesa">💸 Despesa</option>
                </select>
                <div
                  v-if="isCreating ? transactionForm.errors.value.Tipo : editForm.errors.value.Tipo"
                  class="text-red-500 text-xs mt-1"
                >
                  {{ isCreating ? transactionForm.errors.value.Tipo : editForm.errors.value.Tipo }}
                </div>
              </div>

              <!-- Category Select -->
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1"> Categoria </label>
                <select
                  :value="isCreating ? transactionForm.fields.categoria?.value : editForm.fields.categoria?.value"
                  @change="
                    isCreating
                      ? (transactionForm.fields.categoria.value = ($event.target as HTMLSelectElement).value)
                      : (editForm.fields.categoria.value = ($event.target as HTMLSelectElement).value)
                  "
                  class="w-full border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 p-3 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  :class="{
                    'border-red-500': isCreating
                      ? transactionForm.errors.value.Categoria
                      : editForm.errors.value.Categoria,
                  }"
                >
                  <option value="">Detectar automaticamente</option>
                  <option v-for="category in getAllCategories()" :key="category" :value="category">
                    {{ getCategoryIcon(category) }} {{ category }}
                  </option>
                </select>
                <div
                  v-if="isCreating ? transactionForm.errors.value.Categoria : editForm.errors.value.Categoria"
                  class="text-red-500 text-xs mt-1"
                >
                  {{ isCreating ? transactionForm.errors.value.Categoria : editForm.errors.value.Categoria }}
                </div>
              </div>

              <!-- Status Select -->
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1"> Status </label>
                <select
                  :value="isCreating ? transactionForm.fields.status?.value : editForm.fields.status?.value"
                  @change="
                    isCreating
                      ? (transactionForm.fields.status.value = ($event.target as HTMLSelectElement).value as
                          | '❌'
                          | '✔️'
                          | '⏰')
                      : (editForm.fields.status.value = ($event.target as HTMLSelectElement).value as
                          | '❌'
                          | '✔️'
                          | '⏰')
                  "
                  class="w-full border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 p-3 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  :class="{
                    'border-red-500': isCreating ? transactionForm.errors.value.Status : editForm.errors.value.Status,
                  }"
                >
                  <option value="❌">❌ Pendente</option>
                  <option value="✔️">✔️ Confirmado</option>
                </select>
                <div
                  v-if="isCreating ? transactionForm.errors.value.Status : editForm.errors.value.Status"
                  class="text-red-500 text-xs mt-1"
                >
                  {{ isCreating ? transactionForm.errors.value.Status : editForm.errors.value.Status }}
                </div>
              </div>

              <!-- Recurrence Settings -->
              <div class="border-t border-gray-100 dark:border-gray-800 pt-4">
                <div class="flex items-center gap-2 mb-3">
                  <input
                    v-model="editRecurrence.isActive"
                    type="checkbox"
                    class="mr-2 rounded accent-blue-600 dark:accent-blue-400"
                  />
                  <label class="text-sm font-medium text-gray-700 dark:text-gray-200"> Configurar Recorrência </label>
                </div>

                <div v-if="editRecurrence.isActive" class="space-y-3">
                  <div>
                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1"> Frequência </label>
                    <select
                      v-model="editRecurrence.frequency"
                      class="w-full border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 p-3 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="semanal">Semanal</option>
                      <option value="quinzenal">Quinzenal</option>
                      <option value="mensal">Mensal</option>
                      <option value="trimestral">Trimestral</option>
                    </select>
                  </div>

                  <div>
                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1"> Data Final </label>
                    <input
                      v-model="editRecurrence.endDate"
                      type="date"
                      class="w-full border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 p-3 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div class="text-sm text-gray-600 dark:text-blue-200 bg-blue-50 dark:bg-blue-950 p-3 rounded-lg">
                    <i class="fas fa-info-circle text-blue-500 dark:text-blue-300 mr-2"></i>
                    {{ getEditRecurrenceOccurrences() }} ocorrências programadas
                    <div class="text-xs mt-1 dark:text-blue-300">
                      {{ getEditRecurrenceDescription() }}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Action Buttons - Fixed at Bottom -->
          <div
            class="bg-white dark:bg-gray-900 border-t border-gray-100 dark:border-gray-800 px-4 py-3 rounded-b-3xl lg:rounded-b-xl flex-shrink-0 transition-colors"
          >
            <!-- Validation Errors Summary -->
            <div
              v-if="validation.hasTransactionErrors.value && validation.showValidationErrors.value"
              class="mb-3 p-3 bg-red-50 dark:bg-red-900 border border-red-200 dark:border-red-800 rounded-lg"
            >
              <div class="flex items-center text-red-700 dark:text-red-300 text-sm">
                <i class="fas fa-exclamation-triangle mr-2"></i>
                <span class="font-medium">Corrija os erros abaixo:</span>
              </div>
              <ul class="mt-2 text-xs text-red-600 dark:text-red-200 list-disc list-inside">
                <li v-for="(error, field) in transactionForm.errors.value" :key="field">
                  {{ field }}: {{ Array.isArray(error) ? error[0] : error }}
                </li>
              </ul>
            </div>

            <div class="flex gap-3">
              <button
                @click="closeSheet"
                type="button"
                class="flex-1 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200 py-3 px-4 rounded-lg font-medium hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
              >
                Cancelar
              </button>
              <button
                @click="isCreating ? handleValidatedCreate() : handleValidatedEdit()"
                type="button"
                :disabled="isCreating ? !validation.isTransactionValid.value : !validation.isEditValid.value"
                :class="[
                  'flex-1 py-3 px-4 rounded-lg font-medium transition-all duration-200',
                  (isCreating && validation.isTransactionValid.value) || (!isCreating && validation.isEditValid.value)
                    ? 'bg-blue-600 dark:bg-blue-700 text-white hover:bg-blue-700 dark:hover:bg-blue-800 shadow-lg transform hover:scale-105'
                    : 'bg-gray-300 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed',
                ]"
              >
                <i
                  v-if="
                    (isCreating && validation.isTransactionValid.value) || (!isCreating && validation.isEditValid.value)
                  "
                  class="fas fa-check mr-2"
                ></i>
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
      <div
        v-if="showUndoToast"
        class="fixed bottom-4 right-4 bg-gray-800 dark:bg-gray-900 text-white dark:text-gray-100 px-6 py-3 rounded-lg shadow-lg flex items-center gap-3 z-50 transition-colors border border-gray-700 dark:border-gray-800"
      >
        <span>Registro excluído</span>
        <button
          @click="undoDelete"
          class="bg-blue-600 dark:bg-blue-700 hover:bg-blue-700 dark:hover:bg-blue-800 px-3 py-1 rounded text-sm font-medium"
        >
          Desfazer ({{ undoTimeLeft }}s)
        </button>
        <button
          @click="hideUndoToast"
          class="text-gray-300 dark:text-gray-400 hover:text-white dark:hover:text-slate-100"
        >
          <i class="fas fa-times"></i>
        </button>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
  import { useFinanceTableMain } from './hooks/useFinanceTableMain';

  // Component imports
  import CSVImport from '../CSVImport.vue';
  import CurrencyInput from '../CurrencyInput.vue';
  import MonthProjectionManager from '../MonthProjectionManager.vue';
  import MonthSection from '../finance/tables/MonthSection.vue';
  import YearlyProjection from '../finance/summary/YearlyProjection.vue';
  import BalanceCard from '../finance/BalanceCard.vue';
  import FilterBar from '../finance/FilterBar.vue';
  import DeleteConfirmModal from '../finance/DeleteConfirmModal.vue';
  import BusinessDaySelector from '../finance/forms/BusinessDaySelector.vue';

  // Emit events for parent component
  const emit = defineEmits<{
    'sheet-opened': [];
    'sheet-closed': [];
  }>();

  // Callbacks for composable
  const callbacks = {
    onSheetOpened: () => emit('sheet-opened'),
    onSheetClosed: () => emit('sheet-closed'),
  };

  // ALL logic extracted to composable - component is now purely template
  const {
    // Store refs
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
    getSmartVisibleMonths,

    // Store actions
    confirmDelete,
    openEditSheet,
    closeEditSheet,
    startEdit,
    saveEdit,
    undoDelete,
    hideUndoToast,
    getCurrentMonthKey,
    updateProjectionSettings,
    getHiddenMonthsCount,

    // Helpers
    collapsedMonths,
    handleMonthToggle,
    handleToggleStatus,
    getMonthStartIndex,
    formatDate,

    // Import
    importCSV,

    // Business days
    calculateBusinessDay,
    getMonthName,

    // Categories
    getAllCategories,
    getCategoryIcon,

    // Forms
    transactionForm,
    recurrenceForm,
    completeForm,
    editForm,
    validation,
    utils,
    saveEditFromForms,

    // Modal state
    showCreateSheet,
    isCreating,
    newRecord,
    currentRecord,
    dateFieldValue,
    editBusinessDayInfo,

    // Business day handlers
    handleEditBusinessDayChange,
    handleCreateBusinessDayChange,

    // Record operations
    handleEditRecord,
    handleDeleteRecord,

    // Sheet operations
    openCreateSheet,
    setTransactionType,
    saveCreateSheet,
    closeSheet,

    // Validated form handlers
    handleValidatedCreate,
    handleValidatedEdit,

    // Submission state (for UI feedback)
    isSubmittingCreate,
    isSubmittingEdit,

    // CSV Import
    handleImport,

    // Utilities
    formatMonthDisplayName,
    getEditRecurrenceOccurrences,
    getEditRecurrenceDescription,
  } = useFinanceTableMain(callbacks);

  // Expose functions for parent component access
  defineExpose({
    openCreateSheet,
    setTransactionType,
  });
</script>

<script lang="ts">
  // Component name for debugging and DevTools
  export default {
    name: 'FinanceTable',
  };
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
    .sheet-enter-active > div:last-child {
      animation: sheetSlideUp 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
    }

    .sheet-leave-active > div:last-child {
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
    .sheet-enter-active > div:last-child {
      animation: modalFadeIn 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
    }

    .sheet-leave-active > div:last-child {
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

  /* Custom dark mode improvements */
  :deep(.dark) {
    /* Remove blue glow on focus for dark mode, use subtle border */
    input:focus,
    select:focus,
    textarea:focus {
      outline: none;
      border-color: #2563eb !important;
      /* blue-600 */
      box-shadow: 0 0 0 2px #1e40af33;
    }

    /* Scrollbar for dark mode */
    ::-webkit-scrollbar {
      background: #232b3b;
      width: 8px;
    }

    ::-webkit-scrollbar-thumb {
      background: #334155;
      border-radius: 4px;
    }

    /* Modal shadow in dark mode */
    .shadow-xl {
      box-shadow: 0 8px 32px 0 #000a !important;
    }
  }
</style>
