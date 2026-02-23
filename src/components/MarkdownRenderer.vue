<template>
  <div 
    v-html="renderedContent" 
    class="prose prose-sm max-w-none break-words
           prose-headings:text-on-surface prose-p:text-on-surface-variant 
           prose-strong:text-on-surface prose-a:text-primary hover:prose-a:text-primary-container
           prose-ul:text-on-surface-variant prose-ol:text-on-surface-variant 
           prose-blockquote:border-l-primary prose-blockquote:bg-surface-container prose-blockquote:text-on-surface-variant prose-blockquote:py-1 prose-blockquote:px-3 text-on-surface-variant"
  ></div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import MarkdownIt from 'markdown-it';
import DOMPurify from 'dompurify';

const props = defineProps<{
  content?: string | null;
}>();

const md = new MarkdownIt({
  html: true, // Allow HTML (safely sanitized)
  breaks: true, // Convert \n to <br>
  linkify: true, // Autolink URLs
  typographer: true // Smart quotes
});

const renderedContent = computed(() => {
  if (!props.content) return '';
  const rawHtml = md.render(props.content);
  // Optional: configure DOMPurify to allow specific tags if needed (by default it allows safe HTML like <center>, <h3>, etc)
  return DOMPurify.sanitize(rawHtml, { ADD_ATTR: ['align'] });
});
</script>

<style scoped>
/* Optional: Tighten up spacing for chat bubbles */
:deep(p) {
  margin-top: 0.5em;
  margin-bottom: 0.5em;
}
:deep(p:first-child) {
  margin-top: 0;
}
:deep(p:last-child) {
  margin-bottom: 0;
}
:deep(a) {
  color: inherit;
  text-decoration: underline;
  text-underline-offset: 2px;
}
</style>
