import { ref, computed } from 'vue';
import type { ILoginCredentials, IRegisterCredentials } from '../../types/auth';

export function useLoginForm() {
  // Component state
  const isRegisterMode = ref(false);
  const showPassword = ref(false);

  // Form data
  const formData = ref({
    email: '',
    password: '',
    confirmPassword: '',
    fullName: '',
  });

  // Form validation
  const isFormValid = computed(() => {
    const { email, password, confirmPassword, fullName } = formData.value;

    // Verificações básicas para login e registro
    if (!email?.trim() || !password?.trim()) {
      return false;
    }

    if (isRegisterMode.value) {
      return !!(fullName?.trim() && password.length >= 6 && password === confirmPassword);
    }

    // Para login, apenas email e senha são necessários
    return true;
  });

  const passwordMismatch = computed(() => {
    return (
      isRegisterMode.value &&
      formData.value.confirmPassword &&
      formData.value.password !== formData.value.confirmPassword
    );
  });

  // Environment check
  const isDevelopment = computed(() => import.meta.env.DEV);

  // Form methods
  const resetForm = () => {
    formData.value = {
      email: '',
      password: '',
      confirmPassword: '',
      fullName: '',
    };
    showPassword.value = false;
  };

  const toggleMode = () => {
    isRegisterMode.value = !isRegisterMode.value;
    resetForm();
  };

  const fillDemoCredentials = () => {
    formData.value.email = 'demo@financeapp.com';
    formData.value.password = 'demo123';
    isRegisterMode.value = false;
  };

  const getLoginCredentials = (): ILoginCredentials => ({
    email: formData.value.email,
    password: formData.value.password,
  });

  const getRegisterCredentials = (): IRegisterCredentials => ({
    email: formData.value.email,
    password: formData.value.password,
    fullName: formData.value.fullName,
  });

  return {
    // State
    isRegisterMode,
    showPassword,
    formData,
    isDevelopment,

    // Computed
    isFormValid,
    passwordMismatch,

    // Methods
    resetForm,
    toggleMode,
    fillDemoCredentials,
    getLoginCredentials,
    getRegisterCredentials,
  };
}
