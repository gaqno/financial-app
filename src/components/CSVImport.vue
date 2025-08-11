<template>
  <section class="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
    <div class="flex items-center justify-between cursor-pointer p-4 hover:bg-gray-50 transition-colors"
      @click="toggleImportSection">
      <h2 class="text-lg font-semibold text-gray-900">
        <i class="fas fa-file-csv mr-2 text-blue-500"></i>
        Importar CSV
      </h2>
      <i :class="isExpanded ? 'fas fa-chevron-up' : 'fas fa-chevron-down'"
        class="text-gray-400 transition-transform duration-200"></i>
    </div>

    <div v-show="isExpanded" class="border-t border-gray-200">
      <div class="p-4 space-y-4">
        <!-- Upload Area -->
        <div
          class="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center hover:border-blue-300 transition-colors">
          <input ref="fileInputRef" type="file" accept=".csv" @change="onFileSelected" class="hidden" />

          <div v-if="!selectedFile" class="space-y-3">
            <i class="fas fa-upload text-gray-400 text-4xl"></i>
            <p class="text-gray-600 text-sm">Clique para selecionar um arquivo CSV</p>
            <button @click="triggerFileInput"
              class="bg-blue-500 text-white px-6 py-3 rounded-xl hover:bg-blue-600 transition-colors font-medium">
              📁 Selecionar Arquivo
            </button>
          </div>

          <div v-else class="space-y-2">
            <i class="fas fa-file-csv text-green-500 text-3xl"></i>
            <p class="text-gray-800 font-medium">{{ selectedFile.name }}</p>
            <p class="text-gray-600 text-sm">{{ formatFileSize(selectedFile.size) }}</p>
            <div class="flex gap-2 justify-center">
              <button @click="importFile" :disabled="isImporting"
                class="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
                <i v-if="isImporting" class="fas fa-spinner fa-spin mr-2"></i>
                {{ isImporting ? 'Importando...' : 'Importar' }}
              </button>
              <button @click="clearFile" :disabled="isImporting"
                class="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
                Cancelar
              </button>
            </div>
          </div>
        </div>

        <!-- Messages -->
        <div v-if="importError" class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          <div class="flex items-center">
            <i class="fas fa-exclamation-triangle mr-2"></i>
            <span>{{ importError }}</span>
            <button @click="clearMessages" class="ml-auto text-red-700 hover:text-red-900">
              <i class="fas fa-times"></i>
            </button>
          </div>
        </div>

        <div v-if="importSuccess" class="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded">
          <div class="flex items-center">
            <i class="fas fa-check-circle mr-2"></i>
            <span>{{ importSuccess }}</span>
            <button @click="clearMessages" class="ml-auto text-green-700 hover:text-green-900">
              <i class="fas fa-times"></i>
            </button>
          </div>
        </div>

        <!-- CSV Format Info -->
        <div class="bg-blue-50 border border-blue-200 rounded-xl p-4">
          <h3 class="text-sm font-semibold text-blue-800 mb-3">
            <i class="fas fa-info-circle mr-1"></i>
            Formatos Suportados
          </h3>

          <!-- Formato Compacto Mobile -->
          <div class="lg:hidden">
            <p class="text-xs text-blue-700 mb-2">
              <strong>Formato Padrão:</strong> Data, Descrição, Valor, Tipo, Status
            </p>
            <p class="text-xs text-blue-700 mb-2">
              <strong>Novo Formato:</strong> Data, Descrição, Valor, Recorrente, Dia Util (ignorado)
            </p>
            <div class="text-xs text-blue-600 space-y-1">
              <div>✨ Categoria detectada automaticamente</div>
              <div>💡 Saldo calculado automaticamente</div>
              <div>🔄 Valores negativos com -R$ suportados</div>
              <div>📅 Status S/N convertido para ✔️/❌</div>
            </div>
          </div>

          <!-- Formato Completo Desktop -->
          <div class="hidden lg:block">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <!-- Formato Padrão -->
              <div>
                <p class="text-sm font-medium text-blue-800 mb-2">
                  📋 Formato Padrão:
                </p>
                <div class="text-sm text-blue-700 space-y-1">
                  <div><strong>Data:</strong> DD/MM ou YYYY-MM-DD</div>
                  <div><strong>Descrição:</strong> texto descritivo</div>
                  <div><strong>Valor:</strong> R$ 1.500,00 ou -R$ 800,00</div>
                  <div><strong>Tipo:</strong> "Receita" ou "Despesa"</div>
                  <div><strong>Status:</strong> "❌" ou "✔️"</div>
                  <div><strong>Categoria:</strong> opcional</div>
                </div>
              </div>

              <!-- Novo Formato -->
              <div>
                <p class="text-sm font-medium text-blue-800 mb-2">
                  🆕 Novo Formato (Compatível):
                </p>
                <div class="text-sm text-blue-700 space-y-1">
                  <div><strong>Data:</strong> DD/MM</div>
                  <div><strong>Descrição:</strong> texto descritivo</div>
                  <div><strong>Valor:</strong> R$ 3.946,89 ou -R$ 1.246,29</div>
                  <div><strong>Recorrente:</strong> "S" ou "N" (convertido para Status)</div>
                  <div><strong>Dia Util:</strong> ignorado na importação</div>
                </div>
              </div>
            </div>

            <div class="mt-3 p-3 bg-blue-100 rounded-lg">
              <div class="text-sm text-blue-800 space-y-1">
                <div><strong>✨ Recursos Inteligentes:</strong></div>
                <div>• Categoria detectada automaticamente pela descrição</div>
                <div>• Tipo (Receita/Despesa) inferido do sinal do valor</div>
                <div>• Status S/N convertido para ✔️/❌</div>
                <div>• Suporte a valores com ponto de milhares (R$ 3.946,89)</div>
                <div>• Tratamento de valores negativos (-R$ 1.246,29)</div>
              </div>
            </div>
          </div>

          <div class="mt-3">
            <button @click="downloadSample" class="text-blue-600 hover:text-blue-800 text-sm underline font-medium">
              <i class="fas fa-download mr-1"></i>
              Baixar modelos CSV
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

const {
  isImporting,
  importError,
  importSuccess,
  importCSV,
  clearMessages,
  generateSampleCSV
} = useCSVImport();

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