<template>
  <div class="auth-guard">
    <!-- Loading State -->
    <div v-if="authStatus === 'loading'" class="loading-screen">
      <div class="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div class="bg-white rounded-2xl shadow-xl p-8 text-center">
          <div class="w-16 h-16 mx-auto mb-4 bg-blue-100 rounded-full flex items-center justify-center">
            <i class="fas fa-wallet text-blue-600 text-2xl"></i>
          </div>
          <h2 class="text-xl font-semibold text-gray-900 mb-4">FinanceApp</h2>
          <div class="flex items-center justify-center space-x-2">
            <i class="fas fa-spinner fa-spin text-blue-600"></i>
            <span class="text-gray-600">Carregando...</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Authentication Required -->
    <div v-else-if="authStatus === 'unauthenticated'" class="auth-required">
      <LoginForm :error="error" :is-loading="isLoading" @login-success="handleLoginSuccess"
        @register-success="handleRegisterSuccess" @login-attempt="handleLoginAttempt"
        @register-attempt="handleRegisterAttempt" @password-reset="handlePasswordReset"
        @clear-error="handleClearError" />
    </div>

    <!-- Error State -->
    <div v-else-if="authStatus === 'error'" class="error-screen">
      <div class="min-h-screen bg-gradient-to-br from-red-50 to-pink-100 flex items-center justify-center p-4">
        <div class="bg-white rounded-2xl shadow-xl p-8 text-center max-w-md w-full">
          <div class="w-16 h-16 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center">
            <i class="fas fa-exclamation-triangle text-red-600 text-2xl"></i>
          </div>
          <h2 class="text-xl font-semibold text-gray-900 mb-2">Erro de Autenticação</h2>
          <p class="text-gray-600 mb-4">{{ error?.message || 'Ocorreu um erro inesperado' }}</p>

          <div class="flex gap-3">
            <button @click="handleRetry"
              class="flex-1 bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 transition-colors">
              <i class="fas fa-redo mr-2"></i>
              Tentar Novamente
            </button>
            <button @click="handleLogout"
              class="flex-1 bg-gray-100 text-gray-700 py-3 px-4 rounded-lg font-medium hover:bg-gray-200 transition-colors">
              <i class="fas fa-sign-out-alt mr-2"></i>
              Sair
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Authenticated - Show App Content -->
    <div v-else-if="authStatus === 'authenticated'" class="authenticated">
      <!-- User Header -->
      <UserHeader v-if="showUserHeader" :user="user" :show-stats="true" :show-notifications="true"
        :notifications="sampleNotifications" @profile="handleProfile" @settings="handleSettings" @logout="handleLogout"
        @notification-read="handleNotificationRead" @notifications-read-all="handleNotificationsReadAll"
        @notifications-view-all="handleNotificationsViewAll" />

      <!-- Main App Content -->
      <div class="app-content" :class="{ 'pt-16': showUserHeader }">
        <slot />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useAuth } from '../../composables/useAuth'
import LoginForm from './LoginForm.vue'
import UserHeader from './UserHeader.vue'

interface Props {
  showUserHeader?: boolean
  requireAuth?: boolean
}

interface Emits {
  'auth-change': [isAuthenticated: boolean]
  'user-profile': []
  'user-settings': []
}

const props = withDefaults(defineProps<Props>(), {
  showUserHeader: true,
  requireAuth: true
})

const emit = defineEmits<Emits>()

// Use auth composable
const {
  user,
  isAuthenticated,
  authStatus,
  error,
  isLoading,
  login,
  register,
  resetPassword,
  logout,
  clearError,
  initializeAuth
} = useAuth()

// Component state
const sampleNotifications = ref([
  {
    id: '1',
    title: 'Bem-vindo ao FinanceApp!',
    message: 'Explore todas as funcionalidades para gerenciar suas finanças.',
    read: false,
    createdAt: new Date().toISOString()
  },
  {
    id: '2',
    title: 'Backup de dados',
    message: 'Seus dados foram salvos com sucesso na nuvem.',
    read: true,
    createdAt: new Date(Date.now() - 3600000).toISOString()
  }
])

// Methods
const handleLoginSuccess = () => {
  console.log('✅ [AUTH_GUARD] Login realizado com sucesso')
  emit('auth-change', true)
}

const handleRegisterSuccess = () => {
  console.log('✅ [AUTH_GUARD] Registro realizado com sucesso')
  emit('auth-change', true)
}

const handleLoginAttempt = async (credentials: any) => {
  const success = await login(credentials)
  if (success) {
    handleLoginSuccess()
  }
}

const handleRegisterAttempt = async (credentials: any) => {
  const success = await register(credentials)
  if (success) {
    handleRegisterSuccess()
  }
}

const handlePasswordReset = async (email: string) => {
  await resetPassword({ email })
}

const handleClearError = () => {
  clearError()
}

const handleLogout = async () => {
  const success = await logout()
  if (success) {
    emit('auth-change', false)
  }
}

const handleRetry = async () => {
  clearError()
  await initializeAuth()
}

const handleProfile = () => {
  emit('user-profile')
}

const handleSettings = () => {
  emit('user-settings')
}

const handleNotificationRead = (id: string) => {
  const notification = sampleNotifications.value.find(n => n.id === id)
  if (notification) {
    notification.read = true
  }
}

const handleNotificationsReadAll = () => {
  sampleNotifications.value.forEach(n => n.read = true)
}

const handleNotificationsViewAll = () => {
  console.log('📱 Visualizar todas as notificações')
}

// Click outside handling removed - now handled by UserHeader

// Lifecycle
onMounted(async () => {
  // Initialize auth system
  await initializeAuth()

  // Initial auth check
  if (props.requireAuth && !isAuthenticated.value && authStatus.value !== 'loading') {
    console.log('🔒 [AUTH_GUARD] Autenticação necessária')
  }
})
</script>

<style scoped>
.auth-guard {
  @apply relative;
}

/* Loading animations */
.loading-screen .fas.fa-spinner {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }

  to {
    transform: rotate(360deg);
  }
}

/* User menu animations */
.user-menu {
  animation: menuFadeIn 0.2s ease-out;
}

@keyframes menuFadeIn {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Smooth transitions */
.auth-guard button {
  @apply transition-all duration-200;
}

/* Focus improvements */
.auth-guard button:focus {
  @apply ring-2 ring-blue-500 ring-offset-1;
}

/* Responsive improvements */
@media (max-width: 640px) {
  .user-header {
    @apply px-2;
  }

  .user-menu {
    @apply right-2;
  }
}
</style>
