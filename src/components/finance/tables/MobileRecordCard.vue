<template>
  <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-4 transition-all duration-200"
    :class="getCardClasses()">
    <!-- Header with Date and Actions -->
    <div class="flex items-center justify-between mb-3">
      <div class="text-sm" :class="getTextClasses()">
        {{ formatDate(record.Data) }}
      </div>
      <div class="flex items-center gap-2">
        <button @click="$emit('edit', record, index)"
          class="text-blue-600 hover:text-blue-900 transition-colors p-1 rounded hover:bg-blue-50"
          :class="{ 'opacity-60': record.Status === '✔️' }" title="Editar registro">
          <i class="fas fa-edit text-sm"></i>
        </button>
        <button @click="$emit('delete', record, index)"
          class="text-red-600 hover:text-red-900 transition-colors p-1 rounded hover:bg-red-50"
          :class="{ 'opacity-60': record.Status === '✔️' }" title="Excluir registro">
          <i class="fas fa-trash text-sm"></i>
        </button>
      </div>
    </div>

    <!-- Description with Recurring Icon -->
    <div class="mb-3">
      <div class="flex items-center gap-2 mb-1">
        <span class="font-medium text-lg" :class="getTextClasses()">
          {{ record.Descrição }}
        </span>
        <RecurringIcon :record="record" size="sm" />
      </div>
    </div>

    <!-- Value -->
    <div class="mb-3">
      <div class="text-2xl font-bold" :class="getValueClasses()">
        {{ formatCurrency(record.Valor) }}
      </div>
    </div>

    <!-- Type and Category -->
    <div class="flex items-center gap-3 mb-3">
      <span class="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium"
        :class="getTypeClasses(record.Tipo)">
        {{ record.Tipo === 'Receita' ? '💰' : '💸' }} {{ record.Tipo }}
      </span>

      <span v-if="record.Categoria" class="text-sm" :class="getTextClasses()">
        {{ getCategoryIcon(record.Categoria) }} {{ record.Categoria }}
      </span>
      <span v-else class="text-sm text-gray-400 italic">Sem categoria</span>
    </div>

    <!-- Status (Toggleable) -->
    <div class="flex items-center justify-between">
      <button @click="toggleStatus"
        class="inline-flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 hover:scale-105 cursor-pointer"
        :class="getStatusClasses(record.Status)" :title="getStatusToggleTitle(record.Status)">
        {{ record.Status }}
        {{ record.Status === '✔️' ? 'Concluído' : 'Pendente' }}
      </button>

      <!-- Mobile Quick Actions -->
      <div class="flex items-center gap-1">
        <button @click="duplicateRecord"
          class="text-gray-500 hover:text-gray-700 transition-colors p-2 rounded hover:bg-gray-100"
          title="Duplicar registro">
          <i class="fas fa-copy text-xs"></i>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useFinanceTable } from '../../../composables/finance/useFinanceTable'
import { useCategoryDetection } from '../../../composables/useCategoryDetection'
import RecurringIcon from '../utils/RecurringIcon.vue'
import type { IFinanceRecord } from '../../../types/finance'

interface Props {
  record: IFinanceRecord
  index: number
}

interface Emits {
  edit: [record: IFinanceRecord, index: number]
  delete: [record: IFinanceRecord, index: number]
  'toggle-status': [record: IFinanceRecord, index: number]
  duplicate: [record: IFinanceRecord, index: number]
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

// Use composables
const { formatDate, formatCurrency, getValueColor } = useFinanceTable()
const { getCategoryIcon } = useCategoryDetection()

// Card styling based on status
const getCardClasses = () => {
  const baseClasses = ['hover:shadow-md']

  if (props.record.Status === '✔️') {
    // Completed records: grayer background with stroke
    baseClasses.push(
      'bg-gray-50/70',
      'border-l-4',
      'border-l-gray-300'
    )
  }

  return baseClasses.join(' ')
}

// Text styling based on status
const getTextClasses = () => {
  return props.record.Status === '✔️'
    ? 'text-gray-600'
    : 'text-gray-900'
}

// Value styling with opacity for completed
const getValueClasses = () => {
  const baseColor = getValueColor(props.record.Valor)
  const opacity = props.record.Status === '✔️' ? 'opacity-75' : ''
  return `${baseColor} ${opacity}`.trim()
}

// Type badge styling
const getTypeClasses = (tipo: 'Receita' | 'Despesa') => {
  const baseClasses = tipo === 'Receita'
    ? 'bg-green-100 text-green-800'
    : 'bg-red-100 text-red-800'

  const opacity = props.record.Status === '✔️' ? 'opacity-75' : ''

  return `${baseClasses} ${opacity}`.trim()
}

// Status styling with hover effects
const getStatusClasses = (status: '❌' | '✔️') => {
  if (status === '✔️') {
    return 'bg-green-100 text-green-800 hover:bg-green-200 ring-1 ring-green-300'
  } else {
    return 'bg-orange-100 text-orange-800 hover:bg-orange-200 ring-1 ring-orange-300'
  }
}

// Status toggle functionality
const toggleStatus = () => {
  // Pass the ORIGINAL record, not the modified one
  // The handler will create the updated record itself
  emit('toggle-status', props.record, props.index)
}

const getStatusToggleTitle = (status: '❌' | '✔️') => {
  return status === '✔️'
    ? 'Toque para marcar como pendente'
    : 'Toque para marcar como concluído'
}

// Duplicate functionality for mobile
const duplicateRecord = () => {
  emit('duplicate', props.record, props.index)
}
</script>