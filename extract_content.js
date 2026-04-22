const fs = require('fs');
const path = require('path');

const dbPath = path.join(__dirname, 'database.json');
const contentDir = path.join(__dirname, 'content');

// Create base content directory
if (!fs.existsSync(contentDir)) {
    fs.mkdirSync(contentDir, { recursive: true });
}

// Read database
const dbData = fs.readFileSync(dbPath, 'utf8');
const db = JSON.parse(dbData);

// Iterate and extract
db.novels.forEach(novel => {
    const novelDir = path.join(contentDir, novel.id);
    if (!fs.existsSync(novelDir)) {
        fs.mkdirSync(novelDir, { recursive: true });
    }

    if (novel.chapters && novel.chapters.length > 0) {
        novel.chapters.forEach(chapter => {
            if (chapter.content) {
                const chapterFile = path.join(novelDir, `${chapter.id}.md`);
                fs.writeFileSync(chapterFile, chapter.content, 'utf8');
                console.log(`Extracted: ${novel.id}/${chapter.id}.md`);
                // Remove content from DB object
                delete chapter.content;
            }
        });
    }
});

// Write updated DB back
fs.writeFileSync(dbPath, JSON.stringify(db, null, 2), 'utf8');
console.log('Successfully updated database.json');
