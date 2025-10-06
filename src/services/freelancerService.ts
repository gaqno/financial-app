import { supabase } from '../lib/supabase';
import type { IClient, IFreelancerSettings } from '../types/freelancer';

// Database Types
interface DBClient {
  id: string;
  user_id: string;
  client_name: string;
  whatsapp_number: string;
  created_at: string;
  updated_at: string;
}

interface DBProject {
  id: string;
  client_id: string;
  project_name: string;
  created_at: string;
  updated_at: string;
}

interface DBSubtask {
  id: string;
  project_id: string;
  task_name: string;
  projected_hours: number;
  completed: boolean;
  created_at: string;
  updated_at: string;
}

interface DBPayment {
  id: string;
  subtask_id: string;
  amount: number;
  payment_date: string;
  note: string | null;
  created_at: string;
  updated_at: string;
}

// Settings Service
export const settingsService = {
  async get(): Promise<IFreelancerSettings | null> {
    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError || !userData.user) {
      console.error('Error getting user:', userError);
      return null;
    }

    const { data, error } = await supabase
      .from('freelancer_settings')
      .select('*')
      .eq('user_id', userData.user.id)
      .maybeSingle();

    if (error) {
      console.error('Error fetching settings:', error);
      throw error;
    }

    if (!data) {
      return null;
    }

    return {
      hourlyRate: Number(data.hourly_rate),
    };
  },

  async create(hourlyRate: number): Promise<void> {
    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError || !userData.user) throw userError;

    const { error } = await supabase.from('freelancer_settings').insert({
      user_id: userData.user.id,
      hourly_rate: hourlyRate,
    });

    if (error) {
      console.error('Error creating settings:', error);
      throw error;
    }
  },

  async update(hourlyRate: number): Promise<void> {
    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError || !userData.user) throw userError;

    const { error } = await supabase
      .from('freelancer_settings')
      .update({ hourly_rate: hourlyRate })
      .eq('user_id', userData.user.id);

    if (error) {
      console.error('Error updating settings:', error);
      throw error;
    }
  },
};

// Clients Service
export const clientsService = {
  async getAll(): Promise<IClient[]> {
    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError || !userData.user) {
      console.error('Error getting user:', userError);
      return [];
    }

    const { data: clientsData, error: clientsError } = await supabase
      .from('freelancer_clients')
      .select('*')
      .eq('user_id', userData.user.id)
      .order('created_at', { ascending: false });

    if (clientsError) {
      console.error('Error fetching clients:', clientsError);
      throw clientsError;
    }

    // Fetch all projects for these clients
    const { data: projectsData, error: projectsError } = await supabase
      .from('freelancer_projects')
      .select('*')
      .order('created_at', { ascending: false });

    if (projectsError) {
      console.error('Error fetching projects:', projectsError);
      throw projectsError;
    }

    // Fetch all subtasks
    const { data: subtasksData, error: subtasksError } = await supabase
      .from('freelancer_subtasks')
      .select('*')
      .order('created_at', { ascending: false });

    if (subtasksError) {
      console.error('Error fetching subtasks:', subtasksError);
      throw subtasksError;
    }

    // Fetch all payments
    const { data: paymentsData, error: paymentsError } = await supabase
      .from('freelancer_payments')
      .select('*')
      .order('payment_date', { ascending: false });

    if (paymentsError) {
      console.error('Error fetching payments:', paymentsError);
      throw paymentsError;
    }

    // Build the nested structure
    const clients: IClient[] = (clientsData as DBClient[]).map((client) => {
      const clientProjects = (projectsData as DBProject[])
        .filter((p) => p.client_id === client.id)
        .map((project) => {
          const projectSubtasks = (subtasksData as DBSubtask[])
            .filter((s) => s.project_id === project.id)
            .map((subtask) => {
              const subtaskPayments = (paymentsData as DBPayment[])
                .filter((p) => p.subtask_id === subtask.id)
                .map((payment) => ({
                  id: payment.id,
                  amount: Number(payment.amount),
                  date: payment.payment_date,
                  note: payment.note || undefined,
                }));

              return {
                id: subtask.id,
                taskName: subtask.task_name,
                projectedHours: Number(subtask.projected_hours),
                completed: subtask.completed,
                payments: subtaskPayments,
                createdAt: subtask.created_at,
              };
            });

          return {
            id: project.id,
            projectName: project.project_name,
            subtasks: projectSubtasks,
            createdAt: project.created_at,
          };
        });

      return {
        id: client.id,
        clientName: client.client_name,
        whatsappNumber: client.whatsapp_number,
        projects: clientProjects,
        createdAt: client.created_at,
      };
    });

    return clients;
  },

  async create(clientName: string, whatsappNumber: string): Promise<string> {
    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError || !userData.user) throw userError;

    const { data, error } = await supabase
      .from('freelancer_clients')
      .insert({
        user_id: userData.user.id,
        client_name: clientName,
        whatsapp_number: whatsappNumber,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating client:', error);
      throw error;
    }

    return data.id;
  },

  async delete(clientId: string): Promise<void> {
    const { error } = await supabase.from('freelancer_clients').delete().eq('id', clientId);

    if (error) {
      console.error('Error deleting client:', error);
      throw error;
    }
  },
};

// Projects Service
export const projectsService = {
  async create(clientId: string, projectName: string): Promise<string> {
    const { data, error } = await supabase
      .from('freelancer_projects')
      .insert({
        client_id: clientId,
        project_name: projectName,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating project:', error);
      throw error;
    }

    return data.id;
  },

  async delete(projectId: string): Promise<void> {
    const { error } = await supabase.from('freelancer_projects').delete().eq('id', projectId);

    if (error) {
      console.error('Error deleting project:', error);
      throw error;
    }
  },
};

// Subtasks Service
export const subtasksService = {
  async create(projectId: string, taskName: string, projectedHours: number): Promise<string> {
    const { data, error } = await supabase
      .from('freelancer_subtasks')
      .insert({
        project_id: projectId,
        task_name: taskName,
        projected_hours: projectedHours,
        completed: false,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating subtask:', error);
      throw error;
    }

    return data.id;
  },

  async toggleCompleted(subtaskId: string, completed: boolean): Promise<void> {
    const { error } = await supabase
      .from('freelancer_subtasks')
      .update({ completed })
      .eq('id', subtaskId);

    if (error) {
      console.error('Error toggling subtask:', error);
      throw error;
    }
  },

  async delete(subtaskId: string): Promise<void> {
    const { error } = await supabase.from('freelancer_subtasks').delete().eq('id', subtaskId);

    if (error) {
      console.error('Error deleting subtask:', error);
      throw error;
    }
  },
};

// Payments Service
export const paymentsService = {
  async create(subtaskId: string, amount: number, note?: string): Promise<string> {
    const { data, error } = await supabase
      .from('freelancer_payments')
      .insert({
        subtask_id: subtaskId,
        amount,
        note,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating payment:', error);
      throw error;
    }

    return data.id;
  },

  async delete(paymentId: string): Promise<void> {
    const { error } = await supabase.from('freelancer_payments').delete().eq('id', paymentId);

    if (error) {
      console.error('Error deleting payment:', error);
      throw error;
    }
  },
};
