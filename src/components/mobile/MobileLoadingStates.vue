<template>
  <div>
    <!-- Skeleton Loader for Record Cards -->
    <div v-if="type === 'records'" class="space-y-4 p-4">
      <div v-for="n in count" :key="n" class="animate-pulse">
        <div class="bg-white dark:bg-slate-800 rounded-2xl p-4 shadow-sm border border-gray-200 dark:border-slate-600">
          <!-- Header skeleton -->
          <div class="flex items-center justify-between mb-3">
            <div class="flex items-center space-x-3">
              <div class="w-3 h-3 bg-gray-300 dark:bg-slate-600 rounded-full"></div>
              <div class="h-4 bg-gray-300 dark:bg-slate-600 rounded w-20"></div>
              <div class="h-4 bg-gray-300 dark:bg-slate-600 rounded w-4"></div>
            </div>
            <div class="flex space-x-2">
              <div class="w-8 h-8 bg-gray-300 dark:bg-slate-600 rounded-lg"></div>
              <div class="w-8 h-8 bg-gray-300 dark:bg-slate-600 rounded-lg"></div>
            </div>
          </div>

          <!-- Content skeleton -->
          <div class="mb-3">
            <div class="h-6 bg-gray-300 dark:bg-slate-600 rounded w-3/4 mb-2"></div>
            <div class="flex items-center space-x-2">
              <div class="w-4 h-4 bg-gray-300 dark:bg-slate-600 rounded"></div>
              <div class="h-4 bg-gray-300 dark:bg-slate-600 rounded w-24"></div>
            </div>
          </div>

          <!-- Value skeleton -->
          <div class="flex items-center justify-between mb-3">
            <div class="h-8 bg-gray-300 dark:bg-slate-600 rounded w-32"></div>
            <div class="h-6 bg-gray-300 dark:bg-slate-600 rounded w-16"></div>
          </div>

          <!-- Footer skeleton -->
          <div class="flex items-center justify-between">
            <div class="h-8 bg-gray-300 dark:bg-slate-600 rounded-full w-20"></div>
            <div class="h-8 bg-gray-300 dark:bg-slate-600 rounded-xl w-24"></div>
          </div>
        </div>
      </div>
    </div>

    <!-- Skeleton Loader for Search Results -->
    <div v-else-if="type === 'search'" class="space-y-3 p-4">
      <div v-for="n in count" :key="n" class="animate-pulse">
        <div class="bg-white dark:bg-slate-800 rounded-xl p-4 border border-gray-200 dark:border-slate-600">
          <div class="flex items-start justify-between mb-2">
            <div class="flex-1">
              <div class="h-5 bg-gray-300 dark:bg-slate-600 rounded w-3/4 mb-1"></div>
              <div class="h-4 bg-gray-300 dark:bg-slate-600 rounded w-20"></div>
            </div>
            <div class="text-right">
              <div class="h-5 bg-gray-300 dark:bg-slate-600 rounded w-20 mb-1"></div>
              <div class="h-4 bg-gray-300 dark:bg-slate-600 rounded w-16"></div>
            </div>
          </div>
          <div class="flex items-center justify-between">
            <div class="h-4 bg-gray-300 dark:bg-slate-600 rounded w-24"></div>
            <div class="h-6 bg-gray-300 dark:bg-slate-600 rounded-full w-16"></div>
          </div>
        </div>
      </div>
    </div>

    <!-- Spinner Loader -->
    <div v-else-if="type === 'spinner'" class="flex items-center justify-center py-12">
      <div class="relative">
        <!-- Modern iOS-style spinner -->
        <div
          class="w-10 h-10 border-4 border-gray-200 dark:border-slate-600 rounded-full animate-spin border-t-blue-500"
        >
          >
        </div>

        <!-- Pulse effect -->
        <div class="absolute inset-0 w-10 h-10 border-4 border-blue-500 rounded-full animate-ping opacity-20"></div>
      </div>

      <div v-if="message" class="ml-4">
        <p class="text-gray-600 dark:text-slate-400 font-medium">{{ message }}</p>
        <p v-if="submessage" class="text-sm text-gray-500 dark:text-slate-500">
          {{ submessage }}
        </p>
      </div>
    </div>

    <!-- Pull to Refresh Indicator -->
    <div
      v-else-if="type === 'pull-refresh'"
      :style="{ transform: `translateY(${pullDistance}px)` }"
      class="flex items-center justify-center py-4 transition-transform duration-300"
    >
      >
      <div v-if="pullDistance < threshold" class="flex items-center space-x-3">
        <div
          class="w-6 h-6 border-2 border-gray-400 dark:border-slate-500 rounded-full border-t-blue-500 transition-transform duration-300"
          :style="{ transform: `rotate(${pullDistance * 3}deg)` }"
        ></div>
        <span class="text-gray-600 dark:text-slate-400 text-sm">Puxe para atualizar</span>
      </div>

      <div v-else class="flex items-center space-x-3">
        <div class="w-6 h-6 border-2 border-blue-500 rounded-full border-t-transparent animate-spin"></div>
        <span class="text-blue-600 dark:text-blue-400 text-sm font-medium">Atualizando...</span>
      </div>
    </div>

    <!-- Upload Progress -->
    <div v-else-if="type === 'upload'" class="p-4">
      <div class="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-gray-200 dark:border-slate-600">
        <div class="text-center mb-4">
          <div
            class="w-16 h-16 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mx-auto mb-3"
          >
            <i class="fas fa-cloud-upload-alt text-2xl text-blue-600 dark:text-blue-400"></i>
          </div>
          <h3 class="text-lg font-semibold text-gray-900 dark:text-slate-100 mb-1">
            {{ message || 'Enviando arquivo' }}
          </h3>
          <p class="text-sm text-gray-600 dark:text-slate-400">
            {{ submessage || 'Aguarde enquanto processamos seu arquivo...' }}
          </p>
        </div>

        <!-- Progress Bar -->
        <div class="mb-4">
          <div class="flex items-center justify-between text-sm text-gray-600 dark:text-slate-400 mb-2">
            <span>Progresso</span>
            <span>{{ Math.round(progress) }}%</span>
          </div>
          <div class="w-full bg-gray-200 dark:bg-slate-700 rounded-full h-2">
            <div
              class="bg-gradient-to-r from-blue-500 to-purple-600 h-2 rounded-full transition-all duration-300 ease-out"
              :style="{ width: `${progress}%` }"
            ></div>
          </div>
        </div>

        <!-- File Info -->
        <div v-if="fileName" class="flex items-center space-x-3 p-3 bg-gray-50 dark:bg-slate-700 rounded-lg">
          <i class="fas fa-file-csv text-blue-600 dark:text-blue-400"></i>
          <div class="flex-1 min-w-0">
            <p class="text-sm font-medium text-gray-900 dark:text-slate-100 truncate">
              {{ fileName }}
            </p>
            <p class="text-xs text-gray-500 dark:text-slate-400">{{ fileSize }}</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Error State -->
    <div v-else-if="type === 'error'" class="flex items-center justify-center py-12">
      <div class="text-center max-w-sm mx-auto px-4">
        <div class="w-16 h-16 bg-red-100 dark:bg-red-900 rounded-full flex items-center justify-center mx-auto mb-4">
          <i class="fas fa-exclamation-triangle text-2xl text-red-600 dark:text-red-400"></i>
        </div>
        <h3 class="text-lg font-semibold text-gray-900 dark:text-slate-100 mb-2">
          {{ message || 'Oops! Algo deu errado' }}
          }}
        </h3>
        <p class="text-sm text-gray-600 dark:text-slate-400 mb-4">
          {{ submessage || 'Tente novamente em alguns instantes' }}
          }}
        </p>

        <button
          v-if="showRetry"
          @click="$emit('retry')"
          class="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-xl font-medium transition-colors"
        >
          <i class="fas fa-redo mr-2"></i>
          Tentar Novamente
        </button>
      </div>
    </div>

    <!-- Empty State -->
    <div v-else-if="type === 'empty'" class="flex items-center justify-center py-16">
      <div class="text-center max-w-sm mx-auto px-4">
        <div class="w-20 h-20 bg-gray-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
          <i :class="emptyIcon || 'fas fa-inbox'" class="text-3xl text-gray-400 dark:text-slate-500"></i>
        </div>
        <h3 class="text-lg font-semibold text-gray-900 dark:text-slate-100 mb-2">
          {{ message || 'Nada por aqui' }}
        </h3>
        <p class="text-sm text-gray-600 dark:text-slate-400 mb-6">
          {{ submessage || 'Comece adicionando sua primeira transação' }}
        </p>

        <button
          v-if="showAction"
          @click="$emit('action')"
          class="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-6 py-3 rounded-xl font-medium transition-all duration-200 hover:scale-105"
        >
          <i class="fas fa-plus mr-2"></i>
          {{ actionText || 'Adicionar Agora' }}
        </button>
      </div>
    </div>

    <!-- Success State -->
    <div v-else-if="type === 'success'" class="flex items-center justify-center py-12">
      <div class="text-center max-w-sm mx-auto px-4">
        <div
          class="w-16 h-16 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mx-auto mb-4 animate-bounce"
        >
          <i class="fas fa-check text-2xl text-green-600 dark:text-green-400"></i>
        </div>
        <h3 class="text-lg font-semibold text-gray-900 dark:text-slate-100 mb-2">
          {{ message || 'Sucesso!' }}
        </h3>
        <p class="text-sm text-gray-600 dark:text-slate-400">
          {{ submessage || 'Operação realizada com sucesso' }}
        </p>
      </div>
    </div>

    <!-- Network Offline State -->
    <div v-else-if="type === 'offline'" class="flex items-center justify-center py-12">
      <div class="text-center max-w-sm mx-auto px-4">
        <div
          class="w-16 h-16 bg-orange-100 dark:bg-orange-900 rounded-full flex items-center justify-center mx-auto mb-4"
        >
          <i class="fas fa-wifi text-2xl text-orange-600 dark:text-orange-400 transform rotate-45"></i>
        </div>
        <h3 class="text-lg font-semibold text-gray-900 dark:text-slate-100 mb-2">Sem conexão</h3>
        <p class="text-sm text-gray-600 dark:text-slate-400 mb-4">
          Você está offline. Suas alterações serão sincronizadas quando a conexão for restabelecida.
        </p>

        <div class="flex items-center justify-center space-x-2 text-xs text-orange-600 dark:text-orange-400">
          <div class="w-2 h-2 bg-orange-500 rounded-full animate-pulse"></div>
          <span>Modo offline ativo</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
  // Props
  interface Props {
    type: 'records' | 'search' | 'spinner' | 'pull-refresh' | 'upload' | 'error' | 'empty' | 'success' | 'offline';
    count?: number;
    message?: string;
    submessage?: string;
    pullDistance?: number;
    threshold?: number;
    progress?: number;
    fileName?: string;
    fileSize?: string;
    showRetry?: boolean;
    showAction?: boolean;
    actionText?: string;
    emptyIcon?: string;
  }

  // Emits
  interface Emits {
    retry: [];
    action: [];
  }

  withDefaults(defineProps<Props>(), {
    count: 3,
    pullDistance: 0,
    threshold: 80,
    progress: 0,
    showRetry: true,
    showAction: true,
  });

  defineEmits<Emits>();
</script>

<style scoped>
  /* Enhanced animations */
  @keyframes shimmer {
    0% {
      background-position: -200px 0;
    }

    100% {
      background-position: calc(200px + 100%) 0;
    }
  }

  .animate-pulse {
    animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
  }

  /* Skeleton shimmer effect */
  .animate-pulse > div {
    background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
    background-size: 200px 100%;
    animation: shimmer 1.5s infinite;
  }

  .dark .animate-pulse > div {
    background: linear-gradient(90deg, #374151 25%, #4b5563 50%, #374151 75%);
    background-size: 200px 100%;
  }

  /* Smooth transitions for all states */
  .transition-all {
    transition: all 0.3s ease;
  }

  /* Enhanced bounce animation for success */
  @keyframes bounce {
    0%,
    20%,
    53%,
    80%,
    100% {
      transform: translate3d(0, 0, 0);
    }

    40%,
    43% {
      transform: translate3d(0, -20px, 0);
    }

    70% {
      transform: translate3d(0, -10px, 0);
    }

    90% {
      transform: translate3d(0, -4px, 0);
    }
  }

  .animate-bounce {
    animation: bounce 1s ease infinite;
  }
</style>
