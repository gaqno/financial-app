import { ref, computed, onMounted, onUnmounted } from 'vue';

// Props & Emits interfaces
export interface FloatingActionButtonProps {
  isModalOpen?: boolean;
}

export interface FloatingActionButtonEmits {
  'quick-add-income': [];
  'quick-add-expense': [];
  'voice-input': [];
  'scan-receipt': [];
  'toggle-filters': [];
}

export interface FloatingActionButtonCallbacks {
  quickAddIncome: () => void;
  quickAddExpense: () => void;
  voiceInput: () => void;
  scanReceipt: () => void;
  toggleFilters: () => void;
}

export function useFloatingActionButton(props: FloatingActionButtonProps, callbacks: FloatingActionButtonCallbacks) {
  // Reactive State
  const isOpen = ref(false);
  const isListening = ref(false);
  const scrollY = ref(0);
  const fabHideThreshold = 0;

  // Computed
  const showFab = computed(() => {
    // Hide FAB when modal is open
    if (props.isModalOpen) {
      return false;
    }

    // Always show FAB when menu is open, otherwise follow scroll behavior
    if (isOpen.value) {
      return true;
    }

    // Show FAB unless user scrolls down quickly (better UX than always hiding)
    return scrollY.value < fabHideThreshold;
  });

  // Methods
  const toggleActions = () => {
    isOpen.value = !isOpen.value;
    // Haptic feedback
    if (navigator.vibrate) {
      navigator.vibrate(25);
    }
  };

  const closeActions = () => {
    isOpen.value = false;
  };

  const quickAddIncome = () => {
    callbacks.quickAddIncome();
    closeActions();
    // Haptic feedback
    if (navigator.vibrate) {
      navigator.vibrate(50);
    }
  };

  const quickAddExpense = () => {
    callbacks.quickAddExpense();
    closeActions();
    // Haptic feedback
    if (navigator.vibrate) {
      navigator.vibrate(50);
    }
  };

  const startVoiceInput = async () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      alert('Reconhecimento de voz não suportado neste navegador');
      return;
    }

    if (isListening.value) {
      // Stop listening
      isListening.value = false;
      return;
    }

    isListening.value = true;
    callbacks.voiceInput();

    // Simulate voice input (replace with actual implementation)
    setTimeout(() => {
      isListening.value = false;
    }, 3000);

    closeActions();
  };

  const scanReceipt = () => {
    // TODO: Implement camera/receipt scanning
    callbacks.scanReceipt();
    closeActions();
    // Haptic feedback
    if (navigator.vibrate) {
      navigator.vibrate(50);
    }
  };

  const toggleQuickFilters = () => {
    callbacks.toggleFilters();
    closeActions();
  };

  // Scroll handling for FAB show/hide
  const handleScroll = () => {
    scrollY.value = window.scrollY;
  };

  // Lifecycle
  onMounted(() => {
    window.addEventListener('scroll', handleScroll, { passive: true });
  });

  onUnmounted(() => {
    window.removeEventListener('scroll', handleScroll);
  });

  return {
    // State
    isOpen,
    isListening,
    scrollY,

    // Computed
    showFab,

    // Methods
    toggleActions,
    closeActions,
    quickAddIncome,
    quickAddExpense,
    startVoiceInput,
    scanReceipt,
    toggleQuickFilters,
  };
}
