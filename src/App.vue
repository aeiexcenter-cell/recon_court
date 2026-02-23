<template>
  <ErrorBoundary>
    <div class="flex h-screen w-full bg-surface-container-low font-sans text-on-surface overflow-hidden relative selection:bg-primary-container selection:text-on-primary-container">
      
      <!-- Window Layer -->
      <DraggableWindow
        v-for="win in windows"
        :key="win.id"
        :win="win"
        @close="closeWindow"
        @focus="focusWindow"
        @update-position="updateWindowPosition"
        @update-size="updateWindowSize"
      />

      <!-- Left Sidebar -->
      <LeftSidebar
        :width="leftWidth"
        v-model:case-context="caseContext"
        :case-info="DEFAULT_CASE_INFO"
        :file-evidence="fileEvidence"
        :text-evidence="textEvidence"
        :filter="evidenceFilter"
        @update:filter="evidenceFilter = $event"
        @start-resize="startResizing('left', $event)"
        @open-window="openWindow"
      />

      <!-- Chat Area -->
      <ChatArea
        :messages="courtStore.messages"
        :current-phase="courtStore.currentPhase"
        :current-speaker="courtStore.currentSpeaker"
        :session-id="courtStore.sessionId"
        :is-connected="courtStore.isConnected"
        v-model:input-value="inputValue"
        :is-turn-to-speak="courtStore.isTurnToSpeak"
        :is-long-form-mode="isLongFormMode"
        :selected-role="selectedRole"
        :input-window-state="inputWindow"
        :interrupt-state="courtStore.interruptState"
        :evidence-list="courtStore.evidenceList"
        :progress="courtStore.progress"
        @send-message="handleSendMessage"
        @expand-input="isLongFormMode = true"
        @close-long-form="isLongFormMode = false"
        @respond-to-interrupt="handleRespondToInterrupt"
        @focus-input-window="focusInputWindow"
        @update-input-window-pos="updateInputWindowPosition"
        @update-input-window-size="updateInputWindowSize"
      />

      <!-- Right Sidebar -->
      <RightSidebar
        :width="rightWidth"
        v-model:selected-role="selectedRole"
        :is-connected="courtStore.isConnected"
        :is-connecting="courtStore.isConnecting"
        :is-turn-to-speak="courtStore.isTurnToSpeak"
        :current-phase="courtStore.currentPhase"
        :active-node="courtStore.activeNode"
        :progress="courtStore.progress"
        :last-interrupt-req="courtStore.lastInterruptReq"
        @start-resize="startResizing('right', $event)"
        @start-trial="handleStartTrial"
        @retry="handleRetry"
      />

    </div>
  </ErrorBoundary>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useCourtStore } from '@/stores/useCourtStore';
import ErrorBoundary from '@/components/ErrorBoundary.vue';
import LeftSidebar from '@/components/LeftSidebar.vue';
import ChatArea from '@/components/ChatArea.vue';
import RightSidebar from '@/components/RightSidebar.vue';
import DraggableWindow from '@/components/DraggableWindow.vue';
import type { UserRole, WindowState, EvidenceInputPayload } from '@/types';
import { activeCase } from '@/data';

// --- 使用导入的模块化数据 ---
const DEFAULT_CASE_INFO = activeCase.meta;
const DEFAULT_EVIDENCE_LIST = activeCase.evidence;

const courtStore = useCourtStore();

// UI State
const leftWidth = ref(320);
const rightWidth = ref(300);
const selectedRole = ref<UserRole>('Defense AI');
const evidenceFilter = ref('all');
const caseContext = ref(DEFAULT_CASE_INFO.abstract); // Pre-fill with case abstract
const inputValue = ref('');
const isLongFormMode = ref(false);

const textEvidence = ref<any[]>(DEFAULT_EVIDENCE_LIST.map(ev => ({
    id: ev.id,
    name: ev.name,
    speaker: ev.provider === 'prosecutor' ? '原告律师' : '被告律师',
    content: ev.content
})));
const fileEvidence = ref<any[]>([]);

// Window Management (Simplified inline for now as useWindowManager hook wasn't migrated yet)
const windows = ref<WindowState[]>([]);
const inputWindow = ref<WindowState>({
    id: 'detailed-input',
    title: '详细输入',
    x: window.innerWidth / 2 - 300,
    y: window.innerHeight / 2 - 200,
    w: 600,
    h: 400,
    zIndex: 100
});

function closeWindow(id: string | number) {
    windows.value = windows.value.filter(w => w.id !== id);
}
function focusWindow(id: string | number) {
    const maxZ = Math.max(...windows.value.map(w => w.zIndex), inputWindow.value.zIndex, 100);
    const win = windows.value.find(w => w.id === id);
    if (win) win.zIndex = maxZ + 1;
}
function updateWindowPosition(id: string | number, x: number, y: number) {
    const win = windows.value.find(w => w.id === id);
    if (win) { win.x = x; win.y = y; }
}
function updateWindowSize(id: string | number, w: number, h: number) {
    const win = windows.value.find(w => w.id === id);
    if (win) { win.w = w; win.h = h; }
}

function openWindow(title: string, content: string, type: string = 'text', url: string | null = null) {
    const id = Date.now().toString();
    const maxZ = Math.max(...windows.value.map(w => w.zIndex), 100);
    windows.value.push({
        id,
        title,
        content,
        type: type as any,
        url: url || undefined,
        x: window.innerWidth / 2 - 200 + (windows.value.length * 20),
        y: window.innerHeight / 2 - 150 + (windows.value.length * 20),
        w: 500,
        h: 400,
        zIndex: maxZ + 1
    });
}

// Input Window Actions
function focusInputWindow() { 
    const maxZ = Math.max(...windows.value.map(w => w.zIndex), inputWindow.value.zIndex, 100);
    inputWindow.value.zIndex = maxZ + 1;
}
function updateInputWindowPosition(_id: string | number, x: number, y: number) {
    inputWindow.value.x = x; inputWindow.value.y = y;
}
function updateInputWindowSize(_id: string | number, w: number, h: number) {
    inputWindow.value.w = w; inputWindow.value.h = h;
}

// Global Actions
function handleStartTrial() {
    // Use the pre-loaded case data directly (matching React App.tsx behavior)
    courtStore.connect(selectedRole.value, DEFAULT_CASE_INFO as any, DEFAULT_EVIDENCE_LIST as any);
}

function handleSendMessage() {
    if (!inputValue.value.trim()) return;
    const success = courtStore.sendMessage(inputValue.value, selectedRole.value);
    if (success) {
        inputValue.value = '';
    }
}

function handleRespondToInterrupt(payload: boolean | string | EvidenceInputPayload) {
    courtStore.respondToInterrupt(payload);
}

function handleRetry() {
    courtStore.retry();
}

// Resizing Logic
function startResizing(direction: 'left' | 'right', e: MouseEvent) {
    e.preventDefault();
    const startX = e.clientX;
    const startW = direction === 'left' ? leftWidth.value : rightWidth.value;

    const onMove = (ev: MouseEvent) => {
        const d = ev.clientX - startX;
        if (direction === 'left') {
            leftWidth.value = Math.max(250, Math.min(600, startW + d));
        } else {
            rightWidth.value = Math.max(250, Math.min(500, startW - d));
        }
    };

    const onUp = () => {
        document.removeEventListener('mousemove', onMove);
        document.removeEventListener('mouseup', onUp);
    };

    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
}
</script>
