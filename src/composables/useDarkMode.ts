import { ref, computed, watch } from 'vue';

/**
 * Dark Mode composable for managing theme state
 */
export function useDarkMode() {
  // Get persisted dark mode preference or default to system preference
  const getInitialDarkMode = (): boolean => {
    // Check localStorage first
    const stored = localStorage.getItem('darkMode');
    if (stored !== null) {
      return JSON.parse(stored);
    }

    // Fallback to system preference
    if (typeof window !== 'undefined' && window.matchMedia) {
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }

    // Default to light mode
    return false;
  };

  // Reactive dark mode state
  const isDarkMode = ref<boolean>(getInitialDarkMode());

  // Computed class for easy template usage
  const themeClass = computed(() => (isDarkMode.value ? 'dark' : ''));

  // Toggle function with debugging
  const toggleDarkMode = (): void => {
    console.log('🌙 [DARK_MODE] Toggling:', { from: isDarkMode.value, to: !isDarkMode.value });
    isDarkMode.value = !isDarkMode.value;
  };

  // Enable dark mode
  const enableDarkMode = (): void => {
    isDarkMode.value = true;
  };

  // Disable dark mode
  const disableDarkMode = (): void => {
    isDarkMode.value = false;
  };

  // Apply theme to document with debugging
  const applyTheme = (dark: boolean): void => {
    if (typeof document !== 'undefined') {
      const root = document.documentElement;

      try {
        if (dark) {
          root.classList.add('dark');
          console.log('🌙 [DARK_MODE] Applied dark theme to document');
        } else {
          root.classList.remove('dark');
          console.log('☀️ [DARK_MODE] Applied light theme to document');
        }

        // Verify theme was applied
        const hasDarkClass = root.classList.contains('dark');
        console.log('🔍 [DARK_MODE] Theme verification:', {
          intended: dark,
          applied: hasDarkClass,
          classes: root.className,
        });
      } catch (error) {
        console.error('❌ [DARK_MODE] Error applying theme:', error);
      }
    }
  };

  // Watch for changes and persist + apply theme
  watch(
    isDarkMode,
    (newValue) => {
      // Persist to localStorage
      localStorage.setItem('darkMode', JSON.stringify(newValue));

      // Apply to document
      applyTheme(newValue);
    },
    { immediate: true }
  );

  // Listen for system theme changes
  if (typeof window !== 'undefined' && window.matchMedia) {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

    const handleSystemThemeChange = (e: MediaQueryListEvent): void => {
      // Only auto-switch if user hasn't manually set a preference
      const hasManualPreference = localStorage.getItem('darkMode') !== null;

      if (!hasManualPreference) {
        isDarkMode.value = e.matches;
      }
    };

    // Modern browsers
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleSystemThemeChange);
    } else {
      // Legacy browsers
      mediaQuery.addListener(handleSystemThemeChange);
    }
  }

  return {
    // State
    isDarkMode: computed(() => isDarkMode.value),
    themeClass,

    // Actions
    toggleDarkMode,
    enableDarkMode,
    disableDarkMode,

    // Utilities
    applyTheme,
  };
}
