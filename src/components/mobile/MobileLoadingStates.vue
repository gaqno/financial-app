<template>
  <div>
    <!-- Record Card Skeletons -->
    <div v-if="type === 'records'" class="space-y-4 p-4">
      <Card v-for="n in count" :key="n" variant="default" size="md">
        <div class="space-y-3">
          <div class="flex items-center justify-between">
            <div class="flex items-center space-x-3">
              <Skeleton variant="circular" width="12" height="12" />
              <Skeleton width="80" height="16" />
              <Skeleton width="16" height="16" />
            </div>
            <div class="flex space-x-2">
              <Skeleton variant="rectangular" width="32" height="32" />
              <Skeleton variant="rectangular" width="32" height="32" />
            </div>
          </div>
          <Skeleton variant="text" :lines="2" />
          <div class="flex justify-between">
            <Skeleton width="128" height="32" />
            <Skeleton width="64" height="24" />
          </div>
        </div>
      </Card>
    </div>

    <!-- Search Result Skeletons -->
    <div v-else-if="type === 'search'" class="space-y-3 p-4">
      <Card v-for="n in count" :key="n" variant="default" size="sm">
        <div class="space-y-2">
          <div class="flex items-start justify-between">
            <div class="flex-1 space-y-1">
              <Skeleton width="75%" height="20" />
              <Skeleton width="80" height="16" />
            </div>
            <div class="text-right space-y-1">
              <Skeleton width="80" height="20" />
              <Skeleton width="64" height="16" />
            </div>
          </div>
          <div class="flex items-center justify-between">
            <Skeleton width="96" height="16" />
            <Skeleton variant="rounded" width="64" height="24" />
          </div>
        </div>
      </Card>
    </div>

    <!-- Spinner Loading -->
    <div v-else-if="type === 'spinner'" class="flex items-center justify-center py-12">
      <Spinner variant="default" size="lg" :message="message" :sub-message="submessage" />
    </div>

    <!-- Pull to Refresh -->
    <div
      v-else-if="type === 'pull-refresh'"
      :style="{ transform: `translateY(${pullDistance}px)` }"
      class="flex items-center justify-center py-4 transition-transform duration-300"
    >
      <div v-if="pullDistance < threshold" class="flex items-center space-x-3">
        <Spinner size="sm" :style="{ transform: `rotate(${pullDistance * 3}deg)` }" />
        <span class="text-gray-600 dark:text-gray-400 text-sm">Puxe para atualizar</span>
      </div>
      <div v-else class="flex items-center space-x-3">
        <Spinner size="sm" />
        <span class="text-blue-600 dark:text-blue-400 text-sm font-medium">Atualizando...</span>
      </div>
    </div>

    <!-- Upload Progress -->
    <div v-else-if="type === 'upload'" class="p-4">
      <Card variant="default" size="lg">
        <div class="text-center space-y-4">
          <Avatar size="xl" icon="fas fa-cloud-upload-alt" variant="primary" class="mx-auto" />

          <div>
            <h3 class="text-lg font-semibold text-gray-900 dark:text-gray-100">
              {{ message || 'Enviando arquivo' }}
            </h3>
            <p class="text-sm text-gray-600 dark:text-gray-400">
              {{ submessage || 'Aguarde enquanto processamos seu arquivo...' }}
            </p>
          </div>

          <Progress :value="progress" size="md" :show-percentage="true" label="Progresso" />

          <Card v-if="fileName" variant="filled" size="sm">
            <div class="flex items-center space-x-3">
              <i class="fas fa-file-csv text-blue-600 dark:text-blue-400"></i>
              <div class="flex-1 min-w-0">
                <p class="text-sm font-medium truncate">{{ fileName }}</p>
                <p class="text-xs text-gray-500 dark:text-gray-400">{{ fileSize }}</p>
              </div>
            </div>
          </Card>
        </div>
      </Card>
    </div>

    <!-- Error State -->
    <div v-else-if="type === 'error'" class="flex items-center justify-center py-12">
      <Alert
        variant="error"
        :title="message || 'Oops! Algo deu errado'"
        :description="submessage || 'Tente novamente em alguns instantes'"
        :icon="true"
        class="max-w-sm"
      >
        <template #actions>
          <Button v-if="showRetry" variant="primary" size="md" left-icon="fas fa-redo" @click="$emit('retry')">
            Tentar Novamente
          </Button>
        </template>
      </Alert>
    </div>

    <!-- Empty State -->
    <div v-else-if="type === 'empty'" class="flex items-center justify-center py-16">
      <div class="text-center max-w-sm mx-auto px-4 space-y-6">
        <Avatar size="2xl" :icon="emptyIcon || 'fas fa-inbox'" variant="secondary" class="mx-auto" />

        <div>
          <h3 class="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
            {{ message || 'Nada por aqui' }}
          </h3>
          <p class="text-sm text-gray-600 dark:text-gray-400">
            {{ submessage || 'Comece adicionando sua primeira transação' }}
          </p>
        </div>

        <Button
          v-if="showAction"
          variant="primary"
          size="lg"
          left-icon="fas fa-plus"
          class="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
          @click="$emit('action')"
        >
          {{ actionText || 'Adicionar Agora' }}
        </Button>
      </div>
    </div>

    <!-- Success State -->
    <div v-else-if="type === 'success'" class="flex items-center justify-center py-12">
      <Alert
        variant="success"
        :title="message || 'Sucesso!'"
        :description="submessage || 'Operação realizada com sucesso'"
        :icon="true"
        class="max-w-sm"
      />
    </div>

    <!-- Network Offline State -->
    <div v-else-if="type === 'offline'" class="flex items-center justify-center py-12">
      <Alert
        variant="warning"
        title="Sem conexão"
        description="Você está offline. Suas alterações serão sincronizadas quando a conexão for restabelecida."
        :icon="true"
        class="max-w-sm"
      >
        <template #footer>
          <div class="flex items-center justify-center space-x-2 text-xs text-orange-600 dark:text-orange-400">
            <div class="w-2 h-2 bg-orange-500 rounded-full animate-pulse"></div>
            <span>Modo offline ativo</span>
          </div>
        </template>
      </Alert>
    </div>
  </div>
</template>

<script setup lang="ts">
  import Card from '../ui/card/Card.vue';
  import Skeleton from '../ui/skeleton/Skeleton.vue';
  import Spinner from '../ui/spinner/Spinner.vue';
  import Progress from '../ui/progress/Progress.vue';
  import Alert from '../ui/alert/Alert.vue';
  import Button from '../ui/button/Button.vue';
  import Avatar from '../ui/avatar/Avatar.vue';

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

<script lang="ts">
  export default {
    name: 'MobileLoadingStates',
  };
</script>

<!-- Styles now handled by UI components -->
