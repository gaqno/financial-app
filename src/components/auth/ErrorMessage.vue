<template>
  <div v-if="error" class="error-message">
    <div class="flex items-center">
      <i class="fas fa-exclamation-triangle text-red-500 mr-2"></i>
      <span class="text-red-700 text-sm">{{ error.message }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { IAuthError } from '../../types/auth'

interface Props {
  error: IAuthError | null
}

defineProps<Props>()
</script>

<style scoped>
.error-message {
  @apply bg-red-50 border border-red-200 rounded-lg p-3;
}
</style>
