<template>
  <nav class="flex space-x-8 overflow-auto" aria-label="Tabs">
    <button v-for="tab in tabs" :key="tab.id" @click="handleTabClick(tab.id)" :class="tabButtonClasses(tab)">
      <span class="mr-2">{{ tab.icon }}</span>
      {{ tab.label }}
      <span v-if="tab.badge"
        class="ml-2 bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-slate-300 py-0.5 px-2 rounded-full text-xs">
        {{ tab.badge }}
      </span>
    </button>
  </nav>
</template>

<script setup lang="ts">
import type { INavigationTabsProps, INavigationTabsEmits } from './types';
import { useNavigationTabs } from './composables/useNavigationTabs';

// Props
const props = defineProps<INavigationTabsProps>();

// Emits
const emit = defineEmits<INavigationTabsEmits>();

// Composables
const { tabButtonClasses } = useNavigationTabs({
  tabs: props.tabs,
  activeTab: props.activeTab
});

// Methods
const handleTabClick = (tabId: string) => {
  emit('update:activeTab', tabId);
};
</script>

<script lang="ts">
export default {
  name: 'NavigationTabs'
};
</script>
