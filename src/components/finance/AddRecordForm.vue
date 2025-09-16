<template>
  <section
    class="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden theme-transition"
  >
    <div class="px-4 py-3 bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
      <div class="flex items-center justify-between">
        <h2 class="text-lg font-semibold text-gray-900 dark:text-gray-100">
          <i class="fas fa-plus-circle text-blue-500 mr-2"></i>
          {{ isMultipleMode ? 'Múltiplos Registros' : 'Novo Registro' }}
        </h2>
        <div class="flex items-center gap-2">
          <span class="text-sm text-gray-600 dark:text-gray-300">
            {{ isMultipleMode ? 'Múltiplos' : 'Único' }}
          </span>
          <label class="relative inline-flex items-center cursor-pointer">
            <input v-model="isMultipleMode" type="checkbox" class="sr-only peer" />
            <div
              class="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"
            >
              >
            </div>
          </label>
        </div>
      </div>
    </div>

    <!-- Form Content -->
    <div class="p-4">
      <!-- Single Record Form (Desktop) -->
      <div v-if="!isMultipleMode" class="hidden lg:block">
        <form @submit.prevent="handleSubmit" class="grid grid-cols-7 gap-3 items-center">
          <Input v-model="newRecord.Data" type="date" size="md" required />
          <Input
            v-model="newRecord.Descrição"
            type="text"
            placeholder="Descrição"
            size="md"
            :clearable="true"
            required
          />
          <CurrencyInput
            v-model="newRecord.Valor"
            :tipo="newRecord.Tipo"
            placeholder="R$ 0,00"
            input-class="border border-gray-300 p-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            required
          />
          <Select v-model="newRecord.Tipo" :options="tipoOptions" size="md" required />
          <Select v-model="newRecord.Categoria" :options="categoriaOptions" placeholder="🤖 Auto-detectar" size="md" />
          <Select v-model="newRecord.Status" :options="statusOptions" size="md" required />
          <Button
            type="submit"
            variant="primary"
            size="md"
            :disabled="isAdding"
            :loading="isAdding"
            left-icon="fas fa-plus"
          >
            {{ isAdding ? 'Adicionando...' : 'Adicionar' }}
          </Button>
        </form>
      </div>

      <!-- Single Record Form (Mobile) -->
      <div v-if="!isMultipleMode" class="lg:hidden">
        <form @submit.prevent="handleSubmit" class="space-y-4">
          <div class="grid grid-cols-2 gap-3">
            <div>
              <Label for="mobile-data" :required="true">Data</Label>
              <Input id="mobile-data" v-model="newRecord.Data" type="date" size="lg" required />
            </div>
            <div>
              <Label for="mobile-valor" :required="true">Valor</Label>
              <CurrencyInput
                v-model="newRecord.Valor"
                :tipo="newRecord.Tipo"
                placeholder="R$ 0,00"
                input-class="w-full border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>
          </div>

          <div>
            <Label for="mobile-descricao" :required="true">Descrição</Label>
            <Input
              id="mobile-descricao"
              v-model="newRecord.Descrição"
              type="text"
              placeholder="Ex: Supermercado, Salário..."
              size="lg"
              :clearable="true"
              required
            />
          </div>

          <div class="grid grid-cols-2 gap-3">
            <div>
              <Label for="mobile-tipo-2" :required="true">Tipo</Label>
              <Select id="mobile-tipo-2" v-model="newRecord.Tipo" :options="tipoOptionsExtended" size="lg" required />
            </div>
            <div>
              <Label for="mobile-status-2" :required="true">Status</Label>
              <Select
                id="mobile-status-2"
                v-model="newRecord.Status"
                :options="statusOptionsExtended"
                size="lg"
                required
              />
            </div>
          </div>

          <div>
            <Label for="mobile-categoria-2">Categoria</Label>
            <Select
              id="mobile-categoria-2"
              v-model="newRecord.Categoria"
              :options="categoriaOptions"
              placeholder="🤖 Auto-detectar categoria"
              size="lg"
            />
          </div>

          <Button
            type="submit"
            variant="primary"
            size="xl"
            :disabled="isAdding"
            :loading="isAdding"
            left-icon="fas fa-plus"
            :full-width="true"
            class="shadow-lg"
          >
            {{ isAdding ? 'Adicionando...' : 'Adicionar Registro' }}
          </Button>
        </form>
      </div>

      <!-- Multiple Records Mode -->
      <div v-if="isMultipleMode" class="space-y-4">
        <!-- Header -->
        <div class="flex items-center justify-between">
          <span class="text-sm text-gray-600">
            {{ multipleRecords.length }} registro{{ multipleRecords.length !== 1 ? 's' : '' }} na lista
          </span>
          <div class="flex gap-2">
            <button
              @click="addToMultipleList"
              type="button"
              class="bg-green-500 hover:bg-green-600 text-white rounded-lg px-3 py-2 text-sm font-medium transition-colors"
            >
              <i class="fas fa-plus mr-1"></i>
              Adicionar à Lista
            </button>
            <button
              @click="saveAllMultiple"
              type="button"
              v-if="multipleRecords.length > 0"
              :disabled="isSavingMultiple"
              class="bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed text-white rounded-lg px-3 py-2 text-sm font-medium transition-colors"
            >
              <i v-if="!isSavingMultiple" class="fas fa-save mr-1"></i>
              <i v-else class="fas fa-spinner fa-spin mr-1"></i>
              {{ isSavingMultiple ? 'Salvando...' : `Salvar Todos (${multipleRecords.length})` }}
            </button>
            <button
              @click="clearMultiple"
              type="button"
              v-if="multipleRecords.length > 0"
              class="bg-red-500 hover:bg-red-600 text-white rounded-lg px-3 py-2 text-sm font-medium transition-colors"
            >
              <i class="fas fa-trash mr-1"></i>
              Limpar
            </button>
          </div>
        </div>

        <!-- Add Form -->
        <div class="grid grid-cols-7 gap-3 items-center p-3 bg-gray-50 rounded-lg">
          <input
            v-model="newRecord.Data"
            type="date"
            class="border border-gray-300 p-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <input
            v-model="newRecord.Descrição"
            type="text"
            placeholder="Descrição"
            class="border border-gray-300 p-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <CurrencyInput
            v-model="newRecord.Valor"
            :tipo="newRecord.Tipo"
            placeholder="R$ 0,00"
            input-class="border border-gray-300 p-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <select
            v-model="newRecord.Tipo"
            class="border border-gray-300 p-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="Receita">Receita</option>
            <option value="Despesa">Despesa</option>
          </select>
          <select
            v-model="newRecord.Categoria"
            class="border border-gray-300 p-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">🤖 Auto</option>
            <option v-for="category in getAllCategories()" :key="category" :value="category">
              {{ getCategoryIcon(category) }} {{ category }}
            </option>
          </select>
          <select
            v-model="newRecord.Status"
            class="border border-gray-300 p-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="❌">❌</option>
            <option value="✔️">✔️</option>
          </select>
          <button
            @click="addToMultipleList"
            type="button"
            class="bg-green-500 hover:bg-green-600 text-white rounded-lg px-4 py-2 font-medium transition-colors"
          >
            <i class="fa fa-plus mr-1"></i>
            +
          </button>
        </div>

        <!-- Multiple Records List -->
        <div v-if="multipleRecords.length > 0" class="space-y-2">
          <h4 class="text-sm font-semibold text-gray-700">Registros a serem salvos:</h4>
          <div class="max-h-64 overflow-y-auto space-y-2">
            <div
              v-for="(record, index) in multipleRecords"
              :key="index"
              class="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-lg"
            >
              <div class="flex-1 grid grid-cols-6 gap-2 text-sm">
                <span>{{ formatDate(record.Data) }}</span>
                <span class="font-medium">{{ record.Descrição }}</span>
                <span :class="record.Valor < 0 ? 'text-red-600' : 'text-green-600'" class="font-semibold">
                  {{ record.Valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) }}
                </span>
                <span
                  class="text-xs px-2 py-1 rounded-full"
                  :class="record.Tipo === 'Receita' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'"
                >
                  {{ record.Tipo === 'Receita' ? '💰' : '💸' }} {{ record.Tipo }}
                </span>
                <span class="text-xs">{{ record.Categoria || 'Sem categoria' }}</span>
                <span
                  class="text-xs px-2 py-1 rounded-full"
                  :class="record.Status === '✔️' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'"
                >
                  {{ record.Status }}
                </span>
              </div>
              <button
                @click="removeFromMultiple(index)"
                class="ml-2 text-red-600 hover:text-red-800 p-1 rounded hover:bg-red-50"
              >
                <i class="fas fa-times text-sm"></i>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
  import { computed } from 'vue';
  import { useFinanceForms } from '../../composables/finance/useFinanceForms';
  import { useCategoryDetection } from '../../composables/useCategoryDetection';
  import { formatDateForDisplay } from '../../utils/dateUtils';
  import CurrencyInput from '../CurrencyInput.vue';
  import { Input } from '@/components/ui/input/Input.vue';
  import { Select } from '@/components/ui/select/Select.vue';
  import { Button } from '@/components/ui/button/Button.vue';
  import { Label } from '@/components/ui/label/Label.vue';

  // Computed options for Select components
  const tipoOptions = computed(() => [
    { label: 'Receita', value: 'Receita' },
    { label: 'Despesa', value: 'Despesa' },
  ]);

  const tipoOptionsExtended = computed(() => [
    { label: '💰 Receita', value: 'Receita' },
    { label: '💸 Despesa', value: 'Despesa' },
  ]);

  const statusOptions = computed(() => [
    { label: '❌', value: '❌' },
    { label: '✔️', value: '✔️' },
  ]);

  const statusOptionsExtended = computed(() => [
    { label: '❌ Pendente', value: '❌' },
    { label: '✔️ Confirmado', value: '✔️' },
  ]);

  const categoriaOptions = computed(() => {
    const categories = getAllCategories();
    return [
      { label: '🤖 Auto-detectar', value: '' },
      ...categories.map((category) => ({
        label: `${getCategoryIcon(category)} ${category}`,
        value: category,
      })),
    ];
  });

  const {
    newRecord,
    isMultipleMode,
    multipleRecords,
    isAdding,
    isSavingMultiple,
    handleAdd,
    addMultipleRecord,
    saveAllMultipleRecords,
    clearMultipleRecords,
    removeMultipleRecord,
  } = useFinanceForms();

  const { getAllCategories, getCategoryIcon } = useCategoryDetection();

  // Methods
  const handleSubmit = () => {
    handleAdd();
  };

  const addToMultipleList = () => {
    addMultipleRecord();
  };

  const saveAllMultiple = () => {
    saveAllMultipleRecords();
  };

  const clearMultiple = () => {
    clearMultipleRecords();
  };

  const removeFromMultiple = (index: number) => {
    removeMultipleRecord(index);
  };

  const formatDate = (dateStr: string): string => {
    return formatDateForDisplay(dateStr);
  };
</script>

<script lang="ts">
  // Component name for debugging and DevTools
  export default {
    name: 'AddRecordForm',
  };
</script>

<!-- 
CONVERSÃO PARA COMPOSITION API:
- Convertido de Options API (defineComponent + setup) para Composition API puro com <script setup>
- Removido defineComponent, components e setup() wrapper
- Toda lógica mantida igual, apenas removida do objeto de retorno do setup()
- Adicionado displayName conforme padrão do projeto
- Imports mantidos iguais
-->
