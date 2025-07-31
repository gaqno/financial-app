import { ref, computed, watch } from 'vue';
import type { IFinanceRecord } from '../types/finance';

const STORAGE_KEY = 'financeData';

export function useFinance() {
  const data = ref<IFinanceRecord[]>((() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) return JSON.parse(stored);
    return [];
  })());

  const editIndex = ref<number | null>(null);
  const editingItems = ref<Set<number>>(new Set());
  const filter = ref<'all' | 'Receita' | 'Despesa'>('all');
  const categoryFilter = ref<string>('');

  watch(
    data,
    (newData) => {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newData));
    },
    { deep: true }
  );

  // Recalcula saldo cumulativo
  function recalcSaldos(list: IFinanceRecord[]) {
    let saldo = 0;
    return list.map((item) => {
      saldo += item.Valor;
      return { ...item, Saldo: saldo };
    });
  }

  const filteredData = computed(() => {
    let list = data.value;
    
    // Filtro por tipo (Receita/Despesa)
    if (filter.value !== 'all') {
      list = list.filter((item) => item.Tipo === filter.value);
    }
    
    // Filtro por categoria
    if (categoryFilter.value) {
      list = list.filter((item) => {
        const itemCategory = item.Categoria || 'Sem categoria';
        return itemCategory === categoryFilter.value;
      });
    }
    
    return recalcSaldos(list);
  });

  const saldoFinal = computed(() => {
    const last = data.value[data.value.length - 1];
    return last ? last.Saldo : 0;
  });

  function addRecord(record: Omit<IFinanceRecord, 'Saldo'>) {
    // saldo cumulativo + Valor
    const lastSaldo = data.value.length > 0 ? data.value[data.value.length - 1].Saldo : 0;
    const newSaldo = lastSaldo + record.Valor;
    data.value.push({ ...record, Saldo: newSaldo });
  }

  function removeRecord(index: number) {
    data.value.splice(index, 1);
  }

  function updateRecord(index: number, updated: Omit<IFinanceRecord, 'Saldo'>) {
    data.value[index] = { ...updated, Saldo: 0 };
    // Recalcula saldo depois da edição (importante!)
    data.value = recalcSaldos(data.value);
  }

  function setFilter(tipo: 'all' | 'Receita' | 'Despesa') {
    filter.value = tipo;
  }

  function setCategoryFilter(category: string) {
    categoryFilter.value = category;
  }

  function clearCategoryFilter() {
    categoryFilter.value = '';
  }

  function toggleEdit(index: number) {
    if (editingItems.value.has(index)) {
      editingItems.value.delete(index);
    } else {
      editingItems.value.add(index);
    }
    // Forçar reatividade
    editingItems.value = new Set(editingItems.value);
  }

  function startEditAll() {
    const allIndexes = filteredData.value.map((_, index) => index);
    editingItems.value = new Set(allIndexes);
  }

  function cancelAllEdits() {
    editingItems.value = new Set();
  }

  function isEditing(index: number): boolean {
    return editingItems.value.has(index);
  }

  function importRecords(records: Omit<IFinanceRecord, 'Saldo'>[]) {
    // Adiciona todos os registros e recalcula os saldos
    for (const record of records) {
      addRecord(record);
    }
  }

  function clearAllData() {
    data.value = [];
  }

  return {
    data,
    filteredData,
    saldoFinal,
    editIndex,
    editingItems,
    filter,
    categoryFilter,
    addRecord,
    removeRecord,
    updateRecord,
    setFilter,
    setCategoryFilter,
    clearCategoryFilter,
    toggleEdit,
    startEditAll,
    cancelAllEdits,
    isEditing,
    importRecords,
    clearAllData,
  };
}
