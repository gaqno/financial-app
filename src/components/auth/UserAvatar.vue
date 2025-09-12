<template>
  <div :class="avatarClass">
    <img v-if="avatarUrl" :src="avatarUrl" :alt="fullName || 'Avatar'"
      class="w-full h-full rounded-full object-cover" />
    <i v-else :class="`fas fa-user ${iconClass}`"></i>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  avatarUrl?: string
  fullName?: string
  size?: 'sm' | 'md' | 'lg' | 'xl'
}

const props = withDefaults(defineProps<Props>(), {
  size: 'md'
})

const avatarClass = computed(() => {
  const baseClass = 'bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0'
  const sizeClasses = {
    sm: 'w-6 h-6',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
    xl: 'w-16 h-16'
  }
  return `${baseClass} ${sizeClasses[props.size]}`
})

const iconClass = computed(() => {
  const sizeClasses = {
    sm: 'text-blue-600 text-xs',
    md: 'text-blue-600 text-sm',
    lg: 'text-blue-600 text-base',
    xl: 'text-blue-600 text-xl'
  }
  return sizeClasses[props.size]
})
</script>
