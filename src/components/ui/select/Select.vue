<template>
  <div class="relative">
    <select
      :id="id"
      :value="modelValue"
      @change="handleChange"
      @blur="$emit('blur', $event)"
      @focus="$emit('focus', $event)"
      :disabled="disabled"
      :required="required"
      :class="selectClasses"
      :aria-describedby="errorMessage ? `${id}-error` : undefined"
      :aria-invalid="!!errorMessage"
    >
      <!-- Placeholder option -->
      <option v-if="placeholder" value="" disabled hidden>
        {{ placeholder }}
      </option>

      <!-- Options from array -->
      <option v-for="option in normalizedOptions" :key="option.value" :value="option.value" :disabled="option.disabled">
        {{ option.label }}
      </option>

      <!-- Slot for custom options -->
      <slot />
    </select>

    <!-- Custom dropdown arrow -->
    <div class="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
      <i class="fas fa-chevron-down text-gray-400 dark:text-gray-500 text-sm" />
    </div>

    <!-- Error message -->
    <div v-if="errorMessage" :id="`${id}-error`" class="mt-1 text-sm text-red-600 dark:text-red-400">
      {{ errorMessage }}
    </div>

    <!-- Helper text -->
    <div v-else-if="helperText" class="mt-1 text-sm text-gray-500 dark:text-gray-400">
      {{ helperText }}
    </div>
  </div>
</template>

<script setup lang="ts">
  import { useSelect } from './hooks/useSelect';

  // Types
  interface SelectOption {
    label: string;
    value: string | number;
    disabled?: boolean;
  }

  // Props interface
  interface Props {
    modelValue?: string | number;
    placeholder?: string;
    disabled?: boolean;
    required?: boolean;
    id?: string;
    errorMessage?: string;
    helperText?: string;
    size?: 'sm' | 'md' | 'lg';
    variant?: 'default' | 'outline' | 'filled';
    options?: SelectOption[] | string[] | number[];
    className?: string;
  }

  const props = withDefaults(defineProps<Props>(), {
    modelValue: '',
    placeholder: '',
    disabled: false,
    required: false,
    id: () => `select-${Math.random().toString(36).substr(2, 9)}`,
    size: 'md',
    variant: 'default',
    options: () => [],
  });

  // Emits
  const emit = defineEmits<{
    'update:modelValue': [value: string | number];
    blur: [event: Event];
    focus: [event: Event];
  }>();

  // Use select hook
  const { normalizedOptions, selectClasses, handleChange } = useSelect(props, emit);
</script>

<script lang="ts">
  export default {
    name: 'Select',
  };
</script>
