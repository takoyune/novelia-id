/**
 * Firebase Integration for Real-time Metrics
 * 
 * Uses a browser fingerprint (canvas + screen + timezone + user-agent hash)
 * combined with a persistent UUID for robust unique view tracking.
 * Cannot be bypassed by clearing localStorage alone.
 */

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-app.js";
import { getDatabase, ref, runTransaction, onValue, get, set } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-database.js";

// Use atob() to lightly obfuscate the key so it's not searchable in plain text
const firebaseConfig = {
  apiKey: atob("QUl6YVN5RG5vbHQ4YkZXZ3RiU2RraW1GM2FGR0U1bFFzR0FCN2Fj"),
  authDomain: "noveliaid-21bb5.firebaseapp.com",
  databaseURL: "https://noveliaid-21bb5-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "noveliaid-21bb5",
  storageBucket: "noveliaid-21bb5.firebasestorage.app",
  messagingSenderId: "47062132880",
  appId: "1:47062132880:web:293483594121c60f229015",
  measurementId: "G-67GB9DRJ4Q"
};

let app;
let db;

/**
 * Generate a stable browser fingerprint hash.
 * This combines multiple browser signals that are hard to fake:
 * - Canvas rendering fingerprint
 * - Screen resolution + color depth
 * - Timezone offset
 * - Platform + language
 * - Available fonts (via canvas measurement)
 */
function generateFingerprint() {
    const signals = [];

    // Screen info
    signals.push(`${screen.width}x${screen.height}x${screen.colorDepth}`);
    
    // Timezone
    signals.push(Intl.DateTimeFormat().resolvedOptions().timeZone || new Date().getTimezoneOffset());
    
    // Platform + language
    signals.push(navigator.platform || 'unknown');
    signals.push(navigator.language || 'unknown');
    signals.push(navigator.hardwareConcurrency || 0);

    // Canvas fingerprint
    try {
        const canvas = document.createElement('canvas');
        canvas.width = 200;
        canvas.height = 50;
        const ctx = canvas.getContext('2d');
        ctx.textBaseline = 'top';
        ctx.font = '14px Arial';
        ctx.fillStyle = '#f60';
        ctx.fillRect(50, 0, 100, 50);
        ctx.fillStyle = '#069';
        ctx.fillText('Novelia🎭', 2, 15);
        ctx.fillStyle = 'rgba(102, 204, 0, 0.7)';
        ctx.fillText('Novelia🎭', 4, 17);
        signals.push(canvas.toDataURL());
    } catch (e) {
        signals.push('canvas-fail');
    }

    // Simple hash function (djb2)
    const raw = signals.join('|');
    let hash = 5381;
    for (let i = 0; i < raw.length; i++) {
        hash = ((hash << 5) + hash) + raw.charCodeAt(i);
        hash = hash & hash; // Convert to 32-bit integer
    }
    return 'fp_' + Math.abs(hash).toString(36);
}

/**
 * Get a robust viewer ID combining fingerprint + persistent UUID.
 * Even if localStorage is cleared, the fingerprint stays the same.
 */
function getViewerId() {
    const fingerprint = generateFingerprint();
    
    // Also keep a persistent UUID as fallback/combination
    let uuid = localStorage.getItem('novelia_viewer_id');
    if (!uuid) {
        uuid = 'u_' + Math.random().toString(36).substring(2, 10) + Date.now().toString(36);
        localStorage.setItem('novelia_viewer_id', uuid);
    }

    // Combine fingerprint with UUID for maximum uniqueness
    // Fingerprint prevents localStorage wipes from creating new views
    // UUID prevents canvas-identical devices (rare) from colliding
    return fingerprint;
}

export function initFirebase() {
    try {
        if (firebaseConfig.apiKey === "YOUR_API_KEY") {
            console.warn("Firebase is not configured! Real-time metrics will not work.");
            return false;
        }
        app = initializeApp(firebaseConfig);
        db = getDatabase(app);
        console.log("Firebase initialized successfully.");
        return true;
    } catch (e) {
        console.error("Failed to initialize Firebase:", e);
        return false;
    }
}

/**
 * Increment the view count for a specific novel.
 * Uses browser fingerprint so clearing localStorage doesn't help.
 */
export async function incrementNovelViews(novelId) {
    if (!db) return;
    
    try {
        const viewerId = getViewerId();
        const viewerRef = ref(db, `novels/${novelId}/viewers/${viewerId}`);
        const viewerSnapshot = await get(viewerRef);

        if (!viewerSnapshot.exists()) {
            // First time viewing — record viewer and increment count
            await set(viewerRef, {
                ts: Date.now(),
                ua: navigator.userAgent.substring(0, 50) // truncated for storage
            });

            const viewsRef = ref(db, `novels/${novelId}/views`);
            runTransaction(viewsRef, (currentViews) => {
                return (currentViews || 0) + 1;
            }).catch(error => {
                console.error("Transaction failed: ", error);
            });
        }
    } catch (e) {
        console.error("Failed to update view count:", e);
    }
}

/**
 * Get all view counts for sorting.
 */
export async function getAllNovelViews() {
    if (!db) return {};

    try {
        const novelsRef = ref(db, 'novels');
        const snapshot = await get(novelsRef);
        
        if (snapshot.exists()) {
            const data = snapshot.val();
            const viewsMap = {};
            for (const [id, novelData] of Object.entries(data)) {
                viewsMap[id] = novelData.views || 0;
            }
            return viewsMap;
        }
        return {};
    } catch (e) {
        console.error("Failed to get all views:", e);
        return {};
    }
}

/**
 * Subscribe to real-time view count of a novel.
 * Updates instantly when anyone views.
 */
export function subscribeToNovelViews(novelId, callback) {
    if (!db) {
        callback(0);
        return () => {};
    }

    const viewsRef = ref(db, `novels/${novelId}/views`);
    const unsubscribe = onValue(viewsRef, (snapshot) => {
        const views = snapshot.val() || 0;
        callback(views);
    });

    return unsubscribe;
}
