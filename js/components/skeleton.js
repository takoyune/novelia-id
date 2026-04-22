export function renderSkeleton() {
    return `
        <div class="skeleton-container">
            <div class="skeleton-hero shimmer"></div>
            <div class="skeleton-grid">
                ${Array(6).fill('<div class="skeleton-card shimmer"></div>').join('')}
            </div>
        </div>
    `;
}
