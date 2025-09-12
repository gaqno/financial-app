<template>
  <div class="relative">
    <!-- Menu Toggle Button -->
    <button @click="toggleMenu"
      class="text-gray-400 hover:text-gray-600 p-2 rounded-full hover:bg-gray-100 transition-colors"
      :class="{ 'text-gray-600 bg-gray-100': isOpen }">
      <i class="fas fa-ellipsis-v"></i>
    </button>

    <!-- Dropdown Menu -->
    <Transition enter-active-class="transition ease-out duration-100" enter-from-class="transform opacity-0 scale-95"
      enter-to-class="transform opacity-100 scale-100" leave-active-class="transition ease-in duration-75"
      leave-from-class="transform opacity-100 scale-100" leave-to-class="transform opacity-0 scale-95">
      <div v-if="isOpen"
        class="absolute right-0 top-full mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-[60]">
        <!-- Profile Option -->
        <button @click="handleProfile" class="menu-item">
          <i class="fas fa-user-edit mr-3 text-gray-400"></i>
          Editar Perfil
        </button>

        <!-- Settings Option -->
        <button @click="handleSettings" class="menu-item">
          <i class="fas fa-cog mr-3 text-gray-400"></i>
          Configurações
        </button>

        <!-- Divider -->
        <div class="border-t border-gray-100 my-1"></div>

        <!-- Logout Option -->
        <button @click="handleLogout" class="menu-item text-red-600 hover:bg-red-50">
          <i class="fas fa-sign-out-alt mr-3 text-red-400"></i>
          Sair
        </button>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'

interface Emits {
  'profile': []
  'settings': []
  'logout': []
}

const emit = defineEmits<Emits>()

const isOpen = ref(false)

const toggleMenu = () => {
  isOpen.value = !isOpen.value
}

const closeMenu = () => {
  isOpen.value = false
}

const handleProfile = () => {
  closeMenu()
  emit('profile')
}

const handleSettings = () => {
  closeMenu()
  emit('settings')
}

const handleLogout = () => {
  closeMenu()
  emit('logout')
}

// Close menu when clicking outside
const handleClickOutside = (event: Event) => {
  const target = event.target as HTMLElement
  if (!target.closest('.relative')) {
    closeMenu()
  }
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})
</script>

<style scoped>
.menu-item {
  @apply w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center transition-colors;
}
</style>
