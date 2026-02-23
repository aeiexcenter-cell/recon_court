<template>
  <div ref="containerRef" :class="`relative`">
    <!-- 触发按钮 - 药丸形状 -->
    <button
      type="button"
      @click="toggleOpen"
      :disabled="disabled"
      :class="`
        w-full flex items-center justify-between gap-3
        px-5 py-3
        rounded-full
        bg-primary/5 backdrop-blur-md
        border border-primary/20
        text-on-surface
        transition-all duration-200 ease-out
        hover:bg-primary/10 hover:border-primary/30
        focus:outline-none focus:ring-2 focus:ring-primary/30 focus:ring-offset-2 focus:ring-offset-surface
        ${disabled ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}
        ${isOpen ? 'bg-primary/10 border-primary/30 shadow-md' : ''}
      `"
      aria-haspopup="listbox"
      :aria-expanded="isOpen"
    >
      <!-- 角色名称 -->
      <span class="font-semibold text-sm tracking-wide text-on-surface">
        {{ currentLabel }}
      </span>

      <!-- 分隔线 + 箭头 -->
      <div class="flex items-center gap-2">
        <div class="w-px h-4 bg-primary/20" />
        <ChevronDown
          :size="16"
          :class="`
            text-primary transition-transform duration-200
            ${isOpen ? 'rotate-180' : ''}
          `"
        />
      </div>
    </button>

    <!-- 下拉菜单 - 玻璃卡片 -->
    <div
      :class="`
        absolute z-50 mt-2 w-full min-w-[200px]
        rounded-2xl
        bg-surface-container-high/95 backdrop-blur-xl
        border border-outline-variant/30
        shadow-xl shadow-shadow/10
        overflow-hidden
        transition-all duration-200 ease-out origin-top
        ${isOpen
          ? 'opacity-100 scale-100 translate-y-0 pointer-events-auto'
          : 'opacity-0 scale-95 -translate-y-2 pointer-events-none'
        }
      `"
      role="listbox"
      :aria-activedescendant="value"
    >
      <div class="py-2">
        <button
          v-for="option in roleOptions"
          :key="option.value"
          type="button"
          role="option"
          :aria-selected="option.value === value"
          :disabled="!option.available || disabled"
          @click="handleSelect(option)"
          :class="`
            w-full flex items-center justify-between gap-3
            px-4 py-2.5
            text-left text-sm
            transition-all duration-150
            ${!option.available
              ? 'opacity-50 cursor-not-allowed'
              : 'cursor-pointer hover:bg-primary/10'
            }
            ${option.value === value
              ? 'font-bold text-on-surface'
              : 'font-medium text-on-surface/80'
            }
          `"
        >
          <!-- 选项标签 -->
          <span>
            {{ option.label }}
          </span>

          <!-- 状态图标 -->
          <Lock v-if="!option.available" :size="14" class="text-on-surface-variant/50" />
          <Check v-else-if="option.value === value" :size="16" class="text-primary" :stroke-width="2.5" />
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { ChevronDown, Check, Lock } from 'lucide-vue-next';
import type { UserRole } from '@/types';

interface RoleOption {
  value: UserRole;
  label: string;
  available: boolean;
}

const props = withDefaults(defineProps<{
  value: UserRole;
  disabled?: boolean;
}>(), {
  disabled: false
});

const emit = defineEmits<{
  (e: 'update:value', role: UserRole): void;
  (e: 'change', role: UserRole): void;
}>();

const isOpen = ref(false);
const containerRef = ref<HTMLElement | null>(null);

const roleOptions: RoleOption[] = [
  { value: 'Defense AI', label: '辩护代理人', available: true },
  { value: 'Prosecutor AI', label: '公诉人', available: false },
  { value: 'Judge AI', label: '审判长', available: false },
  { value: 'Observer', label: '旁听', available: false },
];

const ROLE_DISPLAY_NAMES: Record<UserRole, string> = {
  'Defense AI': '辩护代理人',
  'Prosecutor AI': '公诉人',
  'Judge AI': '审判长',
  'Observer': '旁听',
};

const currentLabel = computed(() => ROLE_DISPLAY_NAMES[props.value] || props.value);

function toggleOpen() {
  if (!props.disabled) {
    isOpen.value = !isOpen.value;
  }
}

function handleSelect(option: RoleOption) {
  if (!option.available || props.disabled) return;
  emit('update:value', option.value); // Support v-model
  emit('change', option.value);
  isOpen.value = false;
}

// Click Outside
function handleClickOutside(event: MouseEvent) {
  if (containerRef.value && !containerRef.value.contains(event.target as Node)) {
    isOpen.value = false;
  }
}

// Escape Key
function handleEscape(event: KeyboardEvent) {
  if (event.key === 'Escape') {
    isOpen.value = false;
  }
}

onMounted(() => {
  document.addEventListener('mousedown', handleClickOutside);
  document.addEventListener('keydown', handleEscape);
});

onUnmounted(() => {
  document.removeEventListener('mousedown', handleClickOutside);
  document.removeEventListener('keydown', handleEscape);
});
</script>
