<template>
  <WindowFrame
    v-if="isOpen"
    id="detailed-input"
    title="详细输入编辑器"
    :x="winState.x"
    :y="winState.y"
    :w="winState.w"
    :h="winState.h"
    :z-index="winState.zIndex"
    @close="onClose"
    @focus="handleFocus"
    @update-position="updatePosition"
    @update-size="updateSize"
  >
    <div class="flex-1 flex-col flex bg-surface-container-high">
        <!-- 编辑器主体 -->
        <div class="flex-1 p-0 relative">
            <textarea
                autofocus
                class="w-full h-full bg-transparent border-none resize-none text-on-surface text-base p-6 focus:outline-none focus:ring-0 custom-scrollbar leading-relaxed"
                placeholder="在此输入您的详细陈述..."
                :value="modelValue"
                @input="$emit('update:modelValue', ($event.target as HTMLTextAreaElement).value)"
            />
        </div>

        <!-- 底部操作栏 -->
        <div class="p-4 flex items-center justify-between border-t border-outline-variant/10 bg-surface-container/50 backdrop-blur-sm">
            <div class="text-[10px] text-on-surface-variant/60 font-medium px-2">
                提示: 拖动角落调整大小 • shift+enter 换行
            </div>
            <div class="flex gap-3">
                <button
                    @click="onClose('detailed-input')"
                    class="px-5 py-2 rounded-full text-xs font-bold text-on-surface-variant hover:bg-surface-container-highest transition-colors"
                >
                    取消
                </button>
                <button
                    @click="handleSend"
                    :class="`px-6 py-2 rounded-full text-xs font-bold transition-all shadow-sm hover:shadow-md active:scale-95 flex items-center gap-2 ${buttonStyle}`"
                >
                    <Send :size="14" />
                    提交陈述
                </button>
            </div>
        </div>
    </div>
  </WindowFrame>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { Send } from 'lucide-vue-next';
import WindowFrame from './WindowFrame.vue';
import type { WindowState, UserRole } from '@/types';

const props = defineProps<{
    isOpen: boolean;
    modelValue: string;
    selectedRole: UserRole;
    winState: WindowState;
}>();

const emit = defineEmits<{
    (e: 'update:modelValue', value: string): void;
    (e: 'send'): void;
    (e: 'close', id: string | number): void;
    (e: 'focus'): void;
    (e: 'updatePosition', id: string | number, x: number, y: number): void;
    (e: 'updateSize', id: string | number, w: number, h: number): void;
}>();

const buttonStyle = computed(() => {
    if (props.selectedRole?.includes('Prosecutor')) {
        return 'bg-prosecutor-bg text-prosecutor';
    }
    if (props.selectedRole?.includes('Defense')) {
        return 'bg-defense-bg text-defense';
    }
    return 'bg-primary text-on-primary';
});

function handleSend() {
    emit('send');
    emit('close', 'detailed-input');
}

// Proxy emits
const onClose = (id: string | number) => emit('close', id);
const handleFocus = () => emit('focus');
const updatePosition = (id: string | number, x: number, y: number) => emit('updatePosition', id, x, y);
const updateSize = (id: string | number, w: number, h: number) => emit('updateSize', id, w, h);

</script>
