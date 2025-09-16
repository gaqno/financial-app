import { supabase } from '../../lib/supabase';
import type { IPasswordResetRequest, IPasswordUpdate } from '../../types/auth';
import { useAuthState } from './useAuthState';
import { formatAuthError, createAuthLogger } from '../../utils/authHelpers';
import { useToast } from '../useToast';

const logger = createAuthLogger('AUTH_PASSWORD');

export function useAuthPassword() {
  const { setLoading, setError } = useAuthState();
  const { error: showErrorToast, success: showSuccessToast } = useToast();

  const resetPassword = async (request: IPasswordResetRequest): Promise<boolean> => {
    try {
      setLoading(true);
      setError(null);

      const { error: authError } = await supabase.auth.resetPasswordForEmail(request.email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (authError) {
        const formattedError = formatAuthError(authError);
        showErrorToast(formattedError.message, {
          title: 'Erro na Recuperação',
          duration: 5000,
        });
        return false;
      }

      logger.success('Email de recuperação enviado para:', request.email);
      showSuccessToast('Email de recuperação enviado! Verifique sua caixa de entrada.', {
        title: 'Email Enviado',
        duration: 4000,
      });
      return true;
    } catch (err) {
      const formattedError = formatAuthError(err as Error);
      showErrorToast(formattedError.message, {
        title: 'Erro na Recuperação',
        duration: 5000,
      });
      return false;
    } finally {
      setLoading(false);
    }
  };

  const updatePassword = async (passwordUpdate: IPasswordUpdate): Promise<boolean> => {
    try {
      if (passwordUpdate.password !== passwordUpdate.confirmPassword) {
        showErrorToast('As senhas não coincidem', {
          title: 'Erro de Validação',
        });
        return false;
      }

      setLoading(true);
      setError(null);

      const { error: authError } = await supabase.auth.updateUser({
        password: passwordUpdate.password,
      });

      if (authError) {
        const formattedError = formatAuthError(authError);
        showErrorToast(formattedError.message, {
          title: 'Erro ao Atualizar Senha',
          duration: 5000,
        });
        return false;
      }

      logger.success('Senha atualizada com sucesso');
      showSuccessToast('Senha atualizada com sucesso!', {
        title: 'Sucesso',
        duration: 3000,
      });
      return true;
    } catch (err) {
      const formattedError = formatAuthError(err as Error);
      showErrorToast(formattedError.message, {
        title: 'Erro ao Atualizar Senha',
        duration: 5000,
      });
      return false;
    } finally {
      setLoading(false);
    }
  };

  return {
    resetPassword,
    updatePassword,
  };
}
