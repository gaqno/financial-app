<template>
  <div
    class="border-b border-gray-200 dark:border-gray-700 transition-colors"
    :class="{
      'bg-green-50 dark:bg-green-900/20': paymentStatus === 'paid',
      'bg-yellow-50 dark:bg-yellow-900/20': paymentStatus === 'partial',
    }"
  >
    <!-- Main Row -->
    <div class="grid grid-cols-[2fr_1fr_1fr_140px_80px_100px_60px] gap-4 p-3 items-center">
      <div
        class="text-gray-900 dark:text-gray-100"
        :class="{ 'line-through text-gray-500 dark:text-gray-400': subtask.completed }"
      >
        {{ subtask.taskName }}
      </div>
      <div class="text-gray-700 dark:text-gray-300">{{ subtask.projectedHours }}h</div>
      <div class="font-semibold text-gray-900 dark:text-gray-100">
        {{ formatCurrency(totalValue) }}
      </div>
      <div class="text-center text-[11px] text-gray-600 dark:text-gray-400 leading-tight">
        {{ formatDate(subtask.createdAt) }}
      </div>
      <div class="flex justify-center">
        <input
          type="checkbox"
          :checked="subtask.completed"
          @change="handleToggle"
          class="w-5 h-5 cursor-pointer accent-blue-600 dark:accent-blue-500"
        />
      </div>
      <button
        @click="handleAddPayment"
        class="text-white px-3 py-2 rounded transition-colors text-sm font-semibold flex items-center gap-1 justify-center"
        :class="paymentButtonClass"
        :title="paymentButtonTitle"
      >
        <i :class="paymentIcon"></i>
        {{ paymentButtonText }}
      </button>
      <button
        @click="handleDelete"
        class="bg-red-500 hover:bg-red-600 dark:bg-red-600 dark:hover:bg-red-700 text-white p-2 rounded transition-colors"
        title="Excluir tarefa"
      >
        <i class="fas fa-times"></i>
      </button>
    </div>

    <!-- Payment Progress Bar -->
    <div v-if="totalValue > 0" class="px-3 pb-3">
      <div class="flex items-center gap-3 text-xs">
        <div class="flex-1">
          <div class="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
            <div
              class="h-full transition-all duration-300"
              :class="progressBarClass"
              :style="{ width: progressPercentage + '%' }"
            ></div>
          </div>
        </div>
        <div class="text-gray-600 dark:text-gray-400 font-medium whitespace-nowrap">
          <span :class="paidTextClass">{{ formatCurrency(paidValue) }}</span>
          /
          <span>{{ formatCurrency(totalValue) }}</span>
        </div>
      </div>

      <!-- Remaining Amount Alert (Only for Partial) -->
      <div
        v-if="paymentStatus === 'partial' && remainingValue > 0"
        class="mt-2 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg px-3 py-2 flex items-center justify-between"
      >
        <div class="flex items-center gap-2">
          <i class="fas fa-exclamation-triangle text-yellow-600 dark:text-yellow-400"></i>
          <span class="text-xs font-medium text-yellow-800 dark:text-yellow-300">Valor Restante:</span>
        </div>
        <span class="text-sm font-bold text-yellow-900 dark:text-yellow-200">
          {{ formatCurrency(remainingValue) }}
        </span>
      </div>

      <!-- Payments List -->
      <div v-if="subtask.payments.length > 0" class="mt-2 space-y-1">
        <div
          v-for="payment in subtask.payments"
          :key="payment.id"
          class="flex items-center justify-between text-xs text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 rounded px-2 py-1"
        >
          <span>
            {{ formatDate(payment.date) }} - {{ formatCurrency(payment.amount) }}
            <span v-if="payment.note" class="italic">{{ payment.note }}</span>
          </span>
          <button
            @click="handleDeletePayment(payment.id)"
            class="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
            title="Remover pagamento"
          >
            <i class="fas fa-times"></i>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { computed } from 'vue';
  import type { ISubtask } from '../../types/freelancer';

  interface Props {
    subtask: ISubtask;
    clientId: string;
    projectId: string;
    hourlyRate: number;
  }

  const props = defineProps<Props>();

  const emit = defineEmits<{
    toggle: [clientId: string, projectId: string, subtaskId: string];
    delete: [clientId: string, projectId: string, subtaskId: string];
    addPayment: [clientId: string, projectId: string, subtaskId: string];
    deletePayment: [clientId: string, projectId: string, subtaskId: string, paymentId: string];
  }>();

  const totalValue = computed(() => props.subtask.projectedHours * props.hourlyRate);
  
  const paidValue = computed(() => {
    return props.subtask.payments.reduce((total, payment) => total + payment.amount, 0);
  });

  const remainingValue = computed(() => {
    return Math.max(totalValue.value - paidValue.value, 0);
  });

  const progressPercentage = computed(() => {
    if (totalValue.value === 0) return 0;
    return Math.min((paidValue.value / totalValue.value) * 100, 100);
  });

  const paymentStatus = computed((): 'paid' | 'partial' | 'pending' => {
    if (paidValue.value >= totalValue.value) return 'paid';
    if (paidValue.value > 0) return 'partial';
    return 'pending';
  });

  const progressBarClass = computed(() => {
    switch (paymentStatus.value) {
      case 'paid':
        return 'bg-green-500 dark:bg-green-600';
      case 'partial':
        return 'bg-yellow-500 dark:bg-yellow-600';
      default:
        return 'bg-gray-300 dark:bg-gray-600';
    }
  });

  const paidTextClass = computed(() => {
    switch (paymentStatus.value) {
      case 'paid':
        return 'text-green-600 dark:text-green-400 font-bold';
      case 'partial':
        return 'text-yellow-600 dark:text-yellow-400 font-bold';
      default:
        return 'text-gray-500 dark:text-gray-500';
    }
  });

  const paymentButtonClass = computed(() => {
    switch (paymentStatus.value) {
      case 'paid':
        return 'bg-green-500 hover:bg-green-600 dark:bg-green-600 dark:hover:bg-green-700';
      case 'partial':
        return 'bg-yellow-500 hover:bg-yellow-600 dark:bg-yellow-600 dark:hover:bg-yellow-700';
      default:
        return 'bg-blue-500 hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700';
    }
  });

  const paymentIcon = computed(() => {
    switch (paymentStatus.value) {
      case 'paid':
        return 'fas fa-check-circle';
      case 'partial':
        return 'fas fa-clock';
      default:
        return 'fas fa-dollar-sign';
    }
  });

  const paymentButtonText = computed(() => {
    switch (paymentStatus.value) {
      case 'paid':
        return 'Pago';
      case 'partial':
        return 'Parcial';
      default:
        return 'Pagar';
    }
  });

  const paymentButtonTitle = computed(() => {
    switch (paymentStatus.value) {
      case 'paid':
        return 'Pagamento completo';
      case 'partial':
        return `Pago: ${formatCurrency(paidValue.value)} de ${formatCurrency(totalValue.value)}`;
      default:
        return 'Registrar pagamento';
    }
  });

  const formatCurrency = (value: number): string => {
    return value.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    });
  };

  const formatDate = (dateString?: string): string => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    const dateStr = date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
    const timeStr = date.toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
    });
    return `${dateStr} ${timeStr}`;
  };

  const handleToggle = () => {
    emit('toggle', props.clientId, props.projectId, props.subtask.id);
  };

  const handleDelete = () => {
    emit('delete', props.clientId, props.projectId, props.subtask.id);
  };

  const handleAddPayment = () => {
    emit('addPayment', props.clientId, props.projectId, props.subtask.id);
  };

  const handleDeletePayment = (paymentId: string) => {
    emit('deletePayment', props.clientId, props.projectId, props.subtask.id, paymentId);
  };
</script>

<script lang="ts">
  export default {
    name: 'SubtaskItem',
  };
</script>
