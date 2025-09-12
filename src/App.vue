<template>
  <AuthGuard>
    <PorQuinho />
  </AuthGuard>
</template>

<script setup lang="ts">
import PorQuinho from './components/PorQuinho.vue';
import AuthGuard from './components/auth/AuthGuard.vue';
</script>