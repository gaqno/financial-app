<template>
  <header class="bg-gradient-to-r from-pink-500 to-rose-500 dark:from-pink-600 dark:to-rose-600 text-white">
    <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div class="flex flex-col sm:flex-row items-center sm:items-start gap-6">
        <!-- Avatar -->
        <div class="relative group">
          <div
            class="w-24 h-24 sm:w-32 sm:h-32 rounded-full overflow-hidden bg-white/20 dark:bg-white/30 flex items-center justify-center"
          >
            <img
              v-if="profile.avatarUrl"
              :src="profile.avatarUrl"
              :alt="profile.fullName"
              class="w-full h-full object-cover"
            />
            <div v-else class="text-3xl sm:text-4xl font-bold text-white">
              {{ initials }}
            </div>
          </div>

          <!-- Upload overlay (apenas quando editando) -->
          <div
            v-if="isEditing"
            class="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
            @click="triggerFileUpload"
          >
            <i class="fas fa-camera text-white text-xl"></i>
          </div>

          <!-- Botão de upload escondido -->
          <input ref="fileInput" type="file" accept="image/*" class="hidden" @change="handleFileUpload" />
        </div>

        <!-- Informações do usuário -->
        <div class="flex-1 text-center sm:text-left">
          <h1 class="text-2xl sm:text-3xl font-bold mb-2">
            {{ profile.fullName || 'Usuário' }}
          </h1>
          <p class="text-pink-100 text-lg mb-1">{{ profile.email }}</p>

          <!-- Informações adicionais -->
          <div class="flex flex-wrap justify-center sm:justify-start gap-4 text-sm text-pink-100 mt-3">
            <div v-if="profile.location" class="flex items-center gap-1">
              <i class="fas fa-map-marker-alt"></i>
              <span>{{ profile.location }}</span>
            </div>
            <div class="flex items-center gap-1">
              <i class="fas fa-calendar-alt"></i>
              <span>Desde {{ formatJoinDate(profile.createdAt) }}</span>
            </div>
            <div class="flex items-center gap-1">
              <i class="fas fa-coins"></i>
              <span>{{ getCurrentCurrency() }}</span>
            </div>
          </div>

          <!-- Bio -->
          <p v-if="profile.bio" class="text-pink-100 mt-3 text-sm max-w-md">
            {{ profile.bio }}
          </p>
        </div>

        <!-- Ações -->
        <div class="flex gap-3">
          <button
            v-if="!isEditing"
            @click="$emit('edit')"
            class="bg-white/20 dark:bg-white/25 hover:bg-white/30 dark:hover:bg-white/35 text-white px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
          >
            <i class="fas fa-edit"></i>
            <span class="hidden sm:inline">Editar</span>
          </button>

          <template v-else>
            <button
              @click="$emit('cancel')"
              class="bg-white/20 dark:bg-white/25 hover:bg-white/30 dark:hover:bg-white/35 text-white px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
            >
              <i class="fas fa-times"></i>
              <span class="hidden sm:inline">Cancelar</span>
            </button>
            <button
              @click="$emit('save')"
              class="bg-white dark:bg-gray-100 text-pink-600 dark:text-pink-700 hover:bg-pink-50 dark:hover:bg-gray-50 px-4 py-2 rounded-lg transition-colors flex items-center gap-2 font-medium"
            >
              <i class="fas fa-check"></i>
              <span class="hidden sm:inline">Salvar</span>
            </button>
          </template>
        </div>
      </div>

      <!-- Status badges -->
      <div class="flex flex-wrap justify-center sm:justify-start gap-2 mt-6">
        <span class="bg-white/20 dark:bg-white/30 text-white px-3 py-1 rounded-full text-xs font-medium">
          🐷 Usuário por.quinho
        </span>
        <span
          v-if="isProfileComplete"
          class="bg-green-500/80 dark:bg-green-600/90 text-white px-3 py-1 rounded-full text-xs font-medium"
        >
          ✅ Perfil Completo
        </span>
        <span
          v-else
          class="bg-yellow-500/80 dark:bg-yellow-600/90 text-white px-3 py-1 rounded-full text-xs font-medium"
        >
          ⚠️ Perfil Incompleto
        </span>
      </div>
    </div>
  </header>
</template>

<script setup lang="ts">
  import { ref, computed } from 'vue';
  import type { IUserProfile } from '../../../types/profile';

  interface Props {
    profile: IUserProfile;
    isEditing: boolean;
  }

  interface Emits {
    edit: [];
    save: [];
    cancel: [];
    'upload-avatar': [file: File];
  }

  const props = defineProps<Props>();
  const emit = defineEmits<Emits>();

  // Refs
  const fileInput = ref<HTMLInputElement>();

  // Computed
  const initials = computed(() => {
    const name = props.profile.fullName || props.profile.email || 'U';
    return name
      .split(' ')
      .slice(0, 2)
      .map((n) => n[0])
      .join('')
      .toUpperCase();
  });

  const isProfileComplete = computed(() => {
    return !!(props.profile.fullName && props.profile.email);
  });

  // Métodos
  const triggerFileUpload = () => {
    fileInput.value?.click();
  };

  const handleFileUpload = (event: Event) => {
    const target = event.target as HTMLInputElement;
    const file = target.files?.[0];

    if (file) {
      // Validar tipo de arquivo
      if (!file.type.startsWith('image/')) {
        alert('Por favor, selecione apenas imagens');
        return;
      }

      // Validar tamanho (máx 5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert('A imagem deve ter no máximo 5MB');
        return;
      }

      emit('upload-avatar', file);
    }
  };

  const formatJoinDate = (dateString: string): string => {
    try {
      const date = new Date(dateString);
      return new Intl.DateTimeFormat('pt-BR', {
        month: 'long',
        year: 'numeric',
      }).format(date);
    } catch {
      return 'Data inválida';
    }
  };

  const getCurrentCurrency = (): string => {
    const currencies = {
      BRL: 'Real (R$)',
      USD: 'Dólar ($)',
      EUR: 'Euro (€)',
    };
    return currencies[props.profile.currency as keyof typeof currencies] || props.profile.currency;
  };
</script>

<script lang="ts">
  export default {
    name: 'ProfileHeader',
  };
</script>

<style scoped>
  /* Animações para o overlay do avatar */
  .group:hover .opacity-0 {
    opacity: 1;
  }

  /* Transições suaves */
  .transition-colors {
    transition:
      color 0.2s ease,
      background-color 0.2s ease;
  }

  .transition-opacity {
    transition: opacity 0.2s ease;
  }
</style>
