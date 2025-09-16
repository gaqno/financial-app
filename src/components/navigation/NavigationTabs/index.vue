<template>
  <nav class="flex space-x-8 overflow-auto" aria-label="Tabs">
    <button v-for="tab in tabs" :key="tab.id" @click="handleTabClick(tab.id)" :class="getTabButtonClasses(tab)">
      <span class="mr-2">{{ tab.icon }}</span>
      {{ tab.label }}
      <span
        v-if="tab.badge"
        class="ml-2 bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-slate-300 py-0.5 px-2 rounded-full text-xs"
      >
        {{ tab.badge }}
      </span>
    </button>
  </nav>
</template>

<script setup lang="ts">
  import { computed } from 'vue';
  import type { INavigationTabsProps, INavigationTabsEmits, ITab } from './types';

  // Props
  const props = defineProps<INavigationTabsProps>();

  // Emits
  const emit = defineEmits<INavigationTabsEmits>();

  // Computed properties for tab styling
  const getTabButtonClasses = computed(() => (tab: ITab) => [
    props.activeTab === tab.id
      ? 'border-blue-500 text-blue-600 dark:text-blue-400'
      : 'border-transparent text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-slate-300 hover:border-gray-300 dark:hover:border-slate-500',
    'whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm',
  ]);

  // Methods
  const handleTabClick = (tabId: string) => {
    emit('update:active-tab', tabId);
  };
</script>

<script lang="ts">
  export default {
    name: 'NavigationTabs',
  };
</script>
