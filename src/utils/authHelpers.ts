import type { User, AuthError } from '@supabase/supabase-js'
import type { IUser, IAuthError } from '../types/auth'

export const transformUser = (supabaseUser: User): IUser => ({
  id: supabaseUser.id,
  email: supabaseUser.email || '',
  fullName: supabaseUser.user_metadata?.full_name || '',
  avatarUrl: supabaseUser.user_metadata?.avatar_url || '',
  createdAt: supabaseUser.created_at,
  updatedAt: supabaseUser.updated_at || supabaseUser.created_at
})

export const formatAuthError = (authError: AuthError | Error | string): IAuthError => {
  if (typeof authError === 'string') {
    return { message: authError }
  }

  if ('message' in authError) {
    return {
      message: authError.message,
      code: 'code' in authError ? authError.code : undefined
    }
  }

  return { message: 'Erro desconhecido' }
}

export const createAuthLogger = (prefix: string) => ({
  success: (message: string, data?: any) =>
    console.log(`✅ [${prefix}] ${message}`, data || ''),

  error: (message: string, error?: any) =>
    console.error(`❌ [${prefix}] ${message}`, error || ''),

  info: (message: string, data?: any) =>
    console.log(`🔍 [${prefix}] ${message}`, data || ''),

  warn: (message: string, data?: any) =>
    console.warn(`⚠️ [${prefix}] ${message}`, data || '')
})
