export function renderNovelCard(novel) {
    // Generate empty/filled stars
    const fullStars = Math.floor(novel.rating);
    const hasHalfStar = novel.rating % 1 !== 0;
    let starsHtml = '';
    
    for (let i = 0; i < 5; i++) {
        if (i < fullStars) {
            starsHtml += '<i class="fas fa-star"></i>';
        } else if (i === fullStars && hasHalfStar) {
            starsHtml += '<i class="fas fa-star-half-alt"></i>';
        } else {
            starsHtml += '<i class="far fa-star"></i>';
        }
    }

    const badgeClass = novel.status === 'Ongoing' ? 'status-ongoing' : 'status-completed';
    const chapterCount = novel.chapters ? novel.chapters.length : 0;

    return `
        <a href="#/novel/${novel.id}" class="novel-card group">
            <div class="card-image-wrapper">
                <img src="${novel.cover}" alt="Cover of ${novel.title}" class="card-image" loading="lazy">
                <div class="card-overlay"></div>
                <div class="status-badge ${badgeClass}">${novel.status}</div>
                <div class="card-chapter-count"><i class="fas fa-book-open"></i> ${chapterCount} Ch</div>
            </div>
            <div class="card-content">
                <h3 class="card-title">${novel.title}</h3>
                <p class="card-author">${novel.author}</p>
                
                <div class="genre-tags" style="margin-bottom: 0.5rem;">
                    ${novel.genres.slice(0, 2).map(g => `<span class="genre-tag" style="font-size: 0.7rem; padding: 0.15rem 0.5rem;">${g}</span>`).join('')}
                </div>

                <div class="card-rating">
                    ${starsHtml} <span class="text-xs ml-1" style="color: var(--text-muted);">${novel.rating}</span>
                </div>
            </div>
        </a>
    `;
}
