import { useForm } from 'vee-validate'
import { toTypedSchema } from '@vee-validate/zod'
import { computed, ref } from 'vue'
import { z } from 'zod'
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
  validateCustomCategory
} from '../../schemas/transactionSchema'
import type {
  TransactionFormData,
  RecurrenceFormData,
  CompleteTransactionData,
  EditTransactionData
} from '../../schemas/transactionSchema'

// Configurar mapa de erros
z.setErrorMap(transactionErrorMap)

export function useTransactionValidation() {

  // Form para nova transação
  const {
    defineField: defineTransactionField,
    handleSubmit: handleTransactionSubmit,
    errors: transactionErrors,
    meta: transactionMeta,
    resetForm: resetTransactionForm,
    setFieldValue: setTransactionFieldValue,
    values: transactionValues
  } = useForm({
    validationSchema: toTypedSchema(transactionSchema),
    initialValues: transactionInitialValues
  })

  // Form para recorrência
  const {
    defineField: defineRecurrenceField,
    handleSubmit: handleRecurrenceSubmit,
    errors: recurrenceErrors,
    meta: recurrenceMeta,
    resetForm: resetRecurrenceForm,
    setFieldValue: setRecurrenceFieldValue,
    values: recurrenceValues
  } = useForm({
    validationSchema: toTypedSchema(recurrenceSchema),
    initialValues: recurrenceInitialValues
  })

  // Form completo (transação + recorrência)
  const {
    defineField: defineCompleteField,
    handleSubmit: handleCompleteSubmit,
    errors: completeErrors,
    meta: completeMeta,
    resetForm: resetCompleteForm,
    setValues: setCompleteValues
  } = useForm({
    validationSchema: toTypedSchema(completeTransactionSchema),
    initialValues: {
      transaction: transactionInitialValues,
      recurrence: recurrenceInitialValues
    }
  })

  // Form para edição
  const {
    defineField: defineEditField,
    handleSubmit: handleEditSubmit,
    errors: editErrors,
    meta: editMeta,
    resetForm: resetEditForm,
    setValues: setEditValues
  } = useForm({
    validationSchema: toTypedSchema(editTransactionSchema)
  })

  // Campos da transação com validação
  const [data, dataAttrs] = defineTransactionField('Data')
  const [descricao, descricaoAttrs] = defineTransactionField('Descrição')
  const [valor, valorAttrs] = defineTransactionField('Valor')
  const [tipo, tipoAttrs] = defineTransactionField('Tipo')
  const [categoria, categoriaAttrs] = defineTransactionField('Categoria')
  const [status, statusAttrs] = defineTransactionField('Status')

  // Campos da recorrência com validação
  const [recurrenceActive, recurrenceActiveAttrs] = defineRecurrenceField('isActive')
  const [recurrenceFrequency, recurrenceFrequencyAttrs] = defineRecurrenceField('frequency')
  const [recurrenceEndDate, recurrenceEndDateAttrs] = defineRecurrenceField('endDate')

  // Campos de edição com validação
  const [editData, editDataAttrs] = defineEditField('Data')
  const [editDescricao, editDescricaoAttrs] = defineEditField('Descrição')
  const [editValor, editValorAttrs] = defineEditField('Valor')
  const [editTipo, editTipoAttrs] = defineEditField('Tipo')
  const [editCategoria, editCategoriaAttrs] = defineEditField('Categoria')
  const [editStatus, editStatusAttrs] = defineEditField('Status')

  // Computed para validação visual
  const isTransactionValid = computed(() => transactionMeta.value.valid)
  const isRecurrenceValid = computed(() => recurrenceMeta.value.valid)
  const isEditValid = computed(() => editMeta.value.valid)
  const hasTransactionErrors = computed(() => Object.keys(transactionErrors.value).length > 0)
  const hasRecurrenceErrors = computed(() => Object.keys(recurrenceErrors.value).length > 0)
  const hasEditErrors = computed(() => Object.keys(editErrors.value).length > 0)

  // Validação em tempo real para valor
  const isValidCurrency = computed(() => {
    if (typeof valor.value !== 'number') return false
    return validateCurrency(valor.value.toString())
  })

  // Formatação do valor para exibição
  const formattedValue = computed(() => {
    if (typeof valor.value === 'number' && !isNaN(valor.value)) {
      return formatCurrency(valor.value)
    }
    return ''
  })

  // Validação para categoria personalizada
  const isValidCategory = computed(() => {
    return validateCustomCategory(categoria.value || '')
  })

  // Submit handlers
  const submitTransaction = handleTransactionSubmit(async (values) => {
    const transformedData = transformTransactionData(values)
    return transformedData
  })

  const submitComplete = handleCompleteSubmit(async (values) => {
    const transformedTransaction = transformTransactionData(values.transaction)
    return {
      transaction: transformedTransaction,
      recurrence: values.recurrence
    }
  })

  const submitEdit = handleEditSubmit(async (values) => {
    if (values.Valor !== undefined) {
      const transformedData = transformTransactionData(values as TransactionFormData)
      return { ...values, ...transformedData }
    }
    return values
  })

  // Funções auxiliares
  const resetAllForms = () => {
    resetTransactionForm()
    resetRecurrenceForm()
    resetCompleteForm()
    resetEditForm()
  }

  const validateField = (fieldName: string, value: any) => {
    try {
      if (fieldName in transactionSchema.shape) {
        transactionSchema.shape[fieldName as keyof typeof transactionSchema.shape].parse(value)
        return { isValid: true, error: null }
      }
      return { isValid: true, error: null }
    } catch (error) {
      if (error instanceof z.ZodError) {
        return { isValid: false, error: error.issues[0]?.message || 'Valor inválido' }
      }
      return { isValid: false, error: 'Erro de validação' }
    }
  }

  // Função para pré-validar antes do submit
  const preValidateTransaction = (data: Partial<TransactionFormData>): boolean => {
    try {
      transactionSchema.parse(data)
      return true
    } catch {
      return false
    }
  }

  // Função para detectar o tipo automaticamente baseado no valor
  const autoDetectType = (valor: number) => {
    if (valor > 0) {
      setTransactionFieldValue('Tipo', 'Receita')
    } else if (valor < 0) {
      setTransactionFieldValue('Tipo', 'Despesa')
    }
  }

  // Função para sugerir categoria baseada na descrição
  const suggestCategory = (descricao: string): string[] => {
    const suggestions: Record<string, string[]> = {
      'supermercado|mercado|compras': ['Alimentação', 'Supermercado'],
      'gasolina|combustível|posto': ['Transporte', 'Combustível'],
      'médico|hospital|farmácia': ['Saúde', 'Farmácia'],
      'escola|curso|faculdade': ['Educação'],
      'cinema|show|festa': ['Lazer'],
      'aluguel|condomínio|casa': ['Moradia'],
      'salário|ordenado': ['Salário'],
      'freelance|extra': ['Freelance'],
      'netflix|spotify|streaming': ['Streaming'],
      'internet|wi-fi|banda': ['Internet'],
      'academia|gym': ['Academia']
    }

    const desc = descricao.toLowerCase()
    for (const [keywords, categories] of Object.entries(suggestions)) {
      if (new RegExp(keywords).test(desc)) {
        return categories
      }
    }
    return []
  }

  // Estado para controle visual
  const showValidationErrors = ref(false)
  const validationMode = ref<'onSubmit' | 'onChange' | 'onBlur'>('onSubmit')

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
      values: transactionValues
    },

    recurrenceForm: {
      fields: { recurrenceActive, recurrenceFrequency, recurrenceEndDate },
      attrs: { recurrenceActiveAttrs, recurrenceFrequencyAttrs, recurrenceEndDateAttrs },
      errors: recurrenceErrors,
      meta: recurrenceMeta,
      reset: resetRecurrenceForm,
      values: recurrenceValues
    },

    completeForm: {
      errors: completeErrors,
      meta: completeMeta,
      reset: resetCompleteForm,
      submit: submitComplete,
      setValues: setCompleteValues
    },

    editForm: {
      fields: {
        data: editData,
        descricao: editDescricao,
        valor: editValor,
        tipo: editTipo,
        categoria: editCategoria,
        status: editStatus
      },
      attrs: {
        dataAttrs: editDataAttrs,
        descricaoAttrs: editDescricaoAttrs,
        valorAttrs: editValorAttrs,
        tipoAttrs: editTipoAttrs,
        categoriaAttrs: editCategoriaAttrs,
        statusAttrs: editStatusAttrs
      },
      errors: editErrors,
      meta: editMeta,
      reset: resetEditForm,
      submit: submitEdit,
      setValues: setEditValues
    },

    // Validation state
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
      validationMode
    },

    // Utilities
    utils: {
      formattedValue,
      resetAllForms,
      validateField,
      preValidateTransaction,
      autoDetectType,
      suggestCategory,
      formatCurrency,
      validateCurrency,
      validateCustomCategory
    }
  }
}
