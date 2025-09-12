export interface ITab {
  id: string;
  label: string;
  icon: string;
  badge?: number | null;
}

export interface INavigationTabsProps {
  tabs: ITab[];
  activeTab: string;
}

export interface INavigationTabsEmits {
  'update:activeTab': [tabId: string];
}
