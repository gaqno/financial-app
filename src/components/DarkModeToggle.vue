<template>
  <div class="dark-mode-toggle">
    <!-- Mobile: Simple icon button -->
    <button 
      @click="toggleDarkMode"
      class="lg:hidden p-2 rounded-lg transition-colors duration-200
             text-gray-600 hover:text-gray-800 hover:bg-gray-100
             dark:text-gray-300 dark:hover:text-gray-100 dark:hover:bg-gray-700"
      :title="isDarkMode ? 'Modo Claro' : 'Modo Escuro'"
    >
      <i :class="isDarkMode ? 'fas fa-sun' : 'fas fa-moon'" class="text-lg"></i>
    </button>

    <!-- Desktop: Toggle switch with labels -->
    <div class="hidden lg:flex items-center gap-3">
      <i class="fas fa-sun text-yellow-500 text-sm"></i>
      
      <!-- Toggle Switch -->
      <label class="relative inline-block w-12 h-6 cursor-pointer">
        <input 
          type="checkbox" 
          :checked="isDarkMode"
          @change="toggleDarkMode"
          class="sr-only"
        >
        <span 
          class="absolute inset-0 bg-gray-300 rounded-full transition-colors duration-300
                 dark:bg-gray-600"
          :class="isDarkMode ? 'bg-blue-600' : 'bg-gray-300'"
        ></span>
        <span 
          class="absolute left-1 top-1 w-4 h-4 bg-white rounded-full transition-transform duration-300 shadow-sm
                 flex items-center justify-center"
          :class="isDarkMode ? 'transform translate-x-6' : ''"
        >
          <i 
            :class="isDarkMode ? 'fas fa-moon text-blue-600' : 'fas fa-sun text-yellow-500'" 
            class="text-xs"
          ></i>
        </span>
      </label>
      
      <i class="fas fa-moon text-blue-600 text-sm"></i>
    </div>

    <!-- Optional: Status text (development only) -->
    <div 
      v-if="showStatus && isDevelopment" 
      class="text-xs text-gray-500 dark:text-gray-400 ml-2"
    >
      {{ isDarkMode ? 'Escuro' : 'Claro' }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useDarkMode } from '../composables/useDarkMode'

interface Props {
  showStatus?: boolean
}

// Props
const props = withDefaults(defineProps<Props>(), {
  showStatus: false
})

// Dark mode composable
const { isDarkMode, toggleDarkMode } = useDarkMode()

// Development detection
const isDevelopment = computed(() => {
  if (typeof window !== 'undefined') {
    return window.location.hostname === 'localhost'
  }
  return false
})
</script>

<script lang="ts">
export default {
  name: 'DarkModeToggle'
}
</script>

<style scoped>
/* Smooth transitions for toggle animations */
.dark-mode-toggle input:focus + span {
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

/* Enhanced toggle switch styling */
.dark-mode-toggle label:hover span:first-of-type {
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

/* Toggle switch active state */
.dark-mode-toggle input:checked + span {
  background-color: #3b82f6;
}

/* Accessibility improvements */
.dark-mode-toggle button:focus {
  outline: 2px solid #3b82f6;
  outline-offset: 2px;
}

.dark-mode-toggle input:focus-visible + span {
  outline: 2px solid #3b82f6;
  outline-offset: 2px;
}
</style>
