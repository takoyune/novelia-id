const fs = require('fs');
const path = require('path');

const dbPath = path.join(__dirname, 'database.json');

try {
    const dbData = fs.readFileSync(dbPath, 'utf8');
    const db = JSON.parse(dbData);

    const prevTotal = db.meta?.totalNovels;
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
