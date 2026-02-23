<template>
  <div
    :class="`fixed rounded-[28px] bg-surface-container-high shadow-2xl border border-outline-variant/20 overflow-hidden flex flex-col animate-in zoom-in-95 fade-in duration-200`"
    :style="{
      left: `${x}px`,
      top: `${y}px`,
      width: `${w}px`,
      height: `${h}px`,
      zIndex: zIndex,
      transition: (isDragging || isResizing) ? 'none' : 'box-shadow 0.2s'
    }"
    @mousedown="emit('focus', id)"
  >
    <!-- 页眉栏 -->
    <div
      class="h-14 pl-6 pr-4 flex items-center justify-between cursor-move select-none shrink-0 border-b border-outline-variant/10 bg-surface-container-highest/50"
      @mousedown="handleMouseDown"
    >
      <span class="text-sm font-bold text-on-surface truncate">{{ title }}</span>
      <button
        @click.stop="emit('close', id)"
        class="p-2 hover:bg-surface-container-highest rounded-full transition-colors text-on-surface-variant"
      >
        <X :size="18" />
      </button>
    </div>

    <!-- 内容区域 -->
    <div class="flex-1 overflow-hidden relative flex flex-col">
      <slot />
    </div>

    <!-- 缩放手柄 -->
    <div
      class="absolute bottom-0 right-0 w-6 h-6 cursor-se-resize p-1 z-20 flex items-end justify-end opacity-50 hover:opacity-100"
      @mousedown="handleResizeStart"
    >
      <div class="w-2 h-2 border-r-2 border-b-2 border-on-surface-variant rounded-br-sm mb-1 mr-1"></div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import { X } from 'lucide-vue-next';

const WINDOW_MIN_WIDTH = 300;
const WINDOW_MIN_HEIGHT = 200;

const props = defineProps<{
  id: string | number;
  title: string;
  x: number;
  y: number;
  w: number;
  h: number;
  zIndex: number;
}>();

const emit = defineEmits<{
  (e: 'close', id: string | number): void;
  (e: 'focus', id: string | number): void;
  (e: 'updatePosition', id: string | number, x: number, y: number): void;
  (e: 'updateSize', id: string | number, w: number, h: number): void;
}>();

const isDragging = ref(false);
const dragStart = ref({ x: 0, y: 0 });
const isResizing = ref(false);
const resizeStart = ref({ x: 0, y: 0, w: 0, h: 0 });

function handleMouseDown(e: MouseEvent) {
  e.stopPropagation();
  isDragging.value = true;
  emit('focus', props.id);
  dragStart.value = { x: e.clientX - props.x, y: e.clientY - props.y };
}

function handleResizeStart(e: MouseEvent) {
  e.stopPropagation();
  isResizing.value = true;
  emit('focus', props.id);
  resizeStart.value = { x: e.clientX, y: e.clientY, w: props.w, h: props.h };
}

function handleMouseMove(e: MouseEvent) {
  if (isDragging.value) {
    emit('updatePosition', props.id, e.clientX - dragStart.value.x, e.clientY - dragStart.value.y);
  }
  if (isResizing.value) {
    const deltaX = e.clientX - resizeStart.value.x;
    const deltaY = e.clientY - resizeStart.value.y;
    emit(
      'updateSize',
      props.id,
      Math.max(WINDOW_MIN_WIDTH, resizeStart.value.w + deltaX),
      Math.max(WINDOW_MIN_HEIGHT, resizeStart.value.h + deltaY)
    );
  }
}

function handleMouseUp() {
  isDragging.value = false;
  isResizing.value = false;
}

onMounted(() => {
  window.addEventListener('mousemove', handleMouseMove);
  window.addEventListener('mouseup', handleMouseUp);
});

onUnmounted(() => {
  window.removeEventListener('mousemove', handleMouseMove);
  window.removeEventListener('mouseup', handleMouseUp);
});
</script>
