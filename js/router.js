import { store } from './store.js';
import { updateMetaTags } from './utils/seo.js';
import { announce } from './utils/a11y.js';

class Router {
    constructor() {
        this.routes = [];
        this.currentRoute = null;
        this.outlet = document.getElementById('app');
        
        // Listen to hash changes
        window.addEventListener('hashchange', this._handleHashChange.bind(this));
    }

    addRoute(pattern, viewComponent) {
        // Convert route pattern /novel/:id to regex
        const paramNames = [];
        const regexPath = pattern.replace(/([:*])(\w+)/g, (full, colon, name) => {
            paramNames.push(name);
            return '([^/]+)';
        }) + '(?:\\?.*)?$'; // Allow query params at the end

        this.routes.push({
            pattern,
            regex: new RegExp(`^${regexPath}`),
            paramNames,
            viewComponent
        });
    }

    init() {
        this._handleHashChange();
    }

    navigate(path) {
        window.location.hash = path;
    }

    // Helper to parse query string ?genre=action&status=ongoing
    _parseQueryParams(queryString) {
        if (!queryString) return {};
        const params = new URLSearchParams(queryString);
        const result = {};
        for (const [key, value] of params.entries()) {
            // Handle array-like params if they appear multiple times or are comma-separated
            if (result[key]) {
                if (Array.isArray(result[key])) {
                    result[key].push(value);
                } else {
                    result[key] = [result[key], value];
                }
            } else {
                result[key] = value.includes(',') ? value.split(',') : value;
            }
        }
        return result;
    }

    async _handleHashChange() {
        let hash = window.location.hash.slice(1) || '/';
        const [path, queryString] = hash.split('?');
        
        let match = null;

        for (const route of this.routes) {
            const regexMatch = path.match(route.regex);
            if (regexMatch) {
                const params = {};
                route.paramNames.forEach((name, i) => {
                    params[name] = decodeURIComponent(regexMatch[i + 1]);
                });
                match = { route, params };
                break;
            }
        }

        if (match) {
            const queryParams = this._parseQueryParams(queryString);
            
            // Cleanup previous view if it has a destroy method
            if (this.currentRoute && this.currentRoute.destroy) {
                this.currentRoute.destroy();
            }

            // Sync URL params to store filters if on home page
            if (match.route.pattern === '/') {
                this._syncUrlToFilters(queryParams);
            }

            // Scroll to top
            window.scrollTo(0, 0);

            // Announce page change to screen readers
            announce(`Navigated to ${match.route.pattern === '/' ? 'Home' : 'page'}`);

            // Render new view
            try {
                this.outlet.innerHTML = ''; // Clear current content
                const viewInstance = new match.route.viewComponent(match.params, queryParams);
                this.currentRoute = viewInstance;
                
                const html = await viewInstance.render();
                this.outlet.innerHTML = html;
                
                if (viewInstance.afterRender) {
                    await viewInstance.afterRender();
                }
            } catch (error) {
                console.error("Routing error:", error);
                this.outlet.innerHTML = `<div class="container py-8 text-center"><h2>Error loading page</h2><p>${error.message}</p></div>`;
            }
        } else {
            // 404 Route
            this.outlet.innerHTML = `<div class="container py-8 text-center"><h2>404 - Page Not Found</h2><a href="#/" class="btn btn-primary mt-4">Go Home</a></div>`;
            updateMetaTags({ title: '404 Not Found' });
            announce("Error 404. Page not found.");
        }
    }

    _syncUrlToFilters(queryParams) {
        // If navigating to home with NO query params, reset all filters
        if (Object.keys(queryParams).length === 0) {
            store.setNestedState('filters', 'search', '');
            store.setNestedState('filters', 'genres', []);
            store.setNestedState('filters', 'status', 'All');
            store.setNestedState('filters', 'sort', 'Latest Update');
            // Also clear the search input if it exists
            const searchInput = document.getElementById('global-search');
            if (searchInput) searchInput.value = '';
            return;
        }

        if (queryParams.genre) {
            const genres = Array.isArray(queryParams.genre) ? queryParams.genre : [queryParams.genre];
            store.setNestedState('filters', 'genres', genres);
        }

        if (queryParams.status) {
            store.setNestedState('filters', 'status', queryParams.status);
        }

        if (queryParams.sort) {
            store.setNestedState('filters', 'sort', queryParams.sort);
        }
        
        if (queryParams.q) {
            store.setNestedState('filters', 'search', queryParams.q);
        }
    }

    // Helper to generate URL with query string
    buildUrl(path, paramsObj) {
        if (!paramsObj || Object.keys(paramsObj).length === 0) return `#${path}`;
        
        const searchParams = new URLSearchParams();
        for (const [key, value] of Object.entries(paramsObj)) {
            if (Array.isArray(value)) {
                if (value.length > 0) searchParams.set(key, value.join(','));
            } else if (value) {
                searchParams.set(key, value);
            }
        }
        
        const qs = searchParams.toString();
        return qs ? `#${path}?${qs}` : `#${path}`;
    }
}

export const router = new Router();
