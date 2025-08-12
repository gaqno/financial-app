<template>
  <span v-if="isRecurring" class="text-blue-500 inline-flex items-center justify-center" :class="sizeClasses"
    :title="title">
    <i class="fas fa-sync"></i>
  </span>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { IFinanceRecord } from '../../../types/finance'

interface Props {
  record?: IFinanceRecord
  isRecurring?: boolean
  size?: 'xs' | 'sm' | 'md' | 'lg'
  title?: string
}

const props = withDefaults(defineProps<Props>(), {
  size: 'sm',
  title: 'Registro recorrente'
})

// Check if record is recurring
const isRecurring = computed(() => {
  if (props.isRecurring !== undefined) {
    return props.isRecurring
  }

  if (props.record) {
    return !!(props.record.recurrence && props.record.recurrence.isActive)
  }

  return false
})

// Size classes mapping
const sizeClasses = computed(() => {
  const sizes = {
    xs: 'text-xs',
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg'
  }
  return sizes[props.size]
})
</script>