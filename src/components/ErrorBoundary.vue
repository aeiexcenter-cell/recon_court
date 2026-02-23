<template>
  <div v-if="error" class="min-h-screen w-full flex items-center justify-center bg-surface p-6">
    <div class="max-w-md w-full bg-surface-container-high rounded-xl border border-error/20 shadow-xl overflow-hidden">
      <div class="bg-error/10 p-6 flex flex-col items-center justify-center border-b border-error/10">
        <div class="h-16 w-16 rounded-full bg-error/20 flex items-center justify-center mb-4">
          <AlertTriangle class="h-8 w-8 text-error" />
        </div>
        <h2 class="text-xl font-bold text-on-surface">应用程序遇到错误</h2>
      </div>
      
      <div class="p-6 space-y-4">
        <div class="bg-surface-container p-4 rounded-lg border border-outline-variant/30 text-sm font-mono text-error break-all">
          {{ errorMessage }}
        </div>
        
        <p class="text-on-surface-variant text-sm text-center">
          很抱歉，程序发生了一个意外错误。您可以尝试刷新页面或点击下方按钮重试。
        </p>
        
        <div class="flex gap-3 justify-center mt-4">
          <button 
            @click="reloadPage" 
            class="px-4 py-2 rounded-full border border-outline-variant hover:bg-surface-container-highest transition-colors text-sm font-medium"
          >
            刷新页面
          </button>
          <button 
            @click="retry" 
            class="px-4 py-2 rounded-full bg-primary text-on-primary hover:bg-primary/90 transition-colors text-sm font-medium shadow-sm"
          >
            重试组件
          </button>
        </div>
      </div>
    </div>
  </div>
  <slot v-else />
</template>

<script setup lang="ts">
import { ref, onErrorCaptured } from 'vue';
import { AlertTriangle } from 'lucide-vue-next';

const error = ref(false);
const errorMessage = ref('');

onErrorCaptured((err) => {
  console.error('ErrorBoundary captured:', err);
  error.value = true;
  errorMessage.value = err instanceof Error ? err.message : String(err);
  return false; // Prevent error from propagating further
});

function retry() {
  error.value = false;
  errorMessage.value = '';
}

function reloadPage() {
  window.location.reload();
}
</script>
