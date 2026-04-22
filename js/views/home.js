import { store } from '../store.js';
import { renderNovelCard } from '../components/novelCard.js';
import { Carousel } from '../components/carousel.js';
import { renderFilterSidebar } from '../components/filterSidebar.js';
import { router } from '../router.js';
import { updateMetaTags } from '../utils/seo.js';
import { getAllNovelViews } from '../utils/firebase.js';

export default class HomeView {
    constructor(params, queryParams) {
        this.unsubscribeStore = null;
        this.carousel = null;
        this.initialFilters = {
            search: queryParams.q || '',
            genres: Array.isArray(queryParams.genre) ? queryParams.genre : (queryParams.genre ? [queryParams.genre] : []),
            status: queryParams.status || 'All',
            sort: queryParams.sort || 'Latest Update'
        };
    }

    async render() {
        updateMetaTags({
            title: 'Discover',
            description: 'Discover the latest translated web novels, spanning action, fantasy, romance, and more.'
        });

        // If it's a fresh load with query params, sync them to store first
        if (Object.keys(this.initialFilters).some(k => this.initialFilters[k].length > 0 && this.initialFilters[k] !== 'All' && this.initialFilters[k] !== 'Latest Update')) {
            const currentStoreFilters = store.getState('filters');
            store.setState('filters', { ...currentStoreFilters, ...this.initialFilters });
        }

        return `
            <div id="carousel-root"></div>
            
            <div class="container pb-8">
                <div class="discover-layout">
                    <!-- Sidebar -->
                    <aside class="sidebar-wrapper">
                        <div id="filter-sidebar-root" class="sticky top-20"></div>
                    </aside>

                    <!-- Main Grid -->
                    <section class="main-content">
                        <div class="flex justify-between items-center mb-6">
                            <h2 class="text-2xl" id="grid-title">Discover Novels</h2>
                        </div>
                        
                        <div id="novel-grid" class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                            <!-- Cards will be injected here -->
                        </div>
                        
                        <div id="empty-state" class="hidden py-12 text-center text-secondary">
                            <i class="fas fa-search fa-3x mb-4 opacity-50"></i>
                            <h3 class="text-xl">No novels found</h3>
                            <p>Try adjusting your filters.</p>
                            <button id="clear-filters" class="btn btn-outline mt-4">Clear Filters</button>
                        </div>
                    </section>
                </div>
            </div>
        `;
    }

    async afterRender() {
        const allNovels = store.getState('novels');
        
        // Initialize Carousel (only if no active search/filters)
        const filters = store.getState('filters');
        const hasFilters = filters.search || filters.genres.length > 0 || filters.status !== 'All';
        
        const carouselRoot = document.getElementById('carousel-root');
        if (!hasFilters && allNovels.length >= 3) {
            // Pick 3 random novels
            const shuffled = [...allNovels].sort(() => 0.5 - Math.random());
            const randomTop = shuffled.slice(0, 3);
            
            carouselRoot.innerHTML = '<div class="container"><div id="hero-carousel" class="carousel-container"></div></div>';
            this.carousel = new Carousel('hero-carousel', randomTop);
        } else {
            carouselRoot.innerHTML = '<div class="mt-8"></div>'; // Spacing
        }

        // Initialize Filter Sidebar
        renderFilterSidebar('filter-sidebar-root', filters);
        this.bindFilterEvents();

        // Initial Grid Render
        this.updateGrid();

        // Subscribe to store changes to update grid reactively
        this.unsubscribeStore = store.subscribe('filters', () => {
            this.updateGrid();
            
            // Hide carousel when filtering
            const newFilters = store.getState('filters');
            const newHasFilters = newFilters.search || newFilters.genres.length > 0 || newFilters.status !== 'All';
            if (newHasFilters && this.carousel) {
                this.carousel.destroy();
                this.carousel = null;
                carouselRoot.innerHTML = '<div class="mt-8"></div>';
            }
        });

        // Clear filters button
        const clearBtn = document.getElementById('clear-filters');
        if (clearBtn) {
            clearBtn.addEventListener('click', () => {
                store.setState('filters', {
                    search: '',
                    genres: [],
                    status: 'All',
                    sort: 'Latest Update'
                });
                document.getElementById('global-search').value = '';
                router.navigate('#/');
            });
        }
    }

    bindFilterEvents() {
        const sidebar = document.getElementById('filter-sidebar-root');
        
        // Checkboxes (Genres)
        const checkboxes = sidebar.querySelectorAll('input[type="checkbox"]');
        checkboxes.forEach(cb => {
            cb.addEventListener('change', () => {
                const selected = Array.from(checkboxes)
                    .filter(i => i.checked)
                    .map(i => i.value);
                
                store.setNestedState('filters', 'genres', selected);
                this.updateUrl();
            });
        });

        // Radios (Status)
        const radios = sidebar.querySelectorAll('input[type="radio"]');
        radios.forEach(radio => {
            radio.addEventListener('change', (e) => {
                store.setNestedState('filters', 'status', e.target.value);
                this.updateUrl();
            });
        });

        // Select (Sort)
        const sortSelect = sidebar.querySelector('#sort-select');
        if (sortSelect) {
            sortSelect.addEventListener('change', (e) => {
                store.setNestedState('filters', 'sort', e.target.value);
                this.updateUrl();
            });
        }
    }

    updateUrl() {
        const filters = store.getState('filters');
        const params = {};
        
        if (filters.genres.length > 0) params.genre = filters.genres;
        if (filters.status !== 'All') params.status = filters.status;
        if (filters.sort !== 'Latest Update') params.sort = filters.sort;
        if (filters.search) params.q = filters.search;

        const newUrl = router.buildUrl('/', params);
        history.pushState(null, '', newUrl); // Use pushState to avoid re-rendering entire view
    }

    updateGrid() {
        const grid = document.getElementById('novel-grid');
        const emptyState = document.getElementById('empty-state');
        const gridTitle = document.getElementById('grid-title');
        
        const filteredNovels = store.getFilteredNovels();
        const filters = store.getState('filters');

        // Update Title based on search
        if (filters.search) {
            gridTitle.textContent = `Search results for "${filters.search}"`;
        } else {
            gridTitle.textContent = "Discover Novels";
        }

        if (filteredNovels.length === 0) {
            grid.innerHTML = '';
            grid.classList.add('hidden');
            emptyState.classList.remove('hidden');
        } else {
            emptyState.classList.add('hidden');
            grid.classList.remove('hidden');
            grid.innerHTML = filteredNovels.map(novel => renderNovelCard(novel)).join('');
        }
    }

    destroy() {
        if (this.unsubscribeStore) {
            this.unsubscribeStore();
        }
        if (this.carousel) {
            this.carousel.destroy();
        }
    }
}
