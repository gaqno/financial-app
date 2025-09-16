<template>
  <div class="relative">
    <textarea
      :id="id"
      :value="modelValue"
      @input="handleInput"
      @blur="$emit('blur', $event)"
      @focus="$emit('focus', $event)"
      :placeholder="placeholder"
      :disabled="disabled"
      :required="required"
      :readonly="readonly"
      :rows="rows"
      :class="textareaClasses"
      :aria-describedby="errorMessage ? `${id}-error` : undefined"
      :aria-invalid="!!errorMessage"
      :style="{ resize: resizable ? 'vertical' : 'none' }"
    />

    <!-- Character count -->
    <div
      v-if="showCharCount && maxLength"
      class="absolute bottom-2 right-2 text-xs text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-700 px-1 rounded"
    >
      {{ characterCount }}/{{ maxLength }}
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
  import { useTextarea } from './hooks/useTextarea';

  // Props interface
  interface Props {
    modelValue?: string;
    placeholder?: string;
    disabled?: boolean;
    required?: boolean;
    readonly?: boolean;
    id?: string;
    errorMessage?: string;
    helperText?: string;
    size?: 'sm' | 'md' | 'lg';
    variant?: 'default' | 'outline' | 'filled';
    rows?: number;
    maxLength?: number;
    showCharCount?: boolean;
    resizable?: boolean;
    className?: string;
  }

  const props = withDefaults(defineProps<Props>(), {
    modelValue: '',
    placeholder: '',
    disabled: false,
    required: false,
    readonly: false,
    id: () => `textarea-${Math.random().toString(36).substr(2, 9)}`,
    size: 'md',
    variant: 'default',
    rows: 4,
    showCharCount: false,
    resizable: true,
  });

  // Emits
  const emit = defineEmits<{
    'update:modelValue': [value: string];
    blur: [event: Event];
    focus: [event: Event];
  }>();

  // Use textarea hook
  const { characterCount, textareaClasses, handleInput } = useTextarea(props, emit);
</script>

<script lang="ts">
  export default {
    name: 'Textarea',
  };
</script>
