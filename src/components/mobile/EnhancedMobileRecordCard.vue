<template>
  <div
    ref="cardRef"
    :data-record-id="record.id"
    :style="{ transform: `translateX(${translateX}px)` }"
    @touchstart="handleTouchStart"
    @touchmove="handleTouchMove"
    @touchend="handleTouchEnd"
    class="relative bg-white dark:bg-gray-800 rounded-2xl shadow-[0_2px_8px_rgba(0,0,0,0.04)] dark:shadow-[0_2px_8px_rgba(0,0,0,0.2)] hover:shadow-[0_4px_16px_rgba(0,0,0,0.08)] dark:hover:shadow-[0_4px_16px_rgba(0,0,0,0.3)] mb-4 overflow-hidden transition-all duration-200 theme-transition"
    :class="[
      getCardClasses(),
      {
        'transform-gpu': isGestureActive,
        'shadow-lg': isPressed,
        'scale-95': isPressed && !isGestureActive,
      },
    ]"
  >
    >
    <!-- Swipe Action Backgrounds -->
    <!-- Left Action (Complete/Mark Pending) -->
    <div
      :class="[
        'absolute inset-y-0 left-0 flex items-center justify-center transition-all duration-200',
        record.Status === '✔️' ? 'bg-orange-500' : 'bg-green-500',
        translateX > 50 ? 'w-full' : 'w-20',
      ]"
    >
      <div class="text-white text-center">
        <i :class="record.Status === '✔️' ? 'fas fa-undo' : 'fas fa-check'" class="text-2xl mb-1"></i>
        <div class="text-xs font-medium">
          {{ record.Status === '✔️' ? 'Desfazer' : 'Concluir' }}
        </div>
      </div>
    </div>

    <!-- Right Action (Delete) -->
    <div
      :class="[
        'absolute inset-y-0 right-0 flex items-center justify-center bg-red-500 transition-all duration-200',
        translateX < -50 ? 'w-full' : 'w-20',
      ]"
    >
      <div class="text-white text-center">
        <i class="fas fa-trash text-2xl mb-1"></i>
        <div class="text-xs font-medium">Excluir</div>
      </div>
    </div>

    <!-- Card Content -->
    <div class="relative z-10 p-4 bg-white dark:bg-gray-800 transition-colors duration-200">
      <!-- Header with Date and Quick Actions -->
      <div class="flex items-center justify-between mb-3">
        <div class="flex items-center space-x-3">
          <!-- Status Indicator -->
          <div
            :class="[
              'w-3 h-3 rounded-full flex-shrink-0',
              record.Status === '✔️'
                ? 'bg-green-500 shadow-green-200 dark:shadow-green-800'
                : record.Status === '⏰'
                  ? 'bg-blue-500 shadow-blue-200 dark:shadow-blue-800'
                  : 'bg-orange-500 shadow-orange-200 dark:shadow-orange-800',
            ]"
            style="box-shadow: 0 0 0 3px var(--tw-shadow-color)"
          ></div>

          <!-- Date -->
          <div class="text-sm font-medium" :class="getTextClasses()">
            {{ formatDateRelative(record.Data) }}
          </div>

          <!-- Recurring Indicator -->
          <RecurringIcon :record="record" size="sm" />
        </div>

        <!-- Quick Actions -->
        <div class="flex items-center space-x-1">
          <button
            @click.stop="handleEdit"
            class="p-2 rounded-lg transition-colors hover:bg-gray-100 dark:hover:bg-gray-700"
            :class="{ 'opacity-50': record.Status === '✔️' }"
          >
            <i class="fas fa-edit text-blue-600 dark:text-blue-400 text-sm"></i>
          </button>
          <button
            @click.stop="handleDuplicate"
            class="p-2 rounded-lg transition-colors hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            <i class="fas fa-copy text-purple-600 dark:text-purple-400 text-sm"></i>
          </button>
        </div>
      </div>

      <!-- Description and Category -->
      <div class="mb-3">
        <div class="flex items-start justify-between mb-2">
          <div class="flex-1 mr-3">
            <h3 class="text-lg font-semibold leading-tight" :class="getTextClasses()">
              {{ record.Descrição }}
            </h3>
            <div v-if="record.Categoria" class="flex items-center mt-1">
              <i :class="getCategoryIcon(record.Categoria)" class="mr-2 text-gray-500 dark:text-gray-400 text-sm"></i>
              <span class="text-sm text-gray-600 dark:text-gray-400">{{ record.Categoria }}</span>
            </div>
          </div>

          <!-- Amount -->
          <div class="text-right flex-shrink-0">
            <div class="text-2xl font-bold" :class="getValueClasses()">
              {{ formatCurrency(record.Valor) }}
            </div>
            <div class="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {{ record.Tipo }}
            </div>
          </div>
        </div>
      </div>

      <!-- Type Badge and Status -->
      <div class="flex items-center justify-between">
        <!-- Type Badge -->
        <span class="inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium" :class="getTypeClasses()">
          <span class="mr-1.5">{{ record.Tipo === 'Receita' ? '💰' : '💸' }}</span>
          {{ record.Tipo }}
        </span>

        <!-- Status Button -->
        <button
          @click.stop="handleStatusToggle"
          class="inline-flex items-center px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 hover:scale-105 active:scale-95"
          :class="getStatusClasses()"
        >
          <span class="mr-2">{{ record.Status }}</span>
          {{ getStatusText() }}
        </button>
      </div>

      <!-- Additional Details (Expandable) -->
      <Transition name="details">
        <div
          v-if="showDetails"
          class="mt-4 pt-4 relative before:absolute before:top-0 before:left-1/2 before:-translate-x-1/2 before:w-12 before:h-0.5 before:bg-gradient-to-r before:from-transparent before:via-gray-300 before:to-transparent dark:before:via-gray-500"
        >
          <div class="grid grid-cols-2 gap-4 text-sm">
            <div>
              <div class="text-gray-500 dark:text-gray-400 mb-1">Data Completa</div>
              <div class="font-medium text-gray-900 dark:text-gray-100">
                {{ formatDate(record.Data) }}
              </div>
            </div>
            <div>
              <div class="text-gray-500 dark:text-gray-400 mb-1">Valor Absoluto</div>
              <div class="font-medium text-gray-900 dark:text-gray-100">
                {{ formatCurrency(Math.abs(record.Valor)) }}
              </div>
            </div>
            <div v-if="record.recurrence" class="col-span-2">
              <div class="text-gray-500 dark:text-gray-400 mb-1">Recorrência</div>
              <div class="font-medium text-gray-900 dark:text-gray-100">
                A cada {{ record.recurrence.intervalValue }}
                {{ getIntervalLabel(record.recurrence.intervalType) }}
              </div>
            </div>
          </div>
        </div>
      </Transition>

      <!-- Expand/Collapse Button -->
      <button
        @click.stop="showDetails = !showDetails"
        class="w-full mt-3 py-2 text-center text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
      >
        <i :class="showDetails ? 'fas fa-chevron-up' : 'fas fa-chevron-down'" class="text-xs"></i>
      </button>
    </div>

    <!-- Swipe Hint (First time users) -->
    <div
      v-if="showSwipeHint && !hasUserSwiped"
      class="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center z-20 rounded-2xl"
    >
      <div class="bg-white dark:bg-gray-800 rounded-xl p-4 m-4 text-center">
        <div class="flex items-center justify-center space-x-4 mb-3">
          <div class="flex items-center space-x-1">
            <i class="fas fa-arrow-right text-green-500"></i>
            <span class="text-sm">Deslize para concluir</span>
          </div>
          <div class="flex items-center space-x-1">
            <i class="fas fa-arrow-left text-red-500"></i>
            <span class="text-sm">Deslize para excluir</span>
          </div>
        </div>
        <button @click="dismissSwipeHint" class="text-blue-500 text-sm font-medium">Entendi</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { ref, computed, onMounted } from 'vue';
  import { useFinanceTable } from '../../composables/finance/useFinanceTable';
  import { useCategoryDetection } from '../../composables/useCategoryDetection';
  import RecurringIcon from '../finance/utils/RecurringIcon.vue';
  import type { IFinanceRecord } from '../../types/finance';

  // Props & Emits
  interface Props {
    record: IFinanceRecord;
    index: number;
    showSwipeHint?: boolean;
  }

  interface Emits {
    edit: [record: IFinanceRecord, index: number];
    delete: [record: IFinanceRecord, index: number];
    'toggle-status': [record: IFinanceRecord, index: number];
    duplicate: [record: IFinanceRecord, index: number];
  }

  const props = defineProps<Props>();
  const emit = defineEmits<Emits>();

  // Composables
  const { formatDate, formatCurrency, getValueColor } = useFinanceTable();
  const { getCategoryIcon } = useCategoryDetection();

  // Reactive State
  const cardRef = ref<HTMLElement>();
  const translateX = ref(0);
  const isGestureActive = ref(false);
  const isPressed = ref(false);
  const showDetails = ref(false);
  const hasUserSwiped = ref(localStorage.getItem('hasUserSwiped') === 'true');

  // Touch handling
  const startX = ref(0);
  const startY = ref(0);
  const startTime = ref(0);
  const isDragging = ref(false);

  // Methods
  const handleTouchStart = (e: TouchEvent) => {
    if (e.touches.length !== 1) return;

    const touch = e.touches[0];
    startX.value = touch.clientX;
    startY.value = touch.clientY;
    startTime.value = Date.now();
    isPressed.value = true;

    // Add haptic feedback
    if (navigator.vibrate) {
      navigator.vibrate(25);
    }
  };

  const handleTouchMove = (e: TouchEvent) => {
    if (e.touches.length !== 1) return;

    const touch = e.touches[0];
    const deltaX = touch.clientX - startX.value;
    const deltaY = touch.clientY - startY.value;

    // Check if this is a horizontal swipe
    if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 10) {
      e.preventDefault();
      isGestureActive.value = true;
      isDragging.value = true;

      // Limit the translation to prevent overscrolling
      const maxTranslate = 120;
      translateX.value = Math.max(-maxTranslate, Math.min(maxTranslate, deltaX));
    }
  };

  const handleTouchEnd = () => {
    isPressed.value = false;

    if (!isDragging.value) {
      translateX.value = 0;
      isGestureActive.value = false;
      return;
    }

    const threshold = 60;
    const shouldComplete = translateX.value > threshold;
    const shouldDelete = translateX.value < -threshold;

    if (shouldComplete) {
      // Mark as complete/incomplete
      handleStatusToggle();
      hasUserSwiped.value = true;
      localStorage.setItem('hasUserSwiped', 'true');
    } else if (shouldDelete) {
      // Delete
      handleDelete();
      hasUserSwiped.value = true;
      localStorage.setItem('hasUserSwiped', 'true');
    }

    // Reset position
    translateX.value = 0;
    isGestureActive.value = false;
    isDragging.value = false;
  };

  // Format relative date
  const formatDateRelative = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const diffTime = today.getTime() - date.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Hoje';
    if (diffDays === 1) return 'Ontem';
    if (diffDays === -1) return 'Amanhã';
    if (diffDays > 0 && diffDays <= 7) return `${diffDays} dias atrás`;
    if (diffDays < 0 && diffDays >= -7) return `em ${Math.abs(diffDays)} dias`;

    return formatDate(dateString);
  };

  // Card styling
  const getCardClasses = () => {
    const baseClasses = ['hover:shadow-md'];

    if (props.record.Status === '✔️') {
      baseClasses.push('bg-gray-50/70 dark:bg-gray-700/70', 'border-l-4', 'border-l-green-400');
    }

    return baseClasses.join(' ');
  };

  const getTextClasses = () => {
    return props.record.Status === '✔️' ? 'text-gray-600 dark:text-gray-400' : 'text-gray-900 dark:text-gray-100';
  };

  const getValueClasses = () => {
    const baseColor = getValueColor(props.record.Valor);
    const opacity = props.record.Status === '✔️' ? 'opacity-75' : '';
    return `${baseColor} ${opacity}`.trim();
  };

  const getTypeClasses = () => {
    const baseClasses =
      props.record.Tipo === 'Receita'
        ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-300'
        : 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-300';

    const opacity = props.record.Status === '✔️' ? 'opacity-75' : '';
    return `${baseClasses} ${opacity}`.trim();
  };

  const getStatusClasses = () => {
    if (props.record.Status === '✔️') {
      return 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-300 hover:bg-green-200 dark:hover:bg-green-800 ring-1 ring-green-300 dark:ring-green-700';
    } else if (props.record.Status === '⏰') {
      return 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-300 hover:bg-blue-200 dark:hover:bg-blue-800 ring-1 ring-blue-300 dark:ring-blue-700';
    } else {
      return 'bg-orange-100 dark:bg-orange-900 text-orange-800 dark:text-orange-300 hover:bg-orange-200 dark:hover:bg-orange-800 ring-1 ring-orange-300 dark:ring-orange-700';
    }
  };

  const getStatusText = () => {
    switch (props.record.Status) {
      case '✔️':
        return 'Concluído';
      case '⏰':
        return 'Agendado';
      default:
        return 'Pendente';
    }
  };

  const getIntervalLabel = (intervalType: string) => {
    const labels = {
      days: 'dia(s)',
      weeks: 'semana(s)',
      months: 'mês(es)',
      years: 'ano(s)',
    };
    return labels[intervalType as keyof typeof labels] || intervalType;
  };

  // Event handlers
  const handleEdit = () => {
    emit('edit', props.record, props.index);
  };

  const handleDelete = () => {
    emit('delete', props.record, props.index);
  };

  const handleStatusToggle = () => {
    emit('toggle-status', props.record, props.index);
  };

  const handleDuplicate = () => {
    emit('duplicate', props.record, props.index);
  };

  const dismissSwipeHint = () => {
    hasUserSwiped.value = true;
    localStorage.setItem('hasUserSwiped', 'true');
  };
</script>

<style scoped>
  /* Smooth transitions for gestures */
  .transition-all {
    transition-property: transform, box-shadow, background-color, opacity;
  }

  /* Details expand/collapse animation */
  .details-enter-active,
  .details-leave-active {
    transition: all 0.3s ease;
    overflow: hidden;
  }

  .details-enter-from,
  .details-leave-to {
    opacity: 0;
    max-height: 0;
    transform: translateY(-10px);
  }

  .details-enter-to,
  .details-leave-from {
    opacity: 1;
    max-height: 200px;
    transform: translateY(0);
  }

  /* Enhanced shadow effects */
  .shadow-lg {
    box-shadow:
      0 10px 15px -3px rgba(0, 0, 0, 0.1),
      0 4px 6px -2px rgba(0, 0, 0, 0.05);
  }

  /* Transform GPU acceleration for smooth gestures */
  .transform-gpu {
    transform: translateZ(0);
    will-change: transform;
  }
</style>
