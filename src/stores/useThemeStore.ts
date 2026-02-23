import { defineStore } from 'pinia';
import { ref, watch, onMounted } from 'vue';

export type ThemeId =
    | 'default'
    | 'forest-light'
    | 'forest-dark'
    | 'forest-light-hc'
    | 'forest-dark-hc'
    | 'ocean-light'
    | 'ocean-dark'
    | 'ocean-light-hc'
    | 'ocean-dark-hc';

export interface ThemeOption {
    id: ThemeId;
    label: string;
    mode: 'light' | 'dark';
    family: 'gold' | 'forest' | 'ocean';
}

export const THEMES: ThemeOption[] = [
    { id: 'default', label: 'Vintage Gold', mode: 'light', family: 'gold' },
    { id: 'forest-light', label: 'Forest Light', mode: 'light', family: 'forest' },
    { id: 'forest-dark', label: 'Forest Dark', mode: 'dark', family: 'forest' },
    { id: 'forest-light-hc', label: 'Forest Light (HC)', mode: 'light', family: 'forest' },
    { id: 'forest-dark-hc', label: 'Forest Dark (HC)', mode: 'dark', family: 'forest' },
    { id: 'ocean-light', label: 'Ocean Blue', mode: 'light', family: 'ocean' },
    { id: 'ocean-dark', label: 'Ocean Dark', mode: 'dark', family: 'ocean' },
    { id: 'ocean-light-hc', label: 'Ocean Blue (HC)', mode: 'light', family: 'ocean' },
    { id: 'ocean-dark-hc', label: 'Ocean Dark (HC)', mode: 'dark', family: 'ocean' },
];

export const useThemeStore = defineStore('theme', () => {
    // State
    const theme = ref<ThemeId>('default');

    // Actions
    function setTheme(newTheme: ThemeId) {
        theme.value = newTheme;
    }

    function toggleTheme() {
        // Simple toggle logic can be added here if needed, 
        // but typically users pick from a list.
        // For now, we just expose setTheme.
    }

    // Initialization and Persistence
    function initTheme() {
        const saved = localStorage.getItem('court_theme');
        if (saved && THEMES.some(t => t.id === saved)) {
            theme.value = saved as ThemeId;
        }
        applyTheme(theme.value);
    }

    function applyTheme(t: ThemeId) {
        document.documentElement.setAttribute('data-theme', t);
        localStorage.setItem('court_theme', t);
    }

    // Watch for changes
    watch(theme, (newTheme) => {
        applyTheme(newTheme);
    });

    // Initialize on mount (or immediately if called in Setup)
    // In Pinia setup stores, code outside functions runs when store is created.
    initTheme();

    return {
        theme,
        setTheme,
        toggleTheme,
        themes: THEMES
    };
});
