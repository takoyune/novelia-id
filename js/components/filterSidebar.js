export function renderFilterSidebar(containerId, initialFilters) {
    const container = document.getElementById(containerId);
    if (!container) return;

    const genres = ["Action", "Fantasy", "Romance", "Isekai", "Sci-Fi", "Horror", "Drama", "Dark Fantasy"];
    const statuses = ["All", "Ongoing", "Completed"];
    const sorts = ["Latest Update", "A-Z", "Top Rated"];

    let html = `<div class="filter-sidebar">`;

    // Genres
    html += `
        <div class="filter-group">
            <span class="filter-title">Genres</span>
            <div class="flex flex-col gap-2">
                ${genres.map(g => `
                    <label class="checkbox-label text-sm">
                        <input type="checkbox" name="genre" value="${g}" ${initialFilters.genres.includes(g) ? 'checked' : ''}>
                        ${g}
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
