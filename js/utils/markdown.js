export function parseMarkdown(text) {
    if (!text) return '';

    // Escape HTML to prevent XSS
    let html = text.replace(/</g, '&lt;').replace(/>/g, '&gt;');

    // Parse *** to scene break
    html = html.replace(/\*\*\*/g, '<hr class="scene-break">');

    // Parse bold **text**
    html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');

    // Parse italic *text*
    html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');

    // Parse paragraphs (double newlines)
    const paragraphs = html.split(/\n\s*\n/);
    html = paragraphs.map(p => {
        // Handle single newlines within paragraphs
        const lines = p.replace(/\n/g, '<br>').trim();
        if (lines && lines !== '<hr class="scene-break">') {
             return `<p>${lines}</p>`;
        }
        return lines;
    }).join('');

    return html;
}
