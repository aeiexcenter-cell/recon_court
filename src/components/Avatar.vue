<template>
  <div :class="`h-8 w-8 rounded-full flex items-center justify-center shrink-0 shadow-sm ${roleColor}`">
    <component :is="icon" :size="16" />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { Gavel, ShieldAlert, ShieldCheck, Cpu, User, BookOpen } from 'lucide-vue-next';
import type { UIRole } from '@/types';

const props = withDefaults(defineProps<{
  role: UIRole;
}>(), {
  role: 'user'
});

const icons: Record<UIRole, any> = {
  'judge': Gavel,
  'prosecutor': ShieldAlert,
  'defense': ShieldCheck,
  'system': Cpu,
  'user': User,
  'clerk': BookOpen
};

const colors: Record<UIRole, string> = {
  'judge': 'bg-judge-bg text-judge',
  'prosecutor': 'bg-prosecutor-bg text-prosecutor',
  'defense': 'bg-defense-bg text-defense',
  'system': 'bg-system-bg text-system',
  'user': 'bg-secondary-container text-on-secondary-container',
  'clerk': 'bg-system-bg text-system'
};

const icon = computed(() => icons[props.role] || User);
const roleColor = computed(() => colors[props.role] || 'bg-surface-container-high');
</script>
