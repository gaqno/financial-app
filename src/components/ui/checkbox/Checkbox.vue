<template>
  <div class="relative flex items-start">
    <div class="flex items-center h-6">
      <input
        :id="id"
        type="checkbox"
        :checked="modelValue"
        @change="handleChange"
        @blur="$emit('blur', $event)"
        @focus="$emit('focus', $event)"
        :disabled="disabled"
        :required="required"
        :class="checkboxClasses"
        :aria-describedby="errorMessage ? `${id}-error` : description ? `${id}-description` : undefined"
        :aria-invalid="!!errorMessage"
      />

      <!-- Custom checkmark for enhanced visual feedback -->
      <div v-if="customStyle" :class="customCheckmarkClasses">
        <i v-if="modelValue" class="fas fa-check text-white text-xs" />
      </div>
    </div>

    <div v-if="$slots.default || label || description" class="ml-3 text-sm leading-6">
      <!-- Label -->
      <label v-if="$slots.default || label" :for="id" :class="labelClasses">
        <slot>{{ label }}</slot>
      </label>

      <!-- Description -->
      <p v-if="description" :id="`${id}-description`" class="text-gray-500 dark:text-gray-400">
        {{ description }}
      </p>

      <!-- Error message -->
      <p v-if="errorMessage" :id="`${id}-error`" class="text-red-600 dark:text-red-400 mt-1">
        {{ errorMessage }}
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { useCheckbox } from './hooks/useCheckbox';

  // Props interface
  interface Props {
    modelValue?: boolean;
    label?: string;
    description?: string;
    disabled?: boolean;
    required?: boolean;
    id?: string;
    errorMessage?: string;
    size?: 'sm' | 'md' | 'lg';
    customStyle?: boolean;
    className?: string;
  }

  const props = withDefaults(defineProps<Props>(), {
    modelValue: false,
    disabled: false,
    required: false,
    id: () => `checkbox-${Math.random().toString(36).substr(2, 9)}`,
    size: 'md',
    customStyle: false,
  });

  // Emits
  const emit = defineEmits<{
    'update:modelValue': [value: boolean];
    blur: [event: Event];
    focus: [event: Event];
  }>();

  // Use checkbox hook
  const { checkboxClasses, customCheckmarkClasses, labelClasses, handleChange } = useCheckbox(props, emit);
</script>

<script lang="ts">
  export default {
    name: 'Checkbox',
  };
</script>
