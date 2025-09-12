<template>
  <div class="text-center mb-8">
    <div class="w-16 h-16 mx-auto mb-4 bg-blue-100 rounded-full flex items-center justify-center">
      <i class="fas fa-wallet text-blue-600 text-2xl"></i>
    </div>
    <h1 class="text-2xl font-bold text-gray-900 mb-2">
      Bem-vindo ao FinanceApp
    </h1>
    <p class="text-gray-600">
      {{ isRegisterMode ? 'Crie sua conta' : 'Entre na sua conta' }}
    </p>
  </div>
</template>

<script setup lang="ts">
interface Props {
  isRegisterMode: boolean
}

defineProps<Props>()
</script>
