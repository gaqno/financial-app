export interface IPayment {
  id: string;
  amount: number;
  date: string;
  note?: string;
}

export interface ISubtask {
  id: string;
  taskName: string;
  projectedHours: number;
  completed: boolean;
  payments: IPayment[];
  createdAt?: string;
}

export interface IProject {
  id: string;
  projectName: string;
  subtasks: ISubtask[];
  createdAt?: string;
}

export interface IClient {
  id: string;
  clientName: string;
  whatsappNumber: string;
  projects: IProject[];
  createdAt?: string;
}

export interface IFreelancerSettings {
  hourlyRate: number;
}

export type IModalType = 'client' | 'project' | 'subtask' | 'hourlyRate' | 'payment' | null;

export interface IModalState {
  isOpen: boolean;
  type: IModalType;
  clientId?: string;
  projectId?: string;
  subtaskId?: string;
}
