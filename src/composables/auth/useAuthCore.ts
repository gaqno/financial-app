import { onMounted, onUnmounted } from 'vue'
import { supabase } from '../../lib/supabase'
import { useAuthState } from './useAuthState'
import { useAuthProfile } from './useAuthProfile'
import { transformUser, formatAuthError, createAuthLogger } from '../../utils/authHelpers'

const logger = createAuthLogger('AUTH_CORE')

export function useAuthCore() {
  const {
    setUser,
    setSession,
    setLoading,
    setError,
    setAuthListener,
    setInitialized,
    getAuthListener,
    getIsInitialized
  } = useAuthState()

  const { ensureProfile } = useAuthProfile()

  const initializeAuth = async () => {
    if (getIsInitialized()) {
      logger.warn('Sistema já inicializado')
      return
    }

    logger.info('Inicializando sistema de autenticação...')
    setInitialized(true)

    // Verificar configuração do Supabase
    const hasUrl = !!import.meta.env.VITE_SUPABASE_URL
    const hasKey = !!import.meta.env.VITE_SUPABASE_ANON_KEY
    logger.info('Configuração verificada:', { hasUrl, hasKey, hasClient: !!supabase })

    try {
      // 1. Verificar sessão atual com timeout
      logger.info('Verificando sessão atual...')

      const sessionPromise = supabase.auth.getSession()
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Timeout na verificação de sessão')), 15000)
      })

      const { data: { session: currentSession }, error: sessionError } = await Promise.race([
        sessionPromise,
        timeoutPromise
      ]) as any

      logger.info('Sessão verificada:', { session: !!currentSession, user: !!currentSession?.user })

      if (sessionError) {
        logger.error('Erro ao obter sessão:', sessionError)
        setError(formatAuthError(sessionError))
      } else if (currentSession?.user) {
        logger.success('Sessão ativa encontrada:', currentSession.user.email)
        setUser(transformUser(currentSession.user))
        setSession(currentSession)
        await ensureProfile(currentSession.user)
      } else {
        logger.info('Nenhuma sessão ativa')
      }

      // 2. Configurar listener para mudanças futuras
      setupAuthListener()

    } catch (err) {
      logger.error('Erro na inicialização:', err)

      if (err instanceof Error && err.message.includes('Timeout')) {
        logger.warn('Timeout na verificação - continuando sem sessão')
      } else {
        setError(formatAuthError(err as Error))
      }

      // Mesmo com erro, tentar configurar listener
      setupAuthListener()
    } finally {
      logger.info('Inicialização concluída')
      setLoading(false)
    }
  }

  const setupAuthListener = () => {
    try {
      logger.info('Configurando listener...')
      const listener = supabase.auth.onAuthStateChange(async (event, newSession) => {
        logger.info(`${event}`, {
          hasUser: !!newSession?.user,
          email: newSession?.user?.email
        })

        switch (event) {
          case 'SIGNED_IN':
            if (newSession?.user) {
              setUser(transformUser(newSession.user))
              setSession(newSession)
              await ensureProfile(newSession.user)
            }
            break

          case 'SIGNED_OUT':
            setUser(null)
            setSession(null)
            break

          case 'TOKEN_REFRESHED':
          case 'USER_UPDATED':
            if (newSession?.user) {
              setUser(transformUser(newSession.user))
              setSession(newSession)
            }
            break
        }

        setError(null)
      })

      setAuthListener(listener)
      logger.success('Listener configurado com sucesso')
    } catch (listenerErr) {
      logger.error('Erro ao configurar listener:', listenerErr)
    }
  }

  const cleanup = () => {
    const listener = getAuthListener()
    if (listener) {
      listener.data.subscription.unsubscribe()
      setAuthListener(null)
      setInitialized(false)
    }
  }

  // Lifecycle
  // Lifecycle hooks removidos - inicialização manual
  // onMounted(initializeAuth) - removido para evitar inicializações duplicadas
  // onUnmounted removido - cleanup manual via cleanup() function

  return {
    initializeAuth,
    cleanup
  }
}
