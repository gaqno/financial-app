<template>
  <div class="add-record-form">
    <div class="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 dark:bg-gray-800">
      <h2 class="text-lg font-semibold text-gray-900 mb-4 dark:text-gray-100">
        <i class="fas fa-plus-circle text-green-500 mr-2"></i>
        Novo Registro
      </h2>

      <form @submit.prevent="handleSubmit" class="space-y-4">
        <!-- Date with Business Day Selector -->
        <div>
          <BusinessDaySelector
            v-model="formData.Data"
            label="Data da Transação"
            :default-business-day="5"
            @business-day-change="handleBusinessDayChange"
          />
        </div>

        <!-- Description -->
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-100 mb-1 dark:bg-gray-700">
            Descrição
          </label>
          <input
            v-model="formData.Descrição"
            @input="onDescriptionChange"
            type="text"
            placeholder="Ex: Salário, Conta de luz, Supermercado..."
            class="w-full border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            required
          />
        </div>

        <!-- Value with Type -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-100 mb-1 dark:bg-gray-700">
              Tipo
            </label>
            <select
              v-model="formData.Tipo"
              class="w-full border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="Receita">💰 Receita</option>
              <option value="Despesa">💸 Despesa</option>
            </select>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-100 mb-1 dark:bg-gray-700">
              Valor
            </label>
            <CurrencyInput
              v-model="formData.Valor"
              :tipo="formData.Tipo"
              placeholder="R$ 0,00"
              class="w-full dark:border-gray-700"
            />
          </div>
        </div>

        <!-- Category and Status -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-100 mb-1 dark:bg-gray-700">
              Categoria
            </label>
            <select
              v-model="formData.Categoria"
              @change="onCategoryChange"
              class="w-full border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Detectar automaticamente</option>
              <option v-for="category in getAllCategories()" :key="category" :value="category">
                {{ getCategoryIcon(category) }} {{ category }}
              </option>
            </select>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-100 mb-1 dark:bg-gray-700">
              Status
            </label>
            <select
              v-model="formData.Status"
              class="w-full border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="❌">❌ Pendente</option>
              <option value="✔️">✔️ Concluído</option>
            </select>
          </div>
        </div>

        <!-- Business Day Info Display -->
        <div v-if="businessDayInfo.isBusinessDayMode" class="p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <div class="text-sm text-blue-800 dark:text-blue-400 dark:bg-blue-700">
            <i class="fas fa-calendar-week mr-1"></i>
            <strong>Modo Dia Útil Ativo:</strong>
            {{ businessDayInfo.dayNumber }}º dia útil de {{ getMonthName(businessDayInfo.month) }}/{{
              businessDayInfo.year
            }}
          </div>
          <div v-if="businessDayInfo.calculatedDate" class="text-xs text-blue-600 dark:text-blue-400 mt-1">
            Data calculada: {{ formatDate(businessDayInfo.calculatedDate) }}
          </div>
        </div>

        <!-- Form Actions -->
        <div class="flex gap-3 pt-4 border-t border-gray-200">
          <button
            type="button"
            @click="resetForm"
            class="flex-1 px-4 py-3 bg-gray-100 text-gray-700 dark:text-gray-100 dark:bg-gray-800 dark:hover:bg-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-colors"
          >
            <i class="fas fa-undo mr-2"></i>
            Limpar
          </button>
          <button
            type="submit"
            :disabled="!isFormValid"
            class="flex-1 px-4 py-3 bg-green-500 text-white dark:text-gray-100 rounded-xl font-medium hover:bg-green-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
          >
            <i class="fas fa-plus mr-2"></i>
            Adicionar
          </button>
        </div>
      </form>

      <!-- Form Preview -->
      <div v-if="showPreview" class="mt-6 p-4 bg-gray-50 border border-gray-200 rounded-lg">
        <h3 class="text-sm font-semibold text-gray-800 dark:text-gray-100 mb-2">Preview do Registro:</h3>
        <div class="text-sm space-y-1">
          <div>
            <strong>Data:</strong>
            {{ formatDate(formData.Data) }}
          </div>
          <div>
            <strong>Descrição:</strong>
            {{ formData.Descrição }}
          </div>
          <div>
            <strong>Valor:</strong>
            {{ formatCurrency(formData.Valor) }}
          </div>
          <div>
            <strong>Tipo:</strong>
            {{ formData.Tipo }}
          </div>
          <div>
            <strong>Categoria:</strong>
            {{ formData.Categoria || 'A detectar' }}
          </div>
          <div>
            <strong>Status:</strong>
            {{ formData.Status }}
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { ref, computed } from 'vue';
  import { useFinanceForms } from '../../../composables/finance/useFinanceForms';
  import { useCategoryDetection } from '../../../composables/useCategoryDetection';
  import { useFinanceTable } from '../../../composables/finance/useFinanceTable';
  import BusinessDaySelector from './BusinessDaySelector.vue';
  import CurrencyInput from '../../CurrencyInput.vue';

  interface Props {
    showPreview?: boolean;
  }

  const props = withDefaults(defineProps<Props>(), {
    showPreview: false,
  });

  // Use composables
  const {
    newRecord: formData,
    isNewRecordValid,
    onDescriptionChange,
    onCategoryChange,
    handleAdd,
    resetNewRecord,
  } = useFinanceForms();

  const { getAllCategories, getCategoryIcon } = useCategoryDetection();
  const { formatDate, formatCurrency } = useFinanceTable();

  // Business day info from selector - matching the exact emit interface
  const businessDayInfo = ref<{
    isBusinessDayMode: boolean;
    dayNumber?: number;
    month?: number;
    year?: number;
    calculatedDate?: string;
  }>({
    isBusinessDayMode: false,
    dayNumber: undefined,
    month: undefined,
    year: undefined,
    calculatedDate: undefined,
  });

  // Form validation
  const isFormValid = computed(() => {
    return (
      isNewRecordValid.value && formData.value.Data && formData.value.Descrição.trim() && formData.value.Valor !== 0
    );
  });

  // Methods
  const handleBusinessDayChange = (info: {
    isBusinessDayMode: boolean;
    dayNumber?: number;
    month?: number;
    year?: number;
    calculatedDate?: string;
  }) => {
    businessDayInfo.value = info;
  };

  const handleSubmit = async () => {
    if (!isFormValid.value) return;

    await handleAdd();

    // Reset business day info after successful submission
    businessDayInfo.value = {
      isBusinessDayMode: false,
      dayNumber: undefined,
      month: undefined,
      year: undefined,
      calculatedDate: undefined,
    };
  };

  const resetForm = () => {
    resetNewRecord();
    businessDayInfo.value = {
      isBusinessDayMode: false,
      dayNumber: undefined,
      month: undefined,
      year: undefined,
      calculatedDate: undefined,
    };
    console.log('🧹 [ADD_RECORD_FORM] Form reset');
  };

  const getMonthName = (monthNumber?: number): string => {
    if (!monthNumber) return '';
    const months = [
      'Janeiro',
      'Fevereiro',
      'Março',
      'Abril',
      'Maio',
      'Junho',
      'Julho',
      'Agosto',
      'Setembro',
      'Outubro',
      'Novembro',
      'Dezembro',
    ];
    return months[monthNumber - 1] || '';
  };
</script>
