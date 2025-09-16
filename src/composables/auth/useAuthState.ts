import { ref, computed } from 'vue';
import type { Session } from '@supabase/supabase-js';
import type { IUser, IAuthError, AuthStatus } from '../../types/auth';

// Estado global reativo
export const user = ref<IUser | null>(null);
export const session = ref<Session | null>(null);
export const isLoading = ref(true);
export const error = ref<IAuthError | null>(null);

// Controle singleton HMR-safe
export let authListener: any = null;
export let isInitialized = false;

export function useAuthState() {
  // Estado computado
  const isAuthenticated = computed(() => !!user.value);

  const authStatus = computed<AuthStatus>(() => {
    if (isLoading.value) return 'loading';
    if (error.value) return 'error';
    if (isAuthenticated.value) return 'authenticated';
    return 'unauthenticated';
  });

  // Setters para controle interno
  const setUser = (newUser: IUser | null) => {
    user.value = newUser;
  };

  const setSession = (newSession: Session | null) => {
    session.value = newSession;
  };

  const setLoading = (loading: boolean) => {
    isLoading.value = loading;
  };

  const setError = (newError: IAuthError | null) => {
    error.value = newError;
  };

  const setAuthListener = (listener: any) => {
    authListener = listener;
  };

  const setInitialized = (initialized: boolean) => {
    isInitialized = initialized;
  };

  return {
    // Estado reativo
    user: computed(() => user.value),
    session: computed(() => session.value),
    isLoading: computed(() => isLoading.value),
    error: computed(() => error.value),
    isAuthenticated,
    authStatus,

    // Controle interno
    setUser,
    setSession,
    setLoading,
    setError,
    setAuthListener,
    setInitialized,

    // Estado singleton
    getAuthListener: () => authListener,
    getIsInitialized: () => isInitialized,
  };
}
