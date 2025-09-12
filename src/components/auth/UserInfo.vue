<template>
  <div class="flex items-center space-x-3">
    <UserAvatar :avatar-url="user?.avatarUrl" :full-name="user?.fullName" :size="avatarSize" />

    <div v-if="showDetails" class="min-w-0 flex-1">
      <div class="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
        {{ displayName }}
      </div>
      <div v-if="user?.email" class="text-xs text-gray-500 dark:text-gray-400 truncate">
        {{ user.email }}
      </div>
      <div v-if="showRole && userRole" class="text-xs text-blue-600 dark:text-blue-400 truncate">
        {{ userRole }}
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import UserAvatar from './UserAvatar.vue'
import type { IUser } from '../../types/auth'

interface Props {
  user?: IUser | null
  showDetails?: boolean
  showRole?: boolean
  avatarSize?: 'sm' | 'md' | 'lg' | 'xl'
}

const props = withDefaults(defineProps<Props>(), {
  showDetails: true,
  showRole: false,
  avatarSize: 'md'
})

const displayName = computed(() => {
  if (!props.user) return 'Usuário'
  return props.user.fullName || props.user.email || 'Usuário'
})

const userRole = computed(() => {
  // Could be extended to get role from user metadata
  return 'Usuário'
})
</script>
