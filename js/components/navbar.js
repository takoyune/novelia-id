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
                <!-- Mobile search toggle (visible only on mobile) -->
                <button id="mobile-search-toggle" class="icon-btn md-hidden-btn" aria-label="Search">
                    <i class="fas fa-search"></i>
                </button>
                <button id="theme-toggle" class="icon-btn" aria-label="Toggle theme">
                    <i class="fas fa-moon"></i>
                </button>
            </div>
        </div>
    `;

    // --- Scroll-to-top button (injected once into body) ---
    if (!document.getElementById('scroll-to-top-btn')) {
        const scrollBtn = document.createElement('button');
        scrollBtn.id = 'scroll-to-top-btn';
        scrollBtn.className = 'scroll-to-top';
        scrollBtn.setAttribute('aria-label', 'Scroll to top');
        scrollBtn.innerHTML = '<i class="fas fa-arrow-up"></i>';
        document.body.appendChild(scrollBtn);

        scrollBtn.addEventListener('click', () => {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });

        window.addEventListener('scroll', () => {
            if (window.scrollY > 400) {
                scrollBtn.classList.add('visible');
            } else {
                scrollBtn.classList.remove('visible');
            }
        }, { passive: true });
    }

    // --- Mobile search overlay ---
    const mobileSearchBtn = document.getElementById('mobile-search-toggle');
    mobileSearchBtn.addEventListener('click', () => {
        // Create overlay
        let overlay = document.getElementById('mobile-search-overlay');
        if (overlay) {
            overlay.remove();
            return;
        }
        overlay = document.createElement('div');
        overlay.id = 'mobile-search-overlay';
        overlay.className = 'mobile-search-overlay';
        overlay.innerHTML = `
            <button id="close-mobile-search" class="icon-btn" aria-label="Close search">
                <i class="fas fa-arrow-left"></i>
            </button>
            <input type="text" id="mobile-search-input" class="search-input" placeholder="Search novels..." aria-label="Search" autofocus>
        `;
        document.body.appendChild(overlay);

        const mobileInput = document.getElementById('mobile-search-input');
        mobileInput.focus();

        // Sync with global search
        const currentSearch = store.getState('filters').search;
        if (currentSearch) mobileInput.value = currentSearch;

        const handleMobileSearch = debounce((e) => {
            const query = e.target.value.trim();
            store.setNestedState('filters', 'search', query);
            // Sync to desktop search if exists
            const desktopSearch = document.getElementById('global-search');
            if (desktopSearch) desktopSearch.value = query;

            if (window.location.hash.slice(1).split('?')[0] !== '/') {
                router.navigate(router.buildUrl('/', { q: query }));
            }
        }, 300);
        mobileInput.addEventListener('input', handleMobileSearch);

        document.getElementById('close-mobile-search').addEventListener('click', () => {
            overlay.remove();
        });
    });

    // --- Search logic (desktop) ---
    const searchInput = document.getElementById('global-search');
    const currentSearch = store.getState('filters').search;
    if (currentSearch) {
        searchInput.value = currentSearch;
    }

    const handleSearch = debounce((e) => {
        const query = e.target.value.trim();
        store.setNestedState('filters', 'search', query);
        
        if (window.location.hash.slice(1).split('?')[0] !== '/') {
            router.navigate(router.buildUrl('/', { q: query }));
        } else {
            const newUrl = router.buildUrl('/', { ...store.getState('filters'), search: undefined, q: query || undefined });
            history.pushState(null, '', newUrl);
        }
    }, 300);

    searchInput.addEventListener('input', handleSearch);

    // --- Theme toggle logic ---
    const themeToggle = document.getElementById('theme-toggle');
    const themeIcon = themeToggle.querySelector('i');

    const updateThemeIcon = (theme) => {
        themeIcon.className = '';
        if (theme === 'light') themeIcon.classList.add('fas', 'fa-sun');
        else if (theme === 'dark') themeIcon.classList.add('fas', 'fa-moon');
        else themeIcon.classList.add('fas', 'fa-desktop');
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
