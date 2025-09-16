<template>
  <div class="space-y-6">
    <!-- Idioma -->
    <div class="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-600">
      <div class="px-6 py-4 border-b border-gray-200 dark:border-slate-600">
        <h3 class="text-lg font-semibold text-gray-900 dark:text-slate-100 flex items-center gap-2">
          🌍 Idioma e Região
        </h3>
        <p class="text-sm text-gray-600 dark:text-slate-400 mt-1">
          Configure o idioma da interface e preferências regionais
        </p>
      </div>

      <div class="p-6 space-y-4">
        <!-- Idioma -->
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-3"> Idioma da Interface </label>
          <div class="space-y-2">
            <div
              v-for="language in languageOptions"
              :key="language.code"
              @click="updateLanguage(language.code)"
              class="flex items-center justify-between p-3 border border-gray-200 dark:border-slate-600 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors"
              :class="{
                'border-pink-500 bg-pink-50 dark:bg-pink-900/20': currentLanguage?.code === language.code,
              }"
            >
              <div class="flex items-center gap-3">
                <span class="text-2xl">{{ language.flag }}</span>
                <div>
                  <p class="font-medium text-gray-900 dark:text-slate-100">{{ language.name }}</p>
                </div>
              </div>
              <div v-if="currentLanguage?.code === language.code" class="text-pink-500">
                <i class="fas fa-check-circle"></i>
              </div>
            </div>
          </div>
        </div>

        <!-- Moeda -->
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-3"> Moeda Padrão </label>
          <div class="space-y-2">
            <div
              v-for="currency in currencyOptions"
              :key="currency.code"
              @click="updateCurrency(currency.code)"
              class="flex items-center justify-between p-3 border border-gray-200 dark:border-slate-600 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors"
              :class="{
                'border-pink-500 bg-pink-50 dark:bg-pink-900/20': currentCurrency?.code === currency.code,
              }"
            >
              <div class="flex items-center gap-3">
                <span class="text-lg font-bold text-gray-600 dark:text-slate-400 w-8">
                  {{ currency.symbol }}
                </span>
                <div>
                  <p class="font-medium text-gray-900 dark:text-slate-100">{{ currency.name }}</p>
                  <p class="text-sm text-gray-500 dark:text-slate-400">{{ currency.code }}</p>
                </div>
              </div>
              <div v-if="currentCurrency?.code === currency.code" class="text-pink-500">
                <i class="fas fa-check-circle"></i>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Tema -->
    <div class="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-600">
      <div class="px-6 py-4 border-b border-gray-200 dark:border-slate-600">
        <h3 class="text-lg font-semibold text-gray-900 dark:text-slate-100 flex items-center gap-2">🎨 Aparência</h3>
        <p class="text-sm text-gray-600 dark:text-slate-400 mt-1">Personalize o visual da aplicação</p>
      </div>

      <div class="p-6">
        <label class="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-3">Tema</label>
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div
            v-for="theme in themeOptions"
            :key="theme.value"
            @click="updateTheme(theme.value as any)"
            class="flex flex-col items-center p-4 border border-gray-200 dark:border-slate-600 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors text-center"
            :class="{
              'border-pink-500 bg-pink-50 dark:bg-pink-900/20': currentTheme?.value === theme.value,
            }"
          >
            <span class="text-2xl mb-2">{{ theme.icon }}</span>
            <p class="font-medium text-gray-900 dark:text-slate-100">{{ theme.label }}</p>
            <div v-if="currentTheme?.value === theme.value" class="text-pink-500 mt-2">
              <i class="fas fa-check-circle"></i>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Notificações -->
    <div class="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-600">
      <div class="px-6 py-4 border-b border-gray-200 dark:border-slate-600">
        <h3 class="text-lg font-semibold text-gray-900 dark:text-slate-100 flex items-center gap-2">🔔 Notificações</h3>
        <p class="text-sm text-gray-600 dark:text-slate-400 mt-1">Configure como você quer receber notificações</p>
      </div>

      <div class="p-6 space-y-4">
        <!-- Email -->
        <div class="flex items-center justify-between">
          <div>
            <p class="font-medium text-gray-900 dark:text-slate-100">Notificações por Email</p>
            <p class="text-sm text-gray-500 dark:text-slate-400">Receba atualizações importantes por email</p>
          </div>
          <label class="relative inline-flex items-center cursor-pointer">
            <input
              v-model="localNotifications.email"
              type="checkbox"
              class="sr-only peer"
              @change="updateNotifications"
            />
            <div
              class="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-pink-300 dark:peer-focus:ring-pink-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-pink-600"
            >
              >
            </div>
          </label>
        </div>

        <!-- Push -->
        <div class="flex items-center justify-between">
          <div>
            <p class="font-medium text-gray-900 dark:text-slate-100">Notificações Push</p>
            <p class="text-sm text-gray-500 dark:text-slate-400">Receba notificações em tempo real no navegador</p>
          </div>
          <label class="relative inline-flex items-center cursor-pointer">
            <input
              v-model="localNotifications.push"
              type="checkbox"
              class="sr-only peer"
              @change="updateNotifications"
            />
            <div
              class="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-pink-300 dark:peer-focus:ring-pink-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-pink-600"
            >
              >
            </div>
          </label>
        </div>

        <!-- Relatórios -->
        <div class="flex items-center justify-between">
          <div>
            <p class="font-medium text-gray-900 dark:text-slate-100">Relatórios Mensais</p>
            <p class="text-sm text-gray-500 dark:text-slate-400">Receba resumos mensais das suas finanças</p>
          </div>
          <label class="relative inline-flex items-center cursor-pointer">
            <input
              v-model="localNotifications.reports"
              type="checkbox"
              class="sr-only peer"
              @change="updateNotifications"
            />
            <div
              class="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-pink-300 dark:peer-focus:ring-pink-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-pink-600"
            >
              >
            </div>
          </label>
        </div>
      </div>
    </div>

    <!-- Privacidade -->
    <div class="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-600">
      <div class="px-6 py-4 border-b border-gray-200 dark:border-slate-600">
        <h3 class="text-lg font-semibold text-gray-900 dark:text-slate-100 flex items-center gap-2">🔒 Privacidade</h3>
        <p class="text-sm text-gray-600 dark:text-slate-400 mt-1">Controle como seus dados são utilizados</p>
      </div>

      <div class="p-6 space-y-4">
        <!-- Perfil Público -->
        <div class="flex items-center justify-between">
          <div>
            <p class="font-medium text-gray-900 dark:text-slate-100">Perfil Público</p>
            <p class="text-sm text-gray-500 dark:text-slate-400">Permitir que outros usuários vejam seu perfil</p>
          </div>
          <label class="relative inline-flex items-center cursor-pointer">
            <input v-model="localPrivacy.profilePublic" type="checkbox" class="sr-only peer" @change="updatePrivacy" />
            <div
              class="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-pink-300 dark:peer-focus:ring-pink-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-pink-600"
            >
              >
            </div>
          </label>
        </div>

        <!-- Analytics -->
        <div class="flex items-center justify-between">
          <div>
            <p class="font-medium text-gray-900 dark:text-slate-100">Compartilhar Analytics</p>
            <p class="text-sm text-gray-500 dark:text-slate-400">
              Ajude a melhorar o por.quinho compartilhando dados anônimos de uso
            </p>
          </div>
          <label class="relative inline-flex items-center cursor-pointer">
            <input v-model="localPrivacy.shareAnalytics" type="checkbox" class="sr-only peer" @change="updatePrivacy" />
            <div
              class="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-pink-300 dark:peer-focus:ring-pink-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-pink-600"
            >
              >
            </div>
          </label>
        </div>
      </div>
    </div>

    <!-- Loading Overlay -->
    <div v-if="isLoading" class="fixed inset-0 bg-black/20 flex items-center justify-center z-50">
      <div class="bg-white dark:bg-slate-800 rounded-lg p-6 flex items-center gap-3">
        <i class="fas fa-spinner fa-spin text-pink-500"></i>
        <span class="text-gray-700 dark:text-slate-300">Salvando configurações...</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { ref } from 'vue';
  import { useSettings } from '../../../composables/profile/useSettings';

  // Hooks
  const {
    settings,
    isLoading,
    languageOptions,
    currencyOptions,
    themeOptions,
    currentLanguage,
    currentCurrency,
    currentTheme,
    updateLanguage,
    updateCurrency,
    updateTheme,
    updateNotificationSettings,
    updatePrivacySettings,
  } = useSettings();

  // Estado local para edição reativa
  const localNotifications = ref({ ...settings.value.notifications });
  const localPrivacy = ref({ ...settings.value.privacy });

  // Métodos
  const updateNotifications = () => {
    updateNotificationSettings(localNotifications.value);
  };

  const updatePrivacy = () => {
    updatePrivacySettings(localPrivacy.value);
  };
</script>

<script lang="ts">
  export default {
    name: 'SettingsPanel',
  };
</script>

<style scoped>
  /* Toggle switch styling já está no Tailwind */
  .transition-colors {
    transition:
      color 0.2s ease,
      background-color 0.2s ease,
      border-color 0.2s ease;
  }
</style>
