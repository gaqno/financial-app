<template>
  <div class="relative">
    <input v-if="!businessDayMode.enabled" :value="modelValue" @input="handleDateInput" type="date" :class="inputClass"
      :required="required" />
    <div v-else class="space-y-2">
      <select v-model="businessDayMode.dayNumber" @change="updateBusinessDay" :class="selectClass">
        <option v-for="day in 25" :key="day" :value="day">
          {{ getBusinessDayDescription(day) }}
        </option>
      </select>
      <div class="text-xs text-gray-600" :class="previewClass">
        📅 {{ formatDate(modelValue) }}
      </div>
    </div>
    <button type="button" @click="toggleBusinessDayMode" :class="toggleButtonClass"
      :title="businessDayMode.enabled ? 'Usar data normal' : 'Usar dias úteis'">
      {{ businessDayMode.enabled ? '📅' : '💼' }}
    </button>
  </div>
</template>

<script setup lang="ts">
import { reactive, computed } from 'vue';
import { formatDateForDisplay, getCurrentDateISO } from '../utils/dateUtils';

// Props
interface Props {
  modelValue: string;
  inputClass?: string;
  selectClass?: string;
  toggleButtonClass?: string;
  previewClass?: string;
  required?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  inputClass: 'w-full border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent',
  selectClass: 'w-full border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent',
  toggleButtonClass: 'absolute top-1 right-1 w-6 h-6 bg-blue-500 hover:bg-blue-600 text-white rounded-full text-xs flex items-center justify-center',
  previewClass: 'text-center',
  required: false
});

// Emits
const emit = defineEmits<{
  'update:modelValue': [value: string];
}>();
const businessDayMode = reactive({
  enabled: false,
  dayNumber: 1
});

// Função para obter data atual no formato YYYY-MM-DD
function getCurrentDate(): string {
  return getCurrentDateISO();
}

// Função para calcular o N-ésimo dia útil do mês
function calculateBusinessDay(year: number, month: number, businessDayNumber: number): string {
  if (businessDayNumber < 1 || businessDayNumber > 31) {
    return getCurrentDate();
  }

  const firstDay = new Date(year, month - 1, 1);
  const lastDay = new Date(year, month, 0);

  let businessDaysCount = 0;
  let currentDate = new Date(firstDay);

  while (currentDate <= lastDay) {
    const dayOfWeek = currentDate.getDay();

    if (dayOfWeek >= 1 && dayOfWeek <= 5) {
      businessDaysCount++;

      if (businessDaysCount === businessDayNumber) {
        return currentDate.toISOString().split('T')[0];
      }
    }

    currentDate.setDate(currentDate.getDate() + 1);
  }

  // Se não encontrou o dia útil, retorna último dia útil
  let lastBusinessDay = new Date(lastDay);
  while (lastBusinessDay >= firstDay) {
    const dayOfWeek = lastBusinessDay.getDay();
    if (dayOfWeek >= 1 && dayOfWeek <= 5) {
      return lastBusinessDay.toISOString().split('T')[0];
    }
    lastBusinessDay.setDate(lastBusinessDay.getDate() - 1);
  }

  return getCurrentDate();
}

// Função para obter descrição do dia útil
function getBusinessDayDescription(dayNumber: number): string {
  const ordinals = ['', '1º', '2º', '3º', '4º', '5º', '6º', '7º', '8º', '9º', '10º',
    '11º', '12º', '13º', '14º', '15º', '16º', '17º', '18º', '19º', '20º',
    '21º', '22º', '23º', '24º', '25º'];

  if (dayNumber >= 1 && dayNumber <= 25) {
    return `${ordinals[dayNumber]} dia útil`;
  }
  return `${dayNumber}º dia útil`;
}

// Função para formatar data como DD/MM/YYYY
function formatDate(dateStr: string): string {
  return formatDateForDisplay(dateStr);
}

// Função para detectar se a data atual é um dia útil calculado
function detectBusinessDay(dateStr: string) {
  if (!dateStr) return;

  const date = new Date(dateStr);
  businessDayMode.enabled = false;

  for (let dayNum = 1; dayNum <= 25; dayNum++) {
    const calculatedDate = calculateBusinessDay(date.getFullYear(), date.getMonth() + 1, dayNum);
    if (calculatedDate === dateStr) {
      businessDayMode.enabled = true;
      businessDayMode.dayNumber = dayNum;
      break;
    }
  }
}

// Função para atualizar data baseada no dia útil
function updateBusinessDay() {
  if (businessDayMode.enabled) {
    const currentDate = props.modelValue ? new Date(props.modelValue) : new Date();
    const calculatedDate = calculateBusinessDay(currentDate.getFullYear(), currentDate.getMonth() + 1, businessDayMode.dayNumber);
    emit('update:modelValue', calculatedDate);
  }
}

// Função para alternar modo de dias úteis
function toggleBusinessDayMode() {
  businessDayMode.enabled = !businessDayMode.enabled;
  if (businessDayMode.enabled) {
    updateBusinessDay();
  } else {
    emit('update:modelValue', getCurrentDate());
  }
}

// Função para lidar com input de data normal
function handleDateInput(event: Event) {
  const target = event.target as HTMLInputElement;
  if (target) {
    emit('update:modelValue', target.value);
  }
}

// Detectar se a data inicial é um dia útil
detectBusinessDay(props.modelValue);
</script>

<script lang="ts">
// Component name for debugging and DevTools
export default {
  name: 'DatePicker'
};
</script>

<!-- 
CONVERSÃO PARA COMPOSITION API:
- Convertido de Options API (export default { props, emits, setup }) para Composition API puro com <script setup>
- Props definidas com interface TypeScript e withDefaults()
- Emits definidas com defineEmits com tipagem TypeScript
- Toda lógica mantida igual, apenas removida do objeto de retorno do setup()
- Adicionado displayName conforme padrão do projeto
-->