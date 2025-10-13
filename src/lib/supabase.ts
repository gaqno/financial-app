import { createClient } from '@supabase/supabase-js';

// Configurações do Supabase - essas variáveis devem ser definidas no .env
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ [SUPABASE] Variáveis de ambiente não configuradas');
  throw new Error('Variáveis de ambiente do Supabase não configuradas');
}

// Criar cliente Supabase
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
});

// Tipos específicos para o banco de dados
export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string;
          full_name: string | null;
          avatar_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          full_name?: string | null;
          avatar_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          full_name?: string | null;
          avatar_url?: string | null;
          updated_at?: string;
        };
      };
      finance_records: {
        Row: {
          id: string;
          user_id: string;
          data: string;
          descricao: string;
          valor: number;
          tipo: 'Receita' | 'Despesa';
          categoria: string | null;
          status: '❌' | '✔️' | '⏰';
          recurrence: any | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          data: string;
          descricao: string;
          valor: number;
          tipo: 'Receita' | 'Despesa';
          categoria?: string | null;
          status: '❌' | '✔️' | '⏰';
          recurrence?: any | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          data?: string;
          descricao?: string;
          valor?: number;
          tipo?: 'Receita' | 'Despesa';
          categoria?: string | null;
          status: '❌' | '✔️' | '⏰';
          recurrence?: any | null;
          updated_at?: string;
        };
      };
      investments: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          type: string;
          institution: string;
          initial_amount: number;
          current_amount: number;
          applied_amount: number;
          yield_type: string;
          yield_rate: number;
          start_date: string;
          maturity_date: string | null;
          last_update: string;
          status: string;
          auto_reinvest: boolean;
          transactions: any[];
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          type: string;
          institution: string;
          initial_amount: number;
          current_amount: number;
          applied_amount: number;
          yield_type: string;
          yield_rate: number;
          start_date: string;
          maturity_date?: string | null;
          last_update: string;
          status: string;
          auto_reinvest?: boolean;
          transactions?: any[];
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          name?: string;
          type?: string;
          institution?: string;
          initial_amount?: number;
          current_amount?: number;
          applied_amount?: number;
          yield_type?: string;
          yield_rate?: number;
          start_date?: string;
          maturity_date?: string | null;
          last_update?: string;
          status?: string;
          auto_reinvest?: boolean;
          transactions?: any[];
          updated_at?: string;
        };
      };
      user_settings: {
        Row: {
          id: string;
          user_id: string;
          hidden_months: string[];
          projection_settings: any;
          filters: any;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          hidden_months?: string[];
          projection_settings?: any;
          filters?: any;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          hidden_months?: string[];
          projection_settings?: any;
          filters?: any;
          updated_at?: string;
        };
      };
    };
  };
}

export type SupabaseClient = typeof supabase;
