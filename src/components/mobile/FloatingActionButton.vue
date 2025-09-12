<template>
  <div class="lg:hidden">
    <!-- Main FAB -->
    <Transition name="fab">
      <button v-show="showFab" @click="toggleActions" :class="[
        'fixed bottom-20 right-6 z-50',
        'w-14 h-14 rounded-full shadow-2xl',
        'bg-gradient-to-r from-blue-500 to-purple-600',
        'text-white font-medium',
        'transition-all duration-300 ease-in-out',
        'hover:shadow-3xl hover:scale-110',
        'active:scale-95',
        'flex items-center justify-center',
        isOpen ? 'rotate-45' : 'rotate-0'
      ]">
        <i class="fas fa-plus text-xl"></i>
      </button>
    </Transition>

    <!-- Quick Actions Menu -->
    <Transition name="fab-menu">
      <div v-show="isOpen" class="fixed bottom-20 right-6 z-40">

        <!-- Quick Add Income -->
        <div class="mb-4 flex items-center">
          <span class="mr-3 px-3 py-2 bg-black bg-opacity-75 text-white text-sm rounded-lg whitespace-nowrap">
            Adicionar Receita
          </span>
          <button @click="quickAddIncome"
            class="w-12 h-12 rounded-full bg-green-500 text-white shadow-lg hover:bg-green-600 transition-colors flex items-center justify-center">
            <i class="fas fa-plus text-lg"></i>
            <i class="fas fa-arrow-up text-xs absolute translate-x-1"></i>
          </button>
        </div>

        <!-- Quick Add Expense -->
        <div class="mb-4 flex items-center">
          <span class="mr-3 px-3 py-2 bg-black bg-opacity-75 text-white text-sm rounded-lg whitespace-nowrap">
            Adicionar Despesa
          </span>
          <button @click="quickAddExpense"
            class="w-12 h-12 rounded-full bg-red-500 text-white shadow-lg hover:bg-red-600 transition-colors flex items-center justify-center">
            <i class="fas fa-plus text-lg"></i>
            <i class="fas fa-arrow-down text-xs absolute translate-x-1"></i>
          </button>
        </div>

        <!-- Voice Input -->
        <div class="mb-4 flex items-center">
          <span class="mr-3 px-3 py-2 bg-black bg-opacity-75 text-white text-sm rounded-lg whitespace-nowrap">
            Comando de Voz
          </span>
          <button @click="startVoiceInput" :class="[
            'w-12 h-12 rounded-full shadow-lg transition-colors flex items-center justify-center',
            isListening
              ? 'bg-red-500 text-white animate-pulse'
              : 'bg-purple-500 text-white hover:bg-purple-600'
          ]">
            <i :class="isListening ? 'fas fa-stop' : 'fas fa-microphone'"></i>
          </button>
        </div>

        <!-- Camera/Receipt Scan -->
        <div class="mb-4 flex items-center">
          <span class="mr-3 px-3 py-2 bg-black bg-opacity-75 text-white text-sm rounded-lg whitespace-nowrap">
            Escanear Recibo
          </span>
          <button @click="scanReceipt"
            class="w-12 h-12 rounded-full bg-orange-500 text-white shadow-lg hover:bg-orange-600 transition-colors flex items-center justify-center">
            <i class="fas fa-camera"></i>
          </button>
        </div>

        <!-- Quick Filter Toggle -->
        <div class="mb-4 flex items-center">
          <span class="mr-3 px-3 py-2 bg-black bg-opacity-75 text-white text-sm rounded-lg whitespace-nowrap">
            Filtros Rápidos
          </span>
          <button @click="toggleQuickFilters"
            class="w-12 h-12 rounded-full bg-blue-500 text-white shadow-lg hover:bg-blue-600 transition-colors flex items-center justify-center">
            <i class="fas fa-filter"></i>
          </button>
        </div>

      </div>
    </Transition>

    <!-- Backdrop -->
    <Transition name="backdrop">
      <div v-show="isOpen" @click="closeActions" class="fixed inset-0 bg-black bg-opacity-50 z-30">
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'

// Props & Emits
interface Emits {
  'quick-add-income': []
  'quick-add-expense': []
  'voice-input': []
  'scan-receipt': []
  'toggle-filters': []
}

const emit = defineEmits<Emits>()

// Reactive State
const isOpen = ref(false)
const isListening = ref(false)
const scrollY = ref(0)
const fabHideThreshold = 100

// Computed
const showFab = computed(() => {
  // Hide FAB when scrolling down quickly
  return scrollY.value < fabHideThreshold
})

// Methods
const toggleActions = () => {
  isOpen.value = !isOpen.value
  // Haptic feedback
  if (navigator.vibrate) {
    navigator.vibrate(25)
  }
}

const closeActions = () => {
  isOpen.value = false
}

const quickAddIncome = () => {
  emit('quick-add-income')
  closeActions()
  // Haptic feedback
  if (navigator.vibrate) {
    navigator.vibrate(50)
  }
}

const quickAddExpense = () => {
  emit('quick-add-expense')
  closeActions()
  // Haptic feedback
  if (navigator.vibrate) {
    navigator.vibrate(50)
  }
}

const startVoiceInput = async () => {
  if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
    alert('Reconhecimento de voz não suportado neste navegador')
    return
  }

  if (isListening.value) {
    // Stop listening
    isListening.value = false
    return
  }

  isListening.value = true
  emit('voice-input')

  // Simulate voice input (replace with actual implementation)
  setTimeout(() => {
    isListening.value = false
  }, 3000)

  closeActions()
}

const scanReceipt = () => {
  // TODO: Implement camera/receipt scanning
  emit('scan-receipt')
  closeActions()
  // Haptic feedback
  if (navigator.vibrate) {
    navigator.vibrate(50)
  }
}

const toggleQuickFilters = () => {
  emit('toggle-filters')
  closeActions()
}

// Scroll handling for FAB show/hide
const handleScroll = () => {
  scrollY.value = window.scrollY
}

// Lifecycle
onMounted(() => {
  window.addEventListener('scroll', handleScroll, { passive: true })
})

onUnmounted(() => {
  window.removeEventListener('scroll', handleScroll)
})
</script>

<style scoped>
/* FAB animations */
.fab-enter-active,
.fab-leave-active {
  transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.fab-enter-from,
.fab-leave-to {
  transform: scale(0) rotate(180deg);
  opacity: 0;
}

/* FAB menu animations */
.fab-menu-enter-active {
  transition: all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.fab-menu-leave-active {
  transition: all 0.3s ease-in;
}

.fab-menu-enter-from {
  transform: scale(0.8) translateY(20px);
  opacity: 0;
}

.fab-menu-leave-to {
  transform: scale(0.8) translateY(20px);
  opacity: 0;
}

/* Stagger animation for menu items */
.fab-menu-enter-active>div {
  animation: fabItemSlideIn 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.fab-menu-enter-active>div:nth-child(1) {
  animation-delay: 0ms;
}

.fab-menu-enter-active>div:nth-child(2) {
  animation-delay: 50ms;
}

.fab-menu-enter-active>div:nth-child(3) {
  animation-delay: 100ms;
}

.fab-menu-enter-active>div:nth-child(4) {
  animation-delay: 150ms;
}

.fab-menu-enter-active>div:nth-child(5) {
  animation-delay: 200ms;
}

@keyframes fabItemSlideIn {
  from {
    transform: translateX(100px);
    opacity: 0;
  }

  to {
    transform: translateX(0);
    opacity: 1;
  }
}

/* Backdrop animation */
.backdrop-enter-active,
.backdrop-leave-active {
  transition: opacity 0.3s ease;
}

.backdrop-enter-from,
.backdrop-leave-to {
  opacity: 0;
}

/* Enhanced shadow for FAB */
.shadow-3xl {
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(255, 255, 255, 0.1);
}
</style>
