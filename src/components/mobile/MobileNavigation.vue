<template>
  <!-- Bottom Navigation for Mobile -->
  <nav
    v-if="isMobile"
    class="fixed bottom-0 left-0 right-0 bg-white dark:bg-slate-800 shadow-[0_-4px_16px_rgba(0,0,0,0.1)] dark:shadow-[0_-4px_16px_rgba(0,0,0,0.3)] z-50 theme-transition"
  >
    <div class="grid grid-cols-5 h-16">
      <!-- Home/Dashboard -->
      <button
        @click="setActiveTab('dashboard')"
        :class="getNavItemClasses('dashboard')"
        class="flex flex-col items-center justify-center space-y-1 p-2"
      >
        <i class="fas fa-home text-lg"></i>
        <span class="text-xs font-medium">Início</span>
      </button>

      <!-- Transactions -->
      <button
        @click="setActiveTab('transactions')"
        :class="getNavItemClasses('transactions')"
        class="flex flex-col items-center justify-center space-y-1 p-2"
      >
        <i class="fas fa-exchange-alt text-lg"></i>
        <span class="text-xs font-medium">Transações</span>
        <div
          v-if="pendingCount > 0"
          class="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center"
        >
          {{ pendingCount }}
        </div>
      </button>

      <!-- Add (FAB Style) -->
      <button
        @click="openQuickAdd"
        class="relative -top-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-full w-14 h-14 flex items-center justify-center shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
      >
        <i class="fas fa-plus text-xl"></i>
      </button>

      <!-- Analytics -->
      <button
        @click="setActiveTab('analytics')"
        :class="getNavItemClasses('analytics')"
        class="flex flex-col items-center justify-center space-y-1 p-2"
      >
        <i class="fas fa-chart-pie text-lg"></i>
        <span class="text-xs font-medium">Relatórios</span>
      </button>

      <!-- Profile/Settings -->
      <button
        @click="setActiveTab('profile')"
        :class="getNavItemClasses('profile')"
        class="flex flex-col items-center justify-center space-y-1 p-2"
      >
        <i class="fas fa-user text-lg"></i>
        <span class="text-xs font-medium">Perfil</span>
      </button>
    </div>
  </nav>

  <!-- Mobile Header -->
  <header
    v-if="isMobile"
    class="sticky top-0 z-40 bg-white/95 dark:bg-slate-800/95 backdrop-blur-lg shadow-[0_1px_3px_rgba(0,0,0,0.05)] dark:shadow-[0_1px_3px_rgba(0,0,0,0.2)] theme-transition"
  >
    <div class="flex items-center justify-between px-4 h-14">
      <!-- Left: Context Action -->
      <button
        v-if="showBackButton"
        @click="goBack"
        class="p-2 -ml-2 text-gray-600 dark:text-slate-400 hover:text-gray-900 dark:hover:text-slate-100"
      >
        <i class="fas fa-arrow-left text-lg"></i>
      </button>
      <div v-else class="w-8"></div>

      <!-- Center: Dynamic Title -->
      <h1 class="text-lg font-semibold text-gray-900 dark:text-slate-100 truncate">
        {{ currentPageTitle }}
      </h1>

      <!-- Right: Actions -->
      <div class="flex items-center space-x-2">
        <button
          @click="openSearch"
          class="p-2 text-gray-600 dark:text-slate-400 hover:text-gray-900 dark:hover:text-slate-100"
        >
          <i class="fas fa-search text-lg"></i>
        </button>
        <button
          @click="openMenu"
          class="p-2 text-gray-600 dark:text-slate-400 hover:text-gray-900 dark:hover:text-slate-100"
        >
          <i class="fas fa-ellipsis-v text-lg"></i>
        </button>
      </div>
    </div>
  </header>
</template>

<script setup lang="ts">
  import { computed, ref } from 'vue';
  import { useFinanceStore } from '../../stores/financeStore';

  // Props & Emits
  interface Emits {
    'tab-change': [tab: string];
    'quick-add': [];
    search: [];
    menu: [];
    back: [];
  }

  const emit = defineEmits<Emits>();

  // Reactive state
  const activeTab = ref('transactions');
  const showBackButton = ref(false);
  const financeStore = useFinanceStore();

  // Computed
  const isMobile = computed(() => window.innerWidth < 1024);
  const pendingCount = computed(() => financeStore.records.filter((r) => r.Status === '❌').length);

  const currentPageTitle = computed(() => {
    const titles = {
      dashboard: '🐷 por.quinho',
      transactions: 'Transações',
      analytics: 'Relatórios',
      profile: 'Perfil',
    };
    return titles[activeTab.value as keyof typeof titles] || 'por.quinho';
  });

  // Methods
  const setActiveTab = (tab: string) => {
    activeTab.value = tab;
    emit('tab-change', tab);
  };

  const getNavItemClasses = (tab: string) => {
    const isActive = activeTab.value === tab;
    return [
      'relative transition-colors duration-200',
      isActive
        ? 'text-blue-600 dark:text-blue-400'
        : 'text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-slate-300',
    ];
  };

  const openQuickAdd = () => emit('quick-add');
  const openSearch = () => emit('search');
  const openMenu = () => emit('menu');
  const goBack = () => emit('back');
</script>
