<template>
  <WindowFrame
    v-if="isOpen"
    id="evidence-window"
    title="证据提交"
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
    <div class="flex-1 flex flex-col bg-surface-container-high overflow-hidden">
        <!-- 提示文本 -->
        <div class="px-5 py-4 border-b border-outline-variant/10">
            <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium mb-2">
                <FileText :size="14" />
                证据提交
            </div>
            <p class="text-on-surface text-sm font-medium leading-relaxed">
                {{ prompt }}
            </p>
        </div>

        <!-- 举证模式选择 -->
        <div class="flex items-center gap-3 px-5 py-3 border-b border-outline-variant/10 bg-surface-container/50">
            <span class="text-xs text-on-surface-variant">举证模式：</span>
            <div class="flex gap-2">
                <button
                    @click="setMode('single')"
                    :class="`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${showType === 'single' ? 'bg-primary text-on-primary' : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-highest'}`"
                >
                    单一证据
                </button>
                <button
                    @click="setMode('union')"
                    :class="`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1 ${showType === 'union' ? 'bg-primary text-on-primary' : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-highest'}`"
                >
                    <Layers :size="12" />
                    联合证据
                </button>
                <button
                    @click="setMode('quit')"
                    :class="`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1 ${showType === 'quit' ? 'bg-error text-white' : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-highest'}`"
                >
                    <XCircle :size="12" />
                    放弃举证
                </button>
            </div>
        </div>

        <!-- 证据列表 -->
        <div v-if="showType !== 'quit'" class="flex-1 overflow-y-auto p-3 space-y-2 custom-scrollbar">
            <div v-if="evidenceList.length === 0" class="text-center py-10 text-on-surface-variant/60 text-sm">
                暂无可用证据
            </div>
            <label
                v-else
                v-for="ev in evidenceList"
                :key="ev.id"
                :class="`flex items-start gap-3 p-3 rounded-xl cursor-pointer transition-all ${isSelected(ev) ? 'bg-primary/15 border border-primary/30' : 'bg-surface-container hover:bg-surface-container-highest border border-transparent'}`"
            >
                <input
                    :type="showType === 'single' ? 'radio' : 'checkbox'"
                    :checked="isSelected(ev)"
                    @change="handleEvidenceToggle(ev)"
                    class="mt-1 w-4 h-4 rounded border-outline-variant text-primary focus:ring-primary focus:ring-offset-surface-container"
                />
                <div class="flex-1 min-w-0">
                    <div class="flex items-center gap-2">
                        <span class="font-medium text-sm text-on-surface">
                            [{{ ev.id }}] {{ ev.name }}
                        </span>
                        <span :class="`text-[10px] px-1.5 py-0.5 rounded ${ev.provider === 'prosecutor' ? 'bg-prosecutor/20 text-prosecutor' : 'bg-defense/20 text-defense'}`">
                            {{ ev.provider === 'prosecutor' ? '控方' : '辩方' }}
                        </span>
                    </div>
                    <p class="text-xs text-on-surface-variant/70 mt-1 line-clamp-2">
                        {{ ev.content }}
                    </p>
                </div>
            </label>
        </div>

        <!-- 放弃举证时的占位 -->
        <div v-if="showType === 'quit'" class="flex-1 flex items-center justify-center text-on-surface-variant/60 text-sm">
            点击下方按钮确认放弃举证
        </div>

        <!-- 举证说明输入区 -->
        <div v-if="showType !== 'quit'" class="border-t border-outline-variant/10">
            <div
                class="h-3 flex items-center justify-center cursor-ns-resize hover:bg-surface-container-highest/50 transition-colors"
                @mousedown="handleResizeMouseDown"
            >
                <GripVertical :size="14" class="text-on-surface-variant/40 rotate-90" />
            </div>
            <div class="px-4 pb-3">
                <textarea
                    v-model="message"
                    placeholder="举证说明（可选）..."
                    :style="{ height: `${textareaHeight}px` }"
                    class="w-full bg-surface-container border border-outline-variant/30 rounded-lg px-4 py-3 text-sm text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 resize-none custom-scrollbar"
                />
            </div>
        </div>

        <!-- 底部操作栏 -->
        <div class="p-4 flex items-center justify-between border-t border-outline-variant/10 bg-surface-container/50 backdrop-blur-sm shrink-0">
            <div class="text-[10px] text-on-surface-variant/60 font-medium">
                <span v-if="showType !== 'quit' && selectedEvidence.length > 0">
                    已选择 {{ selectedEvidence.length }} 份证据
                </span>
            </div>
            <div class="flex gap-3">
                <button
                    @click="onClose('evidence-window')"
                    class="px-5 py-2 rounded-full text-xs font-bold text-on-surface-variant hover:bg-surface-container-highest transition-colors"
                >
                    取消
                </button>
                <Button
                    :variant="showType === 'quit' ? 'danger' : 'primary'"
                    size="md"
                    :disabled="isSubmitDisabled"
                    @click="handleSubmit"
                    class="gap-2"
                >
                    <Send :size="14" />
                    <span>{{ showType === 'quit' ? '确认放弃' : '提交证据' }}</span>
                </Button>
            </div>
        </div>
    </div>
  </WindowFrame>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { Send, FileText, XCircle, Layers, GripVertical } from 'lucide-vue-next';
import WindowFrame from './WindowFrame.vue';
import Button from './Button.vue';
import type { BackendEvidence, EvidenceInputPayload, WindowState } from '@/types';

type EvidenceShowType = 'single' | 'union' | 'quit';

const props = defineProps<{
    isOpen: boolean;
    prompt: string;
    evidenceList: BackendEvidence[];
    winState: WindowState;
}>();

const emit = defineEmits<{
    (e: 'submit', payload: EvidenceInputPayload): void;
    (e: 'close', id: string | number): void;
    (e: 'focus'): void;
    (e: 'updatePosition', id: string | number, x: number, y: number): void;
    (e: 'updateSize', id: string | number, w: number, h: number): void;
}>();

const showType = ref<EvidenceShowType>('single');
const selectedEvidence = ref<BackendEvidence[]>([]);
const message = ref('');
const textareaHeight = ref(80);
const resizeStart = ref<{ startY: number; startHeight: number } | null>(null);

function setMode(mode: EvidenceShowType) {
    showType.value = mode;
    selectedEvidence.value = [];
}

function handleEvidenceToggle(evidence: BackendEvidence) {
    const exists = selectedEvidence.value.find(e => e.id === evidence.id);
    if (exists) {
        selectedEvidence.value = selectedEvidence.value.filter(e => e.id !== evidence.id);
    } else {
        if (showType.value === 'single') {
            selectedEvidence.value = [evidence];
        } else {
            selectedEvidence.value.push(evidence);
        }
    }
}

function isSelected(evidence: BackendEvidence) {
    return selectedEvidence.value.some(e => e.id === evidence.id);
}

const isSubmitDisabled = computed(() => showType.value !== 'quit' && selectedEvidence.value.length === 0);

function handleSubmit() {
    let payload: EvidenceInputPayload;

    if (showType.value === 'quit') {
        payload = {
            current_evidence: null,
            messages: '放弃举证'
        };
    } else if (showType.value === 'single' && selectedEvidence.value.length > 0) {
        payload = {
            current_evidence: selectedEvidence.value[0],
            messages: message.value || ''
        };
    } else {
        payload = {
            current_evidence: selectedEvidence.value,
            messages: message.value || ''
        };
    }
    emit('submit', payload);
}

// Resizing Textarea
function handleResizeMouseDown(e: MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    resizeStart.value = { startY: e.clientY, startHeight: textareaHeight.value };
}

function handleMouseMove(e: MouseEvent) {
    if (resizeStart.value) {
        const deltaY = resizeStart.value.startY - e.clientY;
        textareaHeight.value = Math.max(60, Math.min(300, resizeStart.value.startHeight + deltaY));
    }
}

function handleMouseUp() {
    resizeStart.value = null;
}

onMounted(() => {
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
});

onUnmounted(() => {
    window.removeEventListener('mousemove', handleMouseMove);
    window.removeEventListener('mouseup', handleMouseUp);
});

// Proxy emits
const onClose = (id: string | number) => emit('close', id);
const handleFocus = () => emit('focus');
const updatePosition = (id: string | number, x: number, y: number) => emit('updatePosition', id, x, y);
const updateSize = (id: string | number, w: number, h: number) => emit('updateSize', id, w, h);

</script>
