<template>
  <div class="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-600">
    <!-- Header -->
    <div class="px-6 py-4 border-b border-gray-200 dark:border-slate-600">
      <h2 class="text-lg font-semibold text-gray-900 dark:text-slate-100">
        Informações Pessoais
      </h2>
      <p class="text-sm text-gray-600 dark:text-slate-400 mt-1">
        Gerencie suas informações de perfil e preferências pessoais
      </p>
    </div>

    <!-- Form -->
    <div class="px-6 py-6">
      <form @submit.prevent="handleSubmit" class="space-y-6">
        <!-- Nome Completo -->
        <div>
          <label for="fullName" class="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
            Nome Completo *
          </label>
          <input id="fullName" v-model="localProfile.fullName" :disabled="!isEditing" type="text" required
            placeholder="Seu nome completo"
            class="w-full px-3 py-2 border border-gray-300 dark:border-slate-500 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500 dark:bg-slate-700 dark:text-slate-100 disabled:bg-gray-50 dark:disabled:bg-slate-600 disabled:text-gray-500 transition-colors" />
        </div>

        <!-- Email -->
        <div>
          <label for="email" class="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
            Email *
          </label>
          <input id="email" v-model="localProfile.email" :disabled="!isEditing" type="email" required
            placeholder="seu@email.com"
            class="w-full px-3 py-2 border border-gray-300 dark:border-slate-500 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500 dark:bg-slate-700 dark:text-slate-100 disabled:bg-gray-50 dark:disabled:bg-slate-600 disabled:text-gray-500 transition-colors" />
        </div>

        <!-- Telefone -->
        <div>
          <label for="phone" class="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
            Telefone
          </label>
          <input id="phone" v-model="localProfile.phone" :disabled="!isEditing" type="tel" placeholder="(00) 00000-0000"
            @input="handlePhoneInput"
            class="w-full px-3 py-2 border border-gray-300 dark:border-slate-500 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500 dark:bg-slate-700 dark:text-slate-100 disabled:bg-gray-50 dark:disabled:bg-slate-600 disabled:text-gray-500 transition-colors" />
        </div>

        <!-- Localização -->
        <div>
          <label for="location" class="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
            Localização
          </label>
          <input id="location" v-model="localProfile.location" :disabled="!isEditing" type="text"
            placeholder="Cidade, Estado"
            class="w-full px-3 py-2 border border-gray-300 dark:border-slate-500 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500 dark:bg-slate-700 dark:text-slate-100 disabled:bg-gray-50 dark:disabled:bg-slate-600 disabled:text-gray-500 transition-colors" />
        </div>

        <!-- Bio -->
        <div>
          <label for="bio" class="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
            Biografia
          </label>
          <textarea id="bio" v-model="localProfile.bio" :disabled="!isEditing" rows="3"
            placeholder="Conte um pouco sobre você..."
            class="w-full px-3 py-2 border border-gray-300 dark:border-slate-500 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500 dark:bg-slate-700 dark:text-slate-100 disabled:bg-gray-50 dark:disabled:bg-slate-600 disabled:text-gray-500 transition-colors resize-none"></textarea>
          <p class="text-xs text-gray-500 dark:text-slate-400 mt-1">
            Máximo 160 caracteres ({{ bioCharCount }}/160)
          </p>
        </div>

        <!-- Preferências -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <!-- Moeda -->
          <div>
            <label for="currency" class="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
              Moeda Padrão
            </label>
            <select id="currency" v-model="localProfile.currency" :disabled="!isEditing"
              class="w-full px-3 py-2 border border-gray-300 dark:border-slate-500 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500 dark:bg-slate-700 dark:text-slate-100 disabled:bg-gray-50 dark:disabled:bg-slate-600 disabled:text-gray-500 transition-colors">
              <option value="BRL">🇧🇷 Real Brasileiro (R$)</option>
              <option value="USD">🇺🇸 Dólar Americano ($)</option>
              <option value="EUR">🇪🇺 Euro (€)</option>
            </select>
          </div>

          <!-- Idioma -->
          <div>
            <label for="language" class="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
              Idioma
            </label>
            <select id="language" v-model="localProfile.language" :disabled="!isEditing"
              class="w-full px-3 py-2 border border-gray-300 dark:border-slate-500 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500 dark:bg-slate-700 dark:text-slate-100 disabled:bg-gray-50 dark:disabled:bg-slate-600 disabled:text-gray-500 transition-colors">
              <option value="pt-BR">🇧🇷 Português (Brasil)</option>
              <option value="en-US">🇺🇸 English (US)</option>
              <option value="es-ES">🇪🇸 Español (España)</option>
            </select>
          </div>
        </div>

        <!-- Ações (apenas quando editando) -->
        <div v-if="isEditing"
          class="flex justify-between items-center pt-6 border-t border-gray-200 dark:border-slate-600">
          <div class="text-sm text-gray-600 dark:text-slate-400">
            <span v-if="hasChanges" class="flex items-center gap-2">
              <i class="fas fa-circle text-orange-400 text-xs"></i>
              Você tem alterações não salvas
            </span>
            <span v-else class="flex items-center gap-2">
              <i class="fas fa-check-circle text-green-500 text-xs"></i>
              Todas as alterações salvas
            </span>
          </div>

          <div class="flex gap-3">
            <button type="button" @click="$emit('cancel')" :disabled="isLoading"
              class="px-4 py-2 text-gray-600 dark:text-slate-400 hover:text-gray-800 dark:hover:text-slate-200 transition-colors">
              Cancelar
            </button>
            <button type="submit" :disabled="isLoading || !hasChanges"
              class="bg-gradient-to-r from-pink-500 to-rose-500 text-white px-6 py-2 rounded-lg hover:from-pink-600 hover:to-rose-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2">
              <i v-if="isLoading" class="fas fa-spinner fa-spin"></i>
              <i v-else class="fas fa-save"></i>
              {{ isLoading ? 'Salvando...' : 'Salvar Alterações' }}
            </button>
          </div>
        </div>
      </form>
    </div>

    <!-- Dicas -->
    <div v-if="!isEditing" class="px-6 py-4 bg-gray-50 dark:bg-slate-700 rounded-b-xl">
      <div class="flex items-start gap-3">
        <i class="fas fa-lightbulb text-yellow-500 mt-1"></i>
        <div class="text-sm text-gray-600 dark:text-slate-300">
          <p class="font-medium mb-1">🐷 Dica do por.quinho:</p>
          <p>Mantenha suas informações atualizadas para uma experiência personalizada. Um perfil completo ajuda a
            organizar melhor suas finanças!</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import type { IUserProfile } from '../../../types/profile'

interface Props {
  profile: IUserProfile
  isEditing: boolean
  isLoading: boolean
  hasChanges: boolean
}

interface Emits {
  'update': [updates: Partial<IUserProfile>]
  'save': []
  'cancel': []
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

// Estado local
const localProfile = ref<IUserProfile>({ ...props.profile })

// Computed
const bioCharCount = computed(() => localProfile.value.bio?.length || 0)

// Watchers
watch(() => props.profile, (newProfile) => {
  localProfile.value = { ...newProfile }
}, { deep: true })

watch(localProfile, (newProfile) => {
  emit('update', newProfile)
}, { deep: true })

// Métodos
const handleSubmit = () => {
  emit('save')
}

const handlePhoneInput = (event: Event) => {
  const target = event.target as HTMLInputElement
  const value = target.value

  // Formatar telefone automaticamente
  const formatted = formatPhoneNumber(value)
  localProfile.value.phone = formatted
  target.value = formatted
}

const formatPhoneNumber = (value: string): string => {
  // Remove tudo que não é dígito
  const numbers = value.replace(/\D/g, '')

  // Formata para (00) 00000-0000 ou (00) 0000-0000
  if (numbers.length <= 10) {
    return numbers.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3')
  } else {
    return numbers.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3')
  }
}
</script>

<script lang="ts">
export default {
  name: 'ProfileEditor'
}
</script>

<style scoped>
/* Focus states personalizados */
input:focus,
textarea:focus,
select:focus {
  box-shadow: 0 0 0 3px rgba(236, 72, 153, 0.1);
}

/* Transições suaves */
.transition-colors {
  transition: color 0.2s ease, background-color 0.2s ease, border-color 0.2s ease;
}

.transition-all {
  transition: all 0.2s ease;
}

/* Estilização do select */
select {
  background-image: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" /></svg>');
  background-repeat: no-repeat;
  background-position: right 8px center;
  background-size: 16px;
  appearance: none;
}
</style>
