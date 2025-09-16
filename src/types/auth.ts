export interface IUser {
  id: string;
  email: string;
  fullName?: string;
  avatarUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ILoginCredentials {
  email: string;
  password: string;
}

export interface IRegisterCredentials {
  email: string;
  password: string;
  fullName?: string;
}

export interface IAuthError {
  message: string;
  code?: string;
}

export interface IAuthState {
  user: IUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  error: IAuthError | null;
}

export interface IPasswordResetRequest {
  email: string;
}

export interface IPasswordUpdate {
  password: string;
  confirmPassword: string;
}

export interface IProfileUpdate {
  fullName?: string;
  avatarUrl?: string;
}

// Estados de autenticação
export type AuthStatus = 'authenticated' | 'unauthenticated' | 'loading' | 'error';

// Eventos de autenticação
export type AuthEvent = 'SIGNED_IN' | 'SIGNED_OUT' | 'TOKEN_REFRESHED' | 'USER_UPDATED' | 'PASSWORD_RECOVERY';
