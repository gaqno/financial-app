import { ref, computed, onMounted } from 'vue';
import type { IClient, IProject, ISubtask, IFreelancerSettings, IModalState, IModalType, IPayment } from '../../types/freelancer';
import { clientsService, projectsService, subtasksService, paymentsService, settingsService } from '../../services/freelancerService';

export function useFreelancerManagement() {
  // State
  const clients = ref<IClient[]>([]);
  const settings = ref<IFreelancerSettings>({
    hourlyRate: 80,
  });
  const modalState = ref<IModalState>({
    isOpen: false,
    type: null,
  });
  const loading = ref(false);
  const error = ref<string | null>(null);

  // Computed
  const totalClients = computed(() => clients.value.length);
  
  const totalProjects = computed(() => 
    clients.value.reduce((total, client) => total + client.projects.length, 0)
  );

  const totalRevenue = computed(() => {
    return clients.value.reduce((clientTotal, client) => {
      return clientTotal + client.projects.reduce((projectTotal, project) => {
        return projectTotal + project.subtasks.reduce((subtaskTotal, subtask) => {
          return subtaskTotal + (subtask.projectedHours * settings.value.hourlyRate);
        }, 0);
      }, 0);
    }, 0);
  });

  // Calcula o total já pago
  const totalPaid = computed(() => {
    return clients.value.reduce((clientTotal, client) => {
      return clientTotal + client.projects.reduce((projectTotal, project) => {
        return projectTotal + project.subtasks.reduce((subtaskTotal, subtask) => {
          return subtaskTotal + subtask.payments.reduce((paymentTotal, payment) => {
            return paymentTotal + payment.amount;
          }, 0);
        }, 0);
      }, 0);
    }, 0);
  });

  // Calcula o total pendente (não pago ainda)
  const totalPending = computed(() => {
    return totalRevenue.value - totalPaid.value;
  });

  // Calcula o total pendente por cliente
  const calculateClientPending = (client: IClient) => {
    const clientTotal = calculateClientTotal(client);
    const clientPaid = client.projects.reduce((total, project) => {
      return total + project.subtasks.reduce((subtaskTotal, subtask) => {
        return subtaskTotal + subtask.payments.reduce((paymentTotal, payment) => {
          return paymentTotal + payment.amount;
        }, 0);
      }, 0);
    }, 0);
    return clientTotal - clientPaid;
  };

  // Calcula o total pendente por projeto
  const calculateProjectPending = (project: IProject) => {
    const projectTotal = calculateProjectTotal(project);
    const projectPaid = project.subtasks.reduce((total, subtask) => {
      return total + subtask.payments.reduce((paymentTotal, payment) => {
        return paymentTotal + payment.amount;
      }, 0);
    }, 0);
    return projectTotal - projectPaid;
  };

  // Calcula o total pendente por subtask
  const calculateSubtaskPending = (subtask: ISubtask) => {
    const subtaskTotal = calculateSubtaskTotal(subtask);
    const subtaskPaid = calculateSubtaskPaid(subtask);
    return subtaskTotal - subtaskPaid;
  };

  // Load data from Supabase
  const loadData = async () => {
    loading.value = true;
    error.value = null;
    try {
      console.log('[Freelancer] Iniciando carregamento de dados...');
      
      // Load settings
      console.log('[Freelancer] Carregando configurações...');
      const settingsData = await settingsService.get();
      if (settingsData) {
        settings.value = settingsData;
        console.log('[Freelancer] Configurações carregadas:', settingsData);
      } else {
        // Create default settings if none exist
        console.log('[Freelancer] Criando configurações padrão...');
        await settingsService.create(80);
        settings.value.hourlyRate = 80;
        console.log('[Freelancer] Configurações padrão criadas');
      }

      // Load clients with nested data
      console.log('[Freelancer] Carregando clientes...');
      const clientsData = await clientsService.getAll();
      clients.value = clientsData;
      console.log('[Freelancer] Clientes carregados:', clientsData.length, 'clientes');
      
      console.log('[Freelancer] Carregamento concluído com sucesso!');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
      error.value = `Erro ao carregar dados: ${errorMessage}`;
      console.error('[Freelancer] Erro ao carregar dados:', err);
    } finally {
      loading.value = false;
      console.log('[Freelancer] Loading finalizado');
    }
  };

  // Client Methods
  const addClient = async (clientName: string, whatsappNumber: string) => {
    loading.value = true;
    error.value = null;
    try {
      const clientId = await clientsService.create(clientName, whatsappNumber);
      const newClient: IClient = {
        id: clientId,
        clientName,
        whatsappNumber,
        projects: [],
        createdAt: new Date().toISOString(),
      };
      // Add to beginning of array (most recent first)
      clients.value.unshift(newClient);
    } catch (err) {
      error.value = 'Erro ao criar cliente';
      console.error(err);
      throw err;
    } finally {
      loading.value = false;
    }
  };

  const deleteClient = async (clientId: string) => {
    loading.value = true;
    error.value = null;
    try {
      await clientsService.delete(clientId);
      const index = clients.value.findIndex(c => c.id === clientId);
      if (index !== -1) {
        clients.value.splice(index, 1);
      }
    } catch (err) {
      error.value = 'Erro ao excluir cliente';
      console.error(err);
      throw err;
    } finally {
      loading.value = false;
    }
  };

  // Project Methods
  const addProject = async (clientId: string, projectName: string) => {
    loading.value = true;
    error.value = null;
    try {
      const projectId = await projectsService.create(clientId, projectName);
      const client = clients.value.find(c => c.id === clientId);
      if (client) {
        const newProject: IProject = {
          id: projectId,
          projectName,
          subtasks: [],
          createdAt: new Date().toISOString(),
        };
        // Add to beginning of array (most recent first)
        client.projects.unshift(newProject);
      }
    } catch (err) {
      error.value = 'Erro ao criar projeto';
      console.error(err);
      throw err;
    } finally {
      loading.value = false;
    }
  };

  const deleteProject = async (clientId: string, projectId: string) => {
    loading.value = true;
    error.value = null;
    try {
      await projectsService.delete(projectId);
      const client = clients.value.find(c => c.id === clientId);
      if (client) {
        const index = client.projects.findIndex(p => p.id === projectId);
        if (index !== -1) {
          client.projects.splice(index, 1);
        }
      }
    } catch (err) {
      error.value = 'Erro ao excluir projeto';
      console.error(err);
      throw err;
    } finally {
      loading.value = false;
    }
  };

  // Subtask Methods
  const addSubtask = async (clientId: string, projectId: string, taskName: string, projectedHours: number) => {
    loading.value = true;
    error.value = null;
    try {
      const subtaskId = await subtasksService.create(projectId, taskName, projectedHours);
      const client = clients.value.find(c => c.id === clientId);
      if (client) {
        const project = client.projects.find(p => p.id === projectId);
        if (project) {
          const newSubtask: ISubtask = {
            id: subtaskId,
            taskName,
            projectedHours,
            completed: false,
            payments: [],
            createdAt: new Date().toISOString(),
          };
          // Add to beginning of array (most recent first)
          project.subtasks.unshift(newSubtask);
        }
      }
    } catch (err) {
      error.value = 'Erro ao criar tarefa';
      console.error(err);
      throw err;
    } finally {
      loading.value = false;
    }
  };

  const toggleSubtaskCompletion = async (clientId: string, projectId: string, subtaskId: string) => {
    const client = clients.value.find(c => c.id === clientId);
    if (client) {
      const project = client.projects.find(p => p.id === projectId);
      if (project) {
        const subtask = project.subtasks.find(s => s.id === subtaskId);
        if (subtask) {
          const newCompleted = !subtask.completed;
          try {
            await subtasksService.toggleCompleted(subtaskId, newCompleted);
            subtask.completed = newCompleted;
          } catch (err) {
            error.value = 'Erro ao atualizar tarefa';
            console.error(err);
            throw err;
          }
        }
      }
    }
  };

  const deleteSubtask = async (clientId: string, projectId: string, subtaskId: string) => {
    loading.value = true;
    error.value = null;
    try {
      await subtasksService.delete(subtaskId);
      const client = clients.value.find(c => c.id === clientId);
      if (client) {
        const project = client.projects.find(p => p.id === projectId);
        if (project) {
          const index = project.subtasks.findIndex(s => s.id === subtaskId);
          if (index !== -1) {
            project.subtasks.splice(index, 1);
          }
        }
      }
    } catch (err) {
      error.value = 'Erro ao excluir tarefa';
      console.error(err);
      throw err;
    } finally {
      loading.value = false;
    }
  };

  // Settings Methods
  const updateHourlyRate = async (newRate: number) => {
    loading.value = true;
    error.value = null;
    try {
      await settingsService.update(newRate);
      settings.value.hourlyRate = newRate;
    } catch (err) {
      error.value = 'Erro ao atualizar valor/hora';
      console.error(err);
      throw err;
    } finally {
      loading.value = false;
    }
  };

  // Payment Methods
  const addPayment = async (clientId: string, projectId: string, subtaskId: string, amount: number, note?: string) => {
    loading.value = true;
    error.value = null;
    try {
      console.log('[Payment] Criando pagamento:', { clientId, projectId, subtaskId, amount, note });
      const paymentData = await paymentsService.create(subtaskId, amount, note);
      console.log('[Payment] Pagamento criado no banco:', paymentData);
      
      const client = clients.value.find(c => c.id === clientId);
      if (client) {
        const project = client.projects.find(p => p.id === projectId);
        if (project) {
          const subtask = project.subtasks.find(s => s.id === subtaskId);
          if (subtask) {
            const newPayment: IPayment = {
              id: paymentData.id,
              amount: Number(paymentData.amount),
              date: paymentData.payment_date,
              note: paymentData.note || undefined,
            };
            console.log('[Payment] Adicionando pagamento ao array:', newPayment);
            console.log('[Payment] Payments ANTES:', subtask.payments.length);
            
            // Add to beginning of array (most recent first)
            subtask.payments.unshift(newPayment);
            
            console.log('[Payment] Payments DEPOIS:', subtask.payments.length);
            console.log('[Payment] Total pago:', subtask.payments.reduce((t, p) => t + p.amount, 0));
          } else {
            console.error('[Payment] Subtask não encontrada!');
          }
        } else {
          console.error('[Payment] Project não encontrado!');
        }
      } else {
        console.error('[Payment] Client não encontrado!');
      }
    } catch (err) {
      error.value = 'Erro ao registrar pagamento';
      console.error('[Payment] Erro:', err);
      throw err;
    } finally {
      loading.value = false;
    }
  };

  const deletePayment = async (clientId: string, projectId: string, subtaskId: string, paymentId: string) => {
    loading.value = true;
    error.value = null;
    try {
      await paymentsService.delete(paymentId);
      const client = clients.value.find(c => c.id === clientId);
      if (client) {
        const project = client.projects.find(p => p.id === projectId);
        if (project) {
          const subtask = project.subtasks.find(s => s.id === subtaskId);
          if (subtask) {
            const index = subtask.payments.findIndex(p => p.id === paymentId);
            if (index !== -1) {
              subtask.payments.splice(index, 1);
            }
          }
        }
      }
    } catch (err) {
      error.value = 'Erro ao remover pagamento';
      console.error(err);
      throw err;
    } finally {
      loading.value = false;
    }
  };

  const calculateSubtaskPaid = (subtask: ISubtask) => {
    return subtask.payments.reduce((total, payment) => total + payment.amount, 0);
  };

  const calculateSubtaskTotal = (subtask: ISubtask) => {
    return subtask.projectedHours * settings.value.hourlyRate;
  };

  const getPaymentStatus = (subtask: ISubtask): 'paid' | 'partial' | 'pending' => {
    const paid = calculateSubtaskPaid(subtask);
    const total = calculateSubtaskTotal(subtask);
    
    if (paid >= total) return 'paid';
    if (paid > 0) return 'partial';
    return 'pending';
  };

  // Modal Methods
  const openModal = (type: IModalType, clientId?: string, projectId?: string, subtaskId?: string) => {
    modalState.value = {
      isOpen: true,
      type,
      clientId,
      projectId,
      subtaskId,
    };
  };

  const closeModal = () => {
    modalState.value = {
      isOpen: false,
      type: null,
    };
  };

  // Calculation Methods
  const calculateProjectTotal = (project: IProject) => {
    return project.subtasks.reduce((total, subtask) => {
      return total + (subtask.projectedHours * settings.value.hourlyRate);
    }, 0);
  };

  const calculateClientTotal = (client: IClient) => {
    return client.projects.reduce((total, project) => {
      return total + calculateProjectTotal(project);
    }, 0);
  };

  const getClientServicesCount = (client: IClient) => {
    return client.projects.reduce((total, project) => {
      return total + project.subtasks.length;
    }, 0);
  };

  // Initialize data on mount
  onMounted(() => {
    loadData();
  });

  return {
    // State
    clients,
    settings,
    modalState,
    loading,
    error,

    // Computed
    totalClients,
    totalProjects,
    totalRevenue,
    totalPaid,
    totalPending,

    // Methods
    loadData,
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
    calculateSubtaskPaid,
    calculateSubtaskTotal,
    getPaymentStatus,
    openModal,
    closeModal,
    calculateProjectTotal,
    calculateClientTotal,
    getClientServicesCount,
    calculateClientPending,
    calculateProjectPending,
    calculateSubtaskPending,
  };
}