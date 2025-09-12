# 🐷 por.quinho

**"De pouco em pouco se enche o porquinho"**

Uma aplicação moderna de gestão financeira pessoal que te ajuda a economizar e controlar seus gastos. Construída com Vue.js 3, TypeScript e Tailwind CSS.

## ✨ Funcionalidades

### 📊 **Gestão de Transações**

- ➕ Adicionar receitas e despesas
- ✏️ Editar múltiplos registros simultaneamente
- 🗑️ Exclusão com confirmação e sistema de undo
- 📅 Datepicker integrado
- 💰 Formatação monetária brasileira (R$)

### 📋 **Importação de Dados**

- 📁 Importação via CSV
- 🇧🇷 Suporte a formato brasileiro (R$ 1.500,00)
- 📅 Reconhecimento de datas DD/MM/YYYY
- ⚡ Validação automática de dados

### 🏷️ **Categorização Inteligente**

- 🤖 Detecção automática por palavras-chave
- 🏠 Categorias: Moradia, Alimentação, Transporte, Saúde, etc.
- 🎯 Filtros por categoria e tipo
- 📊 Resumo visual por categorias

### 📈 **Visualização de Dados**

- 🍩 Gráfico de pizza (Receitas vs Despesas)
- 📋 Resumo financeiro em tempo real
- 🔍 Filtros dinâmicos
- 📱 Cards de categoria com totais

### 📱 **Interface Mobile-First**

- 📲 Design responsivo e nativo
- 👆 Touch-friendly
- 🎨 Animações suaves
- 🌙 UI moderna com Tailwind CSS

## 🚀 Tecnologias

- **Frontend**: Vue.js 3 (Composition API)
- **Linguagem**: TypeScript
- **Styling**: Tailwind CSS
- **Build Tool**: Vite
- **Charts**: Chart.js
- **Icons**: FontAwesome
- **Armazenamento**: LocalStorage

## 📦 Instalação

```bash
# Clone o repositório
git clone https://github.com/gaqno/por-quinho.git

# Entre no diretório
cd por-quinho

# Instale as dependências
npm install

# Execute em modo desenvolvimento
npm run dev

# Build para produção
npm run build
```

## 🎮 Como Usar

### 1. **Adicionar Transações**

- Preencha o formulário: Data, Descrição, Valor, Tipo
- A categoria é detectada automaticamente pela descrição
- Ou selecione manualmente uma categoria

### 2. **Importar CSV**

- Clique em "Importar CSV"
- Use o formato: `Data,Descrição,Valor,Tipo,Categoria`
- Exemplo: `07/08,Aluguel,-R$ 1.500.00,Despesa,Moradia`

### 3. **Gerenciar Registros**

- **Editar**: Clique no ícone de lápis
- **Editar Múltiplos**: Use "Editar Todos"
- **Excluir**: Clique na lixeira → Confirme → Undo em 5s se necessário

### 4. **Filtrar e Visualizar**

- Use os botões de filtro: Todos, Receitas, Despesas
- Clique nos cards de categoria para filtrar
- Veja o gráfico de distribuição

## 📁 Estrutura do Projeto

```
src/
├── components/          # Componentes Vue
│   ├── FinanceTable.vue # Componente principal
│   └── CSVImport.vue    # Importação CSV
├── composables/         # Lógica reutilizável
│   ├── useFinance.ts    # Gestão de dados financeiros
│   ├── useCSVImport.ts  # Importação CSV
│   └── useCategoryDetection.ts # Detecção de categorias
├── types/              # Definições TypeScript
│   └── finance.ts      # Tipos financeiros
└── main.ts            # Entrada da aplicação
```

## 🛠️ Scripts Disponíveis

```bash
npm run dev         # Servidor de desenvolvimento
npm run build       # Build para produção
npm run preview     # Preview do build
npm run lint        # Linting do código
```

## 🎯 Categorias Automáticas

O sistema detecta automaticamente as seguintes categorias:

- 🏠 **Moradia**: aluguel, condomínio, água, luz, etc.
- 🍔 **Alimentação**: supermercado, restaurante, lanche, etc.
- 🚗 **Transporte**: uber, gasolina, ônibus, etc.
- 🏥 **Saúde**: médico, farmácia, plano, etc.
- 📚 **Educação**: curso, livro, escola, etc.
- 🎮 **Lazer**: cinema, streaming, jogo, etc.
- 🛍️ **Compras**: loja, shopping, roupa, etc.
- 🔧 **Serviços**: internet, telefone, banco, etc.
- 💳 **Dívidas**: cartão, empréstimo, financiamento, etc.
- 📈 **Investimentos**: ações, poupança, etc.
- 💼 **Renda**: salário, freelance, venda, etc.

## 📄 Licença

MIT License - veja o arquivo [LICENSE](LICENSE) para detalhes.

## 👨‍💻 Autor

Desenvolvido por [gaqno](https://github.com/gaqno)

---

⭐ Deixe uma estrela se este projeto te ajudou!
