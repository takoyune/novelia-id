export function parseMarkdown(text) {
    if (!text) return '';

    // Normalize line endings
    text = text.replace(/\r\n/g, '\n');

    // Split into lines for block-level parsing
    const lines = text.split('\n');
    const blocks = [];
    let i = 0;

    while (i < lines.length) {
        const line = lines[i];
        const trimmed = line.trim();

        // --- Empty line (paragraph separator) ---
        if (trimmed === '') {
            i++;
            continue;
        }

        // --- Horizontal Rule: ---, ***, ___ (3+ chars, alone on line) ---
        if (/^(-{3,}|\*{3,}|_{3,})$/.test(trimmed)) {
            blocks.push('<hr class="scene-break">');
            i++;
            continue;
        }

        // --- Headings: ### to ###### (skip ## since it's the chapter title) ---
        const headingMatch = trimmed.match(/^(#{3,6})\s+(.+)$/);
        if (headingMatch) {
            const level = headingMatch[1].length;
            const content = parseInline(escapeHtml(headingMatch[2]));
            blocks.push(`<h${level} class="md-heading md-h${level}">${content}</h${level}>`);
            i++;
            continue;
        }

        // --- Blockquote: > text ---
        if (trimmed.startsWith('&gt;') || trimmed.startsWith('>')) {
            const quoteLines = [];
            while (i < lines.length) {
                const ql = lines[i].trim();
                // Match lines starting with > or &gt;
                if (ql.startsWith('>')) {
                    quoteLines.push(ql.replace(/^>\s?/, ''));
                } else if (ql.startsWith('&gt;')) {
                    quoteLines.push(ql.replace(/^&gt;\s?/, ''));
                } else if (ql === '') {
                    // Allow empty lines inside blockquote if next line is also a quote
                    if (i + 1 < lines.length && (lines[i + 1].trim().startsWith('>') || lines[i + 1].trim().startsWith('&gt;'))) {
                        quoteLines.push('');
                        i++;
                        continue;
                    }
                    break;
                } else {
                    break;
                }
                i++;
            }
            // Recursively parse the inner content of the blockquote
            const innerHtml = parseMarkdown(quoteLines.join('\n'));
            blocks.push(`<blockquote class="md-blockquote">${innerHtml}</blockquote>`);
            continue;
        }

        // --- Unordered List: - item or * item ---
        if (/^[-*]\s+/.test(trimmed)) {
            const listItems = [];
            while (i < lines.length) {
                const ll = lines[i].trim();
                const listMatch = ll.match(/^[-*]\s+(.+)$/);
                if (listMatch) {
                    listItems.push(`<li>${parseInline(escapeHtml(listMatch[1]))}</li>`);
                    i++;
                } else if (ll === '') {
                    // Allow blank line between items
                    if (i + 1 < lines.length && /^[-*]\s+/.test(lines[i + 1].trim())) {
                        i++;
                        continue;
                    }
                    break;
                } else {
                    break;
                }
            }
            blocks.push(`<ul class="md-list">${listItems.join('')}</ul>`);
            continue;
        }

        // --- Ordered List: 1. item ---
        if (/^\d+\.\s+/.test(trimmed)) {
            const listItems = [];
            while (i < lines.length) {
                const ll = lines[i].trim();
                const listMatch = ll.match(/^\d+\.\s+(.+)$/);
                if (listMatch) {
                    listItems.push(`<li>${parseInline(escapeHtml(listMatch[1]))}</li>`);
                    i++;
                } else if (ll === '') {
                    if (i + 1 < lines.length && /^\d+\.\s+/.test(lines[i + 1].trim())) {
                        i++;
                        continue;
                    }
                    break;
                } else {
                    break;
                }
            }
            blocks.push(`<ol class="md-list md-ol">${listItems.join('')}</ol>`);
            continue;
        }

        // --- Regular paragraph: collect consecutive non-empty, non-special lines ---
        const paraLines = [];
        while (i < lines.length) {
            const pl = lines[i].trim();
            if (pl === '') break;
            // Stop if next line is a block-level element
            if (/^(#{3,6})\s+/.test(pl)) break;
            if (/^(-{3,}|\*{3,}|_{3,})$/.test(pl)) break;
            if (pl.startsWith('>') || pl.startsWith('&gt;')) break;
            if (/^[-*]\s+/.test(pl) && paraLines.length > 0) break;
            if (/^\d+\.\s+/.test(pl) && paraLines.length > 0) break;

            paraLines.push(pl);
            i++;
        }

        if (paraLines.length > 0) {
            const content = parseInline(escapeHtml(paraLines.join('\n'))).replace(/\n/g, '<br>');
            blocks.push(`<p>${content}</p>`);
        }
    }

    return blocks.join('\n');
}

/**
 * Escape HTML special characters to prevent XSS
 */
function escapeHtml(text) {
    return text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

/**
 * Parse inline markdown elements (bold, italic, strikethrough, code, links, images)
 */
function parseInline(text) {
    // Inline code: `code` (must be before bold/italic to avoid conflicts)
    text = text.replace(/`([^`]+)`/g, '<code class="md-code">$1</code>');

    // Images: ![alt](url)
    text = text.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1" class="md-img" loading="lazy">');

    // Links: [text](url)
    text = text.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" class="md-link" target="_blank" rel="noopener noreferrer">$1</a>');

    // Bold + Italic: ***text*** or ___text___
    text = text.replace(/\*{3}(.+?)\*{3}/g, '<strong><em>$1</em></strong>');
    text = text.replace(/_{3}(.+?)_{3}/g, '<strong><em>$1</em></strong>');

    // Bold: **text** or __text__
    text = text.replace(/\*{2}(.+?)\*{2}/g, '<strong>$1</strong>');
    text = text.replace(/_{2}(.+?)_{2}/g, '<strong>$1</strong>');

    // Italic: *text* or _text_ (but not inside words for underscores)
    text = text.replace(/\*(.+?)\*/g, '<em>$1</em>');
    text = text.replace(/(?<!\w)_(.+?)_(?!\w)/g, '<em>$1</em>');

    // Strikethrough: ~~text~~
    text = text.replace(/~~(.+?)~~/g, '<del class="md-del">$1</del>');

    // Em-dashes and special chars: -- to —, ... to …
    text = text.replace(/--/g, '—');

    return text;
}
