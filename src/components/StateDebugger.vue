<template>
  <section
    class="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-gray-200 dark:border-slate-600 overflow-hidden theme-transition"
  >
    <div
      class="flex items-center justify-between cursor-pointer p-4 hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors"
      @click="toggleSection"
    >
      <h2 class="text-lg font-semibold text-gray-900 dark:text-slate-100">
        <i class="fas fa-code mr-2 text-purple-500" />
        Debug do Estado (LocalStorage)
      </h2>
      <div class="flex items-center gap-2">
        <span
          class="text-xs bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300 px-2 py-1 rounded-full font-medium"
        >
          {{ Object.keys(localStorageState).length }} chaves
        </span>
        <i
          :class="isExpanded ? 'fas fa-chevron-up' : 'fas fa-chevron-down'"
          class="text-gray-400 dark:text-slate-500 transition-transform duration-200"
        />
      </div>
    </div>

    <div v-show="isExpanded" class="border-t border-gray-200 dark:border-slate-600">
      <div class="p-4 space-y-4">
        <!-- Header com controles -->
        <div class="flex items-center justify-between">
          <div class="text-sm text-gray-600">
            <i class="fas fa-info-circle mr-1" />
            Estado atual salvo no navegador
          </div>
          <div class="flex gap-2">
            <button
              @click="refreshState"
              class="text-sm bg-blue-500 text-white px-3 py-1 rounded-lg hover:bg-blue-600 transition-colors"
            >
              <i class="fas fa-sync mr-1" />
              Atualizar
            </button>
            <button
              @click="exportState"
              class="text-sm bg-green-500 text-white px-3 py-1 rounded-lg hover:bg-green-600 transition-colors"
            >
              <i class="fas fa-download mr-1" />
              Exportar
            </button>
            <button
              @click="clearAllState"
              class="text-sm bg-red-500 text-white px-3 py-1 rounded-lg hover:bg-red-600 transition-colors"
            >
              <i class="fas fa-trash mr-1" />
              Limpar Tudo
            </button>
          </div>
        </div>

        <!-- Estado Resumido -->
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div class="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <div class="text-sm font-medium text-blue-800">Dados Financeiros</div>
            <div class="text-lg font-bold text-blue-900">
              {{ stateSnapshot.dataCount || 0 }}
            </div>
            <div class="text-xs text-blue-600">registros salvos</div>
          </div>

          <div class="bg-orange-50 border border-orange-200 rounded-lg p-3">
            <div class="text-sm font-medium text-orange-800">Meses Ocultos</div>
            <div class="text-lg font-bold text-orange-900">
              {{ stateSnapshot.hiddenMonthsCount || 0 }}
            </div>
            <div class="text-xs text-orange-600">
              {{ (stateSnapshot.hiddenMonths || []).join(', ') || 'nenhum' }}
            </div>
          </div>

          <div class="bg-green-50 border border-green-200 rounded-lg p-3">
            <div class="text-sm font-medium text-green-800">Filtros Ativos</div>
            <div class="text-sm font-bold text-green-900">
              {{ stateSnapshot.currentFilter || 'all' }}
            </div>
            <div class="text-xs text-green-600">
              {{ stateSnapshot.categoryFilter || 'todas categorias' }}
            </div>
          </div>

          <div class="bg-purple-50 border border-purple-200 rounded-lg p-3">
            <div class="text-sm font-medium text-purple-800">Recorrência</div>
            <div class="text-sm font-bold text-purple-900">
              {{ stateSnapshot.isRecurring ? 'Ativo' : 'Inativo' }}
            </div>
            <div class="text-xs text-purple-600">
              {{ stateSnapshot.recurrenceSettings?.frequency || 'mensal' }}
            </div>
          </div>
        </div>

        <!-- Estado Detalhado do LocalStorage -->
        <div class="bg-gray-50 rounded-lg p-4">
          <h3 class="text-sm font-semibold text-gray-800 mb-3">
            <i class="fas fa-database mr-1" />
            Estado Completo do LocalStorage
          </h3>
          <div class="space-y-2">
            <div
              v-for="(value, key) in localStorageState"
              :key="key"
              class="flex items-start gap-3 p-2 bg-white rounded border"
            >
              <div class="min-w-0 flex-1">
                <div class="text-sm font-medium text-gray-900">
                  {{ key }}
                </div>
                <div class="text-xs text-gray-600 font-mono break-all">
                  {{ formatValue(value) }}
                </div>
              </div>
              <button
                @click="clearSpecificKey(key)"
                class="text-red-600 hover:text-red-800 p-1 rounded hover:bg-red-50 transition-colors"
                title="Remover esta chave"
              >
                <i class="fas fa-times text-xs" />
              </button>
            </div>
          </div>
        </div>

        <!-- JSON Export/Import -->
        <div class="bg-gray-50 rounded-lg p-4">
          <h3 class="text-sm font-semibold text-gray-800 mb-3">
            <i class="fas fa-code mr-1" />
            Estado em JSON
          </h3>
          <textarea
            v-model="jsonState"
            class="w-full h-32 text-xs font-mono bg-white border border-gray-300 rounded p-2 resize-none"
            readonly
            placeholder="Estado em formato JSON..."
          />
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
  import { ref, computed, onMounted } from 'vue';

  interface Props {
    getStateSnapshot: () => any;
    clearAllData: () => void;
  }

  const props = defineProps<Props>();

  const isExpanded = ref(false);
  const localStorageState = ref<Record<string, any>>({});
  const stateSnapshot = ref({
    dataCount: 0,
    hiddenMonthsCount: 0,
    hiddenMonths: [] as string[],
    currentFilter: 'all' as string,
    categoryFilter: '' as string,
    sortField: 'Data' as string,
    sortDirection: 'desc' as string,
    isRecurring: false,
    recurrenceSettings: {
      frequency: 'mensal' as string,
      endDate: '' as string,
      isActive: false,
    },
  });

  const jsonState = computed(() => {
    return JSON.stringify(stateSnapshot.value, null, 2);
  });

  function toggleSection() {
    isExpanded.value = !isExpanded.value;
    if (isExpanded.value) {
      refreshState();
    }
  }

  function refreshState() {
    try {
      // Get all localStorage data
      const storage: Record<string, any> = {};
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key) {
          try {
            storage[key] = JSON.parse(localStorage.getItem(key) || '');
          } catch {
            storage[key] = localStorage.getItem(key);
          }
        }
      }
      localStorageState.value = storage;

      // Get state snapshot with error handling
      try {
        const snapshot = props.getStateSnapshot();
        stateSnapshot.value = {
          dataCount: snapshot.dataCount || 0,
          hiddenMonthsCount: snapshot.hiddenMonthsCount || 0,
          hiddenMonths: snapshot.hiddenMonths || [],
          currentFilter: snapshot.currentFilter || 'all',
          categoryFilter: snapshot.categoryFilter || '',
          sortField: snapshot.sortField || 'Data',
          sortDirection: snapshot.sortDirection || 'desc',
          isRecurring: snapshot.isRecurring || false,
          recurrenceSettings: snapshot.recurrenceSettings || {
            frequency: 'mensal',
            endDate: '',
            isActive: false,
          },
        };
      } catch (error) {
        console.warn('Erro ao obter snapshot do estado:', error);
      }
    } catch (error) {
      console.error('Erro ao atualizar estado do debugger:', error);
    }
  }

  function formatValue(value: any): string {
    if (typeof value === 'string') {
      return value.length > 100 ? value.substring(0, 100) + '...' : value;
    }
    return JSON.stringify(value).substring(0, 100) + (JSON.stringify(value).length > 100 ? '...' : '');
  }

  function clearSpecificKey(key: string) {
    if (confirm(`Remover a chave "${key}" do localStorage?`)) {
      localStorage.removeItem(key);
      refreshState();
    }
  }

  function clearAllState() {
    if (confirm('Isso irá remover TODOS os dados salvos. Confirma?')) {
      props.clearAllData();
      refreshState();
    }
  }

  function exportState() {
    const dataStr = JSON.stringify(stateSnapshot.value, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `financial-app-state-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  onMounted(() => {
    refreshState();
  });
</script>
