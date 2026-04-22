export function renderFooter() {
    const footer = document.getElementById('site-footer');
    
    footer.innerHTML = `
        <!-- Global Running Text Donators -->
        <div class="container mb-8">
            <h3 class="text-xs text-accent font-bold uppercase tracking-wider mb-2 text-center">Top Supporters</h3>
            <iframe 
                src="https://saweria.co/widgets/recent?streamKey=06f99d9f055f5b8019a99fd37d02a84b" 
                style="width: 100%; height: 50px; border: none; overflow: hidden; background: transparent;" 
                scrolling="no">
            </iframe>
        </div>
        <div class="container grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
                <a href="#/" class="logo mb-4" style="display: inline-flex;">
                    <i class="fas fa-book-open"></i> Novelia ID
                </a>
                <p class="text-secondary text-sm">
                    Your premium destination for high-quality, translated web novels. 
                    Built for readers who appreciate good typography and clean design.
                </p>
            </div>
            
            <div>
                <h3 class="font-bold mb-4">About</h3>
                <ul class="flex flex-col gap-2 text-secondary text-sm">
                    <li><a href="#/" class="hover:text-accent transition-colors">Our Team</a></li>
                    <li><a href="#/" class="hover:text-accent transition-colors">Join Us</a></li>
                    <li><a href="#/" class="hover:text-accent transition-colors">Contact</a></li>
                </ul>
            </div>
            
            <div>
                <h3 class="font-bold mb-4">Legal</h3>
                <ul class="flex flex-col gap-2 text-secondary text-sm">
                    <li><a href="#/" class="hover:text-accent transition-colors">Terms of Service</a></li>
                    <li><a href="#/" class="hover:text-accent transition-colors">Privacy Policy</a></li>
                    <li><a href="#/" class="hover:text-accent transition-colors">DMCA</a></li>
                </ul>
            </div>
            
            <div>
                <h3 class="font-bold mb-4">Follow Us</h3>
                <div class="flex gap-4">
                    <a href="#/" class="icon-btn" aria-label="Twitter">
                        <i class="fab fa-twitter"></i>
                    </a>
                    <a href="#/" class="icon-btn" aria-label="Discord">
                        <i class="fab fa-discord"></i>
                    </a>
                    <a href="#/" class="icon-btn" aria-label="GitHub">
                        <i class="fab fa-github"></i>
                    </a>
                </div>
            </div>
        </div>
        <div class="container mt-8 pt-8 border-t border-color text-center text-secondary text-sm" style="border-top-color: var(--border-color);">
            <p>&copy; ${new Date().getFullYear()} Novelia ID. All rights reserved.</p>
        </div>
    `;
}
