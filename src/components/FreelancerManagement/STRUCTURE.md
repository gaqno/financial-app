# Estrutura do Projeto - Freelancer Management

## 📁 Arquitetura de Arquivos

```
FreelancerManagement/
│
├── 📄 index.tsx                          # Componente principal (apenas template)
├── 📄 types.ts                           # Interfaces e tipos TypeScript
├── 📄 schemas.ts                         # Schemas de validação Zod
├── 📄 exports.ts                         # Exports públicos
│
├── 📂 hooks/                             # Hooks customizados (TODA A LÓGICA)
│   ├── useFreelancerManagement.ts       # Hook principal de gerenciamento
│   ├── useClientForm.ts                 # Hook para formulário de cliente
│   ├── useProjectForm.ts                # Hook para formulário de projeto
│   ├── useSubtaskForm.ts                # Hook para formulário de tarefa
│   └── useHourlyRateForm.ts             # Hook para formulário de valor/hora
│
├── 📂 components/                        # Componentes visuais
│   │
│   ├── 📂 Client/                       # Componente de Cliente
│   │   ├── index.tsx                    # Template do cliente
│   │   └── hooks/
│   │       └── useClient.ts             # Lógica do cliente
│   │
│   ├── 📂 Project/                      # Componente de Projeto
│   │   ├── index.tsx                    # Template do projeto
│   │   └── hooks/
│   │       └── useProject.ts            # Lógica do projeto
│   │
│   ├── 📂 Subtask/                      # Componente de Tarefa
│   │   ├── index.tsx                    # Template da tarefa
│   │   └── hooks/
│   │       └── useSubtask.ts            # Lógica da tarefa
│   │
│   └── 📂 Modals/                       # Componentes de Modal
│       ├── AddClientModal.tsx           # Modal de adicionar cliente
│       ├── AddProjectModal.tsx          # Modal de adicionar projeto
│       ├── AddSubtaskModal.tsx          # Modal de adicionar tarefa
│       └── EditHourlyRateModal.tsx      # Modal de editar valor/hora
│
└── 📚 Documentação/
    ├── README.md                         # Documentação completa
    ├── QUICKSTART.md                     # Guia rápido de início
    ├── DEPENDENCIES.md                   # Lista de dependências
    ├── STRUCTURE.md                      # Este arquivo
    └── Example.tsx                       # Exemplos de uso
```

## 🔄 Fluxo de Dados

```
┌─────────────────────────────────────────────────────────────┐
│                    FreelancerManagement                      │
│                     (Componente Root)                        │
└────────────────────────────┬────────────────────────────────┘
                             │
                             │ usa
                             ▼
┌─────────────────────────────────────────────────────────────┐
│              useFreelancerManagement (Hook)                  │
│  • Gerencia estado (clients, hourlyRate, modalState)        │
│  • Funções de CRUD (add, delete, toggle)                    │
│  • Cálculos (totais, contagens)                             │
└────────────────────────────┬────────────────────────────────┘
                             │
                             │ passa props para
                             ▼
┌─────────────────────────────────────────────────────────────┐
│                    Client Components                         │
│  • Recebe dados e callbacks                                 │
│  • Renderiza UI                                             │
│  • Delega lógica para useClient                             │
└────────────────────────────┬────────────────────────────────┘
                             │
                             │ contém
                             ▼
┌─────────────────────────────────────────────────────────────┐
│                   Project Components                         │
│  • Recebe dados e callbacks                                 │
│  • Renderiza UI                                             │
│  • Delega lógica para useProject                            │
└────────────────────────────┬────────────────────────────────┘
                             │
                             │ contém
                             ▼
┌─────────────────────────────────────────────────────────────┐
│                   Subtask Components                         │
│  • Recebe dados e callbacks                                 │
│  • Renderiza UI                                             │
│  • Delega lógica para useSubtask                            │
└─────────────────────────────────────────────────────────────┘
```

## 🎨 Separação de Responsabilidades

### 📄 Componentes (.tsx)
**Responsabilidade**: Apenas UI/Template
- Recebem props
- Renderizam JSX
- Chamam hooks
- **SEM** lógica de negócio
- **SEM** estado próprio (exceto UI local)

### 🔧 Hooks (.ts)
**Responsabilidade**: Toda a Lógica
- Gerenciam estado
- Implementam funções de negócio
- Realizam cálculos
- Manipulam dados
- **SEM** JSX

### 📋 Types (.ts)
**Responsabilidade**: Contratos de Dados
- Definem interfaces
- Definem enums
- Tipagem TypeScript

### ✅ Schemas (.ts)
**Responsabilidade**: Validação
- Schemas Zod
- Regras de validação
- Tipos inferidos

## 🧩 Componentes e suas Responsabilidades

### FreelancerManagement (Root)
- Renderiza layout principal
- Gerencia modais
- Coordena comunicação entre componentes

### Client
- Exibe informações do cliente
- Colapsável/expansível
- Contém projetos
- Botão WhatsApp
- Totais calculados

### Project
- Exibe informações do projeto
- Colapsável/expansível
- Contém tarefas
- Total do projeto

### Subtask
- Exibe tarefa individual
- Checkbox de conclusão
- Cálculo de preço
- Botão de exclusão

### Modals
- Formulários de entrada
- Validação integrada
- Feedback de erros

## 📊 Estado Global

```typescript
// Estado principal gerenciado por useFreelancerManagement
{
  clients: IClient[],          // Lista de clientes
  hourlyRate: number,          // Valor por hora
  modalState: IModalState      // Estado dos modais
}

// Estrutura de dados
IClient {
  id: string
  clientName: string
  whatsappNumber: string
  projects: IProject[]
}

IProject {
  id: string
  projectName: string
  subtasks: ISubtask[]
}

ISubtask {
  id: string
  taskName: string
  projectedHours: number
  completed: boolean
}
```

## 🔐 Princípios SOLID Aplicados

### Single Responsibility Principle (SRP)
- Cada componente tem UMA responsabilidade
- Cada hook gerencia UM aspecto
- Separação clara: UI vs Lógica

### Open/Closed Principle (OCP)
- Componentes são extensíveis sem modificação
- Novos tipos de modal podem ser adicionados
- Validações podem ser estendidas

### Liskov Substitution Principle (LSP)
- Todos os hooks retornam interfaces consistentes
- Componentes podem ser substituídos

### Interface Segregation Principle (ISP)
- Interfaces específicas e focadas
- Props necessárias claramente definidas

### Dependency Inversion Principle (DIP)
- Componentes dependem de abstrações (interfaces)
- Não dependem de implementações concretas

## 🧪 Testabilidade

A arquitetura facilita testes:

```typescript
// Teste de Hook
test('useFreelancerManagement adds client', () => {
  const { result } = renderHook(() => useFreelancerManagement());
  act(() => {
    result.current.addClient('João', '5511999999999');
  });
  expect(result.current.clients).toHaveLength(1);
});

// Teste de Componente
test('Client renders correctly', () => {
  render(<Client client={mockClient} {...mockProps} />);
  expect(screen.getByText('João Silva')).toBeInTheDocument();
});

// Teste de Validação
test('clientSchema validates correctly', () => {
  expect(() => clientSchema.parse({ clientName: '', whatsappNumber: '123' }))
    .toThrow();
});
```

## 📈 Escalabilidade

A estrutura permite fácil expansão:

1. **Novos Campos**: Adicionar em `types.ts` e `schemas.ts`
2. **Novas Features**: Criar novo hook em `hooks/`
3. **Novos Modais**: Adicionar em `Modals/` e `EModalType`
4. **Novos Componentes**: Seguir padrão Component + Hook
5. **Persistência**: Adicionar no hook principal
6. **API Integration**: Usar react-query nos hooks

## 🎯 Melhores Práticas Implementadas

✅ **Componentes Puros**: Apenas apresentação  
✅ **Hooks Customizados**: Lógica isolada  
✅ **TypeScript**: Tipagem forte  
✅ **Validação**: Zod schemas  
✅ **Immutabilidade**: Estado imutável  
✅ **Nomenclatura**: Consistente e clara  
✅ **DRY**: Sem duplicação  
✅ **SRP**: Uma responsabilidade por arquivo  
✅ **Documentação**: Completa e atualizada  
✅ **Modularidade**: Fácil manutenção  

## 🔄 Ciclo de Desenvolvimento

```
1. Definir tipos (types.ts)
   ↓
2. Criar schemas de validação (schemas.ts)
   ↓
3. Implementar lógica (hooks/)
   ↓
4. Criar componente visual (components/)
   ↓
5. Testar funcionalidade
   ↓
6. Documentar
   ↓
7. Refatorar se necessário
```
