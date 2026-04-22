import { store } from '../store.js';

export function renderFilterSidebar(containerId, initialFilters) {
    const container = document.getElementById(containerId);
    if (!container) return;

    // Dynamically extract unique genres from the database
    const allNovels = store.getState('novels') || [];
    const genreSet = new Set();
    allNovels.forEach(novel => {
        if (novel.genres && Array.isArray(novel.genres)) {
            novel.genres.forEach(g => genreSet.add(g));
        }
    });
    const genres = Array.from(genreSet).sort();
    const statuses = ["All", "Ongoing", "Completed"];
    const sorts = ["Latest Update", "A-Z", "Top Rated"];

    let html = `<div class="filter-sidebar">`;

    // Genres
    html += `
        <div class="filter-group mb-6">
            <span class="filter-title block mb-2 font-bold">Genres</span>
            <select id="genre-select" class="sort-select text-sm w-full" multiple size="4" style="padding-top: 0.5rem;">
                ${genres.map(g => `
                    <option value="${g}" ${initialFilters.genres.includes(g) ? 'selected' : ''}>${g}</option>
                `).join('')}
            </select>
            <p class="text-xs text-muted mt-2"><i class="fas fa-info-circle"></i> Tahan Ctrl/Cmd untuk memilih banyak (PC) atau tap ganda (HP)</p>
        </div>
    `;

    // Status
    html += `
        <div class="filter-group">
            <span class="filter-title">Status</span>
            <div class="flex flex-col gap-2">
                ${statuses.map(s => `
                    <label class="radio-label text-sm">
                        <input type="radio" name="status" value="${s}" ${initialFilters.status === s ? 'checked' : ''}>
                        ${s}
                    </label>
                `).join('')}
            </div>
        </div>
    `;

    // Sort
    html += `
        <div class="filter-group">
            <span class="filter-title">Sort By</span>
            <select id="sort-select" class="sort-select text-sm">
                ${sorts.map(s => `
                    <option value="${s}" ${initialFilters.sort === s ? 'selected' : ''}>${s}</option>
                `).join('')}
            </select>
        </div>
    `;

    html += `</div>`;
    container.innerHTML = html;
}
