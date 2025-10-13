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

      <div class="flex flex-col lg:flex-row lg:justify-between lg:items-center mb-8 gap-4">
        <h1 class="text-2xl lg:text-3xl font-bold text-gray-900 dark:text-gray-100">Gestão de Freelancers</h1>
        <div class="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
          <!-- Hourly Rate Display -->
          <div
            class="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm border border-gray-200 dark:border-gray-700 theme-transition"
          >
            <div class="flex items-center justify-between sm:justify-start sm:gap-3">
              <div class="flex flex-col sm:flex-row sm:items-center sm:gap-3">
                <span class="text-sm text-gray-600 dark:text-gray-400">Valor/hora:</span>
                <span class="text-lg lg:text-xl font-bold text-gray-900 dark:text-gray-100">
                  {{ formatCurrency(settings.hourlyRate) }}
                </span>
              </div>
              <button
                @click="openModal('hourlyRate')"
                class="bg-indigo-500 hover:bg-indigo-600 dark:bg-indigo-600 dark:hover:bg-indigo-700 text-white px-3 py-2 lg:px-4 lg:py-2 rounded transition-colors text-sm"
              >
                Editar
              </button>
            </div>
          </div>
          <!-- Add Client Button -->
          <button
            @click="openModal('client')"
            class="bg-blue-500 hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold shadow-md transition-colors flex items-center justify-center gap-2"
          >
            <i class="fas fa-plus-circle"></i>
            <span class="hidden sm:inline">Adicionar Cliente</span>
            <span class="sm:hidden">Novo Cliente</span>
          </button>
        </div>
      </div>

      <!-- Resumo Financeiro -->
      <div v-if="clients.length > 0" class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <!-- Total Revenue -->
        <div class="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700 theme-transition">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm font-medium text-gray-600 dark:text-gray-400">Total Projetado</p>
              <p class="text-2xl font-bold text-gray-900 dark:text-gray-100">{{ formatCurrency(totalRevenue) }}</p>
            </div>
            <div class="bg-blue-100 dark:bg-blue-900/30 p-3 rounded-full">
              <i class="fas fa-chart-line text-blue-600 dark:text-blue-400 text-xl"></i>
            </div>
          </div>
        </div>

        <!-- Total Paid -->
        <div class="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700 theme-transition">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm font-medium text-gray-600 dark:text-gray-400">Total Pago</p>
              <p class="text-2xl font-bold text-green-600 dark:text-green-400">{{ formatCurrency(totalPaid) }}</p>
            </div>
            <div class="bg-green-100 dark:bg-green-900/30 p-3 rounded-full">
              <i class="fas fa-check-circle text-green-600 dark:text-green-400 text-xl"></i>
            </div>
          </div>
        </div>

        <!-- Total Pending -->
        <div class="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700 theme-transition">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm font-medium text-gray-600 dark:text-gray-400">Total Pendente</p>
              <p class="text-2xl font-bold text-orange-600 dark:text-orange-400">{{ formatCurrency(totalPending) }}</p>
            </div>
            <div class="bg-orange-100 dark:bg-orange-900/30 p-3 rounded-full">
              <i class="fas fa-clock text-orange-600 dark:text-orange-400 text-xl"></i>
            </div>
          </div>
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
        <div class="bg-white dark:bg-gray-800 rounded-xl p-6 w-full max-w-md mx-4 shadow-xl theme-transition max-h-[90vh] overflow-y-auto">
          <h2 class="text-xl lg:text-2xl font-bold mb-4 text-gray-900 dark:text-gray-100">Adicionar Cliente</h2>
          <form @submit.prevent="handleSubmitClient">
            <div class="mb-4">
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"> Nome do Cliente </label>
              <input
                v-model="clientForm.clientName"
                type="text"
                required
                class="w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 p-3 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent theme-transition text-base"
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
                class="w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 p-3 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent theme-transition text-base"
              />
            </div>
            <div class="flex flex-col sm:flex-row gap-3 justify-end">
              <button
                type="button"
                @click="closeModal"
                class="order-2 sm:order-1 bg-gray-500 hover:bg-gray-600 dark:bg-gray-600 dark:hover:bg-gray-700 text-white px-6 py-3 rounded-lg transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                class="order-1 sm:order-2 bg-blue-500 hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700 text-white px-6 py-3 rounded-lg transition-colors"
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
                Horas Pagas
              </label>
              <input
                v-model.number="paymentForm.hours"
                type="number"
                step="0.1"
                min="0.1"
                required
                placeholder="Ex: 2.5"
                class="w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 p-3 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent theme-transition"
              />
              <p class="mt-2 text-sm text-gray-600 dark:text-gray-400">
                Valor calculado: 
                <span class="font-bold text-green-600 dark:text-green-400">
                  {{ formatCurrency((paymentForm.hours || 0) * settings.hourlyRate) }}
                </span>
                ({{ paymentForm.hours || 0 }}h × {{ formatCurrency(settings.hourlyRate) }}/h)
              </p>
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
    totalRevenue,
    totalPaid,
    totalPending,
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
  const paymentForm = ref({ hours: 0, note: '' });

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

  const handleSubmitPayment = async () => {
    if (modalState.value.clientId && modalState.value.projectId && modalState.value.subtaskId) {
      try {
        // Calculate amount based on hours and hourly rate
        const amount = paymentForm.value.hours * settings.value.hourlyRate;
        
        await addPayment(
          modalState.value.clientId,
          modalState.value.projectId,
          modalState.value.subtaskId,
          amount,
          paymentForm.value.note || undefined
        );
        paymentForm.value = { hours: 0, note: '' };
        closeModal();
      } catch (err) {
        console.error('Erro ao adicionar pagamento:', err);
      }
    }
  };

  const handleDeletePayment = async (clientId: string, projectId: string, subtaskId: string, paymentId: string) => {
    if (confirm('Deseja realmente remover este pagamento?')) {
      try {
        await deletePayment(clientId, projectId, subtaskId, paymentId);
      } catch (err) {
        console.error('Erro ao remover pagamento:', err);
      }
    }
  };
</script>

<script lang="ts">
  export default {
    name: 'FreelancerManagement',
  };
</script>
