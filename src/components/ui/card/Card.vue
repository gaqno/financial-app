<template>
  <div :class="cardClasses" @click="handleClick">
    <!-- Card Header -->
    <div v-if="$slots.header" :class="headerClasses">
      <slot name="header" />
    </div>

    <!-- Card Content -->
    <div class="card-content">
      <slot />
    </div>

    <!-- Card Footer -->
    <div v-if="$slots.footer" :class="footerClasses">
      <slot name="footer" />
    </div>
  </div>
</template>

<script setup lang="ts">
  import { useCard } from './hooks/useCard';

  // Props interface
  interface Props {
    variant?: 'default' | 'outlined' | 'elevated' | 'filled';
    size?: 'sm' | 'md' | 'lg';
    hoverable?: boolean;
    clickable?: boolean;
    className?: string;
  }

  const props = withDefaults(defineProps<Props>(), {
    variant: 'default',
    size: 'md',
    hoverable: false,
    clickable: false,
  });

  // Emits
  const emit = defineEmits<{
    click: [event: Event];
  }>();

  // Use card hook
  const { cardClasses, headerClasses, footerClasses } = useCard(props);

  // Methods
  const handleClick = (event: Event) => {
    if (props.clickable) {
      emit('click', event);
    }
  };
</script>

<script lang="ts">
  export default {
    name: 'Card',
  };
</script>
