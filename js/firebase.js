// js/firebase.js
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js';
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js';
import { getFirestore, collection, addDoc, getDocs, query, where, orderBy, updateDoc, doc, serverTimestamp, onSnapshot } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';

const firebaseConfig = {
    // ⚠️ PASTE YOUR FIREBASE CONFIG HERE ⚠️
  apiKey: "AIzaSyD38GyriJFEyfcYdql2n3GHPpuBvP2RbDQ",
  authDomain: "barangay-system-1d7aa.firebaseapp.com",
  projectId: "barangay-system-1d7aa",
  storageBucket: "barangay-system-1d7aa.firebasestorage.app",
  messagingSenderId: "979413370986",
  appId: "1:979413370986:web:9e61698869afb9f58b6213",
  measurementId: "G-M1DYK3D7PG"
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

// 🔥 LIVE REAL-TIME FUNCTIONS
export const listenToRequests = (callback) => {
    return onSnapshot(collection(db, 'requests'), (snapshot) => {
        const requests = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        callback(requests);
    });
};

export const listenToUserRequests = (userId, callback) => {
    return onSnapshot(
        query(collection(db, 'requests'), where('userId', '==', userId)),
        (snapshot) => {
            const requests = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            callback(requests);
        }
    );
};
