<template>
  <WindowFrame
    :id="win.id"
    :title="win.title || '窗口'"
    :x="win.x" :y="win.y" :w="win.w" :h="win.h" :z-index="win.zIndex"
    @close="onClose"
    @focus="onFocus"
    @update-position="updatePosition"
    @update-size="updateSize"
  >
    <div class="flex-1 overflow-auto p-6 text-sm bg-surface-container-low text-on-surface custom-scrollbar">
        <div v-if="win.type === 'image'" class="flex flex-col items-center justify-center h-full">
            <img :src="win.url || ''" :alt="win.title" class="max-w-full max-h-full object-contain rounded-lg shadow-sm" />
        </div>
        <div v-else-if="win.type === 'file' && win.url" class="flex flex-col items-center justify-center h-full gap-4 text-on-surface-variant">
            <div class="p-4 bg-surface-container-highest rounded-full">
                <FileText :size="48" />
            </div>
            <div class="text-center">
                <p class="font-bold text-lg mb-1">{{ win.title }}</p>
                <p class="text-xs opacity-70">PDF 文档</p>
            </div>
            <Button size="sm" variant="outline" @click="openInNewTab">
                在新标签页打开
            </Button>
        </div>
        <div v-else class="h-full">
            <MarkdownRenderer :content="win.content" />
        </div>
    </div>
  </WindowFrame>
</template>

<script setup lang="ts">
import { FileText } from 'lucide-vue-next';
import WindowFrame from './WindowFrame.vue';
import Button from './Button.vue';
import MarkdownRenderer from './MarkdownRenderer.vue';
import type { WindowState } from '@/types';

const props = defineProps<{
  win: WindowState;
}>();

const emit = defineEmits<{
  (e: 'close', id: string | number): void;
  (e: 'focus', id: string | number): void;
  (e: 'updatePosition', id: string | number, x: number, y: number): void;
  (e: 'updateSize', id: string | number, w: number, h: number): void;
}>();

function openInNewTab() {
    window.open(props.win.url || '', '_blank');
}

function onClose(id: string | number) { emit('close', id); }
function onFocus(id: string | number) { emit('focus', id); }
function updatePosition(id: string | number, x: number, y: number) { emit('updatePosition', id, x, y); }
function updateSize(id: string | number, w: number, h: number) { emit('updateSize', id, w, h); }
</script>
