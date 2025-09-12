<template>
  <div class="space-y-6">
    <!-- Alterar Senha -->
    <div class="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-600">
      <div class="px-6 py-4 border-b border-gray-200 dark:border-slate-600">
        <h3 class="text-lg font-semibold text-gray-900 dark:text-slate-100 flex items-center gap-2">
          🔐 Alterar Senha
        </h3>
        <p class="text-sm text-gray-600 dark:text-slate-400 mt-1">
          Mantenha sua conta segura com uma senha forte
        </p>
      </div>

      <div class="p-6">
        <form @submit.prevent="handleChangePassword" class="space-y-4">
          <!-- Senha Atual -->
          <div>
            <label for="currentPassword" class="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
              Senha Atual *
            </label>
            <div class="relative">
              <input id="currentPassword" v-model="passwordForm.currentPassword"
                :type="showCurrentPassword ? 'text' : 'password'" required placeholder="Digite sua senha atual"
                class="w-full px-3 py-2 pr-10 border border-gray-300 dark:border-slate-500 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500 dark:bg-slate-700 dark:text-slate-100 transition-colors" />
              <button type="button" @click="showCurrentPassword = !showCurrentPassword"
                class="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-slate-300">
                <i :class="showCurrentPassword ? 'fas fa-eye-slash' : 'fas fa-eye'"></i>
              </button>
            </div>
          </div>

          <!-- Nova Senha -->
          <div>
            <label for="newPassword" class="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
              Nova Senha *
            </label>
            <div class="relative">
              <input id="newPassword" v-model="passwordForm.newPassword" :type="showNewPassword ? 'text' : 'password'"
                required placeholder="Digite sua nova senha"
                class="w-full px-3 py-2 pr-10 border border-gray-300 dark:border-slate-500 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500 dark:bg-slate-700 dark:text-slate-100 transition-colors" />
              <button type="button" @click="showNewPassword = !showNewPassword"
                class="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-slate-300">
                <i :class="showNewPassword ? 'fas fa-eye-slash' : 'fas fa-eye'"></i>
              </button>
            </div>

            <!-- Força da senha -->
            <div class="mt-2">
              <div class="flex items-center gap-2 mb-1">
                <span class="text-xs text-gray-500 dark:text-slate-400">Força da senha:</span>
                <span :class="passwordStrengthClass" class="text-xs font-medium">
                  {{ passwordStrengthText }}
                </span>
              </div>
              <div class="w-full bg-gray-200 dark:bg-slate-600 rounded-full h-1.5">
                <div :class="passwordStrengthBarClass" :style="{ width: `${passwordStrengthPercentage}%` }"
                  class="h-1.5 rounded-full transition-all duration-300"></div>
              </div>
            </div>
          </div>

          <!-- Confirmar Nova Senha -->
          <div>
            <label for="confirmPassword" class="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
              Confirmar Nova Senha *
            </label>
            <div class="relative">
              <input id="confirmPassword" v-model="passwordForm.confirmPassword"
                :type="showConfirmPassword ? 'text' : 'password'" required placeholder="Digite novamente sua nova senha"
                class="w-full px-3 py-2 pr-10 border border-gray-300 dark:border-slate-500 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500 dark:bg-slate-700 dark:text-slate-100 transition-colors" />
              <button type="button" @click="showConfirmPassword = !showConfirmPassword"
                class="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-slate-300">
                <i :class="showConfirmPassword ? 'fas fa-eye-slash' : 'fas fa-eye'"></i>
              </button>
            </div>

            <!-- Validação -->
            <div v-if="passwordForm.confirmPassword && !passwordsMatch" class="mt-1 text-sm text-red-500">
              As senhas não coincidem
            </div>
          </div>

          <!-- Botão de alterar -->
          <div class="pt-4">
            <button type="submit" :disabled="isLoading || !isPasswordFormValid"
              class="w-full bg-gradient-to-r from-pink-500 to-rose-500 text-white py-2 px-4 rounded-lg hover:from-pink-600 hover:to-rose-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2">
              <i v-if="isLoading" class="fas fa-spinner fa-spin"></i>
              <i v-else class="fas fa-key"></i>
              {{ isLoading ? 'Alterando...' : 'Alterar Senha' }}
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- Sessões Ativas -->
    <div class="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-600">
      <div class="px-6 py-4 border-b border-gray-200 dark:border-slate-600">
        <h3 class="text-lg font-semibold text-gray-900 dark:text-slate-100 flex items-center gap-2">
          💻 Sessões Ativas
        </h3>
        <p class="text-sm text-gray-600 dark:text-slate-400 mt-1">
          Gerencie onde você está conectado
        </p>
      </div>

      <div class="p-6">
        <div class="space-y-4">
          <!-- Sessão atual -->
          <div
            class="flex items-center justify-between p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 bg-green-100 dark:bg-green-800 rounded-full flex items-center justify-center">
                <i class="fas fa-laptop text-green-600 dark:text-green-400"></i>
              </div>
              <div>
                <p class="font-medium text-gray-900 dark:text-slate-100">Esta sessão</p>
                <p class="text-sm text-gray-500 dark:text-slate-400">Chrome • Brasil • Agora</p>
              </div>
            </div>
            <span
              class="bg-green-100 dark:bg-green-800 text-green-800 dark:text-green-200 px-3 py-1 rounded-full text-xs font-medium">
              Ativa
            </span>
          </div>

          <!-- Outras sessões (mock) -->
          <div class="flex items-center justify-between p-4 border border-gray-200 dark:border-slate-600 rounded-lg">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 bg-gray-100 dark:bg-slate-700 rounded-full flex items-center justify-center">
                <i class="fas fa-mobile-alt text-gray-600 dark:text-slate-400"></i>
              </div>
              <div>
                <p class="font-medium text-gray-900 dark:text-slate-100">iPhone Safari</p>
                <p class="text-sm text-gray-500 dark:text-slate-400">São Paulo • Há 2 horas</p>
              </div>
            </div>
            <button
              class="text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 text-sm font-medium">
              Desconectar
            </button>
          </div>

          <div class="flex items-center justify-between p-4 border border-gray-200 dark:border-slate-600 rounded-lg">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 bg-gray-100 dark:bg-slate-700 rounded-full flex items-center justify-center">
                <i class="fas fa-desktop text-gray-600 dark:text-slate-400"></i>
              </div>
              <div>
                <p class="font-medium text-gray-900 dark:text-slate-100">Windows Edge</p>
                <p class="text-sm text-gray-500 dark:text-slate-400">Rio de Janeiro • Ontem</p>
              </div>
            </div>
            <button
              class="text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 text-sm font-medium">
              Desconectar
            </button>
          </div>
        </div>

        <!-- Desconectar de todos -->
        <div class="mt-6 pt-4 border-t border-gray-200 dark:border-slate-600">
          <button @click="logoutAllSessions"
            class="w-full bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800 py-2 px-4 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors flex items-center justify-center gap-2">
            <i class="fas fa-sign-out-alt"></i>
            Desconectar de todos os dispositivos
          </button>
        </div>
      </div>
    </div>

    <!-- Autenticação de Dois Fatores -->
    <div class="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-600">
      <div class="px-6 py-4 border-b border-gray-200 dark:border-slate-600">
        <h3 class="text-lg font-semibold text-gray-900 dark:text-slate-100 flex items-center gap-2">
          🛡️ Autenticação de Dois Fatores
        </h3>
        <p class="text-sm text-gray-600 dark:text-slate-400 mt-1">
          Adicione uma camada extra de segurança à sua conta
        </p>
      </div>

      <div class="p-6">
        <div class="flex items-center justify-between">
          <div>
            <p class="font-medium text-gray-900 dark:text-slate-100">2FA via Aplicativo</p>
            <p class="text-sm text-gray-500 dark:text-slate-400">Use um app autenticador como Google Authenticator</p>
          </div>
          <div class="flex items-center gap-3">
            <span
              class="bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-slate-400 px-3 py-1 rounded-full text-xs font-medium">
              Desabilitado
            </span>
            <button class="bg-pink-500 hover:bg-pink-600 text-white px-4 py-2 rounded-lg transition-colors text-sm">
              Configurar
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Dicas de Segurança -->
    <div class="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-xl p-6">
      <div class="flex items-start gap-3">
        <i class="fas fa-shield-alt text-yellow-600 dark:text-yellow-400 mt-1"></i>
        <div>
          <h4 class="font-medium text-yellow-800 dark:text-yellow-200 mb-2">
            🐷 Dicas de Segurança do por.quinho
          </h4>
          <ul class="text-sm text-yellow-700 dark:text-yellow-300 space-y-1">
            <li>• Use uma senha forte com pelo menos 8 caracteres</li>
            <li>• Inclua letras maiúsculas, minúsculas, números e símbolos</li>
            <li>• Não compartilhe sua senha com ninguém</li>
            <li>• Ative a autenticação de dois fatores quando disponível</li>
            <li>• Verifique regularmente suas sessões ativas</li>
          </ul>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useAuthPassword } from '../../../composables/auth/useAuthPassword'
import { useToast } from '../../../composables/useToast'

// Hooks
const { resetPassword, updatePassword } = useAuthPassword()
const { success: showSuccess, error: showError } = useToast()

// Estado
const isLoading = ref(false)
const showCurrentPassword = ref(false)
const showNewPassword = ref(false)
const showConfirmPassword = ref(false)

const passwordForm = ref({
  currentPassword: '',
  newPassword: '',
  confirmPassword: ''
})

// Computed
const passwordsMatch = computed(() => {
  return passwordForm.value.newPassword === passwordForm.value.confirmPassword
})

const passwordStrength = computed(() => {
  const password = passwordForm.value.newPassword
  let score = 0

  if (password.length >= 8) score++
  if (/[a-z]/.test(password)) score++
  if (/[A-Z]/.test(password)) score++
  if (/[0-9]/.test(password)) score++
  if (/[^A-Za-z0-9]/.test(password)) score++

  return score
})

const passwordStrengthText = computed(() => {
  const texts = ['Muito fraca', 'Fraca', 'Regular', 'Boa', 'Muito boa']
  return texts[passwordStrength.value] || 'Muito fraca'
})

const passwordStrengthClass = computed(() => {
  const classes = ['text-red-500', 'text-orange-500', 'text-yellow-500', 'text-blue-500', 'text-green-500']
  return classes[passwordStrength.value] || 'text-red-500'
})

const passwordStrengthBarClass = computed(() => {
  const classes = ['bg-red-500', 'bg-orange-500', 'bg-yellow-500', 'bg-blue-500', 'bg-green-500']
  return classes[passwordStrength.value] || 'bg-red-500'
})

const passwordStrengthPercentage = computed(() => {
  return (passwordStrength.value / 5) * 100
})

const isPasswordFormValid = computed(() => {
  return passwordForm.value.currentPassword &&
    passwordForm.value.newPassword &&
    passwordForm.value.confirmPassword &&
    passwordsMatch.value &&
    passwordStrength.value >= 2
})

// Métodos
const handleChangePassword = async () => {
  try {
    isLoading.value = true

    // TODO: Implementar mudança de senha real
    // await updatePassword({
    //   currentPassword: passwordForm.value.currentPassword,
    //   newPassword: passwordForm.value.newPassword,
    //   confirmPassword: passwordForm.value.confirmPassword
    // })

    // Simular delay
    await new Promise(resolve => setTimeout(resolve, 2000))

    // Limpar form
    passwordForm.value = {
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    }

    showSuccess('Senha alterada com sucesso!', {
      title: '🔐 Segurança Atualizada'
    })
  } catch (error) {
    console.error('Erro ao alterar senha:', error)
    showError('Erro ao alterar senha. Verifique sua senha atual e tente novamente.', {
      title: '❌ Erro'
    })
  } finally {
    isLoading.value = false
  }
}

const logoutAllSessions = async () => {
  if (confirm('Tem certeza que deseja desconectar de todos os dispositivos? Você precisará fazer login novamente.')) {
    try {
      // TODO: Implementar logout de todas as sessões
      // await authService.logoutAllSessions()

      showSuccess('Desconectado de todos os dispositivos com sucesso!', {
        title: '🚪 Logout Completo'
      })
    } catch (error) {
      console.error('Erro ao fazer logout de todas as sessões:', error)
      showError('Erro ao desconectar de todos os dispositivos.', {
        title: '❌ Erro'
      })
    }
  }
}
</script>

<script lang="ts">
export default {
  name: 'SecurityPanel'
}
</script>

<style scoped>
/* Transições suaves */
.transition-all {
  transition: all 0.2s ease;
}

.transition-colors {
  transition: color 0.2s ease, background-color 0.2s ease, border-color 0.2s ease;
}

/* Focus states */
input:focus {
  box-shadow: 0 0 0 3px rgba(236, 72, 153, 0.1);
}
</style>
