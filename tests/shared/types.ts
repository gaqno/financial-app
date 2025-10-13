/**
 * Shared types for E2E tests
 */

export interface TransactionData {
  date: string;
  description: string;
  value: number;
  type: 'Receita' | 'Despesa';
  category?: string;
  status: '✔️' | '❌';
}

