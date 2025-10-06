import { useState, useCallback, useMemo } from 'react';
import { IClient, IProject, ISubtask, IModalState, EModalType } from '../types';

export const useFreelancerManagement = () => {
  const [clients, setClients] = useState<IClient[]>([]);
  const [hourlyRate, setHourlyRate] = useState<number>(80);
  const [modalState, setModalState] = useState<IModalState>({
    isOpen: false,
    type: null,
  });

  const openModal = useCallback((type: EModalType, data?: IModalState['data']) => {
    setModalState({
      isOpen: true,
      type,
      data,
    });
  }, []);

  const closeModal = useCallback(() => {
    setModalState({
      isOpen: false,
      type: null,
    });
  }, []);

  const addClient = useCallback((clientName: string, whatsappNumber: string) => {
    const newClient: IClient = {
      id: crypto.randomUUID(),
      clientName,
      whatsappNumber,
      projects: [],
    };
    setClients((prev) => [...prev, newClient]);
  }, []);

  const addProject = useCallback((clientId: string, projectName: string) => {
    setClients((prev) =>
      prev.map((client) => {
        if (client.id === clientId) {
          const newProject: IProject = {
            id: crypto.randomUUID(),
            projectName,
            subtasks: [],
          };
          return {
            ...client,
            projects: [...client.projects, newProject],
          };
        }
        return client;
      })
    );
  }, []);

  const addSubtask = useCallback(
    (clientId: string, projectId: string, taskName: string, projectedHours: number) => {
      setClients((prev) =>
        prev.map((client) => {
          if (client.id === clientId) {
            return {
              ...client,
              projects: client.projects.map((project) => {
                if (project.id === projectId) {
                  const newSubtask: ISubtask = {
                    id: crypto.randomUUID(),
                    taskName,
                    projectedHours,
                    completed: false,
                  };
                  return {
                    ...project,
                    subtasks: [...project.subtasks, newSubtask],
                  };
                }
                return project;
              }),
            };
          }
          return client;
        })
      );
    },
    []
  );

  const toggleSubtaskCompletion = useCallback(
    (clientId: string, projectId: string, subtaskId: string) => {
      setClients((prev) =>
        prev.map((client) => {
          if (client.id === clientId) {
            return {
              ...client,
              projects: client.projects.map((project) => {
                if (project.id === projectId) {
                  return {
                    ...project,
                    subtasks: project.subtasks.map((subtask) => {
                      if (subtask.id === subtaskId) {
                        return {
                          ...subtask,
                          completed: !subtask.completed,
                        };
                      }
                      return subtask;
                    }),
                  };
                }
                return project;
              }),
            };
          }
          return client;
        })
      );
    },
    []
  );

  const deleteClient = useCallback((clientId: string) => {
    setClients((prev) => prev.filter((client) => client.id !== clientId));
  }, []);

  const deleteProject = useCallback((clientId: string, projectId: string) => {
    setClients((prev) =>
      prev.map((client) => {
        if (client.id === clientId) {
          return {
            ...client,
            projects: client.projects.filter((project) => project.id !== projectId),
          };
        }
        return client;
      })
    );
  }, []);

  const deleteSubtask = useCallback(
    (clientId: string, projectId: string, subtaskId: string) => {
      setClients((prev) =>
        prev.map((client) => {
          if (client.id === clientId) {
            return {
              ...client,
              projects: client.projects.map((project) => {
                if (project.id === projectId) {
                  return {
                    ...project,
                    subtasks: project.subtasks.filter((subtask) => subtask.id !== subtaskId),
                  };
                }
                return project;
              }),
            };
          }
          return client;
        })
      );
    },
    []
  );

  const calculateProjectTotal = useCallback(
    (project: IProject) => {
      return project.subtasks.reduce((total, subtask) => {
        return total + subtask.projectedHours * hourlyRate;
      }, 0);
    },
    [hourlyRate]
  );

  const calculateClientTotal = useCallback(
    (client: IClient) => {
      return client.projects.reduce((total, project) => {
        return total + calculateProjectTotal(project);
      }, 0);
    },
    [calculateProjectTotal]
  );

  const getClientServicesCount = useCallback((client: IClient) => {
    return client.projects.reduce((total, project) => {
      return total + project.subtasks.length;
    }, 0);
  }, []);

  const updateHourlyRate = useCallback((newRate: number) => {
    setHourlyRate(newRate);
  }, []);

  return {
    clients,
    hourlyRate,
    modalState,
    openModal,
    closeModal,
    addClient,
    addProject,
    addSubtask,
    toggleSubtaskCompletion,
    deleteClient,
    deleteProject,
    deleteSubtask,
    calculateProjectTotal,
    calculateClientTotal,
    getClientServicesCount,
    updateHourlyRate,
  };
};
