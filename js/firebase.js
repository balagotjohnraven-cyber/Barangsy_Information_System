// js/firebase-config.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getDatabase } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyD38GyriJFEyfcYdql2n3GHPpuBvP2RbDQ",
  authDomain: "barangay-system-1d7aa.firebaseapp.com",
  projectId: "barangay-system-1d7aa",
  storageBucket: "barangay-system-1d7aa.firebasestorage.app",
  messagingSenderId: "979413370986",
  appId: "1:979413370986:web:9e61698869afb9f58b6213",
  measurementId: "G-M1DYK3D7PG"
};

export const app = initializeApp(firebaseConfig);
export const db = getDatabase(app);
export const auth = getAuth(app);
