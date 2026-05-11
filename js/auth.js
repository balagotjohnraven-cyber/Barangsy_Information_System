// js/auth.js - 🔥 FIREBASE AUTH VERSION
import { auth, createUserWithEmailAndPassword, signInWithEmailAndPassword, updateProfile } from './firebase.js';

class AuthManager {
    constructor() {
        this.initEventListeners();
        this.checkAuthState();
    }

    initEventListeners() {
        const loginForm = document.getElementById('loginForm');
        const registerForm = document.getElementById('registerForm');

        if (loginForm) {
            loginForm.addEventListener('submit', (e) => this.handleLogin(e));
        }

        if (registerForm) {
            registerForm.addEventListener('submit', (e) => this.handleRegister(e));
        }
    }

    async handleLogin(e) {
        e.preventDefault();
        const email = document.getElementById('loginUsername').value;
        const password = document.getElementById('loginPassword').value;
        const submitBtn = e.target.querySelector('button[type="submit"]');
        
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Logging in...';
        submitBtn.disabled = true;

        try {
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;
            
            // Check if admin (email contains admin or custom claim)
            if (email.includes('admin') || user.email === 'admin@barangay.com') {
                window.location.href = 'admin/dashboard.html';
            } else {
                window.location.href = 'citizen/dashboard.html';
            }
        } catch (error) {
            this.showAlert('Invalid credentials!', 'error');
        } finally {
            submitBtn.innerHTML = '<i class="fas fa-sign-in-alt"></i> Login';
            submitBtn.disabled = false;
        }
    }

    async handleRegister(e) {
        e.preventDefault();
        const userData = {
            email: document.getElementById('email').value,
            password: document.getElementById('regPassword').value,
            name: `${document.getElementById('firstName').value} ${document.getElementById('lastName').value}`,
            username: document.getElementById('regUsername').value,
            purok: document.getElementById('purok').value,
            role: 'citizen'
        };

        const submitBtn = e.target.querySelector('button[type="submit"]');
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Creating...';
        submitBtn.disabled = true;

        try {
            const userCredential = await createUserWithEmailAndPassword(auth, userData.email, userData.password);
            await updateProfile(userCredential.user, { displayName: userData.name });
            
            // Save user profile to Firestore
            await setDoc(doc(db, 'users', userCredential.user.uid), userData);
            
            this.showAlert('Registration successful! Please login.', 'success');
            setTimeout(() => window.location.href = 'login.html', 1500);
        } catch (error) {
            this.showAlert(error.message, 'error');
        } finally {
            submitBtn.innerHTML = '<i class="fas fa-user-plus"></i> Register';
            submitBtn.disabled = false;
        }
    }

    checkAuthState() {
        onAuthStateChanged(auth, (user) => {
            if (user) {
                // Auto-redirect if already logged in
                const currentPath = window.location.pathname;
                if (currentPath.includes('login') || currentPath.includes('register')) {
                    window.location.href = currentPath.includes('admin') ? 'admin/dashboard.html' : 'citizen/dashboard.html';
                }
            }
        });
    }

    showAlert(message, type) {
        const alert = document.createElement('div');
        alert.className = `alert alert-${type}`;
        alert.style.cssText = `
            position: fixed; top: 20px; right: 20px; z-index: 10000;
            padding: 1rem 2rem; border-radius: 12px; color: white;
            background: ${type === 'success' ? '#28a745' : '#dc3545'};
            box-shadow: 0 10px 30px rgba(0,0,0,0.3);
            animation: slideIn 0.3s ease;
        `;
        alert.textContent = message;
        document.body.appendChild(alert);
        
        setTimeout(() => alert.remove(), 4000);
    }
}

document.addEventListener('DOMContentLoaded', () => new AuthManager());
