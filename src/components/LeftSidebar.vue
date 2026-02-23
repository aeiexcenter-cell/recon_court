<template>
  <div :style="{ width: `${width}px` }" class="flex flex-col bg-surface-container-low shrink-0 relative z-10 transition-colors duration-300 h-full">
    <!-- 页眉 -->
    <div class="h-16 flex items-center justify-between px-6 font-bold tracking-tight text-primary text-lg shrink-0 z-20 bg-surface-container-low/80 backdrop-blur-md sticky top-0">
      <div class="flex items-center">
        <Gavel class="h-6 w-6 mr-3 text-primary" /> AI 庭审系统
      </div>
      <ThemeSelector />
    </div>

    <!-- 固定顶部区域：案件信息 + 案情概况 -->
    <div class="shrink-0 px-4 pb-4 space-y-4 border-b border-outline-variant/20">
      <!-- 案件信息 -->
      <div class="space-y-2 p-3 bg-surface-container-high/50 rounded-xl border border-outline-variant/20">
        <label class="text-xs font-bold text-on-surface-variant uppercase flex items-center gap-2">
          <span>📋</span> 案件信息
        </label>
        <div class="space-y-2 text-sm">
          <div class="flex justify-between">
            <span class="text-on-surface-variant">案件编号</span>
            <span class="text-on-surface">{{ caseInfo.case_id }}</span>
          </div>
          <div class="flex justify-between">
            <span class="text-on-surface-variant">法院</span>
            <span class="text-on-surface">{{ caseInfo.court_name }}</span>
          </div>
          <div class="flex justify-between">
            <span class="text-on-surface-variant">被告人</span>
            <span class="text-on-surface">{{ caseInfo.defendant_name }}</span>
          </div>
          <div class="flex justify-between">
            <span class="text-on-surface-variant">罪名</span>
            <span class="text-error">{{ caseInfo.crime }}</span>
          </div>
        </div>
      </div>

      <!-- 案情概况 -->
      <div class="space-y-2">
        <label class="text-xs font-bold text-on-surface-variant uppercase">案情概况</label>
        <textarea
          class="w-full min-h-[80px] rounded-lg border border-outline-variant bg-surface-variant text-on-surface px-3 py-2 text-sm focus:ring-2 focus:ring-primary/50 resize-y placeholder-on-surface-variant/50"
          :value="caseContext"
          @input="$emit('update:caseContext', ($event.target as HTMLTextAreaElement).value)"
        />
      </div>
    </div>

    <!-- 可滚动区域：证据链 -->
    <div class="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
      <!-- 证据链标题和过滤器 -->
      <div class="flex items-center justify-between">
        <label class="text-xs font-bold text-on-surface-variant uppercase">证据链</label>
        <div class="flex gap-1 bg-surface-container-high p-0.5 rounded border border-outline-variant/30">
            <button
                v-for="f in ['all', '原告律师', '被告律师']"
                :key="f"
                @click="$emit('update:filter', f)"
                :class="`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase transition-all ${filter === f ? 'bg-primary text-on-primary shadow-sm' : 'text-on-surface-variant hover:text-on-surface'}`"
            >
                {{ f === 'all' ? '全部' : f === '原告律师' ? '原告' : '被告' }}
            </button>
        </div>
      </div>

      <!-- 文件证据列表 -->
      <div class="space-y-2">
        <EvidenceItem
          v-for="(f, i) in filteredFileEvidence"
          :key="`file-${i}`"
          type="file"
          :data="f"
          :index="i"
          :disabled="false"
          @open="onOpenWindow"
        />
      </div>

      <!-- 文本证据列表 -->
      <div class="flex flex-col gap-2">
        <EvidenceItem
          v-for="(t, i) in filteredTextEvidence"
          :key="`text-${i}`"
          type="text"
          :data="t"
          :index="i"
          :disabled="false"
          @open="onOpenWindow"
        />
      </div>
    </div>

    <!-- 调整大小的手柄 -->
    <div
      class="absolute top-0 bottom-0 -right-3 w-6 z-50 flex justify-center cursor-col-resize group touch-none"
      @mousedown="onStartResize"
    >
      <div class="w-1 h-full rounded-full bg-transparent group-hover:bg-primary transition-colors duration-200 ease-in-out opacity-60" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { Gavel } from 'lucide-vue-next';
import EvidenceItem from './EvidenceItem.vue';
import ThemeSelector from './ThemeSelector.vue';
import type { LayoutConfig, BackendEvidence, CaseInfo } from '@/types';
// Note: Adjusted types slightly or I need to import specific interfaces if they are exported
// The prompt used custom interfaces for grouping props. I will assume flatten props or grouping as passed from parent.
// React version used grouped props (caseData, evidenceData).
// For Vue, we can accept flattened props or objects. I'll stick to flattened for better reactivity or objects if they are reactive.
// Let's use props that match the usage in template.

// Mimicking Request interfaces
export interface CaseInfoConfig {
    case_id: string;
    court_name: string;
    defendant_name: string;
    crime: string;
}

const props = defineProps<{
    width: number;
    caseInfo: CaseInfoConfig;
    caseContext: string;
    fileEvidence: any[]; // Using any[] to match structure, refined later with types
    textEvidence: any[];
    filter: string;
}>();

const emit = defineEmits<{
    (e: 'update:caseContext', val: string): void;
    (e: 'update:filter', val: string): void;
    (e: 'startResize', event: MouseEvent): void;
    (e: 'openWindow', title: string, content: string, type?: string, url?: string | null): void;
}>();

const filteredFileEvidence = computed(() =>
    props.fileEvidence.filter(f => props.filter === 'all' || f.speaker === props.filter)
);

const filteredTextEvidence = computed(() =>
    props.textEvidence.filter(t => props.filter === 'all' || t.speaker === props.filter)
);

function onStartResize(e: MouseEvent) {
    emit('startResize', e);
}

function onOpenWindow(title: string, content: string, type?: string, url?: string | null) {
    emit('openWindow', title, content, type, url);
}

</script>
