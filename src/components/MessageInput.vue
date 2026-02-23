<template>
  <div class="absolute bottom-6 left-1/2 -translate-x-1/2 w-full max-w-3xl px-4 z-30 transition-all duration-300 ease-in-out"
       :class="isLongFormMode ? 'translate-y-[200%] opacity-0 pointer-events-none' : 'translate-y-0 opacity-100'">
    
    <!-- 中断输入模式 -->
    <template v-if="isInterrupted && interruptState">
       <!-- Boolean Input -->
       <div v-if="interruptState.inputType === 'boolean'" class="bg-surface-container-high rounded-full shadow-lg p-2 flex justify-center gap-4">
          <button @click="handleInterruptResponse(true)" class="px-6 py-2 bg-primary/10 hover:bg-primary/20 text-primary rounded-full font-bold transition-colors">是</button>
          <button @click="handleInterruptResponse(false)" class="px-6 py-2 bg-error/10 hover:bg-error/20 text-error rounded-full font-bold transition-colors">否</button>
       </div>

       <!-- Evidence Input Hint -->
       <div v-else-if="interruptState.inputType === 'evidence'" class="w-full max-w-md mx-auto text-center py-6">
          <div class="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium shadow-sm bg-surface-container-high">
              <span class="animate-pulse">●</span>
              请在浮动窗口中选择证据
          </div>
       </div>

       <!-- String Input (Fallback to main input area if complex, but here specific string interrupt) -->
       <div v-else class="relative shadow-lg rounded-full bg-surface-container-high flex items-center p-2 border border-outline-variant/20 transition-all min-h-[56px] ring-0 focus-within:ring-2 ring-primary/50">
          <textarea
              ref="textareaRef"
              rows="1"
              class="flex-1 bg-transparent border-none text-on-surface px-4 text-sm focus:outline-none focus:ring-0 resize-none max-h-32 py-2.5 placeholder:text-on-surface-variant/50 custom-scrollbar"
              placeholder="请输入您的回答..."
              :value="inputValue"
              @input="handleChange"
              @keydown="handleKeyDownInterrupted"
              autofocus
          />
          <button
             @click="() => handleInterruptResponse(inputValue)"
             class="p-2.5 rounded-full bg-primary text-on-primary shadow-md hover:bg-primary/90 transition-all"
          >
             <Send :size="20" />
          </button>
       </div>
    </template>

    <!-- 常规输入模式 -->
    <div v-else class="relative shadow-lg rounded-full bg-surface-container-high flex items-center p-2 border border-outline-variant/20 transition-all min-h-[56px] ring-0 focus-within:ring-2 ring-primary/50">
      
      <!-- 1. 庭审结束 -->
      <div v-if="isEnded" class="flex-1 flex items-center justify-center h-full py-2 text-on-surface-variant/50 text-sm">
          庭审已结束
      </div>

      <!-- 2. 庭审未开始 -->
      <div v-else-if="!isStarted" class="flex-1 flex items-center justify-center h-full py-2 text-on-surface-variant/50 text-sm">
          庭审未开始
      </div>

      <!-- 3. 非发言回合 -->
      <div v-else-if="!isTurnToSpeak" class="flex-1 flex items-center justify-center h-full py-2">
          <ThinkingIndicator />
      </div>

      <!-- 4. 发言回合 -->
      <textarea
          v-else
          ref="textareaRef"
          rows="1"
          class="flex-1 bg-transparent border-none text-on-surface px-4 text-sm focus:outline-none focus:ring-0 resize-none max-h-32 py-2.5 placeholder:text-on-surface-variant/50 custom-scrollbar"
          placeholder="输入您的发言..."
          :value="inputValue"
          @input="handleChange"
          @keydown="handleKeyDown"
          autofocus
      />

      <!-- 按钮区域 -->
      <div class="flex items-center gap-1 pr-1">
          <button
              class="p-2.5 rounded-full text-on-surface-variant hover:bg-primary hover:text-on-primary transition-colors focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none disabled:opacity-50"
              title="展开输入框"
              @click="emit('expandInput')"
              :disabled="!isTurnToSpeak || isEnded || !isStarted"
          >
              <Maximize2 :size="18" />
          </button>
          <button
              @click="onSendMessage"
              :disabled="!isTurnToSpeak || isEnded || !isStarted"
              class="p-2.5 rounded-full transition-all duration-300 focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none disabled:opacity-50 disabled:bg-surface-container-highest disabled:text-on-surface-variant/50"
              :class="inputValue.trim() && isTurnToSpeak ? 'bg-primary text-on-primary shadow-md scale-100 hover:bg-primary/90' : 'bg-surface-container text-on-surface-variant scale-95'"
          >
              <Send :size="20" />
          </button>
      </div>
    </div>

    <div class="text-center mt-2 text-[10px] text-on-surface-variant/40 font-medium">
        {{ isTurnToSpeak ? '按下 Enter 发送，Shift + Enter 换行' : '庭审进行中，请等待...' }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { Send, Maximize2 } from 'lucide-vue-next';
import ThinkingIndicator from './ThinkingIndicator.vue';
import type { InterruptState, EvidenceInputPayload } from '@/types';

const props = defineProps<{
  inputValue: string;
  isTurnToSpeak: boolean;
  isLongFormMode: boolean;
  interruptState?: InterruptState;
  currentPhase?: string;
  isConnected?: boolean;
}>();

const emit = defineEmits<{
  (e: 'update:inputValue', value: string): void;
  (e: 'sendMessage'): void;
  (e: 'expandInput'): void;
  (e: 'respondToInterrupt', payload: boolean | string | EvidenceInputPayload): void;
}>();

const textareaRef = ref<HTMLTextAreaElement | null>(null);

const isInterrupted = computed(() => props.interruptState?.isInterrupted && props.interruptState.inputType);
const isEnded = computed(() => props.currentPhase === 'END' || props.currentPhase === '结案' || props.currentPhase === '已结束');
const isStarted = computed(() => props.isConnected && props.currentPhase && props.currentPhase !== 'START');

function handleChange(e: Event) {
  const target = e.target as HTMLTextAreaElement;
  emit('update:inputValue', target.value);
  // Auto resize
  target.style.height = 'auto';
  target.style.height = `${Math.min(target.scrollHeight, 120)}px`;
}

function handleKeyDown(e: KeyboardEvent) {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    emit('sendMessage');
  }
}

function handleKeyDownInterrupted(e: KeyboardEvent) {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    emit('respondToInterrupt', props.inputValue);
  }
}

function handleInterruptResponse(payload: boolean | string | EvidenceInputPayload) {
  emit('respondToInterrupt', payload);
}

function onSendMessage() {
    emit('sendMessage');
}
</script>
