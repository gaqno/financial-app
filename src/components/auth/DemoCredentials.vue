<template>
  <div v-if="isDevelopment" class="demo-credentials">
    <h4 class="text-sm font-medium text-gray-700 mb-2">
      <i class="fas fa-code mr-1"></i>
      Credenciais de Demonstração
    </h4>
    <div class="text-xs text-gray-600 space-y-1">
      <div>
        <strong>Email:</strong>
        demo@financeapp.com
      </div>
      <div>
        <strong>Senha:</strong>
        demo123
      </div>
    </div>
    <button @click="fillDemo" class="mt-2 text-xs bg-gray-200 hover:bg-gray-300 px-2 py-1 rounded transition-colors">
      Usar credenciais demo
    </button>
  </div>
</template>

<script setup lang="ts">
  interface Emits {
    'fill-demo': [];
  }

  const emit = defineEmits<Emits>();
  const isDevelopment = import.meta.env.DEV;

  const fillDemo = () => {
    emit('fill-demo');
  };
</script>

<style scoped>
  .demo-credentials {
    @apply mt-6 p-4 bg-gray-50 border border-gray-200 rounded-lg;
  }
</style>
