<template>
  <div
    @click="handleClick"
    class="flex items-center gap-3 p-3 rounded-xl bg-surface-container-high hover:bg-surface-container-highest cursor-pointer transition-all hover:shadow-sm group relative overflow-hidden border border-transparent hover:border-outline-variant/30"
  >
    <!-- ID Badge -->
    <div class="flex-shrink-0 font-mono text-[10px] bg-surface-container-highest/50 text-on-surface-variant px-1.5 py-0.5 rounded">
      {{ evidenceId }}
    </div>

    <!-- Icon -->
    <div class="shrink-0 text-primary opacity-80">
      <ImageIcon v-if="isFile && (data as FileEvidenceData).type === 'image'" :size="16" />
      <FileText v-else :size="16" />
    </div>

    <!-- Name/Info -->
    <div class="flex-1 min-w-0 flex flex-col">
      <span class="text-sm font-medium truncate text-on-surface">
        {{ displayName }}
      </span>
    </div>

    <!-- Speaker Badge -->
    <span :class="`shrink-0 text-[9px] px-2 py-0.5 rounded-full font-bold tracking-wide uppercase ${speakerClass}`">
      {{ displaySpeaker }}
    </span>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { FileText, Image as ImageIcon } from 'lucide-vue-next';
import { getSpeakerBadgeStyles } from '@/utils/roleStyles';
import type { EvidenceType } from '@/types';

export type EvidenceItemType = 'file' | 'text';

export interface FileEvidenceData {
  id?: string;
  name: string;
  type: EvidenceType;
  url: string | null;
  speaker: string;
}

export interface TextEvidenceData {
  id?: string;
  name?: string;
  content: string;
  speaker: string;
}

const props = defineProps<{
  type: EvidenceItemType;
  data: FileEvidenceData | TextEvidenceData;
  index: number;
  disabled: boolean;
}>();

const emit = defineEmits<{
  (e: 'open', title: string, content: string, type?: string, url?: string | null): void;
}>();

const isFile = computed(() => props.type === 'file');
const speakerClass = computed(() => getSpeakerBadgeStyles(props.data.speaker));

const speakerDisplayMap: Record<string, string> = {
  '原告律师': '公诉方',
  '被告律师': '辩护方'
};

const displaySpeaker = computed(() => speakerDisplayMap[props.data.speaker] || props.data.speaker);

const displayName = computed(() => props.data.name || (props.data.id ? `${props.data.id}` : `证据 #${props.index + 1}`));
const evidenceId = computed(() => props.data.id || `EVI-${String(props.index + 1).padStart(3, '0')}`);

function handleClick() {
  const modalTitle = props.data.name || `证据 ${evidenceId.value}`;
  const modalContent = isFile.value ? (props.data as FileEvidenceData).name : (props.data as TextEvidenceData).content;
  const modalType = isFile.value ? (props.data as FileEvidenceData).type : 'text';
  const modalUrl = isFile.value ? (props.data as FileEvidenceData).url : undefined;

  emit('open', modalTitle, modalContent, modalType, modalUrl);
}
</script>
