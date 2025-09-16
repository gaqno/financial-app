<template>
  <div class="w-full">
    <!-- Tab List -->
    <div :class="tabListClasses" role="tablist" :aria-orientation="orientation">
      <button
        v-for="item in items"
        :key="item.id"
        :class="getTabClasses(item)"
        :disabled="item.disabled"
        :aria-selected="activeTab === item.id"
        :aria-controls="`panel-${item.id}`"
        :id="`tab-${item.id}`"
        :tabindex="activeTab === item.id ? 0 : -1"
        role="tab"
        type="button"
        @click="selectTab(item.id)"
        @keydown="handleKeydown($event, item.id)"
      >
        <!-- Icon -->
        <i v-if="item.icon" :class="item.icon" class="mr-2" />

        <!-- Label -->
        <span>{{ item.label }}</span>

        <!-- Badge -->
        <span
          v-if="item.badge"
          class="ml-2 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white bg-red-500 rounded-full"
        >
          {{ item.badge }}
        </span>
      </button>
    </div>

    <!-- Tab Panels -->
    <div :class="contentClasses">
      <template v-for="item in items" :key="`panel-${item.id}`">
        <div
          v-show="activeTab === item.id"
          :id="`panel-${item.id}`"
          :aria-labelledby="`tab-${item.id}`"
          role="tabpanel"
          tabindex="0"
        >
          <!-- Slot content for each tab -->
          <slot :name="`tab-${item.id}`" :item="item" :active="activeTab === item.id">
            <!-- Fallback content -->
            <div v-if="item.content" v-html="item.content" />
            <div v-else class="text-gray-500 dark:text-gray-400">Conteúdo para {{ item.label }}</div>
          </slot>
        </div>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { useTabs } from './hooks/useTabs';

  // Types
  interface TabItem {
    id: string;
    label: string;
    icon?: string;
    disabled?: boolean;
    badge?: string | number;
    content?: string;
  }

  // Props interface
  interface Props {
    items: TabItem[];
    modelValue?: string;
    defaultValue?: string;
    orientation?: 'horizontal' | 'vertical';
    variant?: 'default' | 'pills' | 'underline' | 'cards';
    size?: 'sm' | 'md' | 'lg';
    className?: string;
  }

  const props = withDefaults(defineProps<Props>(), {
    orientation: 'horizontal',
    variant: 'default',
    size: 'md',
  });

  // Emits
  const emit = defineEmits<{
    'update:modelValue': [value: string];
    change: [value: string, item: TabItem];
  }>();

  // Use tabs hook
  const { activeTab, tabListClasses, getTabClasses, contentClasses, activeTabItem, selectTab, handleKeydown } = useTabs(
    props,
    emit
  );

  // Expose active tab for parent components
  defineExpose({
    activeTab,
    activeTabItem,
    selectTab,
  });
</script>

<script lang="ts">
  export default {
    name: 'Tabs',
  };
</script>
