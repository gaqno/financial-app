import { ref, computed } from 'vue'
import type { IToast, IToastOptions } from '../types/toast'

// Estado global do toast
const toasts = ref<IToast[]>([])

let toastCounter = 0

/**
 * Composable para gerenciar sistema de toast/notificações
 * 
 * Permite exibir mensagens temporárias na tela para feedback do usuário
 */
export function useToast() {
  // Computed
  const visibleToasts = computed(() => toasts.value)
  const hasToasts = computed(() => toasts.value.length > 0)

  // Métodos privados
  const generateId = (): string => {
    return `toast-${++toastCounter}-${Date.now()}`
  }

  const createToast = (message: string, options: IToastOptions = {}): IToast => {
    return {
      id: generateId(),
      type: options.type || 'info',
      title: options.title,
      message,
      duration: options.duration || (options.type === 'error' ? 5000 : 3000),
      persistent: options.persistent || false,
      createdAt: new Date()
    }
  }

  const removeToast = (id: string) => {
    const index = toasts.value.findIndex(toast => toast.id === id)
    if (index > -1) {
      toasts.value.splice(index, 1)
    }
  }

  // Métodos públicos
  const addToast = (message: string, options: IToastOptions = {}): string => {
    const toast = createToast(message, options)
    toasts.value.push(toast)

    // Auto-remove toast se não for persistente
    if (!toast.persistent && toast.duration && toast.duration > 0) {
      setTimeout(() => {
        removeToast(toast.id)
      }, toast.duration)
    }

    return toast.id
  }

  const success = (message: string, options: Omit<IToastOptions, 'type'> = {}): string => {
    return addToast(message, { ...options, type: 'success' })
  }

  const error = (message: string, options: Omit<IToastOptions, 'type'> = {}): string => {
    return addToast(message, { ...options, type: 'error' })
  }

  const warning = (message: string, options: Omit<IToastOptions, 'type'> = {}): string => {
    return addToast(message, { ...options, type: 'warning' })
  }

  const info = (message: string, options: Omit<IToastOptions, 'type'> = {}): string => {
    return addToast(message, { ...options, type: 'info' })
  }

  const dismiss = (id: string) => {
    removeToast(id)
  }

  const dismissAll = () => {
    toasts.value = []
  }

  return {
    // Estado
    toasts: visibleToasts,
    hasToasts,

    // Métodos para exibir toasts
    addToast,
    success,
    error,
    warning,
    info,

    // Métodos para remover toasts
    dismiss,
    dismissAll
  }
}
