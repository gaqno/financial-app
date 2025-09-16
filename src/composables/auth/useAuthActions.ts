import { supabase } from '../../lib/supabase';
import type { ILoginCredentials, IRegisterCredentials } from '../../types/auth';
import { useAuthState } from './useAuthState';
import { transformUser, formatAuthError, createAuthLogger } from '../../utils/authHelpers';
import { useAuthProfile } from './useAuthProfile';
import { useToast } from '../useToast';

const logger = createAuthLogger('AUTH_ACTIONS');

export function useAuthActions() {
  const { setUser, setSession, setLoading, setError } = useAuthState();
  const { ensureProfile } = useAuthProfile();
  const { error: showErrorToast } = useToast();

  const clearError = () => {
    setError(null);
  };

  const login = async (credentials: ILoginCredentials): Promise<boolean> => {
    try {
      setLoading(true);
      clearError();

      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email: credentials.email,
        password: credentials.password,
      });

      if (authError) {
        const formattedError = formatAuthError(authError);
        showErrorToast(formattedError.message, {
          title: 'Erro no Login',
          duration: 5000,
        });
        return false;
      }

      if (data.user) {
        const transformedUser = transformUser(data.user);
        setUser(transformedUser);
        setSession(data.session);

        // Criar ou atualizar perfil do usuário
        await ensureProfile(data.user);

        logger.success('Login realizado com sucesso:', transformedUser.email);
        return true;
      }

      return false;
    } catch (err) {
      const formattedError = formatAuthError(err as Error);
      showErrorToast(formattedError.message, {
        title: 'Erro no Login',
        duration: 5000,
      });
      return false;
    } finally {
      setLoading(false);
    }
  };

  const register = async (credentials: IRegisterCredentials): Promise<boolean> => {
    try {
      setLoading(true);
      clearError();

      const { data, error: authError } = await supabase.auth.signUp({
        email: credentials.email,
        password: credentials.password,
        options: {
          data: {
            full_name: credentials.fullName || '',
          },
        },
      });

      if (authError) {
        const formattedError = formatAuthError(authError);
        showErrorToast(formattedError.message, {
          title: 'Erro no Registro',
          duration: 5000,
        });
        return false;
      }

      if (data.user) {
        logger.success('Usuário registrado:', data.user.email);

        // Se o usuário foi confirmado imediatamente
        if (data.user.email_confirmed_at) {
          const transformedUser = transformUser(data.user);
          setUser(transformedUser);
          setSession(data.session);
          await ensureProfile(data.user);
        }

        return true;
      }

      return false;
    } catch (err) {
      const formattedError = formatAuthError(err as Error);
      showErrorToast(formattedError.message, {
        title: 'Erro no Registro',
        duration: 5000,
      });
      return false;
    } finally {
      setLoading(false);
    }
  };

  const logout = async (): Promise<boolean> => {
    try {
      setLoading(true);
      clearError();

      const { error: authError } = await supabase.auth.signOut();

      // Se o erro for "session_not_found", considerar como sucesso
      // pois significa que já não há sessão ativa
      if (authError) {
        const isSessionNotFound =
          authError.message?.includes('session_not_found') ||
          authError.message?.includes('Session from session_id claim in JWT does not exist');

        if (isSessionNotFound) {
          logger.info('Sessão já não existe no servidor - limpando estado local');
        } else {
          // Erro real - mostrar toast
          const formattedError = formatAuthError(authError);
          showErrorToast(formattedError.message, {
            title: 'Erro no Logout',
            duration: 5000,
          });

          // Mesmo com erro, limpar estado local para evitar inconsistências
          setUser(null);
          setSession(null);

          logger.warn('Erro no logout, mas estado local foi limpo:', authError.message);
          return false;
        }
      }

      // Sempre limpar estado local
      setUser(null);
      setSession(null);

      logger.success('Logout realizado com sucesso');
      return true;
    } catch (err) {
      // Para qualquer erro de rede ou exceção, sempre limpar estado local
      const formattedError = formatAuthError(err as Error);
      const errorMessage = formattedError.message;

      const isSessionError =
        errorMessage?.includes('session_not_found') ||
        errorMessage?.includes('Session from session_id claim in JWT does not exist');

      if (!isSessionError) {
        showErrorToast(errorMessage, {
          title: 'Erro no Logout',
          duration: 5000,
        });
      }

      // Sempre limpar estado local em qualquer caso
      setUser(null);
      setSession(null);

      logger.info('Estado local limpo após erro de logout');
      return true; // Retornar true pois o objetivo (não ter sessão) foi alcançado
    } finally {
      setLoading(false);
    }
  };

  const forceLogout = () => {
    try {
      setLoading(true);
      clearError();

      // Limpar estado local imediatamente sem chamar o servidor
      setUser(null);
      setSession(null);

      logger.success('Logout forçado realizado - estado local limpo');
      return true;
    } catch (err) {
      logger.error('Erro no logout forçado:', err);
      return false;
    } finally {
      setLoading(false);
    }
  };

  return {
    login,
    register,
    logout,
    forceLogout,
    clearError,
  };
}
