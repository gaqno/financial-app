<template>
  <div
    class="profile-page min-h-screen bg-gradient-to-br from-pink-50 to-rose-100 dark:from-slate-900 dark:to-slate-800"
  >
    <!-- Header -->
    <ProfileHeader
      :profile="profile"
      :is-editing="isEditing"
      @edit="startEditing"
      @save="updateProfile"
      @cancel="cancelEditing"
      @upload-avatar="uploadAvatar"
    />

    <!-- Navigation Tabs -->
    <div
      class="sticky top-0 z-30 bg-white/95 dark:bg-slate-800/95 backdrop-blur-sm border-b border-gray-200 dark:border-slate-600"
    >
      <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <nav class="flex space-x-8 overflow-x-auto" aria-label="Seções">
          <button
            v-for="section in sections"
            :key="section.id"
            @click="activeSection = section.id"
            :class="getSectionClasses(section.id)"
            class="py-4 px-2 text-sm font-medium whitespace-nowrap transition-colors duration-200"
          >
            <span class="mr-2">{{ section.icon }}</span>
            {{ section.label }}
          </button>
        </nav>
      </div>
    </div>

    <!-- Content -->
    <main class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <!-- Perfil Section -->
      <div v-show="activeSection === 'profile'">
        <ProfileEditor
          :profile="editingProfile"
          :is-editing="isEditing"
          :is-loading="isLoading"
          :has-changes="hasChanges"
          @update="updateEditingProfile"
          @save="updateProfile"
          @cancel="cancelEditing"
        />
      </div>

      <!-- Configurações Section -->
      <div v-show="activeSection === 'settings'">
        <SettingsPanel />
      </div>

      <!-- Segurança Section -->
      <div v-show="activeSection === 'security'">
        <SecurityPanel />
      </div>

      <!-- Dados Section -->
      <div v-show="activeSection === 'data'">
        <DataManagementPanel />
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
  import { ref, onMounted, watch } from 'vue';
  import type { ProfileSection } from '../../types/profile';
  import { useProfile } from '../../composables/profile/useProfile';
  import ProfileHeader from './components/ProfileHeader.vue';
  import ProfileEditor from './components/ProfileEditor.vue';
  import SettingsPanel from './components/SettingsPanel.vue';
  import SecurityPanel from './components/SecurityPanel.vue';
  import DataManagementPanel from './components/DataManagementPanel.vue';

  interface Props {
    initialSection?: ProfileSection;
  }

  const props = withDefaults(defineProps<Props>(), {
    initialSection: 'profile',
  });

  // Hooks
  const {
    profile,
    editingProfile,
    isLoading,
    isEditing,
    hasChanges,
    startEditing,
    cancelEditing,
    updateProfile,
    uploadAvatar,
  } = useProfile();

  // Estado local
  const activeSection = ref<ProfileSection>(props.initialSection);

  // Seções disponíveis
  const sections = [
    { id: 'profile', label: 'Perfil', icon: '👤' },
    { id: 'settings', label: 'Configurações', icon: '⚙️' },
    { id: 'security', label: 'Segurança', icon: '🔒' },
    { id: 'data', label: 'Dados', icon: '💾' },
  ] as const;

  // Métodos
  const getSectionClasses = (sectionId: ProfileSection) => {
    const isActive = activeSection.value === sectionId;
    return [
      'border-b-2 transition-colors duration-200',
      isActive
        ? 'border-pink-500 text-pink-600 dark:text-pink-400'
        : 'border-transparent text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-slate-300 hover:border-gray-300 dark:hover:border-slate-500',
    ];
  };

  const updateEditingProfile = (updates: any) => {
    Object.assign(editingProfile.value, updates);
  };

  // Watchers
  watch(
    () => props.initialSection,
    (newSection) => {
      activeSection.value = newSection;
    }
  );
</script>

<script lang="ts">
  export default {
    name: 'ProfilePage',
  };
</script>

<style scoped>
  .profile-page {
    @apply theme-transition;
  }

  /* Scroll suave para navegação horizontal */
  nav {
    scrollbar-width: none;
    -ms-overflow-style: none;
  }

  nav::-webkit-scrollbar {
    display: none;
  }
</style>
