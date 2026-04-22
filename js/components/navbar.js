import { store } from '../store.js';
import { debounce } from '../utils/debounce.js';
import { router } from '../router.js';

export function renderNavbar() {
    const header = document.getElementById('site-header');
    
    header.innerHTML = `
        <div class="container nav-container">
            <a href="#/" class="logo">
                <i class="fas fa-book-open"></i> Novelia ID
            </a>
            
            <div class="search-bar">
                <i class="fas fa-search search-icon"></i>
                <input type="text" id="global-search" class="search-input" placeholder="Search novels, authors..." aria-label="Search">
            </div>

            <div class="nav-actions">
                <button id="theme-toggle" class="icon-btn" aria-label="Toggle theme">
                    <i class="fas fa-moon"></i>
                </button>
            </div>
        </div>
    `;

    // Search logic
    const searchInput = document.getElementById('global-search');
    
    // Set initial value from store if it exists
    const currentSearch = store.getState('filters').search;
    if (currentSearch) {
        searchInput.value = currentSearch;
    }

    const handleSearch = debounce((e) => {
        const query = e.target.value.trim();
        store.setNestedState('filters', 'search', query);
        
        // If not on home page, navigate to home page with search query
        if (window.location.hash.slice(1).split('?')[0] !== '/') {
            router.navigate(router.buildUrl('/', { q: query }));
        } else {
            // Update URL without full reload
            const newUrl = router.buildUrl('/', { ...store.getState('filters'), search: undefined, q: query || undefined });
            history.pushState(null, '', newUrl);
        }
    }, 300);

    searchInput.addEventListener('input', handleSearch);

    // Theme toggle logic
    const themeToggle = document.getElementById('theme-toggle');
    const themeIcon = themeToggle.querySelector('i');

    const updateThemeIcon = (theme) => {
        themeIcon.className = '';
        if (theme === 'light') themeIcon.classList.add('fas', 'fa-sun');
        else if (theme === 'dark') themeIcon.classList.add('fas', 'fa-moon');
        else themeIcon.classList.add('fas', 'fa-desktop'); // System
    };

    updateThemeIcon(store.getState('theme'));

    themeToggle.addEventListener('click', () => {
        const currentTheme = store.getState('theme');
        let newTheme = 'system';
        if (currentTheme === 'system') newTheme = 'light';
        else if (currentTheme === 'light') newTheme = 'dark';
        
        store.setState('theme', newTheme);
        updateThemeIcon(newTheme);
    });
}
