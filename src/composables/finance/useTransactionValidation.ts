import { useForm } from 'vee-validate';
import { toTypedSchema } from '@vee-validate/zod';
import { computed, ref } from 'vue';
import { z } from 'zod';
import { useDarkMode } from '../useDarkMode';
import { useToast } from '../useToast';
import {
  transactionSchema,
  recurrenceSchema,
  completeTransactionSchema,
  editTransactionSchema,
  transactionInitialValues,
  recurrenceInitialValues,
  transformTransactionData,
  transactionErrorMap,
  validateCurrency,
  formatCurrency,
  validateCustomCategory,
} from '../../schemas/transactionSchema';
import type {
  TransactionFormData,
  RecurrenceFormData,
  CompleteTransactionData,
  EditTransactionData,
} from '../../schemas/transactionSchema';

// Configurar mapa de erros
z.setErrorMap(transactionErrorMap);

export function useTransactionValidation() {
  const { isDarkMode, themeClass } = useDarkMode();
  const toast = useToast();

  // Validation state
  const isValidating = ref<boolean>(false);
  const validationErrors = ref<Record<string, string>>({});

  // Dark mode aware validation styling
  const validationClasses = computed(() => ({
    field: {
      valid: isDarkMode.value
        ? 'border-green-500 bg-gray-700 text-gray-100'
        : 'border-green-500 bg-white text-gray-900',
      invalid: isDarkMode.value ? 'border-red-500 bg-gray-700 text-gray-100' : 'border-red-500 bg-white text-gray-900',
      neutral: isDarkMode.value
        ? 'border-gray-600 bg-gray-700 text-gray-100'
        : 'border-gray-300 bg-white text-gray-900',
    },
    error: {
      text: isDarkMode.value ? 'text-red-400' : 'text-red-600',
      background: isDarkMode.value ? 'bg-red-900/20 border-red-800' : 'bg-red-50 border-red-200',
    },
    success: {
      text: isDarkMode.value ? 'text-green-400' : 'text-green-600',
      background: isDarkMode.value ? 'bg-green-900/20 border-green-800' : 'bg-green-50 border-green-200',
    },
    label: isDarkMode.value ? 'text-gray-200 font-medium' : 'text-gray-700 font-medium',
  }));

  // Form para nova transação
  const {
    defineField: defineTransactionField,
    handleSubmit: handleTransactionSubmit,
    errors: transactionErrors,
    meta: transactionMeta,
    resetForm: resetTransactionForm,
    setFieldValue: setTransactionFieldValue,
    values: transactionValues,
  } = useForm({
    validationSchema: toTypedSchema(transactionSchema),
    initialValues: transactionInitialValues,
  });

  // Form para recorrência
  const {
    defineField: defineRecurrenceField,
    handleSubmit: handleRecurrenceSubmit,
    errors: recurrenceErrors,
    meta: recurrenceMeta,
    resetForm: resetRecurrenceForm,
    setFieldValue: setRecurrenceFieldValue,
    values: recurrenceValues,
  } = useForm({
    validationSchema: toTypedSchema(recurrenceSchema),
    initialValues: recurrenceInitialValues,
  });

  // Form completo (transação + recorrência)
  const {
    defineField: defineCompleteField,
    handleSubmit: handleCompleteSubmit,
    errors: completeErrors,
    meta: completeMeta,
    resetForm: resetCompleteForm,
    setValues: setCompleteValues,
  } = useForm({
    validationSchema: toTypedSchema(completeTransactionSchema),
    initialValues: {
      transaction: transactionInitialValues,
      recurrence: recurrenceInitialValues,
    },
  });

  // Form para edição
  const {
    defineField: defineEditField,
    handleSubmit: handleEditSubmit,
    errors: editErrors,
    meta: editMeta,
    resetForm: resetEditForm,
    setValues: setEditValues,
  } = useForm({
    validationSchema: toTypedSchema(editTransactionSchema),
  });

  // Campos da transação com validação
  const [data, dataAttrs] = defineTransactionField('Data');
  const [descricao, descricaoAttrs] = defineTransactionField('Descrição');
  const [valor, valorAttrs] = defineTransactionField('Valor');
  const [tipo, tipoAttrs] = defineTransactionField('Tipo');
  const [categoria, categoriaAttrs] = defineTransactionField('Categoria');
  const [status, statusAttrs] = defineTransactionField('Status');

  // Campos da recorrência com validação
  const [recurrenceActive, recurrenceActiveAttrs] = defineRecurrenceField('isActive');
  const [recurrenceFrequency, recurrenceFrequencyAttrs] = defineRecurrenceField('frequency');
  const [recurrenceEndDate, recurrenceEndDateAttrs] = defineRecurrenceField('endDate');

  // Campos de edição com validação
  const [editData, editDataAttrs] = defineEditField('Data');
  const [editDescricao, editDescricaoAttrs] = defineEditField('Descrição');
  const [editValor, editValorAttrs] = defineEditField('Valor');
  const [editTipo, editTipoAttrs] = defineEditField('Tipo');
  const [editCategoria, editCategoriaAttrs] = defineEditField('Categoria');
  const [editStatus, editStatusAttrs] = defineEditField('Status');

  // Computed para validação visual
  const isTransactionValid = computed(() => transactionMeta.value.valid);
  const isRecurrenceValid = computed(() => recurrenceMeta.value.valid);
  const isEditValid = computed(() => editMeta.value.valid);
  const hasTransactionErrors = computed(() => Object.keys(transactionErrors.value).length > 0);
  const hasRecurrenceErrors = computed(() => Object.keys(recurrenceErrors.value).length > 0);
  const hasEditErrors = computed(() => Object.keys(editErrors.value).length > 0);

  // Validação em tempo real para valor
  const isValidCurrency = computed(() => {
    if (typeof valor.value !== 'number') return false;
    return validateCurrency(valor.value.toString());
  });

  // Formatação do valor para exibição
  const formattedValue = computed(() => {
    if (typeof valor.value === 'number' && !isNaN(valor.value)) {
      return formatCurrency(valor.value);
    }
    return '';
  });

  // Validação para categoria personalizada
  const isValidCategory = computed(() => {
    return validateCustomCategory(categoria.value || '');
  });

  // Enhanced submit handlers with better UX feedback
  const submitTransaction = handleTransactionSubmit(async (values) => {
    isValidating.value = true;

    try {
      toast.info('Validando dados da transação...', {
        title: '🔍 Validando',
        duration: 1000,
      });

      const transformedData = transformTransactionData(values);

      toast.success('Dados validados com sucesso', {
        title: '✅ Validação Concluída',
        duration: 1500,
      });

      return transformedData;
    } catch (error) {
      toast.error('Erro na validação dos dados', {
        title: '❌ Erro de Validação',
        duration: 3000,
      });
      throw error;
    } finally {
      isValidating.value = false;
    }
  });

  const submitComplete = handleCompleteSubmit(async (values) => {
    isValidating.value = true;

    try {
      toast.info('Validando transação completa...', {
        title: '🔍 Validando',
        duration: 1000,
      });

      const transformedTransaction = transformTransactionData(values.transaction);
      const result = {
        transaction: transformedTransaction,
        recurrence: values.recurrence,
      };

      const hasRecurrence = values.recurrence?.isActive;
      toast.success(hasRecurrence ? 'Transação com recorrência validada' : 'Transação validada com sucesso', {
        title: '✅ Validação Concluída',
        duration: 1500,
      });

      return result;
    } catch (error) {
      toast.error('Erro na validação da transação completa', {
        title: '❌ Erro de Validação',
        duration: 3000,
      });
      throw error;
    } finally {
      isValidating.value = false;
    }
  });

  const submitEdit = handleEditSubmit(async (values) => {
    isValidating.value = true;

    try {
      toast.info('Validando alterações...', {
        title: '🔍 Validando',
        duration: 1000,
      });

      let result = values;
      if (values.Valor !== undefined) {
        const transformedData = transformTransactionData(values as TransactionFormData);
        result = { ...values, ...transformedData };
      }

      toast.success('Alterações validadas com sucesso', {
        title: '✅ Validação Concluída',
        duration: 1500,
      });

      return result;
    } catch (error) {
      toast.error('Erro na validação das alterações', {
        title: '❌ Erro de Validação',
        duration: 3000,
      });
      throw error;
    } finally {
      isValidating.value = false;
    }
  });

  // Funções auxiliares
  const resetAllForms = () => {
    resetTransactionForm();
    resetRecurrenceForm();
    resetCompleteForm();
    resetEditForm();
  };

  // Enhanced real-time validation with better UX
  const validateField = (fieldName: string, value: any) => {
    try {
      if (fieldName in transactionSchema.shape) {
        transactionSchema.shape[fieldName as keyof typeof transactionSchema.shape].parse(value);

        // Clear any existing error for this field
        if (validationErrors.value[fieldName]) {
          delete validationErrors.value[fieldName];
          validationErrors.value = { ...validationErrors.value };
        }

        return { isValid: true, error: null };
      }
      return { isValid: true, error: null };
    } catch (error) {
      let errorMessage = 'Valor inválido';

      if (error instanceof z.ZodError) {
        errorMessage = error.issues[0]?.message || 'Valor inválido';

        // Store error for real-time feedback
        validationErrors.value[fieldName] = errorMessage;
      }

      return { isValid: false, error: errorMessage };
    }
  };

  // Enhanced field validation with visual feedback
  const validateFieldWithToast = (fieldName: string, value: any, showToast = false) => {
    const result = validateField(fieldName, value);

    if (!result.isValid && showToast) {
      toast.warning(`${fieldName}: ${result.error}`, {
        title: '⚠️ Campo Inválido',
        duration: 2500,
      });
    } else if (result.isValid && showToast) {
      toast.success(`${fieldName} validado`, {
        title: '✅ Campo Válido',
        duration: 1500,
      });
    }

    return result;
  };

  // Get validation state for a specific field
  const getFieldValidationState = (fieldName: string, value: any) => {
    const hasError = !!validationErrors.value[fieldName];
    const isEmpty = value === null || value === undefined || value === '';

    return {
      hasError,
      isEmpty,
      isValid: !hasError && !isEmpty,
      error: validationErrors.value[fieldName] || null,
      className: hasError
        ? validationClasses.value.field.invalid
        : !isEmpty
          ? validationClasses.value.field.valid
          : validationClasses.value.field.neutral,
    };
  };

  // Clear validation errors
  const clearValidationErrors = () => {
    validationErrors.value = {};
  };

  // Bulk validation with detailed feedback
  const validateAllFields = (showToast = true) => {
    const allErrors: string[] = [];

    if (hasTransactionErrors.value) {
      Object.entries(transactionErrors.value).forEach(([field, error]) => {
        allErrors.push(`${field}: ${error}`);
      });
    }

    if (hasRecurrenceErrors.value) {
      Object.entries(recurrenceErrors.value).forEach(([field, error]) => {
        allErrors.push(`Recorrência - ${field}: ${error}`);
      });
    }

    if (allErrors.length > 0 && showToast) {
      toast.error(`${allErrors.length} erro(s) encontrado(s)`, {
        title: '❌ Validação Falhada',
        duration: 4000,
      });
    } else if (showToast) {
      toast.success('Todos os campos são válidos', {
        title: '✅ Validação Concluída',
        duration: 2000,
      });
    }

    return allErrors.length === 0;
  };

  // Função para pré-validar antes do submit
  const preValidateTransaction = (data: Partial<TransactionFormData>): boolean => {
    try {
      transactionSchema.parse(data);
      return true;
    } catch {
      return false;
    }
  };

  // Função para detectar o tipo automaticamente baseado no valor
  const autoDetectType = (valor: number) => {
    if (valor > 0) {
      setTransactionFieldValue('Tipo', 'Receita');
    } else if (valor < 0) {
      setTransactionFieldValue('Tipo', 'Despesa');
    }
  };

  // Enhanced category suggestion with confidence scoring
  const suggestCategory = (descricao: string): Array<{ category: string; confidence: number }> => {
    const suggestions: Record<string, { categories: string[]; weight: number }> = {
      'supermercado|mercado|compras|feira': { categories: ['Alimentação', 'Supermercado'], weight: 0.9 },
      'gasolina|combustível|posto|etanol': { categories: ['Transporte', 'Combustível'], weight: 0.95 },
      'médico|hospital|farmácia|dentista|consulta': { categories: ['Saúde', 'Farmácia'], weight: 0.9 },
      'escola|curso|faculdade|universidade|educação': { categories: ['Educação'], weight: 0.85 },
      'cinema|show|festa|lazer|entretenimento': { categories: ['Lazer'], weight: 0.8 },
      'aluguel|condomínio|casa|apartamento|moradia': { categories: ['Moradia'], weight: 0.95 },
      'salário|ordenado|pagamento': { categories: ['Salário'], weight: 0.95 },
      'freelance|extra|bico': { categories: ['Freelance'], weight: 0.8 },
      'netflix|spotify|streaming|assinatura': { categories: ['Streaming'], weight: 0.9 },
      'internet|wi-fi|banda|fibra': { categories: ['Internet'], weight: 0.85 },
      'academia|gym|musculação|pilates': { categories: ['Academia'], weight: 0.8 },
      'uber|taxi|transporte|ônibus': { categories: ['Transporte'], weight: 0.8 },
      'restaurante|lanchonete|delivery|ifood': { categories: ['Alimentação'], weight: 0.8 },
      'roupa|sapato|vestuário|shopping': { categories: ['Vestuário'], weight: 0.8 },
    };

    const desc = descricao.toLowerCase();
    const results: Array<{ category: string; confidence: number }> = [];

    for (const [keywords, { categories, weight }] of Object.entries(suggestions)) {
      const regex = new RegExp(keywords, 'i');
      if (regex.test(desc)) {
        categories.forEach((category) => {
          results.push({ category, confidence: weight });
        });
      }
    }

    // Sort by confidence and remove duplicates
    const uniqueResults = results
      .sort((a, b) => b.confidence - a.confidence)
      .filter((item, index, array) => array.findIndex((i) => i.category === item.category) === index)
      .slice(0, 3); // Return top 3 suggestions

    return uniqueResults;
  };

  // Smart category suggestion with toast feedback
  const suggestCategoryWithFeedback = (descricao: string, showToast = true) => {
    const suggestions = suggestCategory(descricao);

    if (suggestions.length > 0 && showToast) {
      const topSuggestion = suggestions[0];
      const confidenceText =
        topSuggestion.confidence >= 0.9
          ? 'alta confiança'
          : topSuggestion.confidence >= 0.8
            ? 'boa confiança'
            : 'baixa confiança';

      toast.info(`Sugestão: ${topSuggestion.category} (${confidenceText})`, {
        title: '💡 Categoria Sugerida',
        duration: 3000,
      });
    }

    return suggestions;
  };

  // Estado para controle visual
  const showValidationErrors = ref(false);
  const validationMode = ref<'onSubmit' | 'onChange' | 'onBlur'>('onSubmit');

  return {
    // Forms
    transactionForm: {
      fields: { data, descricao, valor, tipo, categoria, status },
      attrs: { dataAttrs, descricaoAttrs, valorAttrs, tipoAttrs, categoriaAttrs, statusAttrs },
      errors: transactionErrors,
      meta: transactionMeta,
      reset: resetTransactionForm,
      submit: submitTransaction,
      setFieldValue: setTransactionFieldValue,
      values: transactionValues,
    },

    recurrenceForm: {
      fields: { recurrenceActive, recurrenceFrequency, recurrenceEndDate },
      attrs: { recurrenceActiveAttrs, recurrenceFrequencyAttrs, recurrenceEndDateAttrs },
      errors: recurrenceErrors,
      meta: recurrenceMeta,
      reset: resetRecurrenceForm,
      values: recurrenceValues,
    },

    completeForm: {
      errors: completeErrors,
      meta: completeMeta,
      reset: resetCompleteForm,
      submit: submitComplete,
      setValues: setCompleteValues,
    },

    editForm: {
      fields: {
        data: editData,
        descricao: editDescricao,
        valor: editValor,
        tipo: editTipo,
        categoria: editCategoria,
        status: editStatus,
      },
      attrs: {
        dataAttrs: editDataAttrs,
        descricaoAttrs: editDescricaoAttrs,
        valorAttrs: editValorAttrs,
        tipoAttrs: editTipoAttrs,
        categoriaAttrs: editCategoriaAttrs,
        statusAttrs: editStatusAttrs,
      },
      errors: editErrors,
      meta: editMeta,
      reset: resetEditForm,
      submit: submitEdit,
      setValues: setEditValues,
    },

    // Enhanced validation state
    validation: {
      isTransactionValid,
      isRecurrenceValid,
      isEditValid,
      hasTransactionErrors,
      hasRecurrenceErrors,
      hasEditErrors,
      isValidCurrency,
      isValidCategory,
      showValidationErrors,
      validationMode,
      isValidating,
      validationErrors,
    },

    // Dark mode and styling
    isDarkMode,
    themeClass,
    validationClasses,

    // Enhanced toast system
    toast,

    // Enhanced utilities
    utils: {
      formattedValue,
      resetAllForms,
      validateField,
      validateFieldWithToast,
      getFieldValidationState,
      clearValidationErrors,
      validateAllFields,
      preValidateTransaction,
      autoDetectType,
      suggestCategory,
      suggestCategoryWithFeedback,
      formatCurrency,
      validateCurrency,
      validateCustomCategory,
    },
  };
}
