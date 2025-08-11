# 🔄 Funcionalidade de Recorrência na Edição

## 📋 Visão Geral

A nova funcionalidade permite transformar registros existentes em recorrentes durante a edição, incluindo detecção inteligente de conflitos e confirmação de sobrescrita.

## ✨ Características Principais

### 🎯 **Ativação da Recorrência**

- **Toggle Simples**: Checkbox "Tornar recorrente" no sheet de edição
- **Configuração Flexível**: Frequência (semanal, quinzenal, mensal, trimestral)
- **Data Final**: Configurável ou automática (1 ano)

### 🔍 **Detecção Inteligente**

```typescript
// Verifica similaridade de descrição
const similar = data.value.find(
  (record) =>
    record.Descrição.toLowerCase().includes(
      editingRecord.value!.Descrição.toLowerCase()
    ) ||
    editingRecord
      .value!.Descrição.toLowerCase()
      .includes(record.Descrição.toLowerCase())
);
```

### ⚠️ **Sistema de Alertas**

- **Warning Visual**: Quando detecta recorrência similar existente
- **Confirmação**: Opções para sobrescrever ou cancelar
- **Preview**: Mostra quantas ocorrências serão criadas

## 🔧 Fluxo de Funcionamento

### 1. **Ativação**

```
Usuário edita registro → Ativa "Tornar recorrente" → Configura frequência
```

### 2. **Detecção**

```
Sistema verifica → Encontra similar → Exibe warning → Usuário decide
```

### 3. **Processamento**

```
Confirma → Atualiza original → Gera recorrências → Restaura configurações
```

## 📱 Interface do Usuário

### **🎨 Design Responsivo**

- **Header com Ícone**: `fas fa-repeat` com cor purple-500
- **Warning Card**: Fundo orange-50 com bordas orange-200
- **Preview Card**: Fundo purple-50 com informações da recorrência

### **🎛️ Controles**

- **Checkbox**: Ativar/desativar recorrência
- **Select**: Escolher frequência
- **Date Input**: Data final opcional
- **Botões**: Sobrescrever/Cancelar no warning

## 🔄 Lógica de Recorrência

### **📅 Frequências Suportadas**

```typescript
const frequencies = {
  semanal: "toda semana", // +7 dias
  quinzenal: "a cada 15 dias", // +15 dias
  mensal: "todo mês", // +1 mês
  trimestral: "a cada 3 meses", // +3 meses
};
```

### **📊 Cálculo de Ocorrências**

```typescript
function getEditRecurrenceOccurrences(): number {
  let count = 1;
  let currentDate = new Date(startDate);

  while (currentDate < endDate) {
    // Incrementa baseado na frequência
    if (currentDate <= endDate) count++;
  }

  return count;
}
```

## 🛡️ Validações e Segurança

### **✅ Validações**

- **Data Válida**: Verifica se editingRecord existe
- **Frequência**: Apenas valores permitidos
- **Conflitos**: Detecção automática de similares

### **🔒 Segurança**

- **Estado Temporário**: Configurações são restauradas após uso
- **Isolamento**: Não afeta recorrência global durante edição
- **Cleanup**: Reset automático ao abrir/fechar edição

## 📋 Estados e Variáveis

### **Estado da Recorrência**

```typescript
const editRecurrence = reactive({
  isActive: false,
  frequency: "mensal",
  endDate: "",
});
```

### **Warning de Conflito**

```typescript
const existingRecurrenceWarning = ref<{
  description: string;
  frequency: string;
  originalRecord?: any;
} | null>(null);
```

## 🎯 Benefícios

1. **⚡ Eficiência**: Transforma registros únicos em recorrentes
2. **🧠 Inteligente**: Detecta conflitos automaticamente
3. **🔒 Seguro**: Confirma antes de sobrescrever
4. **👁️ Transparente**: Preview das ocorrências
5. **🎨 Intuitivo**: Interface clara e responsiva

## 🚀 Uso Prático

### **Cenário Típico**

1. Usuário tem registro "Aluguel - R$ 1.200"
2. Clica em editar → Ativa recorrência → Escolhe "mensal"
3. Sistema detecta outro "Aluguel" existente → Exibe warning
4. Usuário confirma sobrescrita → Sistema gera 12 ocorrências
5. Registro original é atualizado, novos são criados

### **Resultado**

- ✅ 1 registro original atualizado
- ✅ 11 novos registros recorrentes criados
- ✅ Configuração global preservada
- ✅ Interface limpa e resetada

## 🔧 Integração

A funcionalidade se integra perfeitamente com:

- ✅ Sistema de recorrência existente
- ✅ Validações de formulário
- ✅ Cálculo de saldo cronológico
- ✅ Persistência no localStorage
- ✅ Interface mobile/desktop

---

**Implementado com Vue 3 + TypeScript + Tailwind CSS**
