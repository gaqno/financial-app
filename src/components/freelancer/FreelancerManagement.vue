<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-900 theme-transition">
    <!-- Header -->
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <!-- Error Message -->
      <div
        v-if="error"
        class="mb-4 bg-red-100 dark:bg-red-900/30 border border-red-400 dark:border-red-700 text-red-700 dark:text-red-300 px-4 py-3 rounded-lg"
        role="alert"
      >
        <div class="flex items-center">
          <i class="fas fa-exclamation-circle mr-2"></i>
          <span>{{ error }}</span>
        </div>
      </div>

      <div class="flex justify-between items-center mb-8">
        <h1 class="text-3xl font-bold text-gray-900 dark:text-gray-100">Gestão de Freelancers</h1>
        <div class="flex items-center gap-4">
          <!-- Hourly Rate Display -->
          <div
            class="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm border border-gray-200 dark:border-gray-700 theme-transition"
          >
            <div class="flex items-center gap-3">
              <span class="text-sm text-gray-600 dark:text-gray-400">Valor/hora:</span>
              <span class="text-xl font-bold text-gray-900 dark:text-gray-100">
                {{ formatCurrency(settings.hourlyRate) }}
              </span>
              <button
                @click="openModal('hourlyRate')"
                class="bg-indigo-500 hover:bg-indigo-600 dark:bg-indigo-600 dark:hover:bg-indigo-700 text-white px-4 py-2 rounded transition-colors"
              >
                Editar
              </button>
            </div>
          </div>
          <!-- Add Client Button -->
          <button
            @click="openModal('client')"
            class="bg-blue-500 hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold shadow-md transition-colors flex items-center gap-2"
          >
            <i class="fas fa-plus-circle"></i>
            Adicionar Cliente
          </button>
        </div>
      </div>

      <!-- Loading State -->
      <div v-if="loading && clients.length === 0" class="text-center py-12">
        <div class="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        <p class="mt-4 text-gray-600 dark:text-gray-400">Carregando dados...</p>
      </div>

      <!-- Empty State -->
      <div
        v-else-if="!loading && clients.length === 0"
        class="text-center bg-white dark:bg-gray-800 rounded-xl p-12 border-2 border-dashed border-gray-300 dark:border-gray-700 theme-transition"
      >
        <i class="fas fa-users text-6xl text-gray-400 dark:text-gray-600 mb-4"></i>
        <p class="text-xl text-gray-600 dark:text-gray-400">
          Nenhum cliente cadastrado. Clique em "Adicionar Cliente" para começar.
        </p>
      </div>

      <!-- Clients List -->
      <div v-else>
        <ClientCard
          v-for="client in clients"
          :key="client.id"
          :client="client"
          :hourly-rate="settings.hourlyRate"
          @add-project="handleAddProject"
          @delete-client="handleDeleteClient"
          @add-subtask="handleAddSubtask"
          @delete-project="handleDeleteProject"
          @toggle-subtask="toggleSubtaskCompletion"
          @delete-subtask="handleDeleteSubtask"
          @add-payment="handleAddPayment"
          @delete-payment="handleDeletePayment"
        />
      </div>
    </div>

    <!-- Modals -->
    <Teleport to="body">
      <!-- Add Client Modal -->
      <div
        v-if="modalState.isOpen && modalState.type === 'client'"
        class="fixed inset-0 bg-black bg-opacity-50 dark:bg-opacity-70 flex items-center justify-center z-50 p-4"
        @click.self="closeModal"
      >
        <div class="bg-white dark:bg-gray-800 rounded-xl p-6 w-full max-w-md shadow-xl theme-transition">
          <h2 class="text-2xl font-bold mb-4 text-gray-900 dark:text-gray-100">Adicionar Cliente</h2>
          <form @submit.prevent="handleSubmitClient">
            <div class="mb-4">
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"> Nome do Cliente </label>
              <input
                v-model="clientForm.clientName"
                type="text"
                required
                class="w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 p-3 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent theme-transition"
              />
            </div>
            <div class="mb-6">
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                WhatsApp (Ex: 5511999999999)
              </label>
              <input
                v-model="clientForm.whatsappNumber"
                type="text"
                required
                minlength="10"
                class="w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 p-3 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent theme-transition"
              />
            </div>
            <div class="flex gap-3 justify-end">
              <button
                type="button"
                @click="closeModal"
                class="bg-gray-500 hover:bg-gray-600 dark:bg-gray-600 dark:hover:bg-gray-700 text-white px-6 py-2 rounded-lg transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                class="bg-blue-500 hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition-colors"
              >
                Adicionar
              </button>
            </div>
          </form>
        </div>
      </div>

      <!-- Add Project Modal -->
      <div
        v-if="modalState.isOpen && modalState.type === 'project'"
        class="fixed inset-0 bg-black bg-opacity-50 dark:bg-opacity-70 flex items-center justify-center z-50 p-4"
        @click.self="closeModal"
      >
        <div class="bg-white dark:bg-gray-800 rounded-xl p-6 w-full max-w-md shadow-xl theme-transition">
          <h2 class="text-2xl font-bold mb-4 text-gray-900 dark:text-gray-100">Adicionar Projeto</h2>
          <form @submit.prevent="handleSubmitProject">
            <div class="mb-6">
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"> Nome do Projeto </label>
              <input
                v-model="projectForm.projectName"
                type="text"
                required
                class="w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 p-3 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent theme-transition"
              />
            </div>
            <div class="flex gap-3 justify-end">
              <button
                type="button"
                @click="closeModal"
                class="bg-gray-500 hover:bg-gray-600 dark:bg-gray-600 dark:hover:bg-gray-700 text-white px-6 py-2 rounded-lg transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                class="bg-green-500 hover:bg-green-600 dark:bg-green-600 dark:hover:bg-green-700 text-white px-6 py-2 rounded-lg transition-colors"
              >
                Adicionar
              </button>
            </div>
          </form>
        </div>
      </div>

      <!-- Add Subtask Modal -->
      <div
        v-if="modalState.isOpen && modalState.type === 'subtask'"
        class="fixed inset-0 bg-black bg-opacity-50 dark:bg-opacity-70 flex items-center justify-center z-50 p-4"
        @click.self="closeModal"
      >
        <div class="bg-white dark:bg-gray-800 rounded-xl p-6 w-full max-w-md shadow-xl theme-transition">
          <h2 class="text-2xl font-bold mb-4 text-gray-900 dark:text-gray-100">Adicionar Tarefa</h2>
          <form @submit.prevent="handleSubmitSubtask">
            <div class="mb-4">
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"> Nome da Tarefa </label>
              <input
                v-model="subtaskForm.taskName"
                type="text"
                required
                class="w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 p-3 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent theme-transition"
              />
            </div>
            <div class="mb-6">
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Horas Projetadas
                <span class="text-xs text-gray-500 dark:text-gray-400 ml-2"> (Ex: 6.5 = 6h30min, 4.1 = 4h06min) </span>
              </label>
              <input
                v-model.number="subtaskForm.projectedHours"
                type="number"
                step="0.1"
                min="0.1"
                required
                class="w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 p-3 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent theme-transition"
              />
            </div>
            <div class="flex gap-3 justify-end">
              <button
                type="button"
                @click="closeModal"
                class="bg-gray-500 hover:bg-gray-600 dark:bg-gray-600 dark:hover:bg-gray-700 text-white px-6 py-2 rounded-lg transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                class="bg-green-500 hover:bg-green-600 dark:bg-green-600 dark:hover:bg-green-700 text-white px-6 py-2 rounded-lg transition-colors"
              >
                Adicionar
              </button>
            </div>
          </form>
        </div>
      </div>

      <!-- Edit Hourly Rate Modal -->
      <div
        v-if="modalState.isOpen && modalState.type === 'hourlyRate'"
        class="fixed inset-0 bg-black bg-opacity-50 dark:bg-opacity-70 flex items-center justify-center z-50 p-4"
        @click.self="closeModal"
      >
        <div class="bg-white dark:bg-gray-800 rounded-xl p-6 w-full max-w-md shadow-xl theme-transition">
          <h2 class="text-2xl font-bold mb-4 text-gray-900 dark:text-gray-100">Editar Valor da Hora</h2>
          <form @submit.prevent="handleSubmitHourlyRate">
            <div class="mb-6">
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Valor por Hora (R$)
              </label>
              <input
                v-model.number="hourlyRateForm.rate"
                type="number"
                step="0.01"
                min="1"
                required
                class="w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 p-3 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent theme-transition"
              />
            </div>
            <div class="flex gap-3 justify-end">
              <button
                type="button"
                @click="closeModal"
                class="bg-gray-500 hover:bg-gray-600 dark:bg-gray-600 dark:hover:bg-gray-700 text-white px-6 py-2 rounded-lg transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                class="bg-indigo-500 hover:bg-indigo-600 dark:bg-indigo-600 dark:hover:bg-indigo-700 text-white px-6 py-2 rounded-lg transition-colors"
              >
                Salvar
              </button>
            </div>
          </form>
        </div>
      </div>

      <!-- Add Payment Modal -->
      <div
        v-if="modalState.isOpen && modalState.type === 'payment'"
        class="fixed inset-0 bg-black bg-opacity-50 dark:bg-opacity-70 flex items-center justify-center z-50 p-4"
        @click.self="closeModal"
      >
        <div class="bg-white dark:bg-gray-800 rounded-xl p-6 w-full max-w-md shadow-xl theme-transition">
          <h2 class="text-2xl font-bold mb-4 text-gray-900 dark:text-gray-100">Registrar Pagamento</h2>
          <form @submit.prevent="handleSubmitPayment">
            <div class="mb-4">
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Valor Recebido (R$)
              </label>
              <input
                v-model.number="paymentForm.amount"
                type="number"
                step="0.01"
                min="0.01"
                required
                class="w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 p-3 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent theme-transition"
              />
            </div>
            <div class="mb-6">
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Observação (Opcional)
              </label>
              <input
                v-model="paymentForm.note"
                type="text"
                placeholder="Ex: Primeira parcela"
                class="w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 p-3 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent theme-transition"
              />
            </div>
            <div class="flex gap-3 justify-end">
              <button
                type="button"
                @click="closeModal"
                class="bg-gray-500 hover:bg-gray-600 dark:bg-gray-600 dark:hover:bg-gray-700 text-white px-6 py-2 rounded-lg transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                class="bg-green-500 hover:bg-green-600 dark:bg-green-600 dark:hover:bg-green-700 text-white px-6 py-2 rounded-lg transition-colors"
              >
                Registrar
              </button>
            </div>
          </form>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
  import { ref } from 'vue';
  import { useFreelancerManagement } from '../../composables/freelancer/useFreelancerManagement';
  import ClientCard from './ClientCard.vue';

  const {
    clients,
    settings,
    modalState,
    loading,
    error,
    openModal,
    closeModal,
    addClient,
    deleteClient,
    addProject,
    deleteProject,
    addSubtask,
    toggleSubtaskCompletion,
    deleteSubtask,
    updateHourlyRate,
    addPayment,
    deletePayment,
  } = useFreelancerManagement();

  // Form states
  const clientForm = ref({ clientName: '', whatsappNumber: '' });
  const projectForm = ref({ projectName: '' });
  const subtaskForm = ref({ taskName: '', projectedHours: 0 });
  const hourlyRateForm = ref({ rate: settings.value.hourlyRate });
  const paymentForm = ref({ amount: 0, note: '' });

  const formatCurrency = (value: number): string => {
    return value.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    });
  };

  const handleSubmitClient = () => {
    addClient(clientForm.value.clientName, clientForm.value.whatsappNumber);
    clientForm.value = { clientName: '', whatsappNumber: '' };
    closeModal();
  };

  const handleAddProject = (clientId: string) => {
    openModal('project', clientId);
  };

  const handleSubmitProject = () => {
    if (modalState.value.clientId) {
      addProject(modalState.value.clientId, projectForm.value.projectName);
      projectForm.value = { projectName: '' };
      closeModal();
    }
  };

  const handleAddSubtask = (clientId: string, projectId: string) => {
    openModal('subtask', clientId, projectId);
  };

  const handleSubmitSubtask = () => {
    if (modalState.value.clientId && modalState.value.projectId) {
      addSubtask(
        modalState.value.clientId,
        modalState.value.projectId,
        subtaskForm.value.taskName,
        subtaskForm.value.projectedHours
      );
      subtaskForm.value = { taskName: '', projectedHours: 0 };
      closeModal();
    }
  };

  const handleSubmitHourlyRate = () => {
    updateHourlyRate(hourlyRateForm.value.rate);
    closeModal();
  };

  const handleDeleteClient = (clientId: string) => {
    deleteClient(clientId);
  };

  const handleDeleteProject = (clientId: string, projectId: string) => {
    deleteProject(clientId, projectId);
  };

  const handleDeleteSubtask = (clientId: string, projectId: string, subtaskId: string) => {
    deleteSubtask(clientId, projectId, subtaskId);
  };

  const handleAddPayment = (clientId: string, projectId: string, subtaskId: string) => {
    openModal('payment', clientId, projectId, subtaskId);
  };

  const handleSubmitPayment = () => {
    if (modalState.value.clientId && modalState.value.projectId && modalState.value.subtaskId) {
      addPayment(
        modalState.value.clientId,
        modalState.value.projectId,
        modalState.value.subtaskId,
        paymentForm.value.amount,
        paymentForm.value.note || undefined
      );
      paymentForm.value = { amount: 0, note: '' };
      closeModal();
    }
  };

  const handleDeletePayment = (clientId: string, projectId: string, subtaskId: string, paymentId: string) => {
    if (confirm('Deseja realmente remover este pagamento?')) {
      deletePayment(clientId, projectId, subtaskId, paymentId);
    }
  };
</script>

<script lang="ts">
  export default {
    name: 'FreelancerManagement',
  };
</script>
