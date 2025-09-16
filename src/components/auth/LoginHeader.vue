<template>
  <div class="text-center mb-8">
    <div class="w-16 h-16 mx-auto mb-4 bg-pink-100 rounded-full flex items-center justify-center">
      <i class="fas fa-piggy-bank text-pink-600 text-2xl"></i>
    </div>
    <h1 class="text-2xl font-bold text-gray-900 mb-2">🐷 Bem-vindo ao por.quinho</h1>
    <p class="text-gray-600 text-sm italic">"De pouco em pouco se enche o porquinho"</p>
    <p class="text-gray-500 text-sm mt-2">
      {{ isRegisterMode ? 'Crie sua conta para começar' : 'Entre na sua conta' }}
    </p>
  </div>
</template>

<script setup lang="ts">
  interface Props {
    isRegisterMode: boolean;
  }

  defineProps<Props>();
</script>
