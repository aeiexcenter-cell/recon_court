<template>
  <div class="flex-1 flex flex-col bg-surface-container-lowest min-w-0 md:min-w-[400px] relative rounded-t-3xl overflow-hidden mt-2 mx-2 shadow-sm border border-outline-variant/10">
    <!-- 页眉 -->
    <div class="h-16 flex items-center justify-between px-6 z-20 sticky top-0 border-b-0 rounded-t-[32px] backdrop-blur-md bg-surface-container-lowest/80 border border-white/10">
      <div class="flex items-center gap-4">
        <!-- 多选角色过滤器 -->
        <div class="flex gap-1 bg-surface-container p-1 rounded-full border border-outline-variant/30">
          <button
            v-for="role in ALL_ROLES"
            :key="role"
            @click="toggleRole(role)"
            class="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all focus:outline-none focus:ring-2 focus:ring-primary"
            :class="visibleRoles.includes(role) ? 'bg-active text-on-primary shadow-sm' : 'text-on-surface-variant border border-outline-variant/30 hover:text-on-surface hover:bg-surface-container-high'"
          >
            {{ ROLE_LABELS[role] }}
          </button>
        </div>

        <div class="h-8 w-px bg-outline-variant/30 hidden md:block" />

        <!-- 状态信息 -->
        <div class="hidden md:flex items-center gap-6 text-xs">
          <div class="flex flex-col">
            <span class="text-on-surface-variant font-bold uppercase text-[9px] tracking-widest">当前阶段</span>
            <span class="font-bold text-primary text-sm">{{ currentPhase }}</span>
          </div>
          <div class="flex flex-col">
            <span class="text-on-surface-variant font-bold uppercase text-[9px] tracking-widest">当前发言</span>
            <span class="font-bold text-primary text-sm">{{ currentSpeaker || '无' }}</span>
          </div>
        </div>
      </div>

      <div class="flex items-center gap-4">
        <!-- 会话 ID -->
        <div class="hidden md:flex items-center gap-6 text-xs border-l border-outline-variant/10 pl-6 h-8">
          <div class="flex flex-col items-end">
            <span class="text-on-surface-variant font-bold uppercase text-[9px] tracking-widest">会话 ID</span>
            <span class="font-mono text-xs text-on-surface opacity-80 select-all">
              {{ isConnected && sessionId ? sessionId : '未连接' }}
            </span>
          </div>
        </div>
      </div>
    </div>

    <!-- 消息列表 -->
    <MessageList :messages="filteredMessages" roleFilter="all" />

    <!-- 消息输入 -->
    <MessageInput
      v-model:input-value="localInputValue"
      :is-turn-to-speak="isTurnToSpeak"
      :is-long-form-mode="isLongFormMode"
      :interrupt-state="interruptState"
      :current-phase="currentPhase"
      :is-connected="isConnected"
      @send-message="handleSendMessage"
      @expand-input="emit('expandInput')"
      @respond-to-interrupt="handleRespondToInterrupt"
    />

    <!-- 证据窗口 -->
    <EvidenceWindow
      :is-open="showEvidenceWindow"
      :prompt="interruptState?.prompt || '请选择证据'"
      :evidence-list="evidenceList"
      :win-state="effectiveEvidenceWinState"
      @submit="handleEvidenceSubmit"
      @close="handleCloseEvidence"
      @focus="handleFocusEvidence"
      @update-position="handleUpdateEvidencePos"
      @update-size="handleUpdateEvidenceSize"
    />

    <!-- 详细输入窗口 -->
    <DetailedInputWindow
      :is-open="isLongFormMode"
      v-model="localInputValue"
      :selected-role="selectedRole"
      :win-state="inputWindowState"
      @send="handleSendAndClose"
      @close="emit('closeLongForm')"
      @focus="emit('focusInputWindow')"
      @update-position="(id, x, y) => emit('updateInputWindowPos', id, x, y)"
      @update-size="(id, w, h) => emit('updateInputWindowSize', id, w, h)"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import MessageList from './MessageList.vue';
import MessageInput from './MessageInput.vue';
import DetailedInputWindow from './DetailedInputWindow.vue';
import EvidenceWindow from './EvidenceWindow.vue';
import type { 
  Message, UserRole, WindowState, InterruptState, 
  BackendEvidence, EvidenceInputPayload, UIRole 
} from '@/types';

// Constants
const ALL_ROLES: UIRole[] = ['judge', 'prosecutor', 'defense', 'clerk', 'system'];
const ROLE_LABELS: Record<UIRole, string> = {
  judge: '法官',
  prosecutor: '公诉人',
  defense: '辩护方',
  clerk: '书记员',
  system: '系统',
  user: '用户'
};

const props = defineProps<{
  messages: Message[];
  currentPhase: string;
  currentSpeaker: string;
  sessionId: string | null;
  isConnected: boolean;
  inputValue: string;
  isTurnToSpeak: boolean;
  isLongFormMode: boolean;
  selectedRole: UserRole;
  inputWindowState: WindowState;
  evidenceWindowState?: WindowState;
  interruptState?: InterruptState;
  evidenceList: BackendEvidence[];
  progress?: number;
}>();

const emit = defineEmits<{
  (e: 'update:inputValue', value: string): void;
  (e: 'sendMessage'): void;
  (e: 'expandInput'): void;
  (e: 'closeLongForm'): void;
  (e: 'respondToInterrupt', payload: boolean | string | EvidenceInputPayload): void;
  // Window events
  (e: 'focusInputWindow'): void;
  (e: 'updateInputWindowPos', id: string | number, x: number, y: number): void;
  (e: 'updateInputWindowSize', id: string | number, w: number, h: number): void;
  // Evidence window (optional if parent manages it, but we handle some internally usually)
  (e: 'focusEvidenceWindow'): void;
  (e: 'updateEvidenceWindowPos', id: string | number, x: number, y: number): void;
  (e: 'updateEvidenceWindowSize', id: string | number, w: number, h: number): void;
}>();

// Local state for two-way binding proxy
const localInputValue = computed({
  get: () => props.inputValue,
  set: (val) => emit('update:inputValue', val)
});

// Role filtering
const visibleRoles = ref<UIRole[]>([...ALL_ROLES]);

function toggleRole(role: UIRole) {
  if (visibleRoles.value.includes(role)) {
    visibleRoles.value = visibleRoles.value.filter(r => r !== role);
  } else {
    visibleRoles.value.push(role);
  }
}

const filteredMessages = computed(() => {
  return props.messages.filter(m => visibleRoles.value.includes(m.role));
});

// Evidence Window Logic
const internalEvidenceWinState = ref<WindowState>({
  id: 'evidence-window',
  x: Math.max(100, window.innerWidth / 2 - 300),
  y: Math.max(80, window.innerHeight / 2 - 250),
  w: 600,
  h: 500,
  zIndex: 100
});

const effectiveEvidenceWinState = computed(() => props.evidenceWindowState || internalEvidenceWinState.value);
const showEvidenceWindow = computed(() => props.interruptState?.isInterrupted && props.interruptState?.inputType === 'evidence');

function handleUpdateEvidencePos(id: string | number, x: number, y: number) {
  if (props.evidenceWindowState) {
    emit('updateEvidenceWindowPos', id, x, y);
  } else {
    internalEvidenceWinState.value = { ...internalEvidenceWinState.value, x, y };
  }
}

function handleUpdateEvidenceSize(id: string | number, w: number, h: number) {
  if (props.evidenceWindowState) {
    emit('updateEvidenceWindowSize', id, w, h);
  } else {
    internalEvidenceWinState.value = { ...internalEvidenceWinState.value, w, h };
  }
}

function handleFocusEvidence() {
  if (props.evidenceWindowState) {
    emit('focusEvidenceWindow');
  } else {
    internalEvidenceWinState.value = { ...internalEvidenceWinState.value, zIndex: internalEvidenceWinState.value.zIndex + 1 };
  }
}

function handleCloseEvidence() {
  // Usually responding with 'quit' or just closing.
  // For now we don't strictly close it unless we respond.
  // We can emit a cancel-like response if needed, but the interrupt persists until answered.
  // Let's assume user clicking cancel in EvidenceWindow emits a quit payload.
}

function handleEvidenceSubmit(payload: EvidenceInputPayload) {
  emit('respondToInterrupt', payload);
}

function handleRespondToInterrupt(payload: boolean | string | EvidenceInputPayload) {
  emit('respondToInterrupt', payload);
}

function handleSendMessage() {
  emit('sendMessage');
}

function handleSendAndClose() {
  emit('sendMessage');
  emit('closeLongForm');
}
</script>
