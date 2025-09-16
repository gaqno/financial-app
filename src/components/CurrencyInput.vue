<template>
  <input
    :value="formattedValue"
    @input="handleInput"
    @blur="handleBlur"
    @focus="handleFocus"
    type="text"
    :placeholder="placeholder"
    :class="inputClass"
    :required="required"
  />
</template>

<script setup lang="ts">
  import { ref, watch, computed } from 'vue';

  // Props
  interface Props {
    modelValue?: number;
    placeholder?: string;
    inputClass?: string;
    required?: boolean;
    tipo?: 'Receita' | 'Despesa';
  }

  const props = withDefaults(defineProps<Props>(), {
    modelValue: 0,
    placeholder: 'R$ 0,00',
    inputClass:
      'w-full border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent',
    required: false,
    tipo: 'Receita',
  });

  // Emits
  const emit = defineEmits<{
    'update:modelValue': [value: number];
  }>();
  const formattedValue = ref('');
  const isUserTyping = ref(false);

  // Função para aplicar o sinal correto baseado no tipo
  function applyCorrectSign(value: number): number {
    if (value === 0) return 0;

    const absoluteValue = Math.abs(value);
    return props.tipo === 'Despesa' ? -absoluteValue : absoluteValue;
  }

  // Função para formatar um valor numérico como moeda (para exibição)
  function formatNumberAsCurrency(value: number): string {
    if (value === 0) return '';

    // Sempre mostra o valor absoluto na interface, o sinal é controlado pelo tipo
    const displayValue = Math.abs(value);

    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(displayValue);
  }

  // Função para aplicar máscara de valor monetário durante digitação
  function formatCurrencyInput(value: string): string {
    if (!value) return '';

    // Remove tudo que não for número
    const numbers = value.replace(/\D/g, '');

    if (!numbers) return '';

    // Converte para centavos (apenas durante digitação)
    const cents = parseInt(numbers);
    const reais = cents / 100;

    // Formata como moeda brasileira (sempre positivo na exibição)
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(reais);
  }

  // Função para converter valor formatado de volta para número
  function parseCurrencyInput(value: string): number {
    if (!value) return 0;

    // Remove R$, espaços, pontos e converte vírgula para ponto
    const cleanValue = value
      .replace(/[R$\s]/g, '')
      .replace(/\./g, '')
      .replace(',', '.');

    const parsedValue = parseFloat(cleanValue) || 0;

    // Aplica o sinal correto baseado no tipo
    return applyCorrectSign(parsedValue);
  }

  // Função para lidar com input
  function handleInput(event: Event) {
    const target = event.target as HTMLInputElement;
    if (target) {
      isUserTyping.value = true;
      const formatted = formatCurrencyInput(target.value);
      formattedValue.value = formatted;
      const numericValue = parseCurrencyInput(formatted);
      emit('update:modelValue', numericValue);
    }
  }

  // Função para lidar com focus
  function handleFocus() {
    isUserTyping.value = true;
  }

  // Função para lidar com blur (garantir formatação)
  function handleBlur() {
    isUserTyping.value = false;
    if (props.modelValue !== undefined && props.modelValue !== null) {
      formattedValue.value = formatNumberAsCurrency(props.modelValue);
    }
  }

  // Watch para atualizar o valor formatado quando modelValue muda externamente
  watch(
    () => props.modelValue,
    (newValue) => {
      // Só atualiza se não estiver digitando
      if (!isUserTyping.value) {
        if (newValue !== undefined && newValue !== null && newValue !== 0) {
          formattedValue.value = formatNumberAsCurrency(newValue);
        } else {
          formattedValue.value = '';
        }
      }
    },
    { immediate: true }
  );

  // Watch para reagir a mudanças no tipo e reapliar o sinal correto
  watch(
    () => props.tipo,
    () => {
      if (props.modelValue !== undefined && props.modelValue !== null && props.modelValue !== 0) {
        const correctedValue = applyCorrectSign(props.modelValue);
        emit('update:modelValue', correctedValue);

        if (!isUserTyping.value) {
          formattedValue.value = formatNumberAsCurrency(correctedValue);
        }
      }
    }
  );
</script>

<script lang="ts">
  // Component name for debugging and DevTools
  export default {
    name: 'CurrencyInput',
  };
</script>

<!-- 
CONVERSÃO PARA COMPOSITION API:
- Convertido de Options API (export default { props, emits, setup }) para Composition API puro com <script setup>
- Props definidas com interface TypeScript e withDefaults(), incluindo validação de tipo para 'tipo'
- Emits definidas com defineEmits com tipagem TypeScript
- Toda lógica mantida igual, apenas removida do objeto de retorno do setup()
- Adicionado displayName conforme padrão do projeto
- Melhorada tipagem com union type para 'tipo' (Receita | Despesa)
-->
