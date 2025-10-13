<template>
  <div class="mb-6 border-2 border-blue-500 dark:border-blue-600 rounded-xl overflow-hidden shadow-lg theme-transition">
    <!-- Client Header -->
    <div
      @click="toggleExpanded"
      class="p-4 sm:p-6 bg-blue-500 dark:bg-blue-600 text-white cursor-pointer hover:bg-blue-600 dark:hover:bg-blue-700 theme-transition"
    >
      <!-- Desktop Layout -->
      <div class="hidden sm:flex justify-between items-center">
        <div class="flex items-center gap-4 flex-1">
          <i :class="isExpanded ? 'fas fa-chevron-down' : 'fas fa-chevron-right'" class="text-2xl"></i>
          <h3 class="font-bold text-2xl">{{ client.clientName }}</h3>
        </div>
        <div class="flex items-center gap-6">
          <div class="text-right">
            <div class="text-sm opacity-90">{{ servicesCount }} serviços</div>
            <div class="text-2xl font-bold">{{ formatCurrency(clientTotal) }}</div>
            <div class="text-xs opacity-80">
              Pago: <span class="text-green-300">{{ formatCurrency(clientPaid) }}</span> | 
              Pendente: <span class="text-orange-300">{{ formatCurrency(clientPending) }}</span>
            </div>
          </div>
          <button
            @click.stop="handleWhatsApp"
            class="bg-green-500 hover:bg-green-600 dark:bg-green-600 dark:hover:bg-green-700 text-white px-5 py-3 rounded-lg font-semibold transition-colors flex items-center gap-2 whitespace-nowrap"
          >
            <i class="fab fa-whatsapp text-xl"></i>
            WhatsApp
          </button>
          <button
            @click.stop="handleAddProject"
            class="bg-emerald-500 hover:bg-emerald-600 dark:bg-emerald-600 dark:hover:bg-emerald-700 text-white px-5 py-3 rounded-lg font-semibold transition-colors whitespace-nowrap"
          >
            + Projeto
          </button>
          <button
            @click.stop="handleDelete"
            class="bg-red-500 hover:bg-red-600 dark:bg-red-600 dark:hover:bg-red-700 text-white px-5 py-3 rounded-lg font-semibold transition-colors"
          >
            Excluir
          </button>
        </div>
      </div>

      <!-- Mobile Layout -->
      <div class="sm:hidden">
        <!-- Header Row - Nome do Cliente -->
        <div class="flex items-center gap-3 mb-3">
          <i :class="isExpanded ? 'fas fa-chevron-down' : 'fas fa-chevron-right'" class="text-lg flex-shrink-0"></i>
          <h3 class="font-bold text-xl leading-tight flex-1 break-words">{{ client.clientName }}</h3>
        </div>

        <!-- Stats Row -->
        <div class="bg-white/10 rounded-lg p-3 mb-4">
          <div class="grid grid-cols-3 gap-2 text-center">
            <div>
              <div class="text-xs opacity-75 uppercase tracking-wide">Serviços</div>
              <div class="text-lg font-bold">{{ servicesCount }}</div>
            </div>
            <div>
              <div class="text-xs opacity-75 uppercase tracking-wide">Total</div>
              <div class="text-lg font-bold">{{ formatCurrency(clientTotal) }}</div>
            </div>
            <div>
              <div class="text-xs opacity-75 uppercase tracking-wide">Pendente</div>
              <div class="text-lg font-bold text-orange-300">{{ formatCurrency(clientPending) }}</div>
            </div>
          </div>
          <div class="mt-2 pt-2 border-t border-white/20 text-center">
            <div class="text-xs opacity-75">
              Pago: <span class="text-green-300 font-semibold">{{ formatCurrency(clientPaid) }}</span>
            </div>
          </div>
        </div>

        <!-- Actions Row -->
        <div class="grid grid-cols-2 gap-2">
          <button
            @click.stop="handleWhatsApp"
            class="bg-green-500 hover:bg-green-600 dark:bg-green-600 dark:hover:bg-green-700 text-white px-4 py-3 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 text-sm"
          >
            <i class="fab fa-whatsapp text-base"></i>
            WhatsApp
          </button>
          <button
            @click.stop="handleAddProject"
            class="bg-emerald-500 hover:bg-emerald-600 dark:bg-emerald-600 dark:hover:bg-emerald-700 text-white px-4 py-3 rounded-lg font-medium transition-colors text-sm"
          >
            + Novo Projeto
          </button>
        </div>
        
        <!-- Delete Button (Secondary) -->
        <button
          @click.stop="handleDelete"
          class="w-full mt-2 bg-red-500/20 hover:bg-red-500/30 border border-red-300/30 text-red-100 px-4 py-2 rounded-lg font-medium transition-colors text-sm"
        >
          <i class="fas fa-trash text-xs mr-2"></i>
          Excluir Cliente
        </button>
      </div>
    </div>

    <!-- Client Content -->
    <div v-show="isExpanded" class="p-6 bg-white dark:bg-gray-900 theme-transition">
      <div v-if="client.projects.length === 0" class="text-center text-gray-500 dark:text-gray-400 py-12 text-lg">
        Nenhum projeto adicionado
      </div>
      <div v-else>
        <ProjectCard
          v-for="project in client.projects"
          :key="project.id"
          :project="project"
          :client-id="client.id"
          :hourly-rate="hourlyRate"
          @add-subtask="(clientId, projectId) => $emit('addSubtask', clientId, projectId)"
          @delete-project="(clientId, projectId) => $emit('deleteProject', clientId, projectId)"
          @toggle-subtask="(clientId, projectId, subtaskId) => $emit('toggleSubtask', clientId, projectId, subtaskId)"
          @delete-subtask="(clientId, projectId, subtaskId) => $emit('deleteSubtask', clientId, projectId, subtaskId)"
          @add-payment="(clientId, projectId, subtaskId) => $emit('addPayment', clientId, projectId, subtaskId)"
          @delete-payment="
            (clientId, projectId, subtaskId, paymentId) =>
              $emit('deletePayment', clientId, projectId, subtaskId, paymentId)
          "
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { ref, computed } from 'vue';
  import type { IClient } from '../../types/freelancer';
  import ProjectCard from './ProjectCard.vue';

  interface Props {
    client: IClient;
    hourlyRate: number;
  }

  const props = defineProps<Props>();

  const emit = defineEmits<{
    addProject: [clientId: string];
    deleteClient: [clientId: string];
    addSubtask: [clientId: string, projectId: string];
    deleteProject: [clientId: string, projectId: string];
    toggleSubtask: [clientId: string, projectId: string, subtaskId: string];
    deleteSubtask: [clientId: string, projectId: string, subtaskId: string];
    addPayment: [clientId: string, projectId: string, subtaskId: string];
    deletePayment: [clientId: string, projectId: string, subtaskId: string, paymentId: string];
  }>();

  const isExpanded = ref(true);

  const clientTotal = computed(() => {
    return props.client.projects.reduce((total, project) => {
      const projectTotal = project.subtasks.reduce((subTotal, subtask) => {
        return subTotal + subtask.projectedHours * props.hourlyRate;
      }, 0);
      return total + projectTotal;
    }, 0);
  });

  const clientPaid = computed(() => {
    return props.client.projects.reduce((total, project) => {
      return total + project.subtasks.reduce((subtaskTotal, subtask) => {
        return subtaskTotal + subtask.payments.reduce((paymentTotal, payment) => {
          return paymentTotal + payment.amount;
        }, 0);
      }, 0);
    }, 0);
  });

  const clientPending = computed(() => {
    return clientTotal.value - clientPaid.value;
  });

  const servicesCount = computed(() => {
    return props.client.projects.reduce((total, project) => {
      return total + project.subtasks.length;
    }, 0);
  });

  const formatCurrency = (value: number): string => {
    return value.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    });
  };

  const toggleExpanded = () => {
    isExpanded.value = !isExpanded.value;
  };

  const handleWhatsApp = () => {
    const cleanNumber = props.client.whatsappNumber.replace(/\D/g, '');
    const url = `https://wa.me/${cleanNumber}`;
    window.open(url, '_blank');
  };

  const handleAddProject = () => {
    emit('addProject', props.client.id);
  };

  const handleDelete = () => {
    if (confirm(`Deseja realmente excluir o cliente "${props.client.clientName}"?`)) {
      emit('deleteClient', props.client.id);
    }
  };
</script>

<script lang="ts">
  export default {
    name: 'ClientCard',
  };
</script>
