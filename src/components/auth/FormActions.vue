<template>
  <div class="space-y-4">
    <!-- Submit Button -->
    <button type="submit" :disabled="isLoading || !isFormValid" class="submit-button">
      <i v-if="isLoading" class="fas fa-spinner fa-spin mr-2"></i>
      <i v-else :class="isRegisterMode ? 'fas fa-user-plus' : 'fas fa-sign-in-alt'" class="mr-2"></i>
      {{ isLoading ? 'Aguarde...' : (isRegisterMode ? 'Criar Conta' : 'Entrar') }}
    </button>

    <!-- Toggle Mode -->
    <div class="text-center">
      <button type="button" @click="toggleMode" class="text-sm text-blue-600 hover:text-blue-800 font-medium"
        :disabled="isLoading">
        {{ isRegisterMode
          ? 'Já tem uma conta? Entrar'
          : 'Não tem uma conta? Registrar-se'
        }}
      </button>
    </div>

    <!-- Forgot Password (only for login) -->
    <div v-if="!isRegisterMode" class="text-center">
      <button type="button" @click="handleForgotPassword" class="text-sm text-gray-600 hover:text-gray-800"
        :disabled="isLoading">
        Esqueceu a senha?
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
interface Props {
  isRegisterMode: boolean
  isFormValid: boolean
  isLoading: boolean
}

interface Emits {
  'toggle-mode': []
  'forgot-password': []
}

defineProps<Props>()
const emit = defineEmits<Emits>()

const toggleMode = () => {
  emit('toggle-mode')
}

const handleForgotPassword = () => {
  emit('forgot-password')
}
</script>

<style scoped>
.submit-button {
  @apply w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center justify-center;
}
</style>
