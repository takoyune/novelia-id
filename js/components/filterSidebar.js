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
            <span class="filter-title block mb-3 font-bold">Genres</span>
            <div class="scroll-container">
                ${genres.map(g => `
                    <label class="relative cursor-pointer shrink-0">
                        <input type="checkbox" name="genre" value="${g}" class="chip-checkbox" ${initialFilters.genres.includes(g) ? 'checked' : ''}>
                        <span class="filter-chip">${g}</span>
                    </label>
                `).join('')}
            </div>
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
