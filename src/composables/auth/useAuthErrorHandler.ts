import { useToast } from '../useToast'
import { useAuthActions } from './useAuthActions'
import { createAuthLogger } from '../../utils/authHelpers'

const logger = createAuthLogger('AUTH_ERROR_HANDLER')

/**
 * Composable para tratamento inteligente de erros de autenticação
 * 
 * Detecta automaticamente erros de sessão expirada/inválida e 
 * toma ações apropriadas para manter a UX consistente
 */
export function useAuthErrorHandler() {
  const { success: showSuccessToast, warning: showWarningToast } = useToast()
  const { forceLogout } = useAuthActions()

  /**
   * Verifica se um erro é relacionado a sessão inválida/expirada
   */
  const isSessionError = (error: any): boolean => {
    if (!error) return false

    const errorMessage = typeof error === 'string' ? error : error.message || ''

    const sessionErrorPatterns = [
      'session_not_found',
      'Session from session_id claim in JWT does not exist',
      'invalid_token',
      'jwt_expired',
      'refresh_token_not_found',
      'invalid_refresh_token',
      'token_expired',
      'session_expired'
    ]

    return sessionErrorPatterns.some(pattern =>
      errorMessage.toLowerCase().includes(pattern.toLowerCase())
    )
  }

  /**
   * Verifica se um erro é de rede/conectividade
   */
  const isNetworkError = (error: any): boolean => {
    if (!error) return false

    const errorMessage = typeof error === 'string' ? error : error.message || ''

    const networkErrorPatterns = [
      'network error',
      'fetch failed',
      'failed to fetch',
      'connection refused',
      'timeout',
      'no internet',
      'offline'
    ]

    return networkErrorPatterns.some(pattern =>
      errorMessage.toLowerCase().includes(pattern.toLowerCase())
    )
  }

  /**
   * Trata automaticamente erros de sessão
   */
  const handleSessionError = async (error: any, context: string = 'operação'): Promise<boolean> => {
    if (!isSessionError(error)) {
      return false // Não é um erro de sessão
    }

    logger.info(`Erro de sessão detectado durante ${context}:`, error)

    try {
      // Fazer logout forçado para limpar estado inconsistente
      const success = forceLogout()

      if (success) {
        showWarningToast('Sua sessão expirou. Faça login novamente para continuar.', {
          title: 'Sessão Expirada',
          duration: 4000
        })

        logger.success('Estado local limpo após erro de sessão')
        return true
      }
    } catch (cleanupError) {
      logger.error('Erro ao limpar estado após erro de sessão:', cleanupError)
    }

    return false
  }

  /**
   * Wrapper para funções que podem ter erros de sessão
   */
  const withSessionErrorHandling = async <T>(
    operation: () => Promise<T>,
    context: string = 'operação'
  ): Promise<T | null> => {
    try {
      return await operation()
    } catch (error) {
      const wasSessionError = await handleSessionError(error, context)

      if (!wasSessionError && !isNetworkError(error)) {
        // Re-throw erro se não for de sessão nem de rede
        throw error
      }

      if (isNetworkError(error)) {
        logger.warn(`Erro de rede durante ${context}:`, error)
        showWarningToast('Problema de conexão. Verifique sua internet e tente novamente.', {
          title: 'Erro de Conexão',
          duration: 3000
        })
      }

      return null
    }
  }

  /**
   * Monitora e trata erros globais do Supabase
   */
  const setupGlobalErrorHandler = () => {
    // Interceptar erros não tratados que podem ser de sessão
    const originalConsoleError = console.error
    console.error = (...args) => {
      const errorArg = args.find(arg =>
        typeof arg === 'string' || (arg && typeof arg.message === 'string')
      )

      if (errorArg && isSessionError(errorArg)) {
        handleSessionError(errorArg, 'erro global')
      }

      originalConsoleError.apply(console, args)
    }

    logger.info('Handler global de erros de sessão configurado')
  }

  return {
    isSessionError,
    isNetworkError,
    handleSessionError,
    withSessionErrorHandling,
    setupGlobalErrorHandler
  }
}
