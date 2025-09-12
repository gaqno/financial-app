<template>
  <div class="relative">
    <!-- Notification Bell -->
    <button @click="toggleNotifications" class="notification-btn" :class="{ 'active': hasUnread }">
      <i class="fas fa-bell"></i>

      <!-- Notification Badge -->
      <span v-if="count > 0" class="notification-badge">
        {{ count > 99 ? '99+' : count }}
      </span>
    </button>

    <!-- Notifications Dropdown -->
    <Transition enter-active-class="transition ease-out duration-200"
      enter-from-class="transform opacity-0 scale-95 translate-y-1"
      enter-to-class="transform opacity-100 scale-100 translate-y-0"
      leave-active-class="transition ease-in duration-150"
      leave-from-class="transform opacity-100 scale-100 translate-y-0"
      leave-to-class="transform opacity-0 scale-95 translate-y-1">
      <div v-if="isOpen" class="notifications-dropdown">
        <!-- Header -->
        <div class="dropdown-header">
          <h3 class="text-sm font-medium text-gray-900">Notificações</h3>
          <button v-if="hasUnread" @click="markAllAsRead" class="text-xs text-blue-600 hover:text-blue-800">
            Marcar todas como lidas
          </button>
        </div>

        <!-- Notifications List -->
        <div class="notifications-list">
          <div v-if="notifications.length === 0" class="no-notifications">
            <i class="fas fa-bell-slash text-gray-300 mb-2"></i>
            <p class="text-sm text-gray-500">Nenhuma notificação</p>
          </div>

          <div v-for="notification in notifications" :key="notification.id" class="notification-item"
            :class="{ 'unread': !notification.read }" @click="markAsRead(notification.id)">
            <div class="notification-content">
              <div class="notification-title">{{ notification.title }}</div>
              <div class="notification-message">{{ notification.message }}</div>
              <div class="notification-time">{{ formatTime(notification.createdAt) }}</div>
            </div>
            <div v-if="!notification.read" class="unread-dot"></div>
          </div>
        </div>

        <!-- Footer -->
        <div class="dropdown-footer">
          <button @click="viewAll" class="w-full text-center text-sm text-blue-600 hover:text-blue-800 py-2">
            Ver todas as notificações
          </button>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'

interface Notification {
  id: string
  title: string
  message: string
  read: boolean
  createdAt: string
}

interface Props {
  notifications?: Notification[]
}

interface Emits {
  'mark-read': [id: string]
  'mark-all-read': []
  'view-all': []
}

const props = withDefaults(defineProps<Props>(), {
  notifications: () => []
})

const emit = defineEmits<Emits>()

const isOpen = ref(false)

const count = computed(() =>
  props.notifications.filter(n => !n.read).length
)

const hasUnread = computed(() => count.value > 0)

const toggleNotifications = () => {
  isOpen.value = !isOpen.value
}

const markAsRead = (id: string) => {
  emit('mark-read', id)
}

const markAllAsRead = () => {
  emit('mark-all-read')
}

const viewAll = () => {
  isOpen.value = false
  emit('view-all')
}

const formatTime = (date: string) => {
  const now = new Date()
  const time = new Date(date)
  const diff = now.getTime() - time.getTime()
  const minutes = Math.floor(diff / (1000 * 60))
  const hours = Math.floor(diff / (1000 * 60 * 60))
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))

  if (minutes < 1) return 'Agora'
  if (minutes < 60) return `${minutes}min atrás`
  if (hours < 24) return `${hours}h atrás`
  if (days < 7) return `${days}d atrás`

  return time.toLocaleDateString('pt-BR')
}

// Close when clicking outside
const handleClickOutside = (event: Event) => {
  const target = event.target as HTMLElement
  if (!target.closest('.relative')) {
    isOpen.value = false
  }
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})
</script>

<style scoped>
.notification-btn {
  @apply relative text-gray-400 hover:text-gray-600 p-2 rounded-full hover:bg-gray-100 transition-colors;
}

.notification-btn.active {
  @apply text-blue-600;
}

.notification-badge {
  @apply absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-medium;
}

.notifications-dropdown {
  @apply absolute right-0 top-full mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 z-[60] max-h-96 overflow-hidden;
}

.dropdown-header {
  @apply flex items-center justify-between p-4 border-b border-gray-100;
}

.notifications-list {
  @apply max-h-64 overflow-y-auto;
}

.no-notifications {
  @apply flex flex-col items-center justify-center py-8 text-center;
}

.notification-item {
  @apply relative flex items-start p-4 hover:bg-gray-50 border-b border-gray-50 last:border-b-0 cursor-pointer;
}

.notification-item.unread {
  @apply bg-blue-50;
}

.notification-content {
  @apply flex-1 min-w-0;
}

.notification-title {
  @apply text-sm font-medium text-gray-900 truncate;
}

.notification-message {
  @apply text-sm text-gray-600 mt-1 line-clamp-2;
}

.notification-time {
  @apply text-xs text-gray-400 mt-1;
}

.unread-dot {
  @apply w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 mt-2;
}

.dropdown-footer {
  @apply border-t border-gray-100;
}
</style>
