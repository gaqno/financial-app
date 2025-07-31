export interface IFinanceRecord {
    Data: string;
    Descrição: string;
    Valor: number;
    Tipo: 'Receita' | 'Despesa';
    Categoria?: string;
    Status: '❌' | '✔️';
    Saldo: number;
  }
  