export interface IUserProfile {
  id: string
  fullName: string
  email: string
  avatarUrl?: string
  phone?: string
  bio?: string
  location?: string
  currency: string
  language: string
  timezone: string
  createdAt: string
  updatedAt: string
}

export interface IUserSettings {
  language: 'pt-BR' | 'en-US' | 'es-ES'
  currency: 'BRL' | 'USD' | 'EUR'
  theme: 'light' | 'dark' | 'auto'
  notifications: {
    email: boolean
    push: boolean
    reports: boolean
  }
  privacy: {
    profilePublic: boolean
    shareAnalytics: boolean
  }
}

export interface IExportOptions {
  format: 'csv' | 'xlsx' | 'pdf'
  dateRange: {
    start: string
    end: string
  }
  includeCategories: boolean
  includeRecurrence: boolean
  includeInvestments: boolean
}

export type ProfileSection = 'profile' | 'settings' | 'security' | 'data'

export interface ILanguageOption {
  code: 'pt-BR' | 'en-US' | 'es-ES'
  name: string
  flag: string
}

export interface ICurrencyOption {
  code: 'BRL' | 'USD' | 'EUR'
  name: string
  symbol: string
}
