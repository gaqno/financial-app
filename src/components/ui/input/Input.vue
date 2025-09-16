<template>
  <div class="relative">
    <input
      :id="id"
      :type="type"
      :value="modelValue"
      @input="handleInput"
      @blur="$emit('blur', $event)"
      @focus="$emit('focus', $event)"
      :placeholder="placeholder"
      :disabled="disabled"
      :required="required"
      :readonly="readonly"
      :class="inputClasses"
      :aria-describedby="errorMessage ? `${id}-error` : undefined"
      :aria-invalid="!!errorMessage"
    />

    <!-- Icon (left side) -->
    <div v-if="leftIcon" :class="leftIconClasses">
      <i :class="leftIcon" />
    </div>

    <!-- Icon (right side) -->
    <div v-if="rightIcon || showClearButton || showPasswordToggle" :class="rightIconClasses">
      <!-- Clear button -->
      <button
        v-if="showClearButton && modelValue"
        @click="clearInput"
        type="button"
        class="text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 p-1 rounded transition-colors"
        :title="clearButtonTitle"
      >
        <i class="fas fa-times text-sm" />
      </button>

      <!-- Password toggle -->
      <button
        v-else-if="showPasswordToggle"
        @click="togglePasswordVisibility"
        type="button"
        class="text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 p-1 rounded transition-colors"
        :title="showPassword ? 'Ocultar senha' : 'Mostrar senha'"
      >
        <i :class="showPassword ? 'fas fa-eye-slash' : 'fas fa-eye'" class="text-sm" />
      </button>

      <!-- Custom right icon -->
      <i v-else-if="rightIcon" :class="rightIcon" />
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
  import { useInput } from './hooks/useInput';

  // Props interface
  interface Props {
    modelValue?: string | number;
    type?: 'text' | 'email' | 'password' | 'number' | 'tel' | 'url' | 'search';
    placeholder?: string;
    disabled?: boolean;
    required?: boolean;
    readonly?: boolean;
    id?: string;
    leftIcon?: string;
    rightIcon?: string;
    errorMessage?: string;
    helperText?: string;
    size?: 'sm' | 'md' | 'lg';
    variant?: 'default' | 'outline' | 'filled';
    clearable?: boolean;
    clearButtonTitle?: string;
    className?: string;
  }

  const props = withDefaults(defineProps<Props>(), {
    modelValue: '',
    type: 'text',
    placeholder: '',
    disabled: false,
    required: false,
    readonly: false,
    id: () => `input-${Math.random().toString(36).substr(2, 9)}`,
    size: 'md',
    variant: 'default',
    clearable: false,
    clearButtonTitle: 'Limpar campo',
  });

  // Emits
  const emit = defineEmits<{
    'update:modelValue': [value: string | number];
    blur: [event: Event];
    focus: [event: Event];
  }>();

  // Use input hook
  const {
    showPassword,
    inputType,
    showClearButton,
    showPasswordToggle,
    inputClasses,
    leftIconClasses,
    rightIconClasses,
    handleInput,
    clearInput,
    togglePasswordVisibility,
  } = useInput(props, emit);
</script>

<script lang="ts">
  export default {
    name: 'Input',
  };
</script>
