<template>
  <div
    class="bg-white dark:bg-gray-900 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-800 transition-all duration-200 mb-4 overflow-hidden"
  >
    <!-- Modern Mobile Header -->
    <button
      @click="isExpanded = !isExpanded"
      class="w-full flex items-center justify-between p-4 text-left hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors group"
    >
      <div class="flex items-center space-x-3 min-w-0 flex-1">
        <div
          class="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 dark:from-blue-600 dark:to-purple-700 rounded-xl flex items-center justify-center"
        >
          <i class="fas fa-calendar-days text-white text-sm" />
        </div>
        <div class="min-w-0 flex-1">
          <h3 class="text-lg font-bold text-gray-900 dark:text-gray-100 truncate">Projeção de Meses</h3>
          <div class="flex items-center space-x-2 mt-0.5">
            <span
              class="px-2.5 py-1 text-xs font-semibold bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 rounded-full"
            >
              {{ activeMonthsCount }} ativos
            </span>
            <span class="text-xs text-gray-500 dark:text-gray-400"> +{{ futureMonths }}m </span>
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

    <!-- Expandable content -->
    <div v-if="isExpanded" class="border-t border-gray-100 dark:border-gray-800">
      <!-- Future months control section -->
      <div class="p-4 bg-gradient-to-r from-gray-50 to-blue-50 dark:from-gray-800 dark:to-blue-900/30">
        <div class="text-center mb-4">
          <h4 class="font-bold text-gray-900 dark:text-gray-100 text-base mb-1">🎯 Meses Futuros</h4>
          <p class="text-sm text-gray-600 dark:text-gray-300">Quantos meses à frente projetar?</p>
        </div>

        <!-- Counter controls -->
        <div class="flex items-center justify-center space-x-4 mb-4">
          <button
            @click="changeFutureMonths(-1)"
            :disabled="futureMonths <= 1"
            class="w-12 h-12 flex items-center justify-center bg-white dark:bg-gray-900 border-2 border-gray-200 dark:border-gray-700 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 hover:border-blue-300 dark:hover:border-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-sm"
          >
            <i class="fas fa-minus text-sm text-gray-700 dark:text-gray-200" />
          </button>

          <div
            class="bg-white dark:bg-gray-900 border-2 border-blue-200 dark:border-blue-700 rounded-2xl px-6 py-3 min-w-[80px] text-center shadow-sm"
          >
            <div class="text-2xl font-bold text-blue-600 dark:text-blue-400">{{ futureMonths }}</div>
            <div class="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              {{ futureMonths === 1 ? 'mês' : 'meses' }}
            </div>
          </div>

          <button
            @click="changeFutureMonths(1)"
            :disabled="futureMonths >= 12"
            class="w-12 h-12 flex items-center justify-center bg-white dark:bg-gray-900 border-2 border-gray-200 dark:border-gray-700 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 hover:border-blue-300 dark:hover:border-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-sm"
          >
            <i class="fas fa-plus text-sm text-gray-700 dark:text-gray-200" />
          </button>
        </div>

        <!-- Quick presets -->
        <div class="grid grid-cols-2 gap-3">
          <button
            v-for="preset in quickPresets"
            :key="preset.months"
            @click="setFutureMonths(preset.months)"
            :class="[
              'px-4 py-3 text-sm font-semibold rounded-xl transition-all duration-200 shadow-sm',
              futureMonths === preset.months
                ? 'bg-blue-600 dark:bg-blue-500 text-white shadow-lg scale-105'
                : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-blue-50 dark:hover:bg-blue-900/50 hover:scale-105 hover:shadow-md border border-gray-200 dark:border-gray-700',
            ]"
          >
            {{ preset.label }}
          </button>
        </div>
      </div>

      <!-- Include past months toggle -->
      <div
        class="flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 bg-white dark:bg-gray-900 rounded-lg border border-gray-100 dark:border-gray-800 space-y-3 sm:space-y-0"
      >
        <div class="flex items-start sm:items-center space-x-3">
          <input
            v-model="includePastMonths"
            type="checkbox"
            class="h-4 w-4 text-blue-600 dark:text-blue-400 focus:ring-blue-500 dark:focus:ring-blue-400 border-gray-300 dark:border-gray-400 rounded mt-0.5 sm:mt-0"
          />
          <div class="flex-1">
            <label
              class="font-medium text-gray-800 dark:text-gray-100 cursor-pointer text-sm sm:text-base"
              @click="includePastMonths = !includePastMonths"
            >
              📊 Incluir Meses Passados
            </label>
            <div class="text-xs sm:text-sm text-gray-600 dark:text-gray-300">
              Para comparação com períodos anteriores
            </div>
          </div>
        </div>
        <div v-if="includePastMonths" class="flex items-center justify-center sm:justify-end space-x-2">
          <button
            @click="changePastMonths(-1)"
            :disabled="pastMonths <= 1"
            class="w-6 h-6 flex items-center justify-center bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded text-xs hover:bg-gray-200 dark:hover:bg-gray-700 disabled:opacity-50"
          >
            <i class="fas fa-minus text-gray-700 dark:text-gray-200" />
          </button>
          <span class="w-6 text-center text-sm font-medium text-gray-800 dark:text-gray-100">
            {{ pastMonths }}
          </span>
          <button
            @click="changePastMonths(1)"
            :disabled="pastMonths >= 24"
            class="w-6 h-6 flex items-center justify-center bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded text-xs hover:bg-gray-200 dark:hover:bg-gray-700 disabled:opacity-50"
          >
            <i class="fas fa-plus text-gray-700 dark:text-gray-200" />
          </button>
        </div>
      </div>

      <!-- Active months preview -->
      <div
        class="border-t border-gray-100 dark:border-gray-800 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20"
      >
        <div class="text-center mb-4">
          <h4 class="font-bold text-gray-900 dark:text-gray-100 text-base mb-1">📅 Meses Ativos na Projeção</h4>
          <p class="text-sm text-gray-600 dark:text-gray-300">Visualização dos períodos incluídos</p>
        </div>

        <!-- Month chips -->
        <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 mb-4">
          <div
            v-for="monthKey in visibleMonthKeys"
            :key="monthKey"
            :class="[
              'px-3 py-3 text-xs font-bold rounded-xl text-center border-2 transition-all duration-200 shadow-sm',
              isCurrentMonth(monthKey)
                ? 'bg-gradient-to-r from-green-100 to-emerald-100 dark:from-green-900/50 dark:to-emerald-900/50 text-green-800 dark:text-green-200 border-green-300 dark:border-green-600 ring-2 ring-green-200 dark:ring-green-700 scale-105 shadow-md'
                : isPastMonth(monthKey)
                  ? 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-600 hover:shadow-md'
                  : 'bg-gradient-to-r from-blue-100 to-indigo-100 dark:from-blue-900/50 dark:to-indigo-900/50 text-blue-800 dark:text-blue-200 border-blue-300 dark:border-blue-600 hover:shadow-md hover:scale-105',
            ]"
          >
            <div class="flex items-center justify-center space-x-1">
              <span class="truncate">{{ formatMonthKey(monthKey) }}</span>
              <i
                v-if="isCurrentMonth(monthKey)"
                class="fas fa-star text-green-600 dark:text-green-400 text-xs flex-shrink-0"
              />
              <i
                v-else-if="isPastMonth(monthKey)"
                class="fas fa-history text-gray-500 dark:text-gray-400 text-xs flex-shrink-0"
              />
              <i v-else class="fas fa-arrow-right text-blue-600 dark:text-blue-400 text-xs flex-shrink-0" />
            </div>
          </div>
        </div>

        <!-- Summary info -->
        <div class="bg-white dark:bg-gray-800 rounded-2xl p-4 border-2 border-blue-200 dark:border-blue-700 shadow-sm">
          <div class="flex items-center justify-center space-x-6 text-sm">
            <div v-if="includePastMonths" class="text-center">
              <div
                class="w-12 h-12 mx-auto mb-2 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800 rounded-xl flex items-center justify-center"
              >
                <span class="text-lg font-bold text-gray-700 dark:text-gray-300">{{ pastMonths }}</span>
              </div>
              <div class="text-gray-600 dark:text-gray-400 font-medium">Passados</div>
            </div>
            <div class="text-center">
              <div
                class="w-12 h-12 mx-auto mb-2 bg-gradient-to-br from-green-100 to-emerald-100 dark:from-green-900/50 dark:to-emerald-900/50 rounded-xl flex items-center justify-center"
              >
                <span class="text-lg font-bold text-green-700 dark:text-green-300">1</span>
              </div>
              <div class="text-green-600 dark:text-green-400 font-medium">Atual</div>
            </div>
            <div class="text-center">
              <div
                class="w-12 h-12 mx-auto mb-2 bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-blue-900/50 dark:to-indigo-900/50 rounded-xl flex items-center justify-center"
              >
                <span class="text-lg font-bold text-blue-700 dark:text-blue-300">{{ futureMonths }}</span>
              </div>
              <div class="text-blue-600 dark:text-blue-400 font-medium">Futuros</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { ref, computed, watch } from 'vue';

  interface Props {
    projectionSettings: {
      includePastMonths: number;
      includeFutureMonths: number;
      maxFutureMonths: number;
    };
    getSmartVisibleMonths: Set<string>;
    getCurrentMonthKey: () => string;
  }

  interface Emits {
    (e: 'update-projection', settings: { includePastMonths: number; includeFutureMonths: number }): void;
  }

  const props = defineProps<Props>();
  const emit = defineEmits<Emits>();

  const isExpanded = ref(false);

  // Local reactive state
  const futureMonths = ref(props.projectionSettings.includeFutureMonths);
  const pastMonths = ref(props.projectionSettings.includePastMonths);
  const includePastMonths = ref(props.projectionSettings.includePastMonths > 0);

  // Quick presets
  const quickPresets = [
    { months: 1, label: '📅 1 Mês' },
    { months: 3, label: '🎯 Trimestre' },
    { months: 6, label: '📊 Semestre' },
    { months: 12, label: '📈 Ano' },
  ];

  // Computed properties
  const currentMonthName = computed(() => {
    const currentKey = props.getCurrentMonthKey();
    const [year, month] = currentKey.split('-').map(Number);
    const date = new Date(year, month - 1, 1);
    return date.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
  });

  const activeMonthsCount = computed(() => {
    return (includePastMonths.value ? pastMonths.value : 0) + 1 + futureMonths.value;
  });

  const visibleMonthKeys = computed(() => {
    const currentKey = props.getCurrentMonthKey();
    const [currentYear, currentMonth] = currentKey.split('-').map(Number);
    const keys: string[] = [];

    // Add past months if enabled
    if (includePastMonths.value) {
      for (let i = pastMonths.value; i >= 1; i--) {
        const pastDate = new Date(currentYear, currentMonth - 1 - i, 1);
        const pastKey = `${pastDate.getFullYear()}-${(pastDate.getMonth() + 1).toString().padStart(2, '0')}`;
        keys.push(pastKey);
      }
    }

    // Add current month
    keys.push(currentKey);

    // Add future months
    for (let i = 1; i <= futureMonths.value; i++) {
      const futureDate = new Date(currentYear, currentMonth - 1 + i, 1);
      const futureKey = `${futureDate.getFullYear()}-${(futureDate.getMonth() + 1).toString().padStart(2, '0')}`;
      keys.push(futureKey);
    }

    return keys;
  });

  // Helper functions
  const isCurrentMonth = (monthKey: string): boolean => {
    return monthKey === props.getCurrentMonthKey();
  };

  const isPastMonth = (monthKey: string): boolean => {
    return monthKey < props.getCurrentMonthKey();
  };

  const formatMonthKey = (monthKey: string): string => {
    const [year, month] = monthKey.split('-').map(Number);
    const date = new Date(year, month - 1, 1);
    return date.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' });
  };

  // Actions
  const changeFutureMonths = (delta: number) => {
    const newValue = Math.max(1, Math.min(12, futureMonths.value + delta));
    futureMonths.value = newValue;
    emitUpdate();
  };

  const changePastMonths = (delta: number) => {
    const newValue = Math.max(1, Math.min(24, pastMonths.value + delta));
    pastMonths.value = newValue;
    emitUpdate();
  };

  const setFutureMonths = (months: number) => {
    futureMonths.value = months;
    emitUpdate();
  };

  const emitUpdate = () => {
    emit('update-projection', {
      includePastMonths: includePastMonths.value ? pastMonths.value : 0,
      includeFutureMonths: futureMonths.value,
    });
  };

  // Watch for changes in includePastMonths checkbox
  watch(includePastMonths, (newValue) => {
    // When enabling past months, ensure we have a reasonable default
    if (newValue && pastMonths.value === 0) {
      pastMonths.value = 6; // Show 6 months of historical data by default
    }
    emitUpdate();
  });

  // Watch for prop changes
  watch(
    () => props.projectionSettings,
    (newSettings) => {
      futureMonths.value = newSettings.includeFutureMonths;
      pastMonths.value = newSettings.includePastMonths;
      includePastMonths.value = newSettings.includePastMonths > 0;
    },
    { deep: true }
  );
</script>
