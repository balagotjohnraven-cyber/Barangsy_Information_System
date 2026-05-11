// js/auth.js - COMPLETE
import { auth, db } from './firebase-config.js';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { ref, set, get } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";
import { showNotification } from './utils.js';

class AuthManager {
  constructor() {
    this.initEventListeners();
  }

  initEventListeners() {
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');

    if (loginForm) loginForm.addEventListener('submit', (e) => this.handleLogin(e));
    if (registerForm) registerForm.addEventListener('submit', (e) => this.handleRegister(e));
  }

  async handleLogin(e) {
    e.preventDefault();
    const email = document.getElementById('loginEmail')?.value || document.getElementById('loginUsername')?.value;
    const password = document.getElementById('loginPassword').value;

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      const userRef = ref(db, `users/${user.uid}`);
      const snapshot = await get(userRef);
      
      const userData = {
        uid: user.uid,
        email: user.email,
        displayName: snapshot.val()?.name || user.displayName || 'Citizen',
        role: snapshot.val()?.role || 'citizen'
      };
      
      localStorage.setItem('currentUser', JSON.stringify(userData));
      
      if (userData.role === 'admin') {
        window.location.href = 'admin/dashboard.html';
      } else {
        window.location.href = 'citizen/dashboard.html';
      }
    } catch (error) {
      showNotification('❌ Login failed: ' + error.message, 'error');
    }
  }

  async handleRegister(e) {
    e.preventDefault();
    const userData = {
      firstName: document.getElementById('firstName').value,
      lastName: document.getElementById('lastName').value,
      email: document.getElementById('email').value,
      password: document.getElementById('regPassword').value,
      purok: document.getElementById('purok').value,
      role: 'citizen'
    };

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, userData.email, userData.password);
      const user = userCredential.user;

      await set(ref(db, `users/${user.uid}`), {
        ...userData,
        uid: user.uid,
        name: `${userData.firstName} ${userData.lastName}`,
        createdAt: Date.now()
      });

      await updateProfile(user, { displayName: userData.name });
      showNotification('✅ Registration successful! Logging in...', 'success');
      setTimeout(() => window.location.href = 'login.html', 1500);
    } catch (error) {
      showNotification('❌ Registration failed: ' + error.message, 'error');
    }
  }
}

document.addEventListener('DOMContentLoaded', () => new AuthManager());
