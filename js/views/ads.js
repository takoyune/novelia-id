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
                        Dukung Novelia ID
                    </div>

                    <h2 class="text-3xl font-bold text-primary">Traktir Kopi Dulu Yuk! ☕</h2>
                    <p class="text-secondary">Jika kamu suka dengan terjemahan kami, dukung kami via Saweria agar makin semangat update!</p>

                    <!-- Saweria Content -->
                    <div class="w-full flex flex-col items-center gap-4">
                        <!-- QR Code Image -->
                        <div class="bg-white p-2 rounded-xl">
                            <img src="https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=https://saweria.co/Takoyune" 
                                 alt="Saweria QR Code" 
                                 class="w-[200px] h-[200px]" />
                        </div>
                        
                        <!-- Clickable Button -->
                        <a href="https://saweria.co/Takoyune" 
                           target="_blank" 
                           rel="noopener noreferrer" 
                           class="btn flex items-center justify-center gap-2"
                           style="background-color: #E2B02A; color: #333;">
                            <i class="fas fa-coffee"></i> 
                            Traktir via Saweria
                        </a>
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
