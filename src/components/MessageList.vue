<template>
  <div class="flex-1 overflow-y-auto p-6 space-y-6 scroll-smooth pb-32" ref="containerRef">
    <template v-for="msg in filteredMessages" :key="msg.id">
      <!-- 系统消息 -->
      <div v-if="msg.role === 'system'" class="flex justify-center my-4">
        <span class="text-xs text-on-surface-variant/70 bg-surface-container-high/60 
                   px-4 py-1.5 rounded-full backdrop-blur-sm border border-outline-variant/10
                   shadow-sm max-w-md text-center leading-relaxed">
          {{ msg.content }}
        </span>
      </div>

      <!-- 标准消息 -->
      <div
        v-else
        class="flex gap-4 items-start max-w-3xl group"
        :class="msg.isSelf ? 'ml-auto flex-row-reverse' : ''"
      >
        <Avatar :role="msg.role" />
        <div class="space-y-1 min-w-0 flex-1 flex flex-col" :class="msg.isSelf ? 'items-end' : 'items-start'">
          <div class="flex items-center gap-2 opacity-80" :class="msg.isSelf ? 'flex-row-reverse' : ''">
            <span class="font-bold text-on-surface text-sm">{{ msg.name }}</span>
            <Badge :role="msg.role" />
            <span class="text-[10px] text-on-surface-variant font-medium">{{ msg.timestamp }}</span>
          </div>
          
          <div 
            class="text-sm leading-relaxed px-5 py-3.5 shadow-sm whitespace-pre-wrap prose prose-sm max-w-none 
                   prose-headings:text-inherit prose-p:my-1 prose-ul:my-1 prose-li:my-0.5 prose-strong:text-inherit
                   prose-code:text-inherit prose-code:bg-transparent prose-code:p-0 prose-code:font-sans prose-code:font-normal prose-code:text-[1em] prose-code:before:content-none prose-code:after:content-none
                   prose-pre:bg-transparent prose-pre:text-inherit prose-pre:p-0 prose-pre:m-0 prose-pre:font-sans prose-pre:text-[1em] prose-pre:shadow-none prose-pre:border-none"
            :class="getBubbleStyles(msg.role, msg.isSelf || false)"
          >
            <MarkdownRenderer :content="msg.content" />
          </div>
        </div>
      </div>
    </template>

    <!-- 空状态 -->
    <div v-if="showEmptyState" class="flex flex-col items-center justify-center p-10 opacity-20 select-none pointer-events-none absolute inset-0">
      <div class="rounded-full bg-surface-container-highest p-8 mb-4">
        <ShieldCheck :size="64" class="text-on-surface-variant" :stroke-width="1" />
      </div>
      <p class="text-lg font-medium text-on-surface-variant">庭审系统已就绪</p>
    </div>

    <div ref="messagesEndRef" />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick } from 'vue';
import { ShieldCheck } from 'lucide-vue-next';
import Avatar from './Avatar.vue';
import Badge from './Badge.vue';
import MarkdownRenderer from './MarkdownRenderer.vue';
import { getBubbleStyles } from '@/utils/roleStyles';
import type { Message, UIRole } from '@/types';

const props = defineProps<{
  messages: Message[];
  roleFilter: string; // 'all' or specific role
}>();

const messagesEndRef = ref<HTMLElement | null>(null);

// 过滤消息
const filteredMessages = computed(() => {
  return props.roleFilter === 'all'
    ? props.messages
    : props.messages.filter(m => m.role === props.roleFilter);
});

const showEmptyState = computed(() => filteredMessages.value.length === 0);

// 自动滚动
watch(
  () => props.messages.length,
  () => {
    nextTick(() => {
      messagesEndRef.value?.scrollIntoView({ behavior: 'smooth' });
    });
  }
);
</script>
