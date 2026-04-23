class Store {
    constructor() {
        this.state = {
            novels: [],
            meta: {},
            filters: {
                search: '',
                genres: [],
                status: 'All', // 'All', 'Ongoing', 'Completed'
                sort: 'Latest Update' // 'Latest Update', 'A-Z', 'Top Rated'
            },
            bookmarks: this._loadFromStorage('novelia_bookmarks', []),
            readProgress: this._loadFromStorage('novelia_progress', {}), // { 'novelId_chapterId': true }
            readerPrefs: this._loadFromStorage('novelia_reader_prefs', {
                fontSize: 18,
                fontFamily: 'Inter',
                theme: 'white' // 'white', 'sepia', 'dark', 'oled'
            }),
            theme: this._loadFromStorage('novelia_theme', 'system'), // 'light', 'dark', 'system'
            clickCount: 0
        };
        this.listeners = new Map();
    }

    _loadFromStorage(key, defaultValue) {
        try {
            const item = localStorage.getItem(key);
            return item ? JSON.parse(item) : defaultValue;
        } catch (e) {
            console.error(`Error loading ${key} from storage:`, e);
            return defaultValue;
        }
    }

    _saveToStorage(key, value) {
        try {
            localStorage.setItem(key, JSON.stringify(value));
        } catch (e) {
            console.error(`Error saving ${key} to storage:`, e);
        }
    }

    getState(key) {
        return key ? this.state[key] : this.state;
    }

    setState(key, value) {
        this.state[key] = typeof value === 'function' ? value(this.state[key]) : value;
        
        // Persist specific keys
        if (['bookmarks', 'readProgress', 'readerPrefs', 'theme'].includes(key)) {
            const storageKey = key === 'theme' ? 'novelia_theme' : 
                               key === 'readerPrefs' ? 'novelia_reader_prefs' : 
                               key === 'readProgress' ? 'novelia_progress' : 
                               'novelia_bookmarks';
            this._saveToStorage(storageKey, this.state[key]);
        }

        this.notify(key);
    }

    // Update deeply nested state (like filters)
    setNestedState(parentKey, childKey, value) {
        this.state[parentKey] = {
            ...this.state[parentKey],
            [childKey]: value
        };
        this.notify(parentKey);
    }

    subscribe(key, callback) {
        if (!this.listeners.has(key)) {
            this.listeners.set(key, []);
        }
        this.listeners.get(key).push(callback);

        // Return unsubscribe function
        return () => {
            const callbacks = this.listeners.get(key);
            this.listeners.set(key, callbacks.filter(cb => cb !== callback));
        };
    }

    notify(key) {
        if (this.listeners.has(key)) {
            this.listeners.get(key).forEach(callback => callback(this.state[key]));
        }
        // Also notify 'all' listeners
        if (this.listeners.has('*')) {
            this.listeners.get('*').forEach(callback => callback(this.state));
        }
    }

    // Helper: Mark chapter as read
    markChapterRead(novelId, chapterId) {
        const key = `${novelId}_${chapterId}`;
        const currentProgress = this.getState('readProgress');
        if (!currentProgress[key]) {
            this.setState('readProgress', prev => ({ ...prev, [key]: true }));
        }
    }

    // Helper: Toggle bookmark
    toggleBookmark(novelId) {
        const bookmarks = this.getState('bookmarks');
        if (bookmarks.includes(novelId)) {
            this.setState('bookmarks', bookmarks.filter(id => id !== novelId));
        } else {
            this.setState('bookmarks', [...bookmarks, novelId]);
        }
    }

    incrementClick() {
        const current = this.getState('clickCount');
        this.setState('clickCount', current + 1);
    }

    // Helper: Get filtered and sorted novels
    getFilteredNovels() {
        let { novels, filters } = this.state;
        
        // 1. Search (matches title, Japanese title, romaji, and author)
        if (filters.search) {
            const query = filters.search.toLowerCase();
            novels = novels.filter(n => 
                n.title.toLowerCase().includes(query) || 
                n.author.toLowerCase().includes(query) ||
                (n.japaneseTitle && n.japaneseTitle.toLowerCase().includes(query)) ||
                (n.RomanjiTitle && n.RomanjiTitle.toLowerCase().includes(query))
            );
        }

        // 2. Status
        if (filters.status !== 'All') {
            novels = novels.filter(n => n.status === filters.status);
        }

        // 3. Genres
        if (filters.genres.length > 0) {
            novels = novels.filter(n => 
                filters.genres.every(g => n.genres.includes(g))
            );
        }

        // 4. Sort
        novels = [...novels].sort((a, b) => {
            switch (filters.sort) {
                case 'A-Z':
                    return a.title.localeCompare(b.title);
                case 'Top Rated':
                    return b.rating - a.rating;
                case 'Latest Update':
                default:
                    return new Date(b.lastUpdated) - new Date(a.lastUpdated);
            }
        });

        return novels;
    }
}

// Export a singleton instance
export const store = new Store();
