export interface IToast {
  id: string
  type: 'success' | 'error' | 'warning' | 'info'
  title?: string
  message: string
  duration?: number
  persistent?: boolean
  createdAt: Date
}

export interface IToastOptions {
  type?: 'success' | 'error' | 'warning' | 'info'
  title?: string
  duration?: number
  persistent?: boolean
}
