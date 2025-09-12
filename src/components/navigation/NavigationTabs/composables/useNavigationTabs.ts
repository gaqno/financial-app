import { computed } from 'vue';
import type { ITab } from '../types';

interface IUseNavigationTabsParams {
  tabs: ITab[];
  activeTab: string;
}

export const useNavigationTabs = ({ tabs, activeTab }: IUseNavigationTabsParams) => {
  // Computed properties
  const currentActiveTab = computed(() => activeTab);

  const tabButtonClasses = computed(() => (tab: ITab) => [
    activeTab === tab.id
      ? 'border-blue-500 text-blue-600 dark:text-blue-400'
      : 'border-transparent text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-slate-300 hover:border-gray-300 dark:hover:border-slate-500',
    'whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm'
  ]);

  const isActiveTab = computed(() => (tabId: string) => activeTab === tabId);

  return {
    currentActiveTab,
    tabButtonClasses,
    isActiveTab
  };
};
