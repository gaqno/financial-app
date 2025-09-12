<template>
  <AuthGuard>
    <FinanceApp />
  </AuthGuard>
</template>

<script setup lang="ts">
import FinanceApp from './components/FinanceApp.vue';
import AuthGuard from './components/auth/AuthGuard.vue';
</script>