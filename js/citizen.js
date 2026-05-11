// js/citizen.js - 🔥 FIREBASE LIVE VERSION
import { auth, addRequest, listenToUserRequests, getUserRatings } from './firebase.js';

class CitizenDashboard {
    constructor() {
        this.currentUser = null;
        this.userRequests = [];
        this.unsubscribeRequests = null;
        this.init();
    }

    async init() {
        auth.onAuthStateChanged(async (user) => {
            if (!user) {
                window.location.href = '../login.html';
                return;
            }
            this.currentUser = user;
            this.updateUI();
            this.bindEvents();
            this.startLiveData(); // 🔥 LIVE UPDATES
        });
    }

    updateUI() {
        document.getElementById('citizenName').textContent = this.currentUser.displayName;
    }

    bindEvents() {
        document.querySelectorAll('.nav-item[data-section]').forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                this.switchSection(item.dataset.section);
            });
        });

        document.getElementById('logoutBtn').addEventListener('click', () => {
            auth.signOut();
        });

        document.querySelectorAll('.btn-service').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const service = e.currentTarget.closest('.service-card').dataset.service;
                this.showRequestForm(service);
            });
        });

        document.getElementById('requestForm').addEventListener('submit', (e) => this.handleRequestSubmit(e));
    }

    // 🔥 LIVE USER REQUESTS
    startLiveData() {
        this.unsubscribeRequests = listenToUserRequests(this.currentUser.uid, (requests) => {
            this.userRequests = requests;
            this.loadHistory();
            this.loadStats();
        });
    }

    async handleRequestSubmit(e) {
        e.preventDefault();
        
        const requestData = {
            userId: this.currentUser.uid,
            userName: this.currentUser.displayName,
            email: this.currentUser.email,
            type: document.getElementById('requestType').value,
            purpose: document.getElementById('requestPurpose').value,
            purok: document.getElementById('requestPurok').value,
            status: 'pending'
        };

        await addRequest(requestData);
        this.hideModal('requestFormModal');
        this.showNotification('✅ Request submitted successfully!');
        document.getElementById('requestForm').reset();
    }

    loadHistory() {
        const container = document.getElementById('historyList');
        if (this.userRequests.length === 0) {
            container.innerHTML = '<p style="text-align:center;padding:2rem;color:#666;">No requests yet</p>';
            return;
        }

        container.innerHTML = this.userRequests.map(request => `
            <div class="history-item">
                <div class="history-info">
                    <h4>${request.type.toUpperCase()} Request</h4>
                    <div class="history-meta">
                        <span>${request.purok} • ${request.createdAt.toLocaleDateString()}</span>
                        <span class="status ${request.status}">${request.status.toUpperCase()}${request.reply ? ' • Replied' : ''}</span>
                    </div>
                </div>
                <div>
                    <p>${request.purpose.substring(0, 80)}${request.purpose.length > 80 ? '...' : ''}</p>
                    ${request.reply ? `
                        <div style="background:#e3f2fd;padding:1rem;border-radius:12px;border-left:4px solid #2196f3;">
                            <strong>📅 ${request.reply.scheduledDate} at ${request.reply.scheduledTime}</strong><br>
                            💬 "${request.reply.message}"
                        </div>
                    ` : ''}
                </div>
            </div>
        `).join('');
    }

    loadStats() {
        const appointments = this.userRequests.filter(r => r.type === 'appointment').length;
        document.getElementById('appointmentCount').textContent = appointments;
        document.getElementById('certificateCount').textContent = this.userRequests.filter(r => r.type === 'certificate').length;
    }

    showRequestForm(serviceType) {
        document.getElementById('requestType').value = serviceType;
        document.getElementById('formTitle').textContent = serviceType === 'appointment' ? 
            'New Appointment Request' : 'New Certificate Request';
        document.getElementById('requestFormModal').style.display = 'block';
    }

    hideModal(modalId) {
        document.getElementById(modalId).style.display = 'none';
    }

    switchSection(section) {
        document.querySelectorAll('.dashboard-section').forEach(s => s.classList.remove('active'));
        document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
        document.getElementById(section).classList.add('active');
        document.querySelector(`[data-section="${section}"]`).classList.add('active');
    }

    showNotification(message) {
        const notification = document.createElement('div');
        notification.style.cssText = `
            position:fixed;top:20px;right:20px;background:#28a745;color:white;
            padding:1rem 2rem;border-radius:12px;z-index:10000;
        `;
        notification.textContent = message;
        document.body.appendChild(notification);
        setTimeout(() => notification.remove(), 4000);
    }
}

document.addEventListener('DOMContentLoaded', () => new CitizenDashboard());
