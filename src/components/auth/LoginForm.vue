<template>
  <div class="login-form">
    <div class="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md">
      <!-- Header -->
      <LoginHeader :is-register-mode="isRegisterMode" />

      <!-- Form -->
      <form @submit.prevent="handleSubmit" class="space-y-6">
        <!-- Form Fields -->
        <FormFields
          :form-data="formData"
          :is-register-mode="isRegisterMode"
          :show-password="showPassword"
          :password-mismatch="passwordMismatch"
          :is-loading="isLoading"
          @toggle-password="showPassword = !showPassword"
        />

        <!-- Error messages are now shown via toast -->

        <!-- Form Actions -->
        <FormActions
          :is-register-mode="isRegisterMode"
          :is-form-valid="isFormValid"
          :is-loading="isLoading"
          @toggle-mode="handleToggleMode"
          @forgot-password="handleForgotPassword"
        />
      </form>

      <!-- Demo Credentials -->
      <DemoCredentials @fill-demo="fillDemoCredentials" />
    </div>

    <!-- Toast Container -->
    <ToastContainer />
  </div>
</template>

<script setup lang="ts">
  import { onMounted } from 'vue';
  import { useToast } from '../../composables/useToast';
  import LoginHeader from './LoginHeader.vue';
  import FormFields from './FormFields.vue';
  import FormActions from './FormActions.vue';
  import DemoCredentials from './DemoCredentials.vue';
  import ToastContainer from '../ToastContainer.vue';
  import { useAuth } from '../../composables/useAuth';
  import { useLoginForm } from '../../composables/auth/useLoginForm';

  interface Emits {
    'login-success': [];
    'register-success': [];
  }

  const emit = defineEmits<Emits>();

  // Composables
  const { login, register, resetPassword, isLoading, clearError } = useAuth();
  const { success: showSuccessToast, error: showErrorToast } = useToast();
  const {
    isRegisterMode,
    showPassword,
    formData,
    isFormValid,
    passwordMismatch,
    resetForm,
    toggleMode,
    fillDemoCredentials,
    getLoginCredentials,
    getRegisterCredentials,
  } = useLoginForm();

  // Event handlers
  const handleSubmit = async () => {
    clearError?.();
    if (!isFormValid.value) return;

    try {
      if (isRegisterMode.value) {
        const success = await register(getRegisterCredentials());
        if (success) {
          emit('register-success');
          resetForm();
        }
      } else {
        const success = await login(getLoginCredentials());
        if (success) {
          emit('login-success');
          resetForm();
        }
      }
    } catch (err) {
      console.error('❌ [LOGIN_FORM] Erro no formulário:', err);
    }
  };

  const handleToggleMode = () => {
    toggleMode();
    clearError?.();
  };

  const handleForgotPassword = async () => {
    if (!formData.value.email) {
      showErrorToast('Por favor, digite seu email primeiro', {
        title: 'Email Necessário',
      });
      return;
    }

    clearError?.();

    try {
      const success = await resetPassword({ email: formData.value.email });
      if (success) {
        showSuccessToast('Email de recuperação enviado! Verifique sua caixa de entrada.', {
          title: 'Email Enviado',
          duration: 4000,
        });
      }
    } catch (err) {
      console.error('❌ [LOGIN_FORM] Erro ao enviar email de recuperação:', err);
    }
  };

  // Lifecycle
  onMounted(() => clearError?.());
</script>

<style scoped>
  .login-form {
    @apply min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4;
  }
</style>
