import { supabase } from '../../lib/supabase'
import type { IPasswordResetRequest, IPasswordUpdate } from '../../types/auth'
import { useAuthState } from './useAuthState'
import { formatAuthError, createAuthLogger } from '../../utils/authHelpers'

const logger = createAuthLogger('AUTH_PASSWORD')

export function useAuthPassword() {
  const { setLoading, setError } = useAuthState()

  const resetPassword = async (request: IPasswordResetRequest): Promise<boolean> => {
    try {
      setLoading(true)
      setError(null)

      const { error: authError } = await supabase.auth.resetPasswordForEmail(
        request.email,
        {
          redirectTo: `${window.location.origin}/reset-password`
        }
      )

      if (authError) {
        setError(formatAuthError(authError))
        return false
      }

      logger.success('Email de recuperação enviado para:', request.email)
      return true
    } catch (err) {
      setError(formatAuthError(err as Error))
      return false
    } finally {
      setLoading(false)
    }
  }

  const updatePassword = async (passwordUpdate: IPasswordUpdate): Promise<boolean> => {
    try {
      if (passwordUpdate.password !== passwordUpdate.confirmPassword) {
        setError(formatAuthError('As senhas não coincidem'))
        return false
      }

      setLoading(true)
      setError(null)

      const { error: authError } = await supabase.auth.updateUser({
        password: passwordUpdate.password
      })

      if (authError) {
        setError(formatAuthError(authError))
        return false
      }

      logger.success('Senha atualizada com sucesso')
      return true
    } catch (err) {
      setError(formatAuthError(err as Error))
      return false
    } finally {
      setLoading(false)
    }
  }

  return {
    resetPassword,
    updatePassword
  }
}
