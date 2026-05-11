class AuthManager {
    constructor() {
        this.db = this.loadDB();
        this.initEventListeners();
    }

    loadDB() {
        try {
            return JSON.parse(localStorage.getItem('barangayDB')) || this.getDefaultDB();
        } catch (e) {
            return this.getDefaultDB();
        }
    }

    getDefaultDB() {
        return {
            users: [
                { id: 1, username: 'admin', password: 'admin123', role: 'admin', name: 'Barangay Admin', email: 'admin@barangay.com' }
            ],
            requests: [],
            ratings: [],
            notifications: []
        };
    }

    saveDB() {
        localStorage.setItem('barangayDB', JSON.stringify(this.db));
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
        const username = document.getElementById('loginUsername').value;
        const password = document.getElementById('loginPassword').value;

        const user = this.db.users.find(u => u.username === username && u.password === password);
        
        if (user) {
            localStorage.setItem('currentUser', JSON.stringify(user));
            
            if (user.role === 'admin') {
                window.location.href = 'admin/dashboard.html';
            } else {
                window.location.href = 'citizen/dashboard.html';
            }
        } else {
            this.showAlert('Invalid credentials!', 'error');
        }
    }

    async handleRegister(e) {
        e.preventDefault();
        const userData = {
            id: Date.now(),
            firstName: document.getElementById('firstName').value,
            lastName: document.getElementById('lastName').value,
            username: document.getElementById('regUsername').value,
            email: document.getElementById('email').value,
            password: document.getElementById('regPassword').value,
            purok: document.getElementById('purok').value,
            role: 'citizen',
            name: `${document.getElementById('firstName').value} ${document.getElementById('lastName').value}`
        };

        // Check if username exists
        if (this.db.users.find(u => u.username === userData.username)) {
            this.showAlert('Username already exists!', 'error');
            return;
        }

        this.db.users.push(userData);
        this.saveDB();
        this.showAlert('Registration successful! Please login.', 'success');
        setTimeout(() => {
            window.location.href = 'login.html';
        }, 1500);
    }

    showAlert(message, type) {
        // Simple alert using native browser alert for reliability
        alert(message);
    }

    static getCurrentUser() {
        try {
            return JSON.parse(localStorage.getItem('currentUser'));
        } catch (e) {
            return null;
        }
    }

    static logout() {
        localStorage.removeItem('currentUser');
        window.location.href = '../index.html';
    }
}

// Initialize auth manager
document.addEventListener('DOMContentLoaded', () => {
    new AuthManager();
});