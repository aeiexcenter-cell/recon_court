<template>
  <button
    :type="type"
    :disabled="disabled"
    :class="combinedClasses"
    @click="$emit('click', $event)"
  >
    <slot />
  </button>
</template>

<script setup lang="ts">
import { computed } from 'vue';

export type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost' | 'outline' | 'success';
export type ButtonSize = 'xs' | 'sm' | 'md' | 'lg' | 'icon';

const props = withDefaults(defineProps<{
  variant?: ButtonVariant;
  size?: ButtonSize;
  disabled?: boolean;
  type?: 'button' | 'submit' | 'reset';
}>(), {
  variant: 'secondary',
  size: 'md',
  disabled: false,
  type: 'button'
});

defineEmits<{
  (e: 'click', event: MouseEvent): void;
}>();

const baseStyles = `
  inline-flex items-center justify-center
  rounded-md font-medium
  transition-all duration-200
  focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2
  disabled:pointer-events-none disabled:opacity-50
  cursor-pointer
`.trim().replace(/\s+/g, ' ');

const variants: Record<ButtonVariant, string> = {
  primary: `
    bg-primary text-on-primary
    hover:bg-primary/90 hover:shadow-md
    focus-visible:ring-primary
    active:scale-[0.98]
  `.trim().replace(/\s+/g, ' '),

  secondary: `
    bg-surface-container text-on-surface
    hover:bg-surface-container-high
    border border-outline-variant/30
    focus-visible:ring-outline
  `.trim().replace(/\s+/g, ' '),

  danger: `
    bg-error text-white
    hover:bg-error/90 hover:shadow-md
    focus-visible:ring-error
    active:scale-[0.98]
  `.trim().replace(/\s+/g, ' '),

  ghost: `
    bg-transparent text-on-surface
    hover:bg-surface-container-high
    focus-visible:ring-outline
  `.trim().replace(/\s+/g, ' '),

  outline: `
    bg-transparent text-on-surface
    border border-outline
    hover:bg-surface-container
    focus-visible:ring-outline
  `.trim().replace(/\s+/g, ' '),

  success: `
    bg-[#2e7d32] text-white
    hover:bg-[#1b5e20] hover:shadow-md
    focus-visible:ring-[#2e7d32]
    active:scale-[0.98]
  `.trim().replace(/\s+/g, ' ')
};

const sizes: Record<ButtonSize, string> = {
  xs: 'h-6 px-2 text-[10px]',
  sm: 'h-8 px-3 text-xs',
  md: 'h-9 px-4 py-2 text-sm',
  lg: 'h-11 px-6 text-base',
  icon: 'h-9 w-9 p-0'
};

const combinedClasses = computed(() => {
  return `${baseStyles} ${variants[props.variant]} ${sizes[props.size]}`;
});
</script>
