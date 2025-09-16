import { ref, computed } from 'vue';
import type { IUserProfile } from '../../types/profile';
import { useAuth } from '../useAuth';
import { useToast } from '../useToast';

export function useProfile() {
  const { user } = useAuth();
  const { success: showSuccess, error: showError } = useToast();

  // Estado do perfil
  const isLoading = ref(false);
  const isEditing = ref(false);

  // Dados do perfil baseados no usuário autenticado
  const profile = ref<IUserProfile>({
    id: user.value?.id || '',
    fullName: user.value?.fullName || '',
    email: user.value?.email || '',
    avatarUrl: user.value?.avatarUrl || '',
    phone: '',
    bio: '',
    location: '',
    currency: 'BRL',
    language: 'pt-BR',
    timezone: 'America/Sao_Paulo',
    createdAt: user.value?.createdAt || new Date().toISOString(),
    updatedAt: user.value?.updatedAt || new Date().toISOString(),
  });

  // Dados temporários para edição
  const editingProfile = ref<IUserProfile>({ ...profile.value });

  // Computed
  const hasChanges = computed(() => {
    return JSON.stringify(profile.value) !== JSON.stringify(editingProfile.value);
  });

  const isProfileComplete = computed(() => {
    return !!(profile.value.fullName && profile.value.email);
  });

  const initials = computed(() => {
    const name = profile.value.fullName || profile.value.email || 'U';
    return name
      .split(' ')
      .slice(0, 2)
      .map((n) => n[0])
      .join('')
      .toUpperCase();
  });

  // Métodos
  const startEditing = () => {
    editingProfile.value = { ...profile.value };
    isEditing.value = true;
  };

  const cancelEditing = () => {
    editingProfile.value = { ...profile.value };
    isEditing.value = false;
  };

  const updateProfile = async (): Promise<boolean> => {
    try {
      isLoading.value = true;

      // TODO: Implementar chamada real para API
      // const updatedProfile = await profileService.update(editingProfile.value)

      // Simular delay da API
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Mock: Atualizar dados localmente
      profile.value = { ...editingProfile.value };
      profile.value.updatedAt = new Date().toISOString();

      isEditing.value = false;

      showSuccess('Perfil atualizado com sucesso!', {
        title: '✅ Sucesso',
      });

      return true;
    } catch (error) {
      console.error('Erro ao atualizar perfil:', error);
      showError('Erro ao atualizar perfil. Tente novamente.', {
        title: '❌ Erro',
      });
      return false;
    } finally {
      isLoading.value = false;
    }
  };

  const uploadAvatar = async (file: File): Promise<boolean> => {
    try {
      isLoading.value = true;

      // TODO: Implementar upload real de avatar
      // const avatarUrl = await profileService.uploadAvatar(file)

      // Simular upload
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Mock: Criar URL fictícia
      const mockAvatarUrl = URL.createObjectURL(file);
      editingProfile.value.avatarUrl = mockAvatarUrl;

      showSuccess('Foto de perfil atualizada!', {
        title: '📸 Sucesso',
      });

      return true;
    } catch (error) {
      console.error('Erro ao fazer upload do avatar:', error);
      showError('Erro ao atualizar foto. Tente novamente.', {
        title: '❌ Erro',
      });
      return false;
    } finally {
      isLoading.value = false;
    }
  };

  const removeAvatar = () => {
    editingProfile.value.avatarUrl = '';
  };

  const validateProfile = (): { isValid: boolean; errors: string[] } => {
    const errors: string[] = [];

    if (!editingProfile.value.fullName?.trim()) {
      errors.push('Nome é obrigatório');
    }

    if (!editingProfile.value.email?.trim()) {
      errors.push('Email é obrigatório');
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(editingProfile.value.email)) {
      errors.push('Email inválido');
    }

    if (editingProfile.value.phone && !/^\(\d{2}\)\s\d{4,5}-\d{4}$/.test(editingProfile.value.phone)) {
      errors.push('Telefone deve estar no formato (00) 00000-0000');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  };

  const formatPhoneNumber = (value: string): string => {
    // Remove tudo que não é dígito
    const numbers = value.replace(/\D/g, '');

    // Formata para (00) 00000-0000 ou (00) 0000-0000
    if (numbers.length <= 10) {
      return numbers.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
    } else {
      return numbers.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
    }
  };

  return {
    // Estado
    profile,
    editingProfile,
    isLoading,
    isEditing,

    // Computed
    hasChanges,
    isProfileComplete,
    initials,

    // Métodos
    startEditing,
    cancelEditing,
    updateProfile,
    uploadAvatar,
    removeAvatar,
    validateProfile,
    formatPhoneNumber,
  };
}
