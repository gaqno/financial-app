<template>
  <div
    class="bg-white dark:bg-gray-900 rounded-xl shadow-sm p-6 border border-gray-100 dark:border-gray-800 transition-colors mb-6"
  >
    <!-- Header -->
    <button
      @click="isExpanded = !isExpanded"
      class="w-full flex items-center justify-between p-3 sm:p-4 text-left hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
    >
      <div class="flex items-center space-x-2 sm:space-x-3 min-w-0 flex-1">
        <i class="fas fa-calendar-days text-blue-600 dark:text-blue-400 text-sm sm:text-base" />
        <h3 class="text-base sm:text-lg font-semibold text-gray-800 dark:text-gray-100 truncate">
          📅 Projeção de Meses
        </h3>
        <span
          class="px-2 py-1 text-xs font-medium bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded-full whitespace-nowrap"
        >
          {{ activeMonthsCount }} meses ativos
        </span>
      </div>
      <div class="flex items-center space-x-2 sm:space-x-3 flex-shrink-0">
        <span class="text-xs sm:text-sm text-gray-600 dark:text-gray-300 hidden sm:block">
          {{ currentMonthName }} + {{ futureMonths }} {{ futureMonths === 1 ? 'mês' : 'meses' }}
        </span>
        <span class="text-xs text-gray-600 dark:text-gray-300 sm:hidden"> +{{ futureMonths }}m </span>
        <i
          :class="isExpanded ? 'fas fa-chevron-up' : 'fas fa-chevron-down'"
          class="text-gray-400 dark:text-gray-500 text-sm"
        />
      </div>
    </button>

    <!-- Expandable content -->
    <div v-if="isExpanded" class="border-t border-gray-100 dark:border-gray-800">
      <!-- Quick controls -->
      <div class="p-3 sm:p-4 bg-gray-50 dark:bg-gray-800">
        <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 space-y-3 sm:space-y-0">
          <div class="flex-1">
            <h4 class="font-medium text-gray-800 dark:text-gray-100 text-sm sm:text-base">🎯 Meses Futuros</h4>
            <p class="text-xs sm:text-sm text-gray-600 dark:text-gray-300">
              Quantos meses à frente você quer projetar?
            </p>
          </div>
          <div class="flex items-center justify-center sm:justify-end space-x-3">
            <button
              @click="changeFutureMonths(-1)"
              :disabled="futureMonths <= 1"
              class="w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <i class="fas fa-minus text-xs text-gray-700 dark:text-gray-200" />
            </button>
            <span class="w-12 sm:w-16 text-center font-semibold text-lg sm:text-xl text-gray-800 dark:text-gray-100">
              {{ futureMonths }}
            </span>
            <button
              @click="changeFutureMonths(1)"
              :disabled="futureMonths >= 12"
              class="w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <i class="fas fa-plus text-xs text-gray-700 dark:text-gray-200" />
            </button>
          </div>
        </div>

        <!-- Quick presets -->
        <div class="grid grid-cols-2 sm:flex sm:flex-wrap gap-2 mb-4">
          <button
            v-for="preset in quickPresets"
            :key="preset.months"
            @click="setFutureMonths(preset.months)"
            :class="[
              'px-2 sm:px-3 py-1.5 text-xs sm:text-sm font-medium rounded-md transition-colors',
              futureMonths === preset.months
                ? 'bg-blue-600 dark:bg-blue-500 text-white'
                : 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 hover:bg-blue-200 dark:hover:bg-blue-800',
            ]"
          >
            {{ preset.label }}
          </button>
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
              :disabled="pastMonths >= 6"
              class="w-6 h-6 flex items-center justify-center bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded text-xs hover:bg-gray-200 dark:hover:bg-gray-700 disabled:opacity-50"
            >
              <i class="fas fa-plus text-gray-700 dark:text-gray-200" />
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Active months preview -->
    <div class="border-t border-gray-100 dark:border-gray-800 p-3 sm:p-4">
      <h4 class="font-medium text-gray-800 dark:text-gray-100 mb-3 text-sm sm:text-base">
        📅 Meses Ativos na Projeção
      </h4>
      <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-2">
        <div
          v-for="monthKey in visibleMonthKeys"
          :key="monthKey"
          :class="[
            'px-2 sm:px-3 py-2 text-xs sm:text-sm font-medium rounded-lg text-center border',
            isCurrentMonth(monthKey)
              ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 border-green-300 dark:border-green-700 ring-2 ring-green-200 dark:ring-green-800'
              : isPastMonth(monthKey)
                ? 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200 border-gray-200 dark:border-gray-700'
                : 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 border-blue-300 dark:border-blue-700',
          ]"
        >
          <div class="flex items-center justify-center space-x-1">
            <span class="truncate">{{ formatMonthKey(monthKey) }}</span>
            <i
              v-if="isCurrentMonth(monthKey)"
              class="fas fa-star text-green-600 dark:text-green-400 text-xs flex-shrink-0"
            />
            <i v-if="isCurrentMonth(monthKey)" class="fas fa-star text-green-600 text-xs flex-shrink-0" />
            <i v-else-if="isPastMonth(monthKey)" class="fas fa-history text-gray-500 text-xs flex-shrink-0" />
            <i v-else class="fas fa-arrow-right text-blue-600 text-xs flex-shrink-0" />
          </div>
        </div>
      </div>

      <!-- Summary info -->
      <div class="mt-4 p-3 bg-blue-100 dark:bg-blue-900 rounded-lg">
        <div class="flex items-center justify-center space-x-4 sm:space-x-6 text-xs sm:text-sm">
          <div v-if="includePastMonths" class="text-center">
            <div class="font-semibold text-gray-700 dark:text-gray-300">
              {{ pastMonths }}
            </div>
            <div class="text-gray-600 dark:text-gray-400">Passados</div>
          </div>
          <div class="text-center">
            <div class="font-semibold text-green-700 dark:text-green-300">1</div>
            <div class="text-green-600 dark:text-green-400">Atual</div>
          </div>
          <div class="text-center">
            <div class="font-semibold text-blue-700 dark:text-blue-300">
              {{ futureMonths }}
            </div>
            <div class="text-blue-600 dark:text-blue-400">Futuros</div>
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
    const newValue = Math.max(1, Math.min(6, pastMonths.value + delta));
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
  watch(includePastMonths, () => {
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
