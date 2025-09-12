import { ref, onMounted, onUnmounted } from 'vue'

export interface SwipeDirection {
  direction: 'left' | 'right' | 'up' | 'down'
  element: HTMLElement
  distance: number
  velocity: number
}

export interface SwipeCallbacks {
  onSwipeLeft?: (data: SwipeDirection) => void
  onSwipeRight?: (data: SwipeDirection) => void
  onSwipeUp?: (data: SwipeDirection) => void
  onSwipeDown?: (data: SwipeDirection) => void
  onPullToRefresh?: () => void
  onLongPress?: (element: HTMLElement) => void
}

export function useMobileGestures(callbacks: SwipeCallbacks = {}) {
  const isGestureActive = ref(false)
  const touchStartX = ref(0)
  const touchStartY = ref(0)
  const touchStartTime = ref(0)
  const longPressTimer = ref<NodeJS.Timeout | null>(null)
  const pullToRefreshThreshold = 120
  const swipeThreshold = 50
  const longPressDelay = 500

  // Enhanced swipe detection
  const handleTouchStart = (event: TouchEvent) => {
    if (event.touches.length !== 1) return

    const touch = event.touches[0]
    touchStartX.value = touch.clientX
    touchStartY.value = touch.clientY
    touchStartTime.value = Date.now()
    isGestureActive.value = true

    // Start long press detection
    longPressTimer.value = setTimeout(() => {
      if (isGestureActive.value && callbacks.onLongPress) {
        callbacks.onLongPress(event.target as HTMLElement)
        // Add haptic feedback simulation
        if (navigator.vibrate) {
          navigator.vibrate(50)
        }
      }
    }, longPressDelay)
  }

  const handleTouchMove = (event: TouchEvent) => {
    if (!isGestureActive.value || event.touches.length !== 1) return

    const touch = event.touches[0]
    const deltaX = touch.clientX - touchStartX.value
    const deltaY = touch.clientY - touchStartY.value

    // Cancel long press if moved too much
    if (Math.abs(deltaX) > 10 || Math.abs(deltaY) > 10) {
      if (longPressTimer.value) {
        clearTimeout(longPressTimer.value)
        longPressTimer.value = null
      }
    }

    // Pull to refresh detection
    if (deltaY > pullToRefreshThreshold && window.scrollY === 0 && callbacks.onPullToRefresh) {
      event.preventDefault()
      // Visual feedback could be added here
    }
  }

  const handleTouchEnd = (event: TouchEvent) => {
    if (!isGestureActive.value) return

    // Clear long press timer
    if (longPressTimer.value) {
      clearTimeout(longPressTimer.value)
      longPressTimer.value = null
    }

    const touch = event.changedTouches[0]
    const deltaX = touch.clientX - touchStartX.value
    const deltaY = touch.clientY - touchStartY.value
    const deltaTime = Date.now() - touchStartTime.value
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY)
    const velocity = distance / deltaTime

    // Pull to refresh
    if (deltaY > pullToRefreshThreshold && window.scrollY === 0 && callbacks.onPullToRefresh) {
      callbacks.onPullToRefresh()
      return
    }

    // Swipe detection
    if (distance > swipeThreshold && deltaTime < 300) {
      const element = event.target as HTMLElement
      const swipeData: SwipeDirection = {
        direction: Math.abs(deltaX) > Math.abs(deltaY)
          ? (deltaX > 0 ? 'right' : 'left')
          : (deltaY > 0 ? 'down' : 'up'),
        element,
        distance,
        velocity
      }

      // Execute callback based on direction
      switch (swipeData.direction) {
        case 'left':
          callbacks.onSwipeLeft?.(swipeData)
          break
        case 'right':
          callbacks.onSwipeRight?.(swipeData)
          break
        case 'up':
          callbacks.onSwipeUp?.(swipeData)
          break
        case 'down':
          callbacks.onSwipeDown?.(swipeData)
          break
      }

      // Haptic feedback for successful swipe
      if (navigator.vibrate) {
        navigator.vibrate(25)
      }
    }

    isGestureActive.value = false
  }

  // Quick action shortcuts
  const setupQuickActions = (element: HTMLElement) => {
    if (!element) return

    element.addEventListener('touchstart', handleTouchStart, { passive: false })
    element.addEventListener('touchmove', handleTouchMove, { passive: false })
    element.addEventListener('touchend', handleTouchEnd, { passive: false })
  }

  const removeQuickActions = (element: HTMLElement) => {
    if (!element) return

    element.removeEventListener('touchstart', handleTouchStart)
    element.removeEventListener('touchmove', handleTouchMove)
    element.removeEventListener('touchend', handleTouchEnd)
  }

  // Auto setup on document
  onMounted(() => {
    setupQuickActions(document.body)
  })

  onUnmounted(() => {
    removeQuickActions(document.body)
    if (longPressTimer.value) {
      clearTimeout(longPressTimer.value)
    }
  })

  return {
    isGestureActive,
    setupQuickActions,
    removeQuickActions
  }
}

// Preset gesture configurations for common actions
export const GESTURE_PRESETS = {
  // Swipe right to mark as complete
  COMPLETE_TASK: {
    onSwipeRight: (data: SwipeDirection) => {
      const recordElement = data.element.closest('[data-record-id]')
      if (recordElement) {
        recordElement.dispatchEvent(new CustomEvent('complete-record', {
          detail: { recordId: recordElement.getAttribute('data-record-id') }
        }))
      }
    }
  },

  // Swipe left to delete
  DELETE_TASK: {
    onSwipeLeft: (data: SwipeDirection) => {
      const recordElement = data.element.closest('[data-record-id]')
      if (recordElement) {
        recordElement.dispatchEvent(new CustomEvent('delete-record', {
          detail: { recordId: recordElement.getAttribute('data-record-id') }
        }))
      }
    }
  },

  // Long press for context menu
  CONTEXT_MENU: {
    onLongPress: (element: HTMLElement) => {
      const recordElement = element.closest('[data-record-id]')
      if (recordElement) {
        recordElement.dispatchEvent(new CustomEvent('show-context-menu', {
          detail: {
            recordId: recordElement.getAttribute('data-record-id'),
            position: { x: touchStartX.value, y: touchStartY.value }
          }
        }))
      }
    }
  }
}
