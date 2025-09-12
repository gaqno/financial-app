import { ref, computed } from 'vue'
import type { IUserSettings, ILanguageOption, ICurrencyOption } from '../../types/profile'
import { useToast } from '../useToast'

export function useSettings() {
  const { success: showSuccess, error: showError, warning: showWarning } = useToast()

  // Estado das configurações
  const isLoading = ref(false)

  const settings = ref<IUserSettings>({
    language: 'pt-BR',
    currency: 'BRL',
    theme: 'light',
    notifications: {
      email: true,
      push: true,
      reports: true
    },
    privacy: {
      profilePublic: false,
      shareAnalytics: true
    }
  })

  // Opções disponíveis
  const languageOptions: ILanguageOption[] = [
    { code: 'pt-BR', name: 'Português (Brasil)', flag: '🇧🇷' },
    { code: 'en-US', name: 'English (US)', flag: '🇺🇸' },
    { code: 'es-ES', name: 'Español (España)', flag: '🇪🇸' }
  ]

  const currencyOptions: ICurrencyOption[] = [
    { code: 'BRL', name: 'Real Brasileiro', symbol: 'R$' },
    { code: 'USD', name: 'Dólar Americano', symbol: '$' },
    { code: 'EUR', name: 'Euro', symbol: '€' }
  ]

  const themeOptions = [
    { value: 'light', label: 'Claro', icon: '☀️' },
    { value: 'dark', label: 'Escuro', icon: '🌙' },
    { value: 'auto', label: 'Automático', icon: '🔄' }
  ]

  // Computed
  const currentLanguage = computed(() =>
    languageOptions.find(lang => lang.code === settings.value.language)
  )

  const currentCurrency = computed(() =>
    currencyOptions.find(curr => curr.code === settings.value.currency)
  )

  const currentTheme = computed(() =>
    themeOptions.find(theme => theme.value === settings.value.theme)
  )

  // Métodos
  const updateLanguage = async (languageCode: ILanguageOption['code']): Promise<boolean> => {
    try {
      isLoading.value = true

      // TODO: Implementar mudança real de idioma
      // await settingsService.updateLanguage(languageCode)

      // Simular delay da API
      await new Promise(resolve => setTimeout(resolve, 500))

      settings.value.language = languageCode

      const language = languageOptions.find(lang => lang.code === languageCode)
      showSuccess(`Idioma alterado para ${language?.name}`, {
        title: `${language?.flag} Idioma Atualizado`
      })

      return true
    } catch (error) {
      console.error('Erro ao alterar idioma:', error)
      showError('Erro ao alterar idioma. Tente novamente.', {
        title: '❌ Erro'
      })
      return false
    } finally {
      isLoading.value = false
    }
  }

  const updateCurrency = async (currencyCode: ICurrencyOption['code']): Promise<boolean> => {
    try {
      isLoading.value = true

      // TODO: Implementar mudança real de moeda
      // await settingsService.updateCurrency(currencyCode)

      await new Promise(resolve => setTimeout(resolve, 500))

      settings.value.currency = currencyCode

      const currency = currencyOptions.find(curr => curr.code === currencyCode)
      showSuccess(`Moeda alterada para ${currency?.name}`, {
        title: '💰 Moeda Atualizada'
      })

      return true
    } catch (error) {
      console.error('Erro ao alterar moeda:', error)
      showError('Erro ao alterar moeda. Tente novamente.', {
        title: '❌ Erro'
      })
      return false
    } finally {
      isLoading.value = false
    }
  }

  const updateTheme = async (theme: 'light' | 'dark' | 'auto'): Promise<boolean> => {
    try {
      isLoading.value = true

      // TODO: Implementar mudança real de tema
      // await settingsService.updateTheme(theme)

      await new Promise(resolve => setTimeout(resolve, 300))

      settings.value.theme = theme

      const themeOption = themeOptions.find(t => t.value === theme)
      showSuccess(`Tema alterado para ${themeOption?.label}`, {
        title: `${themeOption?.icon} Tema Atualizado`
      })

      return true
    } catch (error) {
      console.error('Erro ao alterar tema:', error)
      showError('Erro ao alterar tema. Tente novamente.', {
        title: '❌ Erro'
      })
      return false
    } finally {
      isLoading.value = false
    }
  }

  const updateNotificationSettings = async (notificationSettings: IUserSettings['notifications']): Promise<boolean> => {
    try {
      isLoading.value = true

      // TODO: Implementar mudança real de notificações
      // await settingsService.updateNotifications(notificationSettings)

      await new Promise(resolve => setTimeout(resolve, 500))

      settings.value.notifications = { ...notificationSettings }

      showSuccess('Configurações de notificação atualizadas!', {
        title: '🔔 Notificações'
      })

      return true
    } catch (error) {
      console.error('Erro ao atualizar notificações:', error)
      showError('Erro ao atualizar notificações. Tente novamente.', {
        title: '❌ Erro'
      })
      return false
    } finally {
      isLoading.value = false
    }
  }

  const updatePrivacySettings = async (privacySettings: IUserSettings['privacy']): Promise<boolean> => {
    try {
      isLoading.value = true

      // TODO: Implementar mudança real de privacidade
      // await settingsService.updatePrivacy(privacySettings)

      await new Promise(resolve => setTimeout(resolve, 500))

      settings.value.privacy = { ...privacySettings }

      showSuccess('Configurações de privacidade atualizadas!', {
        title: '🔒 Privacidade'
      })

      return true
    } catch (error) {
      console.error('Erro ao atualizar privacidade:', error)
      showError('Erro ao atualizar privacidade. Tente novamente.', {
        title: '❌ Erro'
      })
      return false
    } finally {
      isLoading.value = false
    }
  }

  const resetAllSettings = (): void => {
    settings.value = {
      language: 'pt-BR',
      currency: 'BRL',
      theme: 'light',
      notifications: {
        email: true,
        push: true,
        reports: true
      },
      privacy: {
        profilePublic: false,
        shareAnalytics: true
      }
    }

    showWarning('Configurações resetadas para os valores padrão', {
      title: '🔄 Reset Completo'
    })
  }

  const exportSettings = (): string => {
    try {
      const settingsJson = JSON.stringify(settings.value, null, 2)

      // Criar blob e URL para download
      const blob = new Blob([settingsJson], { type: 'application/json' })
      const url = URL.createObjectURL(blob)

      // Criar link temporário para download
      const link = document.createElement('a')
      link.href = url
      link.download = `por-quinho-settings-${new Date().toISOString().split('T')[0]}.json`
      link.click()

      // Limpar URL temporária
      URL.revokeObjectURL(url)

      showSuccess('Configurações exportadas com sucesso!', {
        title: '📁 Export Concluído'
      })

      return settingsJson
    } catch (error) {
      console.error('Erro ao exportar configurações:', error)
      showError('Erro ao exportar configurações. Tente novamente.', {
        title: '❌ Erro'
      })
      return ''
    }
  }

  const importSettings = (settingsJson: string): boolean => {
    try {
      const importedSettings = JSON.parse(settingsJson) as IUserSettings

      // Validar estrutura básica
      if (!importedSettings.language || !importedSettings.currency) {
        throw new Error('Arquivo de configurações inválido')
      }

      settings.value = { ...importedSettings }

      showSuccess('Configurações importadas com sucesso!', {
        title: '📥 Import Concluído'
      })

      return true
    } catch (error) {
      console.error('Erro ao importar configurações:', error)
      showError('Arquivo de configurações inválido. Verifique o arquivo e tente novamente.', {
        title: '❌ Erro no Import'
      })
      return false
    }
  }

  return {
    // Estado
    settings,
    isLoading,

    // Opções
    languageOptions,
    currencyOptions,
    themeOptions,

    // Computed
    currentLanguage,
    currentCurrency,
    currentTheme,

    // Métodos
    updateLanguage,
    updateCurrency,
    updateTheme,
    updateNotificationSettings,
    updatePrivacySettings,
    resetAllSettings,
    exportSettings,
    importSettings
  }
}
