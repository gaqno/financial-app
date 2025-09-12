import type { User } from '@supabase/supabase-js'
import { supabase } from '../../lib/supabase'
import type { IProfileUpdate } from '../../types/auth'
import { useAuthState } from './useAuthState'
import { formatAuthError, createAuthLogger } from '../../utils/authHelpers'

const logger = createAuthLogger('AUTH_PROFILE')

export function useAuthProfile() {
  const { user, setUser, setError, setLoading } = useAuthState()

  const ensureProfile = async (supabaseUser: User) => {
    try {
      // Verificar se o perfil já existe
      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', supabaseUser.id)
        .single()

      if (!existingProfile) {
        // Criar novo perfil
        const { error: insertError } = await supabase
          .from('profiles')
          .insert({
            id: supabaseUser.id,
            email: supabaseUser.email || '',
            full_name: supabaseUser.user_metadata?.full_name || '',
            avatar_url: supabaseUser.user_metadata?.avatar_url || '',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })

        if (insertError) {
          logger.error('Erro ao criar perfil:', insertError)
        } else {
          logger.success('Perfil criado com sucesso')
        }
      }
    } catch (err) {
      logger.error('Erro ao gerenciar perfil:', err)
    }
  }

  const updateProfile = async (profileUpdate: IProfileUpdate): Promise<boolean> => {
    try {
      setLoading(true)
      setError(null)

      const { error: authError } = await supabase.auth.updateUser({
        data: {
          full_name: profileUpdate.fullName,
          avatar_url: profileUpdate.avatarUrl
        }
      })

      if (authError) {
        setError(formatAuthError(authError))
        return false
      }

      // Atualizar também na tabela profiles
      if (user.value) {
        const { error: profileError } = await supabase
          .from('profiles')
          .update({
            full_name: profileUpdate.fullName,
            avatar_url: profileUpdate.avatarUrl,
            updated_at: new Date().toISOString()
          })
          .eq('id', user.value.id)

        if (profileError) {
          setError(formatAuthError(profileError))
          return false
        }

        // Atualizar estado local
        setUser({
          ...user.value,
          fullName: profileUpdate.fullName || user.value.fullName,
          avatarUrl: profileUpdate.avatarUrl || user.value.avatarUrl,
          updatedAt: new Date().toISOString()
        })
      }

      logger.success('Perfil atualizado com sucesso')
      return true
    } catch (err) {
      setError(formatAuthError(err as Error))
      return false
    } finally {
      setLoading(false)
    }
  }

  return {
    ensureProfile,
    updateProfile
  }
}
