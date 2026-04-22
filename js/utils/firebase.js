/**
 * Firebase Integration for Real-time Metrics
 * 
 * IMPORTANT: You must replace the firebaseConfig object below with your actual 
 * Firebase project configuration!
 */

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-app.js";
import { getDatabase, ref, runTransaction, onValue } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-database.js";

// TODO: Replace with your Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyDnolt8bFWgtbSdkimF3aFGE5lQsGAB7ac",
  authDomain: "noveliaid-21bb5.firebaseapp.com",
  databaseURL: "https://noveliaid-21bb5-default-rtdb.firebaseio.com",
  projectId: "noveliaid-21bb5",
  storageBucket: "noveliaid-21bb5.firebasestorage.app",
  messagingSenderId: "47062132880",
  appId: "1:47062132880:web:293483594121c60f229015",
  measurementId: "G-67GB9DRJ4Q"
};

let app;
let db;

export function initFirebase() {
    try {
        if (firebaseConfig.apiKey === "YOUR_API_KEY") {
            console.warn("Firebase is not configured! Real-time metrics will not work. Please update js/utils/firebase.js with your config.");
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
 * @param {string} novelId 
 */
export function incrementNovelViews(novelId) {
    if (!db) return;
    
    const viewsRef = ref(db, `novels/${novelId}/views`);
    runTransaction(viewsRef, (currentViews) => {
        return (currentViews || 0) + 1;
    }).catch(error => {
        console.error("Transaction failed: ", error);
    });
}

/**
 * Subscribe to the real-time view count of a novel.
 * @param {string} novelId 
 * @param {function} callback - Called whenever the view count changes
 * @returns {function} Unsubscribe function
 */
export function subscribeToNovelViews(novelId, callback) {
    if (!db) {
        // Fallback if Firebase isn't configured
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
