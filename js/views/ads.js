import { router } from '../router.js';

export default class AdsView {
    constructor(params, queryParams) {
        this.params = params;
        this.queryParams = queryParams;
        this.timeLeft = 10;
        this.timer = null;
        // The URL to continue to is passed via query param or router state
        this.targetUrl = queryParams.continue || '#/';
    }

    async render() {
        return `
            <div class="fixed inset-0 z-[9999] bg-background flex flex-col items-center justify-center p-6 text-center">
                <div class="max-w-md w-full space-y-8 animate-fade-in">
                    <!-- Ad Badge -->
                    <div class="inline-block px-3 py-1 rounded-full bg-accent/10 text-accent text-xs font-bold uppercase tracking-wider mb-4">
                        Commercial Break
                    </div>

                    <h2 class="text-3xl font-bold text-primary">Please wait a moment...</h2>
                    <p class="text-secondary">We'll continue to your content shortly. This helps keep Novelia free!</p>

                    <!-- Mock Ad Content -->
                    <div class="aspect-video w-full bg-surface rounded-2xl border-2 border-dashed border-border flex items-center justify-center p-8 group hover:border-accent transition-colors">
                        <div class="text-center">
                            <i class="fas fa-ad fa-4x text-accent/20 group-hover:text-accent/40 transition-colors mb-4"></i>
                            <p class="text-sm font-medium text-secondary">Premium Web Novel Experience</p>
                            <p class="text-xs text-muted">Join 10,000+ readers today</p>
                        </div>
                    </div>

                    <div class="flex flex-col items-center gap-4">
                        <!-- Progress Circle/Timer -->
                        <div class="relative w-16 h-16 flex items-center justify-center">
                            <svg class="absolute inset-0 w-full h-full -rotate-90">
                                <circle 
                                    cx="32" cy="32" r="28" 
                                    stroke="currentColor" stroke-width="4" 
                                    fill="transparent" 
                                    class="text-border"
                                />
                                <circle 
                                    id="timer-progress"
                                    cx="32" cy="32" r="28" 
                                    stroke="currentColor" stroke-width="4" 
                                    fill="transparent" 
                                    class="text-accent transition-all duration-1000"
                                    stroke-dasharray="176"
                                    stroke-dashoffset="0"
                                />
                            </svg>
                            <span id="countdown-text" class="text-xl font-bold text-primary">${this.timeLeft}</span>
                        </div>

                        <button id="skip-btn" class="btn btn-secondary transition-all">
                            Skip Ad
                        </button>
                    </div>
                </div>

                <div class="absolute bottom-8 text-xs text-muted">
                    Your content will load automatically at <span class="font-mono">${this.targetUrl}</span>
                </div>
            </div>
        `;
    }

    async afterRender() {
        const skipBtn = document.getElementById('skip-btn');
        const countdownText = document.getElementById('countdown-text');
        const progressCircle = document.getElementById('timer-progress');
        
        const totalTime = 10;
        const totalDash = 176;

        this.timer = setInterval(() => {
            this.timeLeft--;
            
            if (countdownText) countdownText.textContent = this.timeLeft;
            
            // Update progress circle
            if (progressCircle) {
                const offset = totalDash - (this.timeLeft / totalTime) * totalDash;
                progressCircle.style.strokeDashoffset = offset;
            }

            if (this.timeLeft <= 0) {
                this.finish();
            }
        }, 1000);

        if (skipBtn) {
            skipBtn.addEventListener('click', () => {
                if (!skipBtn.disabled) this.finish();
            });
        }
    }

    finish() {
        clearInterval(this.timer);
        // Navigate back to the intended page
        window.location.hash = this.targetUrl;
    }

    destroy() {
        if (this.timer) clearInterval(this.timer);
    }
}
