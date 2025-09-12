import { supabase } from '../../lib/supabase'
import type { ILoginCredentials, IRegisterCredentials } from '../../types/auth'
import { useAuthState } from './useAuthState'
import { transformUser, formatAuthError, createAuthLogger } from '../../utils/authHelpers'
import { useAuthProfile } from './useAuthProfile'

const logger = createAuthLogger('AUTH_ACTIONS')

export function useAuthActions() {
  const { setUser, setSession, setLoading, setError } = useAuthState()
  const { ensureProfile } = useAuthProfile()

  const clearError = () => {
    setError(null)
  }

  const login = async (credentials: ILoginCredentials): Promise<boolean> => {
    try {
      setLoading(true)
      clearError()

      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email: credentials.email,
        password: credentials.password
      })

      if (authError) {
        setError(formatAuthError(authError))
        return false
      }

      if (data.user) {
        const transformedUser = transformUser(data.user)
        setUser(transformedUser)
        setSession(data.session)

        // Criar ou atualizar perfil do usuário
        await ensureProfile(data.user)

        logger.success('Login realizado com sucesso:', transformedUser.email)
        return true
      }

      return false
    } catch (err) {
      setError(formatAuthError(err as Error))
      return false
    } finally {
      setLoading(false)
    }
  }

  const register = async (credentials: IRegisterCredentials): Promise<boolean> => {
    try {
      setLoading(true)
      clearError()

      const { data, error: authError } = await supabase.auth.signUp({
        email: credentials.email,
        password: credentials.password,
        options: {
          data: {
            full_name: credentials.fullName || ''
          }
        }
      })

      if (authError) {
        setError(formatAuthError(authError))
        return false
      }

      if (data.user) {
        logger.success('Usuário registrado:', data.user.email)

        // Se o usuário foi confirmado imediatamente
        if (data.user.email_confirmed_at) {
          const transformedUser = transformUser(data.user)
          setUser(transformedUser)
          setSession(data.session)
          await ensureProfile(data.user)
        }

        return true
      }

      return false
    } catch (err) {
      setError(formatAuthError(err as Error))
      return false
    } finally {
      setLoading(false)
    }
  }

  const logout = async (): Promise<boolean> => {
    try {
      setLoading(true)
      clearError()

      const { error: authError } = await supabase.auth.signOut()

      if (authError) {
        setError(formatAuthError(authError))
        return false
      }

      setUser(null)
      setSession(null)

      logger.success('Logout realizado com sucesso')
      return true
    } catch (err) {
      setError(formatAuthError(err as Error))
      return false
    } finally {
      setLoading(false)
    }
  }

  return {
    login,
    register,
    logout,
    clearError
  }
}
