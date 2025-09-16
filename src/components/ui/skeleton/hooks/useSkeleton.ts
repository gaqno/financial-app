import { computed } from 'vue';

// Types
interface UseSkeletonProps {
  variant?: 'text' | 'circular' | 'rectangular' | 'rounded';
  width?: string | number;
  height?: string | number;
  animation?: 'pulse' | 'wave' | 'none';
  lines?: number;
  className?: string;
}

export const useSkeleton = (props: UseSkeletonProps) => {
  // Computed properties
  const variantClasses = computed(() => {
    const variants = {
      text: 'rounded',
      circular: 'rounded-full',
      rectangular: 'rounded-none',
      rounded: 'rounded-lg',
    };
    return variants[props.variant || 'text'];
  });

  const animationClasses = computed(() => {
    const animations = {
      pulse: 'animate-pulse',
      wave: 'animate-wave',
      none: '',
    };
    return animations[props.animation || 'pulse'];
  });

  const skeletonClasses = computed(() => {
    return [
      'bg-gray-200 dark:bg-gray-700',
      variantClasses.value,
      animationClasses.value,
      props.className,
    ].filter(Boolean).join(' ');
  });

  const skeletonStyle = computed(() => {
    const style: Record<string, string> = {};
    
    if (props.width !== undefined) {
      style.width = typeof props.width === 'number' ? `${props.width}px` : props.width;
    }
    
    if (props.height !== undefined) {
      style.height = typeof props.height === 'number' ? `${props.height}px` : props.height;
    }
    
    return style;
  });

  const textLineClasses = computed(() => {
    return [
      'bg-gray-200 dark:bg-gray-700 rounded h-4 mb-2 last:mb-0',
      animationClasses.value,
    ].filter(Boolean).join(' ');
  });

  const textLineWidths = computed(() => {
    if (!props.lines || props.lines <= 1) return ['100%'];
    
    const widths = [];
    for (let i = 0; i < props.lines; i++) {
      if (i === props.lines - 1) {
        // Last line is shorter
        widths.push('75%');
      } else {
        // Random width variation for other lines
        const randomWidth = 85 + Math.random() * 15; // 85-100%
        widths.push(`${randomWidth}%`);
      }
    }
    return widths;
  });

  return {
    // Computed properties
    skeletonClasses,
    skeletonStyle,
    textLineClasses,
    textLineWidths,
  };
};
