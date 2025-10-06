<template>
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
    <div class="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-12 text-center">
      <div class="w-24 h-24 mx-auto mb-4 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center">
        <i :class="`fas fa-${icon}`" class="text-gray-400 dark:text-gray-500 text-3xl" />
      </div>
      <h3 class="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
        {{ title }}
      </h3>
      <p class="text-gray-600 dark:text-gray-300 mb-4">
        {{ description }}
      </p>
      <div
        v-if="features && features.length > 0"
        class="flex justify-center space-x-4 text-sm text-gray-500 dark:text-gray-400"
      >
        <span v-for="feature in features" :key="feature">{{ feature }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
  interface IComingSoonPlaceholderProps {
    icon: string;
    title: string;
    description: string;
    features?: string[];
  }

  withDefaults(defineProps<IComingSoonPlaceholderProps>(), {
    features: () => [],
  });
</script>

<script lang="ts">
  export default {
    name: 'ComingSoonPlaceholder',
  };
</script>
