const fs = require('fs');
const path = require('path');

const dbPath = path.join(__dirname, 'database.json');
const contentDir = path.join(__dirname, 'content');

try {
    const dbData = fs.readFileSync(dbPath, 'utf8');
    const db = JSON.parse(dbData);

    // ── Auto-scan chapters from content folders ──
    for (const novel of db.novels) {
        const novelDir = path.join(contentDir, novel.id);
        if (!fs.existsSync(novelDir)) continue;

        // Find all .md files matching ch-*.md pattern (case-insensitive)
        const allFiles = fs.readdirSync(novelDir);
        const chapterFiles = allFiles
            .filter(f => /^ch-\d+\.md$/i.test(f))
            .sort((a, b) => {
                // Natural sort by chapter number
                const numA = parseInt(a.match(/ch-(\d+)/i)[1]);
                const numB = parseInt(b.match(/ch-(\d+)/i)[1]);
                return numA - numB;
            });

        if (chapterFiles.length === 0) continue;

        // Build chapters array from files
        const autoChapters = chapterFiles.map((file, idx) => {
            const chNum = parseInt(file.match(/ch-(\d+)/i)[1]);
            const chId = `ch-${chNum}`;
            const filePath = path.join(novelDir, file);

            // Read ## Title from first line of the .md file
            let title = '';
            try {
                const content = fs.readFileSync(filePath, 'utf8');
                const firstLine = content.split(/\r?\n/)[0].trim();
                if (firstLine.startsWith('## ')) {
                    title = firstLine.slice(3).trim();
                }
            } catch (e) {
                // Ignore read errors
            }

            // Fallback title if empty
            if (!title) {
                title = ``;
            }

            // Get file modification date for the chapter date
            const stats = fs.statSync(filePath);
            const fileDate = stats.mtime.toISOString().split('T')[0]; // YYYY-MM-DD

            // If chapter already exists in DB, preserve its date
            const existingCh = novel.chapters?.find(c => c.id === chId);
            const date = existingCh?.date || fileDate;

            return {
                id: chId,
                title: title,
                index: chNum,
                date: date
            };
        });

        novel.chapters = autoChapters;
        console.log(`[update_meta.js] ${novel.id}: auto-scanned ${autoChapters.length} chapters`);
    }

    // ── Update meta ──
    const newTotal = db.novels.length;
    db.meta = {
        totalNovels: newTotal,
        lastUpdated: new Date().toISOString()
    };

    fs.writeFileSync(dbPath, JSON.stringify(db, null, 2), 'utf8');
    console.log(`[update_meta.js] Auto-updated database.json meta: ${newTotal} novels, ${db.meta.lastUpdated}`);
} catch (error) {
    console.error('[update_meta.js] Error updating database metadata:', error);
    process.exit(1);
}
