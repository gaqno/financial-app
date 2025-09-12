import { useAuthState } from './auth/useAuthState'
import { useAuthActions } from './auth/useAuthActions'
import { useAuthProfile } from './auth/useAuthProfile'
import { useAuthPassword } from './auth/useAuthPassword'
import { useAuthCore } from './auth/useAuthCore'

/**
 * Composable principal de autenticação
 * 
 * Facade que combina todos os módulos de autenticação em uma interface unificada.
 * Segue o padrão de arquitetura modular para facilitar manutenção e testes.
 */
export function useAuth() {
  // Estado reativo e computed properties
  const {
    user,
    session,
    isLoading,
    error,
    isAuthenticated,
    authStatus
  } = useAuthState()

  // Operações de autenticação básica
  const {
    login,
    register,
    logout,
    clearError
  } = useAuthActions()

  // Gestão de perfil
  const {
    updateProfile
  } = useAuthProfile()

  // Gestão de senhas
  const {
    resetPassword,
    updatePassword
  } = useAuthPassword()

  // Inicialização e lifecycle
  const {
    initializeAuth,
    cleanup
  } = useAuthCore()

  return {
    // Estado
    user,
    session,
    isLoading,
    isAuthenticated,
    authStatus,
    error,

    // Métodos de autenticação
    login,
    register,
    logout,

    // Gestão de perfil e senha
    updateProfile,
    resetPassword,
    updatePassword,

    // Utilitários
    clearError,
    initializeAuth,
    cleanup
  }
}
