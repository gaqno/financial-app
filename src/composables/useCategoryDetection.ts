export function useCategoryDetection() {
  // Mapeamento de palavras-chave para categorias
  const categoryKeywords = {
    'Moradia': [
      'aluguel', 'condominio', 'condomínio', 'iptu', 'agua', 'água', 'luz', 'energia', 
      'gas', 'gás', 'telefone', 'internet', 'tv', 'casa', 'apartamento', 'imovel', 'imóvel',
      'portaria', 'limpeza', 'manutenção', 'manutencao', 'elevador', 'reforma'
    ],
    'Alimentação': [
      'supermercado', 'mercado', 'padaria', 'acougue', 'açougue', 'feira', 'restaurante',
      'lanchonete', 'fast food', 'delivery', 'ifood', 'uber eats', 'rappi', 'comida',
      'food', 'bar', 'cafe', 'café', 'pizza', 'hamburguer', 'almoço', 'almoco', 'jantar'
    ],
    'Transporte': [
      'combustivel', 'combustível', 'gasolina', 'alcool', 'álcool', 'diesel', 'posto',
      'uber', 'taxi', 'metro', 'metrô', 'onibus', 'ônibus', 'passagem', 'bilhete',
      'estacionamento', 'parking', 'pedagio', 'pedágio', 'carro', 'moto', 'bicicleta',
      'seguro auto', 'ipva', 'licenciamento', 'multa', 'veiculo', 'veículo'
    ],
    'Saúde': [
      'medico', 'médico', 'hospital', 'clinica', 'clínica', 'farmacia', 'farmácia',
      'remedio', 'remédio', 'medicamento', 'consulta', 'exame', 'laboratorio', 'laboratório',
      'dentista', 'ortodontia', 'fisioterapia', 'psicologia', 'terapia', 'plano de saude',
      'plano de saúde', 'convenio', 'convênio'
    ],
    'Educação': [
      'escola', 'universidade', 'faculdade', 'curso', 'aula', 'mensalidade', 'material escolar',
      'livro', 'apostila', 'formatura', 'diploma', 'certificado', 'idioma', 'ingles', 'inglês'
    ],
    'Lazer': [
      'cinema', 'teatro', 'show', 'concerto', 'festa', 'balada', 'clube', 'academia',
      'gym', 'natacao', 'natação', 'futebol', 'esporte', 'jogo', 'netflix', 'spotify',
      'streaming', 'viagem', 'hotel', 'pousada', 'turismo', 'parque', 'diversao', 'diversão'
    ],
    'Compras': [
      'shopping', 'loja', 'magazine', 'magazineluiza', 'casas bahia', 'americanas',
      'mercado livre', 'amazon', 'aliexpress', 'roupa', 'calcado', 'calçado', 'sapato',
      'tenis', 'tênis', 'bolsa', 'mochila', 'acessorio', 'acessório', 'eletronico', 'eletrônico',
      'celular', 'notebook', 'computador', 'tv', 'geladeira', 'fogao', 'fogão', 'monitor',
      'box', 'cama', 'sofa', 'sofá', 'mesa', 'cadeira', 'movel', 'móvel', 'decoracao', 'decoração'
    ],
    'Serviços': [
      'banco', 'tarifas bancarias', 'tarifas bancárias', 'ted', 'doc', 'cartao', 'cartão',
      'anuidade', 'seguro', 'advogado', 'contador', 'contabilidade', 'juridico', 'jurídico',
      'correios', 'sedex', 'pac', 'entrega', 'frete', 'consultoria', 'assessoria', 'fatura',
      'nubank', 'picpay', 'inter', 'bradesco', 'itau', 'itaú', 'santander', 'caixa'
    ],
    'Dívidas': [
      'emprestimo', 'empréstimo', 'financiamento', 'parcelamento', 'prestacao', 'prestação',
      'juros', 'multa', 'divida', 'dívida', 'atraso', 'refinanciamento', 'crediario', 'crediário',
      'carnê', 'carne', 'consorcio', 'consórcio', 'spc', 'serasa', 'negativacao', 'negativação'
    ],
    'Investimentos': [
      'investimento', 'aplicacao', 'aplicação', 'poupanca', 'poupança', 'cdb', 'lci', 'lca',
      'tesouro', 'acao', 'ação', 'fundo', 'previdencia', 'previdência', 'bitcoins', 'crypto',
      'corretora', 'broker', 'dividendos', 'rendimento'
    ],
    'Renda': [
      'salario', 'salário', 'ordenado', 'pro labore', 'freelance', 'freela', 'consultoria',
      'honorarios', 'honorários', 'comissao', 'comissão', 'bonus', 'bônus', 'premio', 'prêmio',
      'adiantamento', 'vale', 'hora extra', 'adicional', 'gratificacao', 'gratificação'
    ]
  };

  function detectCategory(description: string): string {
    if (!description) return '';
    
    const descLower = description.toLowerCase().trim();
    
    // Procura por cada categoria
    for (const [category, keywords] of Object.entries(categoryKeywords)) {
      for (const keyword of keywords) {
        if (descLower.includes(keyword.toLowerCase())) {
          return category;
        }
      }
    }
    
    return 'Outros'; // Categoria padrão se não encontrar nada
  }

  function getAllCategories(): string[] {
    return Object.keys(categoryKeywords).sort();
  }

  return {
    detectCategory,
    getAllCategories,
    categoryKeywords
  };
} 