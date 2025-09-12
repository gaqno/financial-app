<template>
  <div class="space-y-6">
    <!-- Full Name (only for register) -->
    <div v-if="isRegisterMode">
      <label class="form-label">Nome Completo</label>
      <input v-model="formData.fullName" type="text" placeholder="Seu nome completo" class="form-input"
        :disabled="isLoading" />
    </div>

    <!-- Email -->
    <div>
      <label class="form-label">Email</label>
      <input v-model="formData.email" type="email" placeholder="seu@email.com" required class="form-input"
        :disabled="isLoading" />
    </div>

    <!-- Password -->
    <div>
      <label class="form-label">Senha</label>
      <div class="relative">
        <input v-model="formData.password" :type="showPassword ? 'text' : 'password'" placeholder="••••••••" required
          :minlength="isRegisterMode ? 6 : undefined" class="form-input pr-12" :disabled="isLoading" />
        <button type="button" @click="togglePassword"
          class="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
          :disabled="isLoading">
          <i :class="showPassword ? 'fas fa-eye-slash' : 'fas fa-eye'"></i>
        </button>
      </div>
      <div v-if="isRegisterMode" class="text-xs text-gray-500 mt-1">
        Mínimo de 6 caracteres
      </div>
    </div>

    <!-- Confirm Password (only for register) -->
    <div v-if="isRegisterMode">
      <label class="form-label">Confirmar Senha</label>
      <input v-model="formData.confirmPassword" type="password" placeholder="••••••••" required class="form-input"
        :disabled="isLoading" />
      <div v-if="passwordMismatch" class="text-xs text-red-600 mt-1">
        As senhas não coincidem
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
interface Props {
  formData: {
    email: string
    password: string
    confirmPassword: string
    fullName: string
  }
  isRegisterMode: boolean
  showPassword: boolean
  passwordMismatch: boolean
  isLoading: boolean
}

interface Emits {
  'toggle-password': []
}

defineProps<Props>()
const emit = defineEmits<Emits>()

const togglePassword = () => {
  emit('toggle-password')
}
</script>

<style scoped>
.form-label {
  @apply block text-sm font-medium text-gray-700 mb-2;
}

.form-input {
  @apply w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors;
}

.form-input:focus {
  @apply ring-2 ring-blue-500 ring-offset-1;
}
</style>
