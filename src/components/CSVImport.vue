<template>
  <section
    class="bg-white dark:bg-gray-900 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-800 transition-all duration-200 mb-4 overflow-hidden"
  >
    <!-- Modern Mobile Header -->
    <button
      @click="toggleImportSection"
      class="w-full flex items-center justify-between p-4 text-left hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors group"
    >
      <div class="flex items-center space-x-3 min-w-0 flex-1">
        <div
          class="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-600 dark:from-green-600 dark:to-emerald-700 rounded-xl flex items-center justify-center"
        >
          <i class="fas fa-file-csv text-white text-sm" />
        </div>
        <div class="min-w-0 flex-1">
          <h2 class="text-lg font-bold text-gray-900 dark:text-gray-100 truncate">Importar CSV</h2>
          <div class="flex items-center space-x-2 mt-0.5">
            <span v-if="!selectedFile" class="text-xs text-gray-500 dark:text-gray-400"> Adicione dados em lote </span>
            <span
              v-else
              class="px-2.5 py-1 text-xs font-semibold bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-300 rounded-full"
            >
              {{ selectedFile.name }}
            </span>
          </div>
        </div>
      </div>
      <div
        class="flex-shrink-0 w-8 h-8 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center group-hover:bg-gray-200 dark:group-hover:bg-gray-700 transition-colors"
      >
        <i
          :class="isExpanded ? 'fas fa-chevron-up' : 'fas fa-chevron-down'"
          class="text-gray-500 dark:text-gray-400 text-sm"
        />
      </div>
    </button>

    <div v-show="isExpanded" class="border-t border-gray-100 dark:border-gray-800">
      <!-- Upload section -->
      <div class="p-4 bg-gradient-to-r from-gray-50 to-green-50 dark:from-gray-800 dark:to-green-900/30">
        <!-- Upload Area -->
        <div
          class="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-2xl p-6 text-center hover:border-green-400 dark:hover:border-green-500 transition-all duration-200 bg-white dark:bg-gray-900 hover:shadow-lg"
          @click="!selectedFile && triggerFileInput()"
          :class="{ 'cursor-pointer': !selectedFile }"
        >
          <input ref="fileInputRef" type="file" accept=".csv" @change="onFileSelected" class="hidden" />

          <div v-if="!selectedFile" class="space-y-4">
            <div
              class="w-16 h-16 mx-auto bg-gradient-to-br from-green-100 to-emerald-100 dark:from-green-900/50 dark:to-emerald-900/50 rounded-2xl flex items-center justify-center"
            >
              <i class="fas fa-upload text-green-600 dark:text-green-400 text-2xl" />
            </div>
            <div>
              <h3 class="text-lg font-bold text-gray-900 dark:text-gray-100 mb-1">Selecionar Arquivo CSV</h3>
              <p class="text-gray-600 dark:text-gray-300 text-sm">Toque para escolher um arquivo de dados</p>
            </div>
            <button
              @click="triggerFileInput"
              class="bg-gradient-to-r from-green-500 to-emerald-600 dark:from-green-600 dark:to-emerald-700 text-white px-8 py-4 rounded-2xl hover:shadow-lg hover:scale-105 transition-all duration-200 font-bold text-sm"
            >
              📁 Escolher Arquivo
            </button>
          </div>

          <div v-else class="space-y-4">
            <div
              class="w-16 h-16 mx-auto bg-gradient-to-br from-green-100 to-emerald-100 dark:from-green-900/50 dark:to-emerald-900/50 rounded-2xl flex items-center justify-center"
            >
              <i class="fas fa-file-csv text-green-600 dark:text-green-400 text-2xl" />
            </div>
            <div>
              <h3 class="text-lg font-bold text-gray-900 dark:text-gray-100 mb-1">
                {{ selectedFile.name }}
              </h3>
              <p class="text-gray-600 dark:text-gray-300 text-sm">
                {{ formatFileSize(selectedFile.size) }}
              </p>
            </div>
            <div class="flex gap-3 justify-center">
              <button
                @click="importFile"
                :disabled="isImporting"
                class="bg-gradient-to-r from-green-500 to-emerald-600 dark:from-green-600 dark:to-emerald-700 text-white px-6 py-3 rounded-xl hover:shadow-lg hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 transition-all duration-200 font-bold text-sm"
              >
                <i v-if="isImporting" class="fas fa-spinner fa-spin mr-2" />
                {{ isImporting ? 'Importando...' : '✅ Importar' }}
              </button>
              <button
                @click="clearFile"
                :disabled="isImporting"
                class="bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 px-6 py-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 hover:shadow-md hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 transition-all duration-200 font-bold text-sm border border-gray-200 dark:border-gray-700"
              >
                🗑️ Cancelar
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Messages -->
      <div v-if="importError || importSuccess" class="p-4">
        <!-- Error Message -->
        <div
          v-if="importError"
          class="bg-gradient-to-r from-red-50 to-rose-50 dark:from-red-900/30 dark:to-rose-900/30 border-2 border-red-200 dark:border-red-700 rounded-2xl p-4 shadow-sm"
        >
          <div class="flex items-start space-x-3">
            <div
              class="flex-shrink-0 w-8 h-8 bg-red-100 dark:bg-red-900/50 rounded-xl flex items-center justify-center"
            >
              <i class="fas fa-exclamation-triangle text-red-600 dark:text-red-400 text-sm" />
            </div>
            <div class="flex-1 min-w-0">
              <h4 class="font-bold text-red-800 dark:text-red-200 text-sm mb-1">Erro na Importação</h4>
              <p class="text-red-700 dark:text-red-300 text-sm">{{ importError }}</p>
            </div>
            <button
              @click="clearMessages"
              class="flex-shrink-0 w-8 h-8 bg-red-100 dark:bg-red-900/50 rounded-xl flex items-center justify-center hover:bg-red-200 dark:hover:bg-red-800 transition-colors"
            >
              <i class="fas fa-times text-red-600 dark:text-red-400 text-sm" />
            </button>
          </div>
        </div>

        <!-- Success Message -->
        <div
          v-if="importSuccess"
          class="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/30 dark:to-emerald-900/30 border-2 border-green-200 dark:border-green-700 rounded-2xl p-4 shadow-sm"
        >
          <div class="flex items-start space-x-3">
            <div
              class="flex-shrink-0 w-8 h-8 bg-green-100 dark:bg-green-900/50 rounded-xl flex items-center justify-center"
            >
              <i class="fas fa-check-circle text-green-600 dark:text-green-400 text-sm" />
            </div>
            <div class="flex-1 min-w-0">
              <h4 class="font-bold text-green-800 dark:text-green-200 text-sm mb-1">Sucesso!</h4>
              <p class="text-green-700 dark:text-green-300 text-sm">{{ importSuccess }}</p>
            </div>
            <button
              @click="clearMessages"
              class="flex-shrink-0 w-8 h-8 bg-green-100 dark:bg-green-900/50 rounded-xl flex items-center justify-center hover:bg-green-200 dark:hover:bg-green-800 transition-colors"
            >
              <i class="fas fa-times text-green-600 dark:text-green-400 text-sm" />
            </button>
          </div>
        </div>
      </div>

      <!-- CSV Format Info -->
      <div class="p-4">
        <div
          class="bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-900/30 dark:to-cyan-900/30 border-2 border-blue-200 dark:border-blue-700 rounded-2xl p-4 shadow-sm"
        >
          <div class="flex items-center space-x-3 mb-4">
            <div
              class="flex-shrink-0 w-8 h-8 bg-blue-100 dark:bg-blue-900/50 rounded-xl flex items-center justify-center"
            >
              <i class="fas fa-info-circle text-blue-600 dark:text-blue-400 text-sm" />
            </div>
            <h3 class="font-bold text-blue-800 dark:text-blue-200 text-base">Formatos Suportados</h3>
          </div>

          <!-- Formato Compacto Mobile -->
          <div class="lg:hidden space-y-4">
            <!-- Format Cards -->
            <div class="grid gap-3">
              <div class="bg-white dark:bg-gray-800 rounded-xl p-3 border border-blue-200 dark:border-blue-700">
                <h4 class="font-bold text-blue-800 dark:text-blue-200 text-sm mb-2">📋 Formato Padrão</h4>
                <p class="text-xs text-blue-700 dark:text-blue-300">Data, Descrição, Valor, Tipo, Status</p>
              </div>
              <div class="bg-white dark:bg-gray-800 rounded-xl p-3 border border-blue-200 dark:border-blue-700">
                <h4 class="font-bold text-blue-800 dark:text-blue-200 text-sm mb-2">🆕 Novo Formato</h4>
                <p class="text-xs text-blue-700 dark:text-blue-300">Data, Descrição, Valor, Recorrente, Dia Útil</p>
              </div>
            </div>

            <!-- Features -->
            <div class="grid grid-cols-2 gap-2">
              <div class="flex items-center space-x-2 text-xs text-blue-600 dark:text-blue-300">
                <span>✨</span>
                <span>Auto categoria</span>
              </div>
              <div class="flex items-center space-x-2 text-xs text-blue-600 dark:text-blue-300">
                <span>💡</span>
                <span>Auto saldo</span>
              </div>
              <div class="flex items-center space-x-2 text-xs text-blue-600 dark:text-blue-300">
                <span>🔄</span>
                <span>Valores -R$</span>
              </div>
              <div class="flex items-center space-x-2 text-xs text-blue-600 dark:text-blue-300">
                <span>📅</span>
                <span>Status S/N</span>
              </div>
            </div>
          </div>

          <!-- Formato Completo Desktop -->
          <div class="hidden lg:block">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <!-- Formato Padrão -->
              <div>
                <p class="text-sm font-medium text-blue-800 dark:text-blue-200 mb-2">📋 Formato Padrão:</p>
                <div class="text-sm text-blue-700 dark:text-blue-200 space-y-1">
                  <div>
                    <strong>Data:</strong>
                    DD/MM ou YYYY-MM-DD
                  </div>
                  <div>
                    <strong>Descrição:</strong>
                    texto descritivo
                  </div>
                  <div>
                    <strong>Valor:</strong>
                    R$ 1.500,00 ou -R$ 800,00
                  </div>
                  <div>
                    <strong>Tipo:</strong>
                    "Receita" ou "Despesa"
                  </div>
                  <div>
                    <strong>Status:</strong>
                    "❌" ou "✔️"
                  </div>
                  <div>
                    <strong>Categoria:</strong>
                    opcional
                  </div>
                </div>
              </div>

              <!-- Novo Formato -->
              <div>
                <p class="text-sm font-medium text-blue-800 dark:text-blue-200 mb-2">🆕 Novo Formato (Compatível):</p>
                <div class="text-sm text-blue-700 dark:text-blue-200 space-y-1">
                  <div>
                    <strong>Data:</strong>
                    DD/MM
                  </div>
                  <div>
                    <strong>Descrição:</strong>
                    texto descritivo
                  </div>
                  <div>
                    <strong>Valor:</strong>
                    R$ 3.946,89 ou -R$ 1.246,29
                  </div>
                  <div>
                    <strong>Recorrente:</strong>
                    "S" ou "N" (convertido para Status)
                  </div>
                  <div>
                    <strong>Dia Util:</strong>
                    ignorado na importação
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="mt-3 p-3 bg-blue-100 dark:bg-blue-900/60 rounded-lg">
          <div class="text-sm text-blue-800 dark:text-blue-200 space-y-1">
            <div><strong>✨ Recursos Inteligentes:</strong></div>
            <div>• Categoria detectada automaticamente pela descrição</div>
            <div>• Tipo (Receita/Despesa) inferido do sinal do valor</div>
            <div>• Status S/N convertido para ✔️/❌</div>
            <div>• Suporte a valores com ponto de milhares (R$ 3.946,89)</div>
            <div>• Tratamento de valores negativos (-R$ 1.246,29)</div>
          </div>
          <!-- Download Sample -->
          <div class="mt-4 text-center">
            <button
              @click="downloadSample"
              class="inline-flex items-center space-x-2 bg-white dark:bg-gray-800 text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 border-2 border-blue-200 dark:border-blue-700 hover:border-blue-300 dark:hover:border-blue-600 px-4 py-2 rounded-xl font-bold text-sm hover:shadow-md hover:scale-105 transition-all duration-200"
            >
              <i class="fas fa-download" />
              <span>Baixar Modelos CSV</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
  import { ref } from 'vue';
  import { useCSVImport } from '../composables/useCSVImport';
  import type { IFinanceRecord } from '../types/finance';

  interface Props {
    onImport: (records: Omit<IFinanceRecord, 'Saldo'>[]) => void;
  }

  const props = defineProps<Props>();

  const { isImporting, importError, importSuccess, importCSV, clearMessages, generateSampleCSV } = useCSVImport();

  const fileInputRef = ref<HTMLInputElement | null>(null);
  const selectedFile = ref<File | null>(null);
  const isExpanded = ref(false);

  function toggleImportSection() {
    isExpanded.value = !isExpanded.value;
  }

  function triggerFileInput() {
    fileInputRef.value?.click();
  }

  function onFileSelected(event: Event) {
    const target = event.target as HTMLInputElement;
    const file = target.files?.[0];

    if (file) {
      if (!file.name.toLowerCase().endsWith('.csv')) {
        alert('Por favor, selecione um arquivo CSV válido.');
        return;
      }
      selectedFile.value = file;
      clearMessages();
    }
  }

  function clearFile() {
    selectedFile.value = null;
    if (fileInputRef.value) {
      fileInputRef.value.value = '';
    }
    clearMessages();
  }

  async function importFile() {
    if (!selectedFile.value) return;

    await importCSV(selectedFile.value, props.onImport);

    // Limpar arquivo selecionado após importação bem-sucedida
    if (importSuccess.value) {
      setTimeout(() => {
        clearFile();
      }, 3000);
    }
  }

  function formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  function downloadSample() {
    const csvContent = generateSampleCSV();
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');

    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', 'modelo_financeiro.csv');
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  }
</script>
