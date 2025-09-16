<template>
  <div class="flex items-center">
    <!-- Switch -->
    <button
      :id="id"
      type="button"
      :class="trackClasses"
      role="switch"
      :aria-checked="modelValue"
      :aria-labelledby="label ? `${id}-label` : undefined"
      :aria-describedby="description ? `${id}-description` : undefined"
      :disabled="disabled"
      @click="handleToggle"
      @keydown="handleKeydown"
    >
      <span :class="thumbClasses" />
    </button>

    <!-- Label and Description -->
    <div v-if="$slots.default || label || description" class="ml-3">
      <!-- Label -->
      <label
        v-if="$slots.default || label"
        :id="`${id}-label`"
        :for="id"
        :class="labelClasses"
        class="block cursor-pointer"
      >
        <slot>{{ label }}</slot>
      </label>

      <!-- Description -->
      <p v-if="description" :id="`${id}-description`" :class="descriptionClasses">
        {{ description }}
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { useSwitch } from './hooks/useSwitch';

  // Props interface
  interface Props {
    modelValue?: boolean;
    disabled?: boolean;
    size?: 'sm' | 'md' | 'lg';
    variant?: 'default' | 'success' | 'warning' | 'danger';
    label?: string;
    description?: string;
    id?: string;
    className?: string;
  }

  const props = withDefaults(defineProps<Props>(), {
    modelValue: false,
    disabled: false,
    size: 'md',
    variant: 'default',
    id: () => `switch-${Math.random().toString(36).substr(2, 9)}`,
  });

  // Emits
  const emit = defineEmits<{
    'update:modelValue': [value: boolean];
    change: [value: boolean];
  }>();

  // Use switch hook
  const { trackClasses, thumbClasses, labelClasses, descriptionClasses, handleToggle, handleKeydown } = useSwitch(
    props,
    emit
  );
</script>

<script lang="ts">
  export default {
    name: 'Switch',
  };
</script>
