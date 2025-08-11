import { ref, watch } from 'vue';
import type { Ref } from 'vue';

export function useLocalStorage<T>(key: string, defaultValue: T) {
  // Try to get the value from localStorage
  const storedValue = localStorage.getItem(key);
  const data = ref<T>(
    storedValue ? JSON.parse(storedValue) : defaultValue
  ) as Ref<T>;

  // Watch for changes and update localStorage
  watch(
    data,
    (newValue) => {
      localStorage.setItem(key, JSON.stringify(newValue));
    },
    { deep: true }
  );

  const clearStorage = () => {
    localStorage.removeItem(key);
    data.value = defaultValue;
  };

  return {
    data,
    clearStorage
  };
} 