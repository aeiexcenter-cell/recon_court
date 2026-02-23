<template>
  <span :class="`px-2 py-0.5 rounded-full text-xxs uppercase font-bold tracking-wider ${roleColor}`">
    {{ role.toUpperCase() }}
  </span>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { UIRole } from '@/types';

const props = defineProps<{
  role: UIRole;
}>();

const colors: Record<UIRole, string> = {
  'judge': 'bg-judge-bg text-judge',
  'prosecutor': 'bg-prosecutor-bg text-prosecutor',
  'defense': 'bg-defense-bg text-defense',
  'system': 'bg-system-bg text-system',
  'user': 'bg-secondary-container text-on-secondary-container',
  'clerk': 'bg-system-bg text-system'
};

const roleColor = computed(() => colors[props.role] || colors['user']);
</script>
