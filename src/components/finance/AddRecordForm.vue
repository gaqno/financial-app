<template>
  <section class="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
    <div class="px-4 py-3 bg-gray-50 border-b border-gray-200">
      <div class="flex items-center justify-between">
        <h2 class="text-lg font-semibold text-gray-900">
          <i class="fas fa-plus-circle text-blue-500 mr-2"></i>
          {{ isMultipleMode ? 'Múltiplos Registros' : 'Novo Registro' }}
        </h2>
        <div class="flex items-center gap-2">
          <span class="text-sm text-gray-600">{{ isMultipleMode ? 'Múltiplos' : 'Único' }}</span>
          <label class="relative inline-flex items-center cursor-pointer">
            <input v-model="isMultipleMode" type="checkbox" class="sr-only peer">
            <div
              class="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600">
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
          <input v-model="newRecord.Data" type="date"
            class="border border-gray-300 p-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            required />
          <input v-model="newRecord.Descrição" type="text" placeholder="Descrição"
            class="border border-gray-300 p-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            required />
          <CurrencyInput v-model="newRecord.Valor" :tipo="newRecord.Tipo" placeholder="R$ 0,00"
            inputClass="border border-gray-300 p-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            required />
          <select v-model="newRecord.Tipo"
            class="border border-gray-300 p-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            required>
            <option value="Receita">Receita</option>
            <option value="Despesa">Despesa</option>
          </select>
          <select v-model="newRecord.Categoria"
            class="border border-gray-300 p-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
            <option value="">🤖 Auto-detectar</option>
            <option v-for="category in getAllCategories()" :key="category" :value="category">
              {{ getCategoryIcon(category) }} {{ category }}
            </option>
          </select>
          <select v-model="newRecord.Status"
            class="border border-gray-300 p-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            required>
            <option value="❌">❌</option>
            <option value="✔️">✔️</option>
          </select>
          <button type="submit"
            class="bg-blue-500 hover:bg-blue-600 text-white rounded-lg px-4 py-2 font-medium transition-colors">
            <i class="fa fa-plus mr-1"></i>Adicionar
          </button>
        </form>
      </div>

      <!-- Single Record Form (Mobile) -->
      <div v-if="!isMultipleMode" class="lg:hidden">
        <form @submit.prevent="handleSubmit" class="space-y-4">
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Data</label>
              <input v-model="newRecord.Data" type="date"
                class="w-full border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Valor</label>
              <CurrencyInput v-model="newRecord.Valor" :tipo="newRecord.Tipo" placeholder="R$ 0,00"
                inputClass="w-full border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required />
            </div>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Descrição</label>
            <input v-model="newRecord.Descrição" type="text" placeholder="Ex: Supermercado, Salário..."
              class="w-full border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required />
          </div>

          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Tipo</label>
              <select v-model="newRecord.Tipo"
                class="w-full border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none"
                required>
                <option value="Receita">💰 Receita</option>
                <option value="Despesa">💸 Despesa</option>
              </select>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select v-model="newRecord.Status"
                class="w-full border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none"
                required>
                <option value="❌">❌ Pendente</option>
                <option value="✔️">✔️ Confirmado</option>
              </select>
            </div>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Categoria</label>
            <select v-model="newRecord.Categoria"
              class="w-full border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none">
              <option value="">🤖 Auto-detectar categoria</option>
              <optgroup label="📂 Categorias Disponíveis">
                <option v-for="category in getAllCategories()" :key="category" :value="category">
                  {{ getCategoryIcon(category) }} {{ category }}
                </option>
              </optgroup>
            </select>
          </div>

          <button type="submit"
            class="w-full bg-blue-500 hover:bg-blue-600 text-white rounded-xl p-4 font-semibold text-lg transition-colors shadow-lg">
            <i class="fa fa-plus mr-2"></i>
            Adicionar Registro
          </button>
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
            <button @click="addToMultipleList" type="button"
              class="bg-green-500 hover:bg-green-600 text-white rounded-lg px-3 py-2 text-sm font-medium transition-colors">
              <i class="fas fa-plus mr-1"></i>Adicionar à Lista
            </button>
            <button @click="saveAllMultiple" type="button" v-if="multipleRecords.length > 0"
              class="bg-blue-500 hover:bg-blue-600 text-white rounded-lg px-3 py-2 text-sm font-medium transition-colors">
              <i class="fas fa-save mr-1"></i>Salvar Todos ({{ multipleRecords.length }})
            </button>
            <button @click="clearMultiple" type="button" v-if="multipleRecords.length > 0"
              class="bg-red-500 hover:bg-red-600 text-white rounded-lg px-3 py-2 text-sm font-medium transition-colors">
              <i class="fas fa-trash mr-1"></i>Limpar
            </button>
          </div>
        </div>

        <!-- Add Form -->
        <div class="grid grid-cols-7 gap-3 items-center p-3 bg-gray-50 rounded-lg">
          <input v-model="newRecord.Data" type="date"
            class="border border-gray-300 p-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
          <input v-model="newRecord.Descrição" type="text" placeholder="Descrição"
            class="border border-gray-300 p-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
          <CurrencyInput v-model="newRecord.Valor" :tipo="newRecord.Tipo" placeholder="R$ 0,00"
            inputClass="border border-gray-300 p-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
          <select v-model="newRecord.Tipo"
            class="border border-gray-300 p-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
            <option value="Receita">Receita</option>
            <option value="Despesa">Despesa</option>
          </select>
          <select v-model="newRecord.Categoria"
            class="border border-gray-300 p-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
            <option value="">🤖 Auto</option>
            <option v-for="category in getAllCategories()" :key="category" :value="category">
              {{ getCategoryIcon(category) }} {{ category }}
            </option>
          </select>
          <select v-model="newRecord.Status"
            class="border border-gray-300 p-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
            <option value="❌">❌</option>
            <option value="✔️">✔️</option>
          </select>
          <button @click="addToMultipleList" type="button"
            class="bg-green-500 hover:bg-green-600 text-white rounded-lg px-4 py-2 font-medium transition-colors">
            <i class="fa fa-plus mr-1"></i>+
          </button>
        </div>

        <!-- Multiple Records List -->
        <div v-if="multipleRecords.length > 0" class="space-y-2">
          <h4 class="text-sm font-semibold text-gray-700">Registros a serem salvos:</h4>
          <div class="max-h-64 overflow-y-auto space-y-2">
            <div v-for="(record, index) in multipleRecords" :key="index"
              class="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-lg">
              <div class="flex-1 grid grid-cols-6 gap-2 text-sm">
                <span>{{ formatDate(record.Data) }}</span>
                <span class="font-medium">{{ record.Descrição }}</span>
                <span :class="record.Valor < 0 ? 'text-red-600' : 'text-green-600'" class="font-semibold">
                  {{ record.Valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) }}
                </span>
                <span class="text-xs px-2 py-1 rounded-full"
                  :class="record.Tipo === 'Receita' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'">
                  {{ record.Tipo === 'Receita' ? '💰' : '💸' }} {{ record.Tipo }}
                </span>
                <span class="text-xs">{{ record.Categoria || 'Sem categoria' }}</span>
                <span class="text-xs px-2 py-1 rounded-full"
                  :class="record.Status === '✔️' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'">
                  {{ record.Status }}
                </span>
              </div>
              <button @click="removeFromMultiple(index)"
                class="ml-2 text-red-600 hover:text-red-800 p-1 rounded hover:bg-red-50">
                <i class="fas fa-times text-sm"></i>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import { useFinanceForms } from '../../composables/finance/useFinanceForms'
import { useCategoryDetection } from '../../composables/useCategoryDetection'
import CurrencyInput from '../CurrencyInput.vue'

export default defineComponent({
  name: 'AddRecordForm',
  components: {
    CurrencyInput
  },
  setup() {
    const {
      newRecord,
      isMultipleMode,
      multipleRecords,
      handleAdd,
      addMultipleRecord,
      saveAllMultipleRecords,
      clearMultipleRecords,
      removeMultipleRecord
    } = useFinanceForms()

    const { getAllCategories, getCategoryIcon } = useCategoryDetection()

    // Methods
    const handleSubmit = () => {
      handleAdd()
    }

    const addToMultipleList = () => {
      addMultipleRecord()
    }

    const saveAllMultiple = () => {
      saveAllMultipleRecords()
    }

    const clearMultiple = () => {
      clearMultipleRecords()
    }

    const removeFromMultiple = (index: number) => {
      removeMultipleRecord(index)
    }

    const formatDate = (dateStr: string): string => {
      const date = new Date(dateStr)
      return date.toLocaleDateString('pt-BR')
    }

    return {
      newRecord,
      isMultipleMode,
      multipleRecords,
      getAllCategories,
      getCategoryIcon,
      handleSubmit,
      addToMultipleList,
      saveAllMultiple,
      clearMultiple,
      removeFromMultiple,
      formatDate
    }
  }
})
</script>