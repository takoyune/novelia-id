export function renderFooter() {
    const footer = document.getElementById('site-footer');
    
    footer.innerHTML = `
        <!-- Global Donation Banner -->
        <div class="container mb-8">
            <div class="bg-accent/10 border border-accent/20 rounded-xl p-4 flex flex-col md:flex-row items-center justify-between gap-4">
                <div>
                    <h3 class="text-accent font-bold mb-1">Dukung Terjemahan Kami! ☕</h3>
                    <p class="text-sm text-secondary">Suka dengan novel di sini? Bantu traktir kopi agar kami makin semangat update chapter baru.</p>
                </div>
                <a href="https://saweria.co/Takoyune" target="_blank" rel="noopener noreferrer" class="btn shrink-0" style="background-color: #E2B02A; color: #333; border: none;">
                    <i class="fas fa-coffee mr-2"></i> Traktir Saweria
                </a>
            </div>
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
