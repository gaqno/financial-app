<template>
  <div class="ml-4 sm:ml-8 mb-4 border border-gray-300 dark:border-gray-600 rounded-lg overflow-hidden theme-transition">
    <!-- Project Header -->
    <div
      @click="toggleExpanded"
      class="p-4 bg-gray-50 dark:bg-gray-800 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 theme-transition"
    >
      <!-- Desktop Layout -->
      <div class="hidden sm:flex justify-between items-center">
        <div class="flex items-center gap-3 flex-1">
          <i
            :class="isExpanded ? 'fas fa-chevron-down' : 'fas fa-chevron-right'"
            class="text-gray-600 dark:text-gray-400"
          ></i>
          <h4 class="font-semibold text-lg text-gray-900 dark:text-gray-100">{{ project.projectName }}</h4>
          <span class="text-sm text-gray-500 dark:text-gray-400">({{ project.subtasks.length }} tarefas)</span>
        </div>
        <div class="flex items-center gap-3">
          <span class="font-bold text-lg text-gray-900 dark:text-gray-100">
            {{ formatCurrency(projectTotal) }}
          </span>
          <button
            @click.stop="handleAddSubtask"
            class="bg-green-500 hover:bg-green-600 dark:bg-green-600 dark:hover:bg-green-700 text-white px-4 py-2 rounded transition-colors whitespace-nowrap"
          >
            + Tarefa
          </button>
          <button
            @click.stop="handleDelete"
            class="bg-red-500 hover:bg-red-600 dark:bg-red-600 dark:hover:bg-red-700 text-white px-4 py-2 rounded transition-colors"
          >
            Excluir
          </button>
        </div>
      </div>

      <!-- Mobile Layout -->
      <div class="sm:hidden space-y-3">
        <!-- Header Row -->
        <div class="flex items-start gap-3">
          <i
            :class="isExpanded ? 'fas fa-chevron-down' : 'fas fa-chevron-right'"
            class="text-gray-600 dark:text-gray-400 mt-1 flex-shrink-0"
          ></i>
          <div class="flex-1 min-w-0">
            <h4 class="font-semibold text-base text-gray-900 dark:text-gray-100 break-words leading-tight">
              {{ project.projectName }}
            </h4>
            <div class="flex items-center gap-4 mt-1">
              <span class="text-xs text-gray-500 dark:text-gray-400">
                {{ project.subtasks.length }} {{ project.subtasks.length === 1 ? 'tarefa' : 'tarefas' }}
              </span>
              <span class="font-bold text-sm text-gray-900 dark:text-gray-100">
                {{ formatCurrency(projectTotal) }}
              </span>
            </div>
          </div>
        </div>

        <!-- Actions Row -->
        <div class="flex gap-2 pt-1">
          <button
            @click.stop="handleAddSubtask"
            class="flex-1 bg-green-500 hover:bg-green-600 dark:bg-green-600 dark:hover:bg-green-700 text-white px-4 py-2.5 rounded-lg font-medium transition-colors text-sm"
          >
            + Nova Tarefa
          </button>
          <button
            @click.stop="handleDelete"
            class="bg-red-500 hover:bg-red-600 dark:bg-red-600 dark:hover:bg-red-700 text-white px-4 py-2.5 rounded-lg font-medium transition-colors"
          >
            <i class="fas fa-trash text-sm"></i>
          </button>
        </div>
      </div>
    </div>

    <!-- Project Content -->
    <div v-show="isExpanded" class="p-4 bg-white dark:bg-gray-900 theme-transition">
      <div v-if="project.subtasks.length === 0" class="text-center text-gray-500 dark:text-gray-400 py-8">
        Nenhuma tarefa adicionada
      </div>
      <div v-else>
        <!-- Desktop Subtasks Header -->
        <div
          class="hidden lg:grid grid-cols-[2fr_1fr_1fr_140px_80px_100px_60px] gap-4 p-3 bg-gray-100 dark:bg-gray-800 border-b-2 border-gray-300 dark:border-gray-600 font-semibold text-gray-700 dark:text-gray-300"
        >
          <div>Nome da Tarefa</div>
          <div>Horas</div>
          <div>Preço Total</div>
          <div class="text-center">Criado em</div>
          <div class="text-center">Concluída</div>
          <div class="text-center">Pagamento</div>
          <div class="text-center">Ações</div>
        </div>
        
        <!-- Mobile Header -->
        <div class="lg:hidden p-3 bg-gray-100 dark:bg-gray-800 border-b-2 border-gray-300 dark:border-gray-600">
          <h5 class="font-semibold text-gray-700 dark:text-gray-300 text-center">
            Tarefas do Projeto
          </h5>
        </div>
        
        <!-- Subtasks List -->
        <SubtaskItem
          v-for="subtask in project.subtasks"
          :key="subtask.id"
          :subtask="subtask"
          :client-id="clientId"
          :project-id="project.id"
          :hourly-rate="hourlyRate"
          @toggle="(clientId, projectId, subtaskId) => $emit('toggleSubtask', clientId, projectId, subtaskId)"
          @delete="(clientId, projectId, subtaskId) => $emit('deleteSubtask', clientId, projectId, subtaskId)"
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
  import type { IProject } from '../../types/freelancer';
  import SubtaskItem from './SubtaskItem.vue';

  interface Props {
    project: IProject;
    clientId: string;
    hourlyRate: number;
  }

  const props = defineProps<Props>();

  const emit = defineEmits<{
    addSubtask: [clientId: string, projectId: string];
    deleteProject: [clientId: string, projectId: string];
    toggleSubtask: [clientId: string, projectId: string, subtaskId: string];
    deleteSubtask: [clientId: string, projectId: string, subtaskId: string];
    addPayment: [clientId: string, projectId: string, subtaskId: string];
    deletePayment: [clientId: string, projectId: string, subtaskId: string, paymentId: string];
  }>();

  const isExpanded = ref(true);

  const projectTotal = computed(() => {
    return props.project.subtasks.reduce((total, subtask) => {
      return total + subtask.projectedHours * props.hourlyRate;
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

  const handleAddSubtask = () => {
    emit('addSubtask', props.clientId, props.project.id);
  };

  const handleDelete = () => {
    emit('deleteProject', props.clientId, props.project.id);
  };
</script>

<script lang="ts">
  export default {
    name: 'ProjectCard',
  };
</script>
