# Freelancer Management - Vue 3

Uma aplicação completa para gestão de clientes freelancer, projetos e tarefas com cálculo automático de valores.

## ✨ Características

- ✅ **Valor por hora editável** (padrão: R$ 80,00)
- ✅ **Gestão de Clientes** com integração WhatsApp
- ✅ **Projetos hierárquicos** organizados por cliente
- ✅ **Tarefas detalhadas** com horas projetadas e preços automáticos
- ✅ **Seções colapsáveis** para melhor navegação
- ✅ **Cálculos automáticos** de totais por projeto e cliente
- ✅ **Marcação de conclusão** de tarefas
- ✅ **Dark mode** integrado
- ✅ **Interface responsiva** e moderna

## 🏗️ Estrutura de Dados

```
Cliente
├── Nome do Cliente
├── WhatsApp
├── Total (soma de todos os projetos)
└── Projetos
    ├── Nome do Projeto
    ├── Total do Projeto
    └── Tarefas
        ├── Nome da Tarefa
        ├── Horas Projetadas
        ├── Preço Total (Horas × Valor/Hora)
        └── Status de Conclusão
```

## 🚀 Como Usar

### Acesso
1. Acesse a aba **"Freelancers"** (💼) no menu principal
2. A página será carregada automaticamente

### Funcionalidades Principais

#### Configurar Valor por Hora
1. Clique em "Editar" ao lado do valor/hora
2. Digite o novo valor
3. Clique em "Salvar"
- Todos os cálculos são atualizados automaticamente

#### Adicionar Cliente
1. Clique em "+ Adicionar Cliente"
2. Preencha:
   - **Nome do Cliente**: Nome completo
   - **WhatsApp**: Formato internacional (ex: 5511999999999)
3. Clique em "Adicionar"

#### Adicionar Projeto
1. Expanda um cliente (clique no nome)
2. Clique em "+ Projeto"
3. Digite o nome do projeto
4. Clique em "Adicionar"

#### Adicionar Tarefa
1. Expanda um projeto
2. Clique em "+ Tarefa"
3. Preencha:
   - **Nome da Tarefa**: Descrição do trabalho
   - **Horas Projetadas**: Quantidade de horas (ex: 8.5)
4. Clique em "Adicionar"

#### Marcar Tarefa como Concluída
- Clique no checkbox ao lado da tarefa
- Tarefas concluídas ficam destacadas em verde

#### Contatar Cliente via WhatsApp
- Clique no botão "📱 WhatsApp" do cliente
- Abre automaticamente o WhatsApp Web/App

#### Excluir Itens
- Use os botões "Excluir" em clientes, projetos ou tarefas
- Cliente: Confirmação é solicitada

## 📁 Arquitetura

Seguindo os padrões do projeto **Vue 3 + TypeScript + Composition API**:

```
src/
├── types/
│   └── freelancer.ts                    # Interfaces TypeScript
│
├── composables/
│   └── freelancer/
│       └── useFreelancerManagement.ts  # Lógica de negócio
│
└── components/
    └── freelancer/
        ├── FreelancerManagement.vue     # Componente principal
        ├── ClientCard.vue               # Card de cliente
        ├── ProjectCard.vue              # Card de projeto
        └── SubtaskItem.vue              # Item de tarefa
```

### Separação de Responsabilidades

#### ✅ Componentes (.vue)
- **Apenas UI/Template**
- Recebem props e emitem eventos
- Sem lógica de negócio
- Utilizam Composition API (`<script setup>`)

#### ✅ Composables (.ts)
- **Toda a lógica de negócio**
- Gerenciamento de estado (ref, computed)
- Funções de CRUD
- Cálculos e transformações

#### ✅ Types (.ts)
- **Contratos de dados**
- Interfaces TypeScript
- Types e Enums

## 🎨 Tecnologias Utilizadas

- **Vue 3** (Composition API)
- **TypeScript** (Tipagem forte)
- **Tailwind CSS** (Estilização)
- **Dark Mode** (Integrado)
- **Font Awesome** (Ícones)

## 💡 Exemplos de Uso

### Cenário 1: Novo Cliente com Projeto Completo

```
1. Adicionar Cliente:
   Nome: "João Silva"
   WhatsApp: "5511987654321"

2. Adicionar Projeto: "Website Corporativo"

3. Adicionar Tarefas:
   - "Design UI/UX" → 8h
   - "Desenvolvimento Frontend" → 20h
   - "Integração Backend" → 12h
   - "Deploy e Testes" → 5h

✅ Total Calculado: 45h × R$ 80 = R$ 3.600,00
```

### Cenário 2: Ajuste de Valor por Hora

```
Situação Atual:
- Cliente com 3 projetos
- 50 tarefas totalizando 200h
- Valor: R$ 80/h = R$ 16.000,00

Ação:
- Ajustar para: R$ 100/h

✅ Novo Total: R$ 20.000,00 (atualizado automaticamente)
```

### Cenário 3: Gerenciamento de Múltiplos Clientes

```
Cliente A: 3 projetos, 45 tarefas → R$ 12.000,00
Cliente B: 2 projetos, 30 tarefas → R$ 8.000,00
Cliente C: 1 projeto, 15 tarefas  → R$ 3.500,00

✅ Total Geral: 6 projetos, 90 tarefas, R$ 23.500,00
```

## 🎯 Funcionalidades Detalhadas

### Gestão de Clientes
- ✅ Adicionar novos clientes
- ✅ Visualizar total de valor
- ✅ Contar número de serviços
- ✅ Link direto para WhatsApp
- ✅ Excluir clientes (com confirmação)
- ✅ Expandir/colapsar seção

### Gestão de Projetos
- ✅ Adicionar múltiplos projetos por cliente
- ✅ Visualizar total por projeto
- ✅ Contar tarefas do projeto
- ✅ Excluir projetos
- ✅ Expandir/colapsar seção

### Gestão de Tarefas
- ✅ Adicionar tarefas com horas projetadas
- ✅ Cálculo automático de preço (horas × valor/hora)
- ✅ Marcar como concluída (checkbox)
- ✅ Visual diferenciado para concluídas
- ✅ Excluir tarefas

### Cálculos Automáticos
Todos os totais recalculam automaticamente quando:
- ✅ O valor por hora é alterado
- ✅ Novas tarefas são adicionadas
- ✅ Tarefas são removidas
- ✅ Horas projetadas são modificadas

## 🌙 Dark Mode

O componente suporta **dark mode completo**:
- ✅ Transições suaves entre temas
- ✅ Cores otimizadas para cada tema
- ✅ Integrado com o tema global do app
- ✅ Classes Tailwind: `dark:bg-gray-900`, `dark:text-gray-100`, etc.

## 🔄 Fluxo de Dados

```
FreelancerManagement (Root)
      ↓ usa
useFreelancerManagement (Composable)
      ↓ expõe
{ clients, settings, modalState, funções CRUD }
      ↓ passa props para
ClientCard → ProjectCard → SubtaskItem
      ↑ emitem eventos para
FreelancerManagement (gerencia via composable)
```

## 📝 Boas Práticas Aplicadas

✅ **Composition API**: Uso consistente de `<script setup>`  
✅ **TypeScript**: Tipagem completa e segura  
✅ **Props/Emits**: Comunicação clara entre componentes  
✅ **Reactive State**: `ref()` e `computed()` corretos  
✅ **Immutabilidade**: Estado gerenciado corretamente  
✅ **Single Responsibility**: Cada componente tem uma função  
✅ **DRY**: Sem duplicação de código  
✅ **Nomenclatura**: Interfaces prefixadas com `I`  
✅ **Dark Mode**: Suporte completo  

## 🚀 Melhorias Futuras

- [ ] **Persistência**: Salvar dados no localStorage/Supabase
- [ ] **Filtros**: Busca e filtros avançados
- [ ] **Exportação**: PDF/Excel com relatórios
- [ ] **Histórico**: Log de alterações
- [ ] **Gráficos**: Visualização de dados
- [ ] **Mobile**: Otimização para touch
- [ ] **Drag & Drop**: Reordenar items
- [ ] **Múltiplas moedas**: Suporte internacional
- [ ] **Templates**: Projetos pré-configurados
- [ ] **Notificações**: Lembretes e alertas

## 🔧 Personalização

### Alterar Valor Padrão da Hora

Edite `src/composables/freelancer/useFreelancerManagement.ts`:

```typescript
const settings = ref<IFreelancerSettings>({
  hourlyRate: 100, // Altere de 80 para 100
});
```

### Alterar Cores

As cores seguem o Tailwind CSS do projeto. Para personalizar:

```vue
<!-- Cor primária do cliente -->
<div class="bg-blue-500 dark:bg-blue-600">
  <!-- Alterar para verde -->
  <div class="bg-green-500 dark:bg-green-600">
```

### Adicionar Persistência

Adicione ao composable:

```typescript
import { watch } from 'vue';

// Carregar do localStorage
const loadFromStorage = () => {
  const saved = localStorage.getItem('freelancerData');
  if (saved) {
    const data = JSON.parse(saved);
    clients.value = data.clients;
    settings.value = data.settings;
  }
};

// Salvar automaticamente
watch([clients, settings], () => {
  localStorage.setItem('freelancerData', JSON.stringify({
    clients: clients.value,
    settings: settings.value
  }));
}, { deep: true });

// Chamar ao iniciar
loadFromStorage();
```

## 🐛 Troubleshooting

### Problema: Totais não calculam
**Solução**: Verifique se o `hourlyRate` está sendo passado corretamente via props

### Problema: WhatsApp não abre
**Solução**: Número deve estar no formato internacional (ex: 5511999999999)

### Problema: Modal não fecha
**Solução**: Verifique se o evento `@click.self` está no overlay

### Problema: Dark mode não funciona
**Solução**: Certifique-se de que as classes `dark:` estão presentes e que o dark mode está ativo no app

## 📞 Integração

O componente está integrado automaticamente na aba "Freelancers" do menu principal. Para usar em outro lugar:

```vue
<script setup lang="ts">
import FreelancerManagement from '@/components/freelancer/FreelancerManagement.vue';
</script>

<template>
  <FreelancerManagement />
</template>
```

## ✅ Checklist de Uso

- [x] Componente criado em Vue 3
- [x] TypeScript com tipagem completa
- [x] Composition API (`<script setup>`)
- [x] Dark mode integrado
- [x] Responsivo e acessível
- [x] Integrado na navegação
- [x] Sem erros de lint
- [x] Documentação completa

---

**Desenvolvido com Vue 3 + TypeScript + Composition API**
**Seguindo os padrões do projeto por.quinho** 🐷