import { store } from '../store.js';
import { updateMetaTags } from '../utils/seo.js';
import { announce } from '../utils/a11y.js';
import { incrementNovelViews, subscribeToNovelViews } from '../utils/firebase.js';

export default class DetailView {
    constructor(params) {
        this.novelId = params.id;
        this.novel = store.getState('novels').find(n => n.id === this.novelId);
        this.sortOrder = 'asc'; // 'asc' = Oldest First, 'desc' = Newest First
        this.unsubscribeStore = null;
        this.unsubscribeViews = null;
    }

    async render() {
        if (!this.novel) {
            return `<div class="container py-8 text-center"><h2>Novel not found</h2><a href="#/" class="btn btn-primary mt-4">Go Back</a></div>`;
        }

        updateMetaTags({
            title: this.novel.title,
            description: this.novel.synopsis,
            image: this.novel.cover
        });

        const isBookmarked = store.getState('bookmarks').includes(this.novel.id);
        const readProgress = store.getState('readProgress');
        
        // Check how many chapters read
        const readCount = this.novel.chapters.filter(ch => readProgress[`${this.novel.id}_${ch.id}`]).length;
        const totalCh = this.novel.chapters.length;

        return `
            <!-- Hero Parallax -->
            <div class="detail-hero">
                <div class="detail-bg" style="background-image: url('${this.novel.cover}')"></div>
                <div class="container detail-content">
                    <img src="${this.novel.cover}" alt="Cover" class="detail-cover">
                    
                    <div class="detail-info">
                        <h1 class="detail-title">${this.novel.title}</h1>
                        <div class="detail-meta">
                            <span><i class="fas fa-pen text-accent"></i> ${this.novel.author}</span>
                            <span><i class="fas fa-language text-accent"></i> ${this.novel.translator}</span>
                            <span><i class="fas fa-star text-rating-star" style="color: var(--rating-star);"></i> ${this.novel.rating}</span>
                            <span class="status-badge ${this.novel.status === 'Ongoing' ? 'status-ongoing' : 'status-completed'}" style="position: static;">${this.novel.status}</span>
                        </div>
                        
                        <div class="genre-tags">
                            ${this.novel.genres.map(g => `<span class="genre-tag">${g}</span>`).join('')}
                        </div>

                        <div class="flex gap-4 mt-6" style="flex-wrap: wrap;">
                            <a href="#/novel/${this.novel.id}/${this._getResumeChapter().id}" class="btn btn-primary">
                                <i class="fas fa-book-reader"></i> ${readCount > 0 ? 'Continue Reading' : 'Start Reading'}
                            </a>
                            <button id="bookmark-btn" class="btn btn-outline" aria-pressed="${isBookmarked}">
                                <i class="${isBookmarked ? 'fas' : 'far'} fa-bookmark"></i> 
                                ${isBookmarked ? 'In Library' : 'Add to Library'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <div class="container pb-8">
                <!-- Info Stats Bar (horizontal, full width) -->
                <div class="detail-stats-bar mb-8">
                    <div class="stat-item">
                        <i class="fas fa-book-open text-accent"></i>
                        <div>
                            <span class="stat-value">${totalCh}</span>
                            <span class="stat-label">Chapters</span>
                        </div>
                    </div>
                    <div class="stat-item">
                        <i class="fas fa-eye text-accent"></i>
                        <div>
                            <span id="view-count" class="stat-value"><i class="fas fa-spinner fa-spin text-xs"></i></span>
                            <span class="stat-label">Views</span>
                        </div>
                    </div>
                    <div class="stat-item">
                        <i class="fas fa-clock text-accent"></i>
                        <div>
                            <span class="stat-value">${new Date(this.novel.lastUpdated).toLocaleDateString()}</span>
                            <span class="stat-label">Last Updated</span>
                        </div>
                    </div>
                    <div class="stat-item">
                        <i class="fas fa-check-circle text-accent"></i>
                        <div>
                            <span class="stat-value">${readCount}/${totalCh}</span>
                            <span class="stat-label">Read</span>
                        </div>
                    </div>
                </div>

                <!-- Synopsis (full width) -->
                <div class="synopsis-container mb-8">
                    <h2 class="text-xl font-bold mb-4">Synopsis</h2>
                    <div id="synopsis-content" class="synopsis-text collapsed text-secondary whitespace-pre-line">
                        ${this.novel.synopsis}
                    </div>
                    <button id="toggle-synopsis" class="toggle-synopsis">Show More</button>
                </div>

                <!-- Chapters (full width) -->
                <div id="chapter-list-section">
                    <div class="chapter-list-header">
                        <h2 class="text-xl font-bold">Chapters</h2>
                        <button id="sort-chapters" class="btn btn-outline btn-sm text-sm py-1 px-2">
                            <i class="fas fa-sort-numeric-down"></i> Oldest First
                        </button>
                    </div>
                    
                    <div id="chapter-grid" class="chapter-grid">
                        <!-- Chapters injected here -->
                    </div>
                </div>
            </div>
        `;
    }

    async afterRender() {
        if (!this.novel) return;

        // Synopsis Toggle
        const synopsisEl = document.getElementById('synopsis-content');
        const toggleBtn = document.getElementById('toggle-synopsis');
        
        // Check if synopsis is long enough to need toggling
        if (synopsisEl.scrollHeight <= 100) {
            toggleBtn.style.display = 'none';
            synopsisEl.classList.remove('collapsed');
        } else {
            toggleBtn.addEventListener('click', () => {
                const isCollapsed = synopsisEl.classList.contains('collapsed');
                if (isCollapsed) {
                    synopsisEl.classList.remove('collapsed');
                    synopsisEl.style.maxHeight = `${synopsisEl.scrollHeight}px`;
                    toggleBtn.textContent = 'Show Less';
                    announce('Synopsis expanded');
                } else {
                    synopsisEl.classList.add('collapsed');
                    synopsisEl.style.maxHeight = '100px';
                    toggleBtn.textContent = 'Show More';
                    announce('Synopsis collapsed');
                }
            });
        }

        // Bookmark Toggle
        const bookmarkBtn = document.getElementById('bookmark-btn');
        bookmarkBtn.addEventListener('click', () => {
            store.toggleBookmark(this.novel.id);
        });

        // Subscribe to store to update bookmark button
        this.unsubscribeStore = store.subscribe('bookmarks', (bookmarks) => {
            const isBookmarked = bookmarks.includes(this.novel.id);
            bookmarkBtn.innerHTML = `<i class="${isBookmarked ? 'fas' : 'far'} fa-bookmark"></i> ${isBookmarked ? 'In Library' : 'Add to Library'}`;
            bookmarkBtn.setAttribute('aria-pressed', isBookmarked);
            announce(isBookmarked ? 'Added to library' : 'Removed from library');
        });

        // Chapter List Rendering
        this.renderChapterList();

        // Sort Chapters
        const sortBtn = document.getElementById('sort-chapters');
        sortBtn.addEventListener('click', () => {
            this.sortOrder = this.sortOrder === 'asc' ? 'desc' : 'asc';
            sortBtn.innerHTML = this.sortOrder === 'asc' 
                ? '<i class="fas fa-sort-numeric-down"></i> Oldest First'
                : '<i class="fas fa-sort-numeric-up-alt"></i> Newest First';
            this.renderChapterList();
            announce(`Chapters sorted ${this.sortOrder === 'asc' ? 'oldest' : 'newest'} first`);
        });

        // Real-time Views
        try {
            incrementNovelViews(this.novel.id);
            this.unsubscribeViews = subscribeToNovelViews(this.novel.id, (views) => {
                const viewCountEl = document.getElementById('view-count');
                if (viewCountEl) {
                    viewCountEl.textContent = new Intl.NumberFormat().format(views || 0);
                }
            });
        } catch (e) {
            console.error('Firebase view error:', e);
        }

        // Fallback: if after 5 seconds view count still shows spinner, set to 0
        setTimeout(() => {
            const viewCountEl = document.getElementById('view-count');
            if (viewCountEl && viewCountEl.querySelector('.fa-spinner')) {
                viewCountEl.textContent = '0';
            }
        }, 5000);
    }

    _getResumeChapter() {
        const readProgress = store.getState('readProgress');
        // Find the first unread chapter
        for (const ch of this.novel.chapters) {
            if (!readProgress[`${this.novel.id}_${ch.id}`]) {
                return ch;
            }
        }
        // All chapters read — go to last chapter
        return this.novel.chapters[this.novel.chapters.length - 1];
    }

    renderChapterList() {
        const grid = document.getElementById('chapter-grid');
        const readProgress = store.getState('readProgress');
        
        let sortedChapters = [...this.novel.chapters];
        if (this.sortOrder === 'desc') {
            sortedChapters.reverse();
        }

        // Simple virtual list/pagination concept (rendering all since data is small, 
        // but structured to support chunking if needed)
        
        grid.innerHTML = sortedChapters.map(ch => {
            const isRead = readProgress[`${this.novel.id}_${ch.id}`];
            const dateStr = new Date(ch.date).toLocaleDateString(undefined, {month: 'short', day: 'numeric', year: 'numeric'});
            
            return `
                <a href="#/novel/${this.novel.id}/${ch.id}" class="chapter-item ${isRead ? 'read' : ''}">
                    ${isRead ? '<i class="fas fa-check-circle read-check"></i>' : ''}
                    <div class="flex-1 min-w-0">
                        <div class="chapter-title font-medium truncate">Chapter ${ch.index}: ${ch.title}</div>
                        <div class="text-xs text-muted mt-1">${dateStr}</div>
                    </div>
                </a>
            `;
        }).join('');
    }

    destroy() {
        if (this.unsubscribeStore) {
            this.unsubscribeStore();
        }
        if (this.unsubscribeViews) {
            this.unsubscribeViews();
        }
    }
}
