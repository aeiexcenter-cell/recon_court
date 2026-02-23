<template>
  <div ref="buttonRef" class="inline-block relative">
    <Button
      variant="ghost"
      size="icon"
      @click="toggleOpen"
      class="text-primary hover:bg-primary/10 rounded-full w-8 h-8"
      title="切换主题"
    >
      <Palette :size="18" />
    </Button>
  </div>

  <Teleport to="body">
    <div
      v-if="isOpen"
      ref="dropdownRef"
      class="fixed w-64 bg-surface-container-high rounded-lg shadow-xl border border-outline-variant/20 py-2 z-[9999] overflow-hidden transform origin-top-left animate-in fade-in zoom-in-95 duration-100 max-h-[80vh] overflow-y-auto"
      :style="{ top: `${position.top}px`, left: `${position.left}px` }"
    >
      <!-- Vintage Gold -->
      <div class="px-3 py-1.5 text-[10px] font-bold text-on-surface-variant/50 uppercase tracking-widest bg-surface-container-highest/50">
        Vintage Gold
      </div>
      <button
        v-for="t in goldThemes"
        :key="t.id"
        @click="selectTheme(t.id)"
        class="w-full text-left px-4 py-2.5 text-sm flex items-center justify-between transition-colors"
        :class="themeStore.theme === t.id ? 'bg-primary/10 text-primary font-medium' : 'text-on-surface hover:bg-surface-container-highest'"
      >
        <span class="flex items-center gap-3">
          <span
            class="w-4 h-4 rounded-full border border-black/10 shadow-sm shrink-0"
            :style="{ backgroundColor: getThemeColor(t.family, t.mode) }"
          />
          {{ t.label }}
        </span>
        <Check v-if="themeStore.theme === t.id" :size="14" />
      </button>

      <div class="h-px bg-outline-variant/10 my-1" />

      <!-- Forest Green -->
      <div class="px-3 py-1.5 text-[10px] font-bold text-on-surface-variant/50 uppercase tracking-widest bg-surface-container-highest/50">
        Forest Green
      </div>
      <button
        v-for="t in forestThemes"
        :key="t.id"
        @click="selectTheme(t.id)"
        class="w-full text-left px-4 py-2.5 text-sm flex items-center justify-between transition-colors"
        :class="themeStore.theme === t.id ? 'bg-primary/10 text-primary font-medium' : 'text-on-surface hover:bg-surface-container-highest'"
      >
        <span class="flex items-center gap-3">
          <span
            class="w-4 h-4 rounded-full border border-black/10 shadow-sm shrink-0"
            :style="{ backgroundColor: getThemeColor(t.family, t.mode) }"
          />
          {{ t.label }}
        </span>
        <Check v-if="themeStore.theme === t.id" :size="14" />
      </button>

      <div class="h-px bg-outline-variant/10 my-1" />

      <!-- Ocean Blue -->
      <div class="px-3 py-1.5 text-[10px] font-bold text-on-surface-variant/50 uppercase tracking-widest bg-surface-container-highest/50">
        Ocean Blue
      </div>
      <button
        v-for="t in oceanThemes"
        :key="t.id"
        @click="selectTheme(t.id)"
        class="w-full text-left px-4 py-2.5 text-sm flex items-center justify-between transition-colors"
        :class="themeStore.theme === t.id ? 'bg-primary/10 text-primary font-medium' : 'text-on-surface hover:bg-surface-container-highest'"
      >
        <span class="flex items-center gap-3">
          <span
            class="w-4 h-4 rounded-full border border-black/10 shadow-sm shrink-0"
            :style="{ backgroundColor: getThemeColor(t.family, t.mode) }"
          />
          {{ t.label }}
        </span>
        <Check v-if="themeStore.theme === t.id" :size="14" />
      </button>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue';
import { Palette, Check } from 'lucide-vue-next';
import { useThemeStore, THEMES, type ThemeId } from '@/stores/useThemeStore';
import Button from './Button.vue';

const themeStore = useThemeStore();
const isOpen = ref(false);
const dropdownRef = ref<HTMLElement | null>(null);
const buttonRef = ref<HTMLElement | null>(null);
const position = ref({ top: 0, left: 0 });

const goldThemes = computed(() => THEMES.filter(t => t.family === 'gold'));
const forestThemes = computed(() => THEMES.filter(t => t.family === 'forest'));
const oceanThemes = computed(() => THEMES.filter(t => t.family === 'ocean'));

function getThemeColor(family: string, mode: string) {
  if (family === 'gold') return '#6d5e0f';
  if (family === 'forest') return mode === 'light' ? '#4c662b' : '#b1d18a';
  if (family === 'ocean') return mode === 'light' ? '#415f91' : '#aac7ff';
  return '#ccc';
}

function toggleOpen() {
  isOpen.value = !isOpen.value;
  if (isOpen.value) {
    nextTick(() => {
        if (buttonRef.value) {
            const rect = buttonRef.value.getBoundingClientRect();
            position.value = {
                top: rect.bottom + 8,
                left: rect.left
            };
        }
    });
  }
}

function selectTheme(id: ThemeId) {
  themeStore.setTheme(id);
  isOpen.value = false;
}

function handleClickOutside(event: MouseEvent) {
  if (
    dropdownRef.value &&
    !dropdownRef.value.contains(event.target as Node) &&
    buttonRef.value &&
    !buttonRef.value.contains(event.target as Node)
  ) {
    isOpen.value = false;
  }
}

function handleResizeScroll() {
  if (isOpen.value) {
    isOpen.value = false;
  }
}

onMounted(() => {
  document.addEventListener('mousedown', handleClickOutside);
  window.addEventListener('resize', handleResizeScroll);
  window.addEventListener('scroll', handleResizeScroll, true);
});

onUnmounted(() => {
  document.removeEventListener('mousedown', handleClickOutside);
  window.removeEventListener('resize', handleResizeScroll);
  window.removeEventListener('scroll', handleResizeScroll, true);
});
</script>
