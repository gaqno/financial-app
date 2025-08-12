import { ref } from 'vue';
import type { ICategory } from '../types/finance';

interface ICategoryPattern {
  category: string;
  patterns: string[];
}

export function useCategoryDetection() {
  const categories = ref<ICategory[]>([
    { name: 'Alimentação', icon: '🍽️' },
    { name: 'Moradia', icon: '🏠' },
    { name: 'Transporte', icon: '🚗' },
    { name: 'Saúde', icon: '🏥' },
    { name: 'Educação', icon: '📚' },
    { name: 'Lazer', icon: '🎮' },
    { name: 'Compras', icon: '🛒' },
    { name: 'Serviços', icon: '⚙️' },
    { name: 'Dívidas', icon: '💳' },
    { name: 'Investimentos', icon: '📈' },
    { name: 'Renda', icon: '💰' },
    { name: 'Outros', icon: '📋' }
  ]);

  const categoryPatterns: ICategoryPattern[] = [
    {
      category: 'Alimentação',
      patterns: ['supermercado', 'restaurante', 'ifood', 'lanche', 'padaria', 'café', 'almoço', 'jantar', 'mercadinho', 'açougue', 'feira']
    },
    {
      category: 'Moradia',
      patterns: ['aluguel', 'condomínio', 'água', 'luz', 'energia', 'gás', 'internet', 'iptu', 'reforma']
    },
    {
      category: 'Transporte',
      patterns: ['uber', '99', 'taxi', 'ônibus', 'metrô', 'combustível', 'gasolina', 'estacionamento', 'pedágio']
    },
    {
      category: 'Saúde',
      patterns: ['farmácia', 'médico', 'consulta', 'exame', 'dentista', 'hospital', 'plano de saúde']
    },
    {
      category: 'Educação',
      patterns: ['escola', 'faculdade', 'curso', 'livro', 'material escolar', 'mensalidade']
    },
    {
      category: 'Lazer',
      patterns: ['cinema', 'teatro', 'show', 'netflix', 'spotify', 'jogos', 'viagem', 'passeio']
    },
    {
      category: 'Compras',
      patterns: ['shopping', 'loja', 'roupa', 'calçado', 'acessório', 'eletrônico']
    },
    {
      category: 'Serviços',
      patterns: ['manutenção', 'conserto', 'limpeza', 'lavanderia', 'assinatura', 'serviço']
    },
    {
      category: 'Dívidas',
      patterns: ['empréstimo', 'financiamento', 'cartão', 'crédito', 'débito', 'parcela', 'prestação', 'fatura', 'nubank', 'picpay', 'mercadopago', 'bradesco', 'itau', 'santander', 'caixa']
    },
    {
      category: 'Investimentos',
      patterns: ['ação', 'fundo', 'tesouro', 'cdb', 'investimento', 'aplicação']
    },
    {
      category: 'Renda',
      patterns: ['salário', 'pagamento', 'reembolso', 'rendimento', 'dividendo', 'pró-labore']
    }
  ];

  const detectCategory = (description: string): string => {
    const normalizedDescription = description.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

    for (const { category, patterns } of categoryPatterns) {
      const hasMatch = patterns.some(pattern =>
        normalizedDescription.includes(pattern.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, ''))
      );

      if (hasMatch) {
        return category;
      }
    }

    return 'Outros';
  };

  const getAllCategories = (): string[] => {
    return categories.value.map(cat => cat.name);
  };

  const getCategoryIcon = (categoryName: string): string => {
    const category = categories.value.find(cat => cat.name === categoryName);
    return category?.icon || '📋';
  };

  const addCustomCategory = (name: string, icon: string) => {
    if (!categories.value.some(cat => cat.name === name)) {
      categories.value.push({ name, icon });
    }
  };

  const removeCategory = (name: string) => {
    if (name !== 'Outros') {
      categories.value = categories.value.filter(cat => cat.name !== name);
    }
  };

  return {
    categories,
    detectCategory,
    getAllCategories,
    getCategoryIcon,
    addCustomCategory,
    removeCategory
  };
} 