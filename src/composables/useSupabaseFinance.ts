import { ref, computed, watch } from 'vue';
import { supabase } from '../lib/supabase';
import { useAuth } from './useAuth';
import type { IFinanceRecord, IFilter } from '../types/finance';

type SortField = 'Data' | 'Descrição' | 'Valor' | 'Tipo' | 'Categoria' | 'Status';
type SortDirection = 'asc' | 'desc';

// 🚀 ANTI-DUPLICATION: Global flags to prevent multiple initializations
let financeDataLoadingFlag = false;
let financeDataInitialized = false;
let lastUserId = '';

export function useSupabaseFinance() {
  const { user } = useAuth();

  // Reactive state
  const records = ref<IFinanceRecord[]>([]);
  const hiddenMonths = ref<Set<string>>(new Set());
  const isLoading = ref(true);
  const error = ref<string | null>(null);

  // Filters state
  const filters = ref({
    filter: 'all' as IFilter,
    categoryFilter: '',
    sortField: 'Data' as SortField,
    sortDirection: 'desc' as SortDirection,
  });

  // Load data from Supabase with anti-duplication protection
  const loadData = async () => {
    if (!user.value?.id) {
      console.warn('📊 [SUPABASE_FINANCE] Usuário não autenticado');
      isLoading.value = false;
      return;
    }

    // 🚀 ANTI-DUPLICATION: Prevent multiple simultaneous loads
    const currentUserId = user.value.id;
    if (financeDataLoadingFlag && lastUserId === currentUserId) {
      return;
    }

    if (financeDataInitialized && lastUserId === currentUserId) {
      return;
    }

    try {
      financeDataLoadingFlag = true;
      lastUserId = currentUserId;
      isLoading.value = true;
      error.value = null;

      // Load finance records
      const { data: financeData, error: financeError } = await supabase
        .from('finance_records')
        .select('*')
        .eq('user_id', user.value.id)
        .order('data', { ascending: false });

      if (financeError) {
        throw financeError;
      }

      // Transform data to match IFinanceRecord interface
      records.value = (financeData || []).map((record) => ({
        Data: record.data,
        Descrição: record.descricao,
        Valor: Number(record.valor),
        Tipo: record.tipo as 'Receita' | 'Despesa',
        Categoria: record.categoria || '',
        Status: record.status as '❌' | '✔️',
        recurrence: record.recurrence as any,
      }));

      // Load user settings (hidden months + filters)
      const { data: settingsData, error: settingsError } = await supabase
        .from('user_settings')
        .select('hidden_months, filters')
        .eq('user_id', user.value.id)
        .single();

      if (settingsError && settingsError.code !== 'PGRST116') {
        // PGRST116 = no rows found
        throw settingsError;
      }

      if (settingsData) {
        // Set hidden months
        hiddenMonths.value = new Set(settingsData.hidden_months || []);

        // Set filters
        if (settingsData.filters) {
          filters.value = { ...filters.value, ...settingsData.filters };
        }
      }
    } catch (err) {
      console.error('❌ [SUPABASE_FINANCE] Erro ao carregar dados:', err);
      error.value = err instanceof Error ? err.message : 'Erro desconhecido';
      financeDataInitialized = false; // Reset flag on error
    } finally {
      isLoading.value = false;
      financeDataLoadingFlag = false;
      if (!error.value) {
        financeDataInitialized = true;
      }
    }
  };

  // Save record to Supabase
  const addRecord = async (record: IFinanceRecord) => {
    if (!user.value?.id) {
      throw new Error('Usuário não autenticado');
    }

    try {
      const { data, error: insertError } = await supabase
        .from('finance_records')
        .insert({
          user_id: user.value.id,
          data: record.Data,
          descricao: record.Descrição,
          valor: record.Valor,
          tipo: record.Tipo,
          categoria: record.Categoria || null,
          status: record.Status,
          recurrence: record.recurrence || null,
        })
        .select()
        .single();

      if (insertError) {
        throw insertError;
      }

      // Add to local state (reactive update)
      const newRecord: IFinanceRecord = {
        Data: data.data,
        Descrição: data.descricao,
        Valor: Number(data.valor),
        Tipo: data.tipo,
        Categoria: data.categoria || '',
        Status: data.status,
        recurrence: data.recurrence,
      };

      // Force reactive update with new array reference
      records.value = [newRecord, ...records.value];

      return newRecord;
    } catch (err) {
      console.error('❌ [SUPABASE_FINANCE] Erro ao adicionar registro:', err);
      throw err;
    }
  };

  // Batch add multiple records to Supabase (for recurring records)
  const addRecordsBatch = async (recordsBatch: IFinanceRecord[]) => {
    if (!user.value?.id) {
      throw new Error('Usuário não autenticado');
    }

    if (recordsBatch.length === 0) {
      return [];
    }

    try {
      // Transform records for Supabase insert
      const insertData = recordsBatch.map((record) => ({
        user_id: user.value!.id,
        data: record.Data,
        descricao: record.Descrição,
        valor: record.Valor,
        tipo: record.Tipo,
        categoria: record.Categoria || null,
        status: record.Status,
        recurrence: record.recurrence || null,
      }));

      // Single batch insert query
      const { data, error: insertError } = await supabase.from('finance_records').insert(insertData).select();

      if (insertError) {
        throw insertError;
      }

      // Transform returned data to IFinanceRecord format
      const newRecords: IFinanceRecord[] = (data || []).map((item) => ({
        Data: item.data,
        Descrição: item.descricao,
        Valor: Number(item.valor),
        Tipo: item.tipo,
        Categoria: item.categoria || '',
        Status: item.status,
        recurrence: item.recurrence,
      }));

      // Update local state with new records (reactive update)
      records.value = [...newRecords, ...records.value];

      return newRecords;
    } catch (err) {
      console.error('❌ [SUPABASE_FINANCE] Erro ao inserir registros em lote:', err);
      throw err;
    }
  };

  // Update record in Supabase
  const updateRecord = async (index: number, updatedRecord: IFinanceRecord) => {
    if (!user.value?.id) {
      throw new Error('Usuário não autenticado');
    }

    const originalRecord = records.value[index];
    if (!originalRecord) {
      console.error('❌ [SUPABASE_UPDATE] Record not found at index:', { index, totalRecords: records.value.length });
      throw new Error('Registro não encontrado');
    }

    try {
      // BUGFIX: Build complete DELETE query with all conditions before execution
      // This ensures we only delete the specific record being updated, not all records with same desc/value
      let deleteQuery = supabase
        .from('finance_records')
        .delete()
        .eq('user_id', user.value.id)
        .eq('data', originalRecord.Data)
        .eq('descricao', originalRecord.Descrição)
        .eq('valor', originalRecord.Valor)
        .eq('status', originalRecord.Status) // CRITICAL: Add status to make query more specific
        .eq('tipo', originalRecord.Tipo); // CRITICAL: Add type to make query more specific

      // Add recurrence criteria if present to distinguish recurring records
      if (originalRecord.recurrence?.recurrenceId) {
        // For recurring records, also match the instance number to target the exact record
        // BUGFIX: Use correct JSON syntax for PostgreSQL/Supabase (->> for text values)
        deleteQuery = deleteQuery
          .eq('recurrence->>recurrenceId', originalRecord.recurrence.recurrenceId)
          .eq('recurrence->>instanceNumber', originalRecord.recurrence.instanceNumber);
      } else {
        // For non-recurring records, ensure recurrence is null
        deleteQuery = deleteQuery.is('recurrence', null);
      }

      // Execute the complete query
      const { error: deleteError, count } = await deleteQuery;
      if (deleteError) {
        console.error('❌ [SUPABASE_UPDATE] DELETE query failed:', deleteError);
        throw deleteError;
      }

      const { error: insertError } = await supabase.from('finance_records').insert({
        user_id: user.value.id,
        data: updatedRecord.Data,
        descricao: updatedRecord.Descrição,
        valor: updatedRecord.Valor,
        tipo: updatedRecord.Tipo,
        categoria: updatedRecord.Categoria || null,
        status: updatedRecord.Status,
        recurrence: updatedRecord.recurrence || null,
      });

      if (insertError) {
        throw insertError;
      }

      // Update local state (reactive update)
      // BUGFIX: Preserve all original record data, especially recurrence info
      records.value = records.value.map((record, i) => {
        if (i === index) {
          // Merge the original record with updates, preserving all existing data
          return {
            ...record, // Keep ALL original data (including recurrence)
            ...updatedRecord, // Apply only the specific updates
            // Ensure recurrence data is preserved if not explicitly updated
            recurrence: updatedRecord.recurrence || record.recurrence,
          };
        }
        return record;
      });
    } catch (err) {
      console.error('❌ [SUPABASE_FINANCE] Erro ao atualizar registro:', err);
      throw err;
    }
  };

  // Delete record from Supabase
  const deleteRecord = async (index: number) => {
    if (!user.value?.id) {
      throw new Error('Usuário não autenticado');
    }

    const recordToDelete = records.value[index];
    if (!recordToDelete) {
      throw new Error('Registro não encontrado');
    }

    try {
      const { error: deleteError } = await supabase
        .from('finance_records')
        .delete()
        .eq('user_id', user.value.id)
        .eq('data', recordToDelete.Data)
        .eq('descricao', recordToDelete.Descrição)
        .eq('valor', recordToDelete.Valor);

      if (deleteError) {
        throw deleteError;
      }

      // Remove from local state (reactive update)
      records.value = records.value.filter((_, i) => i !== index);
    } catch (err) {
      console.error('❌ [SUPABASE_FINANCE] Erro ao remover registro:', err);
      throw err;
    }
  };

  // Save user settings (hidden months + filters)
  const saveSettings = async () => {
    if (!user.value?.id) {
      console.warn('📊 [SUPABASE_FINANCE] Usuário não autenticado para salvar configurações');
      return;
    }

    try {
      const { error: upsertError } = await supabase.from('user_settings').upsert(
        {
          user_id: user.value.id,
          hidden_months: Array.from(hiddenMonths.value),
          filters: filters.value,
        },
        {
          onConflict: 'user_id',
        }
      );

      if (upsertError) {
        throw upsertError;
      }
    } catch (err) {
      console.error('❌ [SUPABASE_FINANCE] Erro ao salvar configurações:', err);
    }
  };

  // Watch for changes in settings and auto-save
  watch(
    [hiddenMonths, filters],
    () => {
      if (user.value?.id) {
        saveSettings();
      }
    },
    { deep: true }
  );

  // Computed properties (keeping same interface as original)
  const sortedData = computed(() => {
    let filtered = records.value;

    // Apply filters
    if (filters.value.filter !== 'all') {
      filtered = filtered.filter((record) => record.Tipo === filters.value.filter);
    }

    if (filters.value.categoryFilter) {
      filtered = filtered.filter((record) =>
        record.Categoria?.toLowerCase().includes(filters.value.categoryFilter.toLowerCase())
      );
    }

    // Apply sorting
    filtered.sort((a, b) => {
      const field = filters.value.sortField;
      let aVal = a[field];
      let bVal = b[field];

      if (field === 'Data') {
        aVal = new Date(aVal as string).getTime();
        bVal = new Date(bVal as string).getTime();
      } else if (field === 'Valor') {
        aVal = Number(aVal);
        bVal = Number(bVal);
      } else {
        aVal = String(aVal).toLowerCase();
        bVal = String(bVal).toLowerCase();
      }

      const comparison = aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
      return filters.value.sortDirection === 'asc' ? comparison : -comparison;
    });

    return filtered;
  });

  // Initialize data when user changes (with anti-duplication)
  watch(
    () => user.value?.id,
    (newUserId, oldUserId) => {
      // Reset flags when user changes
      if (newUserId !== oldUserId) {
        financeDataInitialized = false;
        financeDataLoadingFlag = false;
        lastUserId = '';
      }

      if (newUserId) {
        // Debounce rapid successive calls
        setTimeout(() => {
          if (user.value?.id === newUserId) {
            // Still the same user
            loadData();
          }
        }, 100);
      } else {
        records.value = [];
        hiddenMonths.value.clear();
        financeDataInitialized = false;
        financeDataLoadingFlag = false;
        lastUserId = '';
      }
    },
    { immediate: true }
  );

  // Optimized batch update for categories - much faster with fewer requests
  const updateRecordsBatch = async (updates: Array<{ index: number; updates: Partial<IFinanceRecord> }>) => {
    if (!user.value?.id) {
      throw new Error('Usuário não autenticado');
    }

    if (updates.length === 0) {
      return [];
    }

    try {
      // Group updates by the changes being made for efficiency
      const categoryUpdates: Array<{ record: IFinanceRecord; newCategory: string; index: number }> = [];
      const otherUpdates: Array<{ index: number; updates: Partial<IFinanceRecord> }> = [];

      updates.forEach(({ index, updates: recordUpdates }) => {
        const originalRecord = records.value[index];
        if (!originalRecord) {
          console.warn('❌ [SUPABASE_BATCH_UPDATE] Record not found at index:', index);
          return;
        }

        // Check if this is just a category update (most common case for auto-categorization)
        const onlyCategory = Object.keys(recordUpdates).length === 1 && 'Categoria' in recordUpdates;

        if (onlyCategory && recordUpdates.Categoria) {
          categoryUpdates.push({
            record: originalRecord,
            newCategory: recordUpdates.Categoria,
            index,
          });
        } else {
          otherUpdates.push({ index, updates: recordUpdates });
        }
      });

      const successfulUpdates: Array<{ index: number; record: IFinanceRecord }> = [];

      // 🚀 OPTIMIZED: Use SQL UPDATE for category-only changes (most efficient)
      if (categoryUpdates.length > 0) {
        for (const { record, newCategory, index } of categoryUpdates) {
          try {
            // Use direct UPDATE SQL - much more efficient than DELETE+INSERT
            let updateQuery = supabase
              .from('finance_records')
              .update({ categoria: newCategory })
              .eq('user_id', user.value!.id)
              .eq('data', record.Data)
              .eq('descricao', record.Descrição)
              .eq('valor', record.Valor)
              .eq('status', record.Status)
              .eq('tipo', record.Tipo);

            // Handle recurrence matching
            if (record.recurrence?.recurrenceId) {
              updateQuery = updateQuery
                .eq('recurrence->>recurrenceId', record.recurrence.recurrenceId)
                .eq('recurrence->>instanceNumber', record.recurrence.instanceNumber);
            } else {
              updateQuery = updateQuery.is('recurrence', null);
            }

            const { error: updateError } = await updateQuery;

            if (updateError) {
              console.error('❌ [BATCH_OPTIMIZE] Category update failed:', updateError);
              continue;
            }

            // Update local state immediately for UI reactivity
            const updatedRecord = { ...record, Categoria: newCategory };
            records.value[index] = updatedRecord;
            successfulUpdates.push({ index, record: updatedRecord });
          } catch (error) {
            console.error('❌ [BATCH_OPTIMIZE] Category update error:', error);
          }
        }
      }

      // Handle other complex updates (rare) with the original method
      if (otherUpdates.length > 0) {
        for (const { index, updates: recordUpdates } of otherUpdates) {
          const originalRecord = records.value[index];
          if (!originalRecord) continue;

          const mergedRecord = { ...originalRecord, ...recordUpdates };

          try {
            // For complex updates, still use DELETE+INSERT
            let deleteQuery = supabase
              .from('finance_records')
              .delete()
              .eq('user_id', user.value!.id)
              .eq('data', originalRecord.Data)
              .eq('descricao', originalRecord.Descrição)
              .eq('valor', originalRecord.Valor)
              .eq('status', originalRecord.Status)
              .eq('tipo', originalRecord.Tipo);

            if (originalRecord.recurrence?.recurrenceId) {
              deleteQuery = deleteQuery
                .eq('recurrence->>recurrenceId', originalRecord.recurrence.recurrenceId)
                .eq('recurrence->>instanceNumber', originalRecord.recurrence.instanceNumber);
            } else {
              deleteQuery = deleteQuery.is('recurrence', null);
            }

            const { error: deleteError } = await deleteQuery;
            if (deleteError) throw deleteError;

            const { error: insertError } = await supabase.from('finance_records').insert({
              user_id: user.value!.id,
              data: mergedRecord.Data,
              descricao: mergedRecord.Descrição,
              valor: mergedRecord.Valor,
              tipo: mergedRecord.Tipo,
              categoria: mergedRecord.Categoria || null,
              status: mergedRecord.Status,
              recurrence: mergedRecord.recurrence || null,
            });

            if (insertError) throw insertError;

            records.value[index] = mergedRecord;
            successfulUpdates.push({ index, record: mergedRecord });
          } catch (error) {
            console.error('❌ [BATCH_FALLBACK] Complex update failed:', error);
          }
        }
      }

      return successfulUpdates;
    } catch (err) {
      console.error('❌ [SUPABASE_FINANCE] Erro no batch update:', err);
      throw err;
    }
  };

  return {
    // State
    records: computed(() => records.value),
    sortedData,
    hiddenMonths,
    filters,
    isLoading: computed(() => isLoading.value),
    error: computed(() => error.value),

    // Methods
    loadData,
    addRecord,
    addRecordsBatch,
    updateRecord,
    updateRecordsBatch,
    deleteRecord,
    saveSettings,
  };
}
