import { store } from './store.js';
import { router } from './router.js';
import { initThemeManager } from './theme.js';
import { renderNavbar } from './components/navbar.js';
import { renderFooter } from './components/footer.js';
import { renderSkeleton } from './components/skeleton.js';

// Import Views
import HomeView from './views/home.js';
import DetailView from './views/detail.js';
import ReaderView from './views/reader.js';
import AdsView from './views/ads.js';
import { initFirebase } from './utils/firebase.js';

class App {
    constructor() {
        this.appContainer = document.getElementById('app');
    }

    async init() {
        // 0. Initialize Backend Services
        initFirebase();

        // 1. Initialize Theme
        initThemeManager();

        // 2. Render Layout Shell
        renderNavbar();
        renderFooter();

        // 2.5 Setup Global Click Listener for Ads
        this.setupAdsTrigger();

        // 3. Fetch Data
        try {
            await this.fetchData();
            
            // 4. Register Routes
            this.registerRoutes();

            // 5. Boot Router
            router.init();
        } catch (error) {
            console.error('Failed to initialize app:', error);
            this.showErrorState(error.message);
        }
    }

    async fetchData() {
        const CACHE_KEY = 'novelia_db_cache';
        const VERSION_KEY = 'novelia_db_version';
        
        try {
            // Check cache first
            const cachedData = localStorage.getItem(CACHE_KEY);
            const cachedVersion = localStorage.getItem(VERSION_KEY);

            // In a real app, you might fetch just a version hash first to check if you need to download the full DB
            // For this simulation, we'll fetch every time to ensure freshness, but use cache if fetch fails
            
            const response = await fetch('database.json');
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            
            const data = await response.json();
            
            // Cache the new data
            localStorage.setItem(CACHE_KEY, JSON.stringify(data));
            localStorage.setItem(VERSION_KEY, data.meta.lastUpdated);
            
            // Populate store
            store.setState('novels', data.novels);
            store.setState('meta', data.meta);

        } catch (error) {
            console.warn('Network fetch failed, attempting to use cache...', error);
            const cachedData = localStorage.getItem(CACHE_KEY);
            
            if (cachedData) {
                const data = JSON.parse(cachedData);
                store.setState('novels', data.novels);
                store.setState('meta', data.meta);
                console.log('Successfully loaded from cache.');
            } else {
                throw new Error("Unable to load library. Please check your connection.");
            }
        }
    }

    registerRoutes() {
        router.addRoute('/', HomeView);
        router.addRoute('/novel/:id', DetailView);
        router.addRoute('/novel/:id/:chapterId', ReaderView);
        router.addRoute('/ads', AdsView);
    }

    setupAdsTrigger() {
        // Use capturing phase so we intercept the click before other handlers or the browser's default action
        document.addEventListener('click', (e) => {
            // Don't count clicks on the ads page itself
            if (window.location.hash.startsWith('#/ads')) return;

            // Only count clicks on "real" interactive elements (buttons, links, etc.)
            const interactive = e.target.closest('button, a, [role="button"], .clickable');
            if (!interactive) return;

            store.incrementClick();
            
            const count = store.getState('clickCount');
            const shouldShowAd = (Math.random() < 0.025) || (count >= 120);
            
            console.log(`Ad Check: Count=${count}/120, Chance=2.5% -> Triggered=${shouldShowAd}`);
            
            if (shouldShowAd) {
                // Prevent the normal click action (e.g. following the link)
                e.preventDefault();
                e.stopPropagation();

                // Reset counter
                store.setState('clickCount', 0);
                
                // Determine where the user WAS going to go
                let targetUrl = window.location.hash || '#/';
                
                if (interactive.tagName.toLowerCase() === 'a' && interactive.getAttribute('href')) {
                    // If it's a link, they were trying to go to the href
                    targetUrl = interactive.getAttribute('href');
                    
                    // If it's a full URL instead of a hash, just extract the hash
                    if (targetUrl.includes('#')) {
                        targetUrl = '#' + targetUrl.split('#')[1];
                    } else if (!targetUrl.startsWith('#')) {
                        targetUrl = '#' + targetUrl;
                    }
                }
                
                // Navigate to ads immediately
                router.navigate(`/ads?continue=${encodeURIComponent(targetUrl)}`);
            }
        }, true); // Important: true enables the capture phase
    }

    showErrorState(message) {
        this.appContainer.innerHTML = `
            <div class="container py-12 text-center text-secondary">
                <i class="fas fa-exclamation-triangle fa-3x mb-4 opacity-50"></i>
                <h2 class="text-2xl font-bold mb-2 text-primary">Error Loading Application</h2>
                <p class="mb-6">${message}</p>
                <button onclick="window.location.reload()" class="btn btn-primary">
                    <i class="fas fa-redo"></i> Retry
                </button>
            </div>
        `;
    }
}

// Boot application when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    const app = new App();
    app.init();
});
