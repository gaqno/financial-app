<template>
  <tr class="transition-all duration-200" :class="getRowClasses()">
    <!-- Date -->
    <td class="px-6 py-4 whitespace-nowrap text-sm" :class="getTextClasses()">
      {{ formatDate(record.Data) }}
    </td>

    <!-- Description with recurring icon -->
    <td class="px-6 py-4 text-sm" :class="getTextClasses()">
      <div class="flex items-center gap-2">
        <span class="font-medium">{{ record.Descrição }}</span>
        <RecurringIcon :record="record" size="xs" />
      </div>
    </td>

    <!-- Value -->
    <td class="px-6 py-4 whitespace-nowrap text-sm font-semibold" :class="getValueClasses()">
      {{ formatCurrency(record.Valor) }}
    </td>

    <!-- Type -->
    <td class="px-6 py-4 whitespace-nowrap">
      <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
        :class="getTypeClasses(record.Tipo)">
        {{ record.Tipo === 'Receita' ? '💰' : '💸' }} {{ record.Tipo }}
      </span>
    </td>

    <!-- Category -->
    <td class="px-6 py-4 whitespace-nowrap text-sm" :class="getTextClasses()">
      <span v-if="record.Categoria" class="flex items-center gap-1">
        {{ getCategoryIcon(record.Categoria) }}
        {{ record.Categoria }}
      </span>
      <span v-else class="text-gray-400 dark:text-slate-500 italic">Sem categoria</span>
    </td>

    <!-- Status - Now Toggleable -->
    <td class="px-6 py-4 whitespace-nowrap">
      <button @click="toggleStatus"
        class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium transition-all duration-200 hover:scale-105 cursor-pointer"
        :class="getStatusClasses(record.Status)" :title="getStatusToggleTitle(record.Status)">
        {{ record.Status }}
        {{ record.Status === '✔️' ? 'Concluído' : 'Pendente' }}
      </button>
    </td>

    <!-- Actions -->
    <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
      <div class="flex items-center justify-end gap-2">
        <button @click="$emit('edit', record, index)"
          class="text-blue-600 dark:text-blue-400 hover:text-blue-900 dark:hover:text-blue-300 transition-colors p-1 rounded hover:bg-blue-50 dark:hover:bg-blue-900"
          :class="{ 'opacity-60': record.Status === '✔️' }" title="Editar registro">
          <i class="fas fa-edit"></i>
        </button>
        <button @click="$emit('delete', record, index)"
          class="text-red-600 dark:text-red-400 hover:text-red-900 dark:hover:text-red-300 transition-colors p-1 rounded hover:bg-red-50 dark:hover:bg-red-900"
          :class="{ 'opacity-60': record.Status === '✔️' }" title="Excluir registro">
          <i class="fas fa-trash"></i>
        </button>
      </div>
    </td>
  </tr>
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
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

// Use composables
const { formatDate, formatCurrency, getValueColor } = useFinanceTable()
const { getCategoryIcon } = useCategoryDetection()

// Row styling based on status
const getRowClasses = () => {
  const baseClasses = ['hover:bg-gray-50', 'dark:hover:bg-slate-700']

  if (props.record.Status === '✔️') {
    // Completed records: grayer background with stroke
    baseClasses.push(
      'bg-gray-50/70',
      'dark:bg-slate-700/70',
      'border-l-4',
      'border-l-gray-300',
      'dark:border-l-slate-500',
      'hover:bg-gray-100/70',
      'dark:hover:bg-slate-600/70'
    )
  }

  return baseClasses.join(' ')
}

// Text styling based on status
const getTextClasses = () => {
  return props.record.Status === '✔️'
    ? 'text-gray-600 dark:text-slate-400'
    : 'text-gray-900 dark:text-slate-100'
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
    ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-300'
    : 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-300'

  const opacity = props.record.Status === '✔️' ? 'opacity-75' : ''

  return `${baseClasses} ${opacity}`.trim()
}

// Status styling with hover effects
const getStatusClasses = (status: '❌' | '✔️') => {
  if (status === '✔️') {
    return 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-300 hover:bg-green-200 dark:hover:bg-green-800 ring-1 ring-green-300 dark:ring-green-700'
  } else {
    return 'bg-orange-100 dark:bg-orange-900 text-orange-800 dark:text-orange-300 hover:bg-orange-200 dark:hover:bg-orange-800 ring-1 ring-orange-300 dark:ring-orange-700'
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
    ? 'Clique para marcar como pendente'
    : 'Clique para marcar como concluído'
}
</script>