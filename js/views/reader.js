import { store } from '../store.js';
import { updateMetaTags } from '../utils/seo.js';
import { parseMarkdown } from '../utils/markdown.js';
import { applyReaderPrefs } from '../theme.js';
import { trapFocus, announce } from '../utils/a11y.js';

export default class ReaderView {
    constructor(params) {
        this.novelId = params.id;
        this.chapterId = params.chapterId;
        
        this.novel = store.getState('novels').find(n => n.id === this.novelId);
        if (this.novel) {
            this.chapterIndex = this.novel.chapters.findIndex(c => c.id === this.chapterId);
            this.chapter = this.novel.chapters[this.chapterIndex];
            this.prevChapter = this.novel.chapters[this.chapterIndex - 1];
            this.nextChapter = this.novel.chapters[this.chapterIndex + 1];
        }

        this.unsubscribeStore = null;
        this.cleanupFocusTrap = null;
        this.handleKeyDown = this.handleKeyDown.bind(this);
    }

    async render() {
        if (!this.novel || !this.chapter) {
            return `<div class="container py-8 text-center"><h2>Chapter not found</h2><a href="#/" class="btn btn-primary mt-4">Go Home</a></div>`;
        }

        updateMetaTags({
            title: `Chapter ${this.chapter.index}: ${this.chapter.title} | ${this.novel.title}`,
            description: `Read Chapter ${this.chapter.index} of ${this.novel.title}.`
        });

        // Fetch and parse content dynamically
        let htmlContent = '<p class="text-center opacity-70">Loading chapter content...</p>';
        try {
            const response = await fetch(`content/${this.novel.id}/${this.chapter.id}.md`);
            if (!response.ok) {
                if (response.status === 404) throw new Error('Chapter content file not found.');
                throw new Error(`Failed to load chapter content (${response.status}).`);
            }
            let markdownText = await response.text();
            
            // Strip the ## Title heading from first line (it's already shown in the reader header)
            const lines = markdownText.split(/\r?\n/);
            if (lines[0].trim().startsWith('## ')) {
                // Remove the title line and any blank line after it
                lines.shift();
                if (lines.length > 0 && lines[0].trim() === '') lines.shift();
                markdownText = lines.join('\n');
            }
            
            htmlContent = parseMarkdown(markdownText);
        } catch (error) {
            console.error('Error fetching chapter content:', error);
            htmlContent = `<div class="p-6 bg-red-900/20 border border-red-500/30 text-red-400 rounded text-center my-8">
                <i class="fas fa-exclamation-triangle mb-3 text-3xl"></i>
                <p class="font-bold">${error.message}</p>
                <p class="text-sm mt-2 opacity-80">Ensure that <code>content/${this.novel.id}/${this.chapter.id}.md</code> exists.</p>
            </div>`;
        }

        return `
            <div class="reader-wrapper">
                <!-- Reading Progress Bar -->
                <div id="reading-progress" class="reading-progress-bar" style="width: 0%;"></div>

                <!-- Sticky Header -->
                <header class="reader-header">
                    <a href="#/novel/${this.novel.id}" class="btn text-sm hover:text-accent">
                        <i class="fas fa-arrow-left"></i> 
                        <span class="hidden md:inline ml-2">${this.novel.title}</span>
                    </a>
                    
                    <div class="text-center truncate px-4 flex-1">
                        <span class="font-bold block text-sm md:text-base truncate">Chapter ${this.chapter.index}</span>
                        <span class="text-xs opacity-70 truncate">${this.chapter.title}</span>
                    </div>

                    <button id="open-settings" class="btn icon-btn" aria-label="Reader Settings" aria-haspopup="dialog">
                        <i class="fas fa-cog"></i>
                    </button>
                </header>

                <!-- Main Content Area -->
                <main id="reader-content-area" class="reader-content">
                    <h1 class="text-2xl md:text-4xl font-bold mb-8 text-center">${this.chapter.title || `Chapter ${this.chapter.index}`}</h1>
                    <div class="content-body">
                        ${htmlContent}
                    </div>
                </main>

                <!-- Sticky Footer Navigation -->
                <footer class="reader-footer">
                    <a href="${this.prevChapter ? `#/novel/${this.novel.id}/${this.prevChapter.id}` : '#'}" 
                       class="btn btn-outline ${!this.prevChapter ? 'opacity-50 cursor-not-allowed pointer-events-none' : ''}">
                        <i class="fas fa-chevron-left"></i> <span class="hidden sm:inline ml-2">Prev</span>
                    </a>
                    
                    <a href="#/novel/${this.novel.id}" class="btn">
                        <i class="fas fa-list"></i> Index
                    </a>
                    
                    <a href="${this.nextChapter ? `#/novel/${this.novel.id}/${this.nextChapter.id}` : `#/novel/${this.novel.id}`}" 
                       class="btn btn-outline">
                        <span class="hidden sm:inline mr-2">${this.nextChapter ? 'Next' : 'Finish'}</span> 
                        <i class="fas ${this.nextChapter ? 'fa-chevron-right' : 'fa-check-circle'}"></i>
                    </a>
                </footer>

                <!-- Settings Modal -->
                <div id="settings-modal" class="settings-modal" role="dialog" aria-modal="true" aria-labelledby="settings-title">
                    <div class="settings-content">
                        <div class="flex justify-between items-center mb-6">
                            <h2 id="settings-title" class="text-xl font-bold">Display Settings</h2>
                            <button id="close-settings" class="icon-btn" aria-label="Close settings"><i class="fas fa-times"></i></button>
                        </div>
                        
                        <!-- Font Size -->
                        <div class="settings-group">
                            <label class="settings-label" for="font-size-slider">Font Size</label>
                            <div class="flex items-center gap-4">
                                <span class="text-sm">A</span>
                                <input type="range" id="font-size-slider" min="14" max="28" step="2" class="flex-1" aria-label="Adjust font size">
                                <span class="text-xl font-bold">A</span>
                            </div>
                        </div>

                        <!-- Font Family -->
                        <div class="settings-group mt-6">
                            <label class="settings-label">Font Family</label>
                            <select id="font-family-select" class="sort-select w-full" aria-label="Select font family">
                                <option value="Inter">Sans Serif (Inter)</option>
                                <option value="Merriweather">Serif (Merriweather)</option>
                                <option value="Atkinson Hyperlegible">Accessibility (Atkinson)</option>
                            </select>
                        </div>

                        <!-- Theme -->
                        <div class="settings-group mt-6">
                            <label class="settings-label">Theme</label>
                            <div class="theme-options">
                                <button class="theme-btn btn-white" data-theme="white" aria-label="White theme"></button>
                                <button class="theme-btn btn-sepia" data-theme="sepia" aria-label="Sepia theme"></button>
                                <button class="theme-btn btn-dark" data-theme="dark" aria-label="Dark theme"></button>
                                <button class="theme-btn btn-oled" data-theme="oled" aria-label="OLED black theme"></button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    async afterRender() {
        if (!this.novel || !this.chapter) return;

        // Hide global site header/footer
        const siteHeader = document.getElementById('site-header');
        const siteFooter = document.getElementById('site-footer');
        if (siteHeader) siteHeader.style.display = 'none';
        if (siteFooter) siteFooter.style.display = 'none';

        // Apply initial reader prefs
        const contentArea = document.getElementById('reader-content-area');
        applyReaderPrefs(contentArea);

        // Mark chapter as read
        store.markChapterRead(this.novel.id, this.chapter.id);

        this.initSettingsModal();
        this.bindKeyboardEvents();
        this.initProgressBar();
    }

    initSettingsModal() {
        const modal = document.getElementById('settings-modal');
        const openBtn = document.getElementById('open-settings');
        const closeBtn = document.getElementById('close-settings');
        
        // Controls
        const sizeSlider = document.getElementById('font-size-slider');
        const familySelect = document.getElementById('font-family-select');
        const themeBtns = document.querySelectorAll('.theme-btn');
        const contentArea = document.getElementById('reader-content-area');

        // Set initial values
        const prefs = store.getState('readerPrefs');
        sizeSlider.value = prefs.fontSize;
        familySelect.value = prefs.fontFamily;
        themeBtns.forEach(btn => {
            if (btn.dataset.theme === prefs.theme) btn.classList.add('active');
        });

        // Open/Close logic
        const openModal = () => {
            modal.classList.add('active');
            this.cleanupFocusTrap = trapFocus(modal);
            announce("Reader settings opened");
        };

        const closeModal = () => {
            modal.classList.remove('active');
            if (this.cleanupFocusTrap) this.cleanupFocusTrap();
            openBtn.focus(); // Return focus
            announce("Reader settings closed");
        };

        openBtn.addEventListener('click', openModal);
        closeBtn.addEventListener('click', closeModal);
        modal.addEventListener('click', (e) => {
            if (e.target === modal) closeModal(); // Click outside
        });

        // Settings change handlers
        const updatePrefs = (updates) => {
            const current = store.getState('readerPrefs');
            store.setState('readerPrefs', { ...current, ...updates });
        };

        sizeSlider.addEventListener('input', (e) => updatePrefs({ fontSize: parseInt(e.target.value) }));
        familySelect.addEventListener('change', (e) => updatePrefs({ fontFamily: e.target.value }));
        
        themeBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                themeBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                updatePrefs({ theme: btn.dataset.theme });
            });
        });

        // Subscribe to apply changes immediately
        this.unsubscribeStore = store.subscribe('readerPrefs', () => {
            applyReaderPrefs(contentArea);
        });
    }

    initProgressBar() {
        const progressBar = document.getElementById('reading-progress');
        if (!progressBar) return;

        const updateProgress = () => {
            const scrollTop = window.scrollY;
            const docHeight = document.documentElement.scrollHeight - window.innerHeight;
            const percent = docHeight > 0 ? Math.min((scrollTop / docHeight) * 100, 100) : 0;
            progressBar.style.width = `${percent}%`;
        };

        window.addEventListener('scroll', updateProgress, { passive: true });
        this._cleanupProgress = () => window.removeEventListener('scroll', updateProgress);
        updateProgress();
    }

    bindKeyboardEvents() {
        document.addEventListener('keydown', this.handleKeyDown);
    }

    handleKeyDown(e) {
        // Don't navigate if modal is open
        if (document.getElementById('settings-modal').classList.contains('active')) {
            if (e.key === 'Escape') {
                document.getElementById('close-settings').click();
            }
            return;
        }

        switch(e.key) {
            case 'ArrowLeft':
                if (this.prevChapter) router.navigate(`/novel/${this.novel.id}/${this.prevChapter.id}`);
                break;
            case 'ArrowRight':
                if (this.nextChapter) {
                    router.navigate(`/novel/${this.novel.id}/${this.nextChapter.id}`);
                } else {
                    router.navigate(`/novel/${this.novel.id}`);
                }
                break;
            case 'Escape':
                router.navigate(`/novel/${this.novel.id}`);
                break;
        }
    }

    destroy() {
        if (this.unsubscribeStore) this.unsubscribeStore();
        if (this._cleanupProgress) this._cleanupProgress();
        document.removeEventListener('keydown', this.handleKeyDown);
        if (this.cleanupFocusTrap) this.cleanupFocusTrap();
        
        // Restore global site header/footer
        const siteHeader = document.getElementById('site-header');
        const siteFooter = document.getElementById('site-footer');
        if (siteHeader) siteHeader.style.display = '';
        if (siteFooter) siteFooter.style.display = '';
    }
}
