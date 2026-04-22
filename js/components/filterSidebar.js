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

    // Genres — Custom friendly dropdown
    const selectedCount = initialFilters.genres.length;
    const btnLabel = selectedCount > 0 ? `${selectedCount} Genre Dipilih` : 'Pilih Genre...';
    html += `
        <div class="filter-group mb-6">
            <span class="filter-title block mb-2 font-bold">Genres</span>
            <div class="custom-multiselect" id="genre-dropdown-wrapper">
                <button type="button" class="sort-select text-sm w-full flex justify-between items-center" id="genre-dropdown-btn" aria-expanded="false" aria-haspopup="listbox">
                    <span id="genre-btn-label">${btnLabel}</span>
                    <i class="fas fa-chevron-down text-xs transition-transform" id="genre-chevron"></i>
                </button>
                <div class="genre-dropdown-panel" id="genre-dropdown-panel" role="listbox" aria-multiselectable="true" style="display:none;">
                    ${genres.map((g, i) => `
                        <label class="genre-option-label" for="genre-opt-${i}">
                            <input type="checkbox" id="genre-opt-${i}" class="genre-checkbox" name="genre" value="${g}" ${initialFilters.genres.includes(g) ? 'checked' : ''}>
                            <span class="genre-option-check"><i class="fas fa-check"></i></span>
                            ${g}
                        </label>
                    `).join('')}
                </div>
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

    // --- Dropdown toggle logic (self-contained) ---
    const btn = document.getElementById('genre-dropdown-btn');
    const panel = document.getElementById('genre-dropdown-panel');
    const chevron = document.getElementById('genre-chevron');
    const btnLabelEl = document.getElementById('genre-btn-label');

    function updateBtnLabel() {
        const checked = panel.querySelectorAll('.genre-checkbox:checked');
        btnLabelEl.textContent = checked.length > 0 ? `${checked.length} Genre Dipilih` : 'Pilih Genre...';
    }

    function togglePanel(open) {
        const isOpen = open !== undefined ? open : panel.style.display === 'none';
        panel.style.display = isOpen ? 'block' : 'none';
        btn.setAttribute('aria-expanded', String(isOpen));
        chevron.style.transform = isOpen ? 'rotate(180deg)' : '';
    }

    btn.addEventListener('click', (e) => {
        e.stopPropagation();
        togglePanel();
    });

    // Close on outside click
    document.addEventListener('click', (e) => {
        if (!document.getElementById('genre-dropdown-wrapper')?.contains(e.target)) {
            togglePanel(false);
        }
    });

    // Update label when checkbox changes — bubble up to home.js
    panel.addEventListener('change', () => {
        updateBtnLabel();
    });
}
