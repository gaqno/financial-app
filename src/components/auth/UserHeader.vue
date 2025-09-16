<template>
  <div
    class="user-header bg-white dark:bg-slate-800 border-b border-gray-200 dark:border-slate-600 px-4 py-3 shadow-sm fixed top-0 left-0 right-0 w-full z-50 theme-transition"
  >
    <div class="max-w-7xl mx-auto flex items-center justify-between">
      <!-- Left Side - User Info -->
      <div class="flex items-center space-x-4">
        <UserInfo :user="user" :show-details="true" :show-role="false" avatar-size="md" />

        <!-- Additional Info (optional) -->
        <div v-if="showStats" class="hidden md:flex items-center space-x-4 ml-6">
          <div class="text-xs text-gray-500">
            <i class="fas fa-clock mr-1"></i>
            Último acesso: {{ lastLoginFormatted }}
          </div>
        </div>
      </div>

      <!-- Right Side - Actions -->
      <div class="flex items-center space-x-3">
        <!-- Dark Mode Toggle -->
        <DarkModeToggle />

        <!-- Notifications -->
        <NotificationBell
          v-if="showNotifications"
          :notifications="notifications"
          @mark-read="$emit('notification-read', $event)"
          @mark-all-read="$emit('notifications-read-all')"
          @view-all="$emit('notifications-view-all')"
        />

        <!-- User Menu -->
        <UserMenu @profile="handleProfile" @settings="handleSettings" @logout="handleLogout" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { computed } from 'vue';
  import UserInfo from './UserInfo.vue';
  import UserMenu from './UserMenu.vue';
  import NotificationBell from './NotificationBell.vue';
  import DarkModeToggle from '../DarkModeToggle.vue';
  import type { IUser } from '../../types/auth';

  interface Notification {
    id: string;
    title: string;
    message: string;
    read: boolean;
    createdAt: string;
  }

  interface Props {
    user?: IUser | null;
    showStats?: boolean;
    showNotifications?: boolean;
    notifications?: Notification[];
  }

  interface Emits {
    profile: [];
    settings: [];
    logout: [];
    'notification-read': [id: string];
    'notifications-read-all': [];
    'notifications-view-all': [];
  }

  const props = withDefaults(defineProps<Props>(), {
    showStats: false,
    showNotifications: false,
    notifications: () => [],
  });

  const emit = defineEmits<Emits>();

  const lastLoginFormatted = computed(() => {
    if (!props.user?.updatedAt) return 'Nunca';

    const date = new Date(props.user.updatedAt);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) return 'Hoje';
    if (days === 1) return 'Ontem';
    if (days < 7) return `${days} dias atrás`;

    return date.toLocaleDateString('pt-BR');
  });

  const handleProfile = () => {
    emit('profile');
  };

  const handleSettings = () => {
    emit('settings');
  };

  const handleLogout = () => {
    emit('logout');
  };
</script>
