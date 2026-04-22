import { store } from './store.js';

export function initThemeManager() {
    const htmlEl = document.documentElement;
    
    // Listen for system preference changes
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    mediaQuery.addEventListener('change', () => {
        if (store.getState('theme') === 'system') {
            applyTheme('system');
        }
    });

    // Subscribe to store theme changes
    store.subscribe('theme', (newTheme) => {
        applyTheme(newTheme);
    });

    // Apply initial theme
    applyTheme(store.getState('theme'));

    function applyTheme(theme) {
        // Remove existing global theme classes
        htmlEl.classList.remove('light', 'dark', 'system');
        
        // Add new theme class
        htmlEl.classList.add(theme);

        // Update meta theme color for mobile browsers
        const metaThemeColor = document.querySelector('meta[name="theme-color"]');
        if (metaThemeColor) {
            const isDark = theme === 'dark' || (theme === 'system' && mediaQuery.matches);
            metaThemeColor.setAttribute('content', isDark ? '#0f0f14' : '#ffffff');
        } else {
            const meta = document.createElement('meta');
            meta.name = 'theme-color';
            const isDark = theme === 'dark' || (theme === 'system' && mediaQuery.matches);
            meta.content = isDark ? '#0f0f14' : '#ffffff';
            document.head.appendChild(meta);
        }
    }
}

// Helper to apply reader-specific preferences
export function applyReaderPrefs(container) {
    if (!container) return;
    
    const prefs = store.getState('readerPrefs');
    
    // Apply Font Size
    container.style.fontSize = `${prefs.fontSize}px`;
    
    // Apply Font Family
    let fontVar = 'var(--font-sans)';
    if (prefs.fontFamily === 'Merriweather') fontVar = 'var(--font-serif)';
    if (prefs.fontFamily === 'Atkinson Hyperlegible') fontVar = 'var(--font-a11y)';
    container.style.fontFamily = fontVar;

    // Apply Reader Theme (applied to the wrapper, not just content)
    const wrapper = document.querySelector('.reader-wrapper') || container;
    wrapper.classList.remove('reader-white', 'reader-sepia', 'reader-dark', 'reader-oled');
    wrapper.classList.add(`reader-${prefs.theme}`);
}
