// js/admin.js - 🔥 FIREBASE LIVE VERSION
import { auth, listenToAllRequests, updateRequest } from './firebase.js';

class AdminDashboard {
    constructor() {
        this.currentUser = null;
        this.unsubscribeRequests = null;
        this.init();
    }

    async init() {
        auth.onAuthStateChanged(async (user) => {
            if (!user || !user.email.includes('admin')) {
                window.location.href = '../login.html';
                return;
            }
            this.currentUser = user;
            this.updateUI();
            this.bindEvents();
            this.startLiveRequests(); // 🔥 LIVE UPDATES
        });
    }

    updateUI() {
        document.getElementById('adminName').textContent = this.currentUser.displayName || 'Admin';
    }

    bindEvents() {
        // Navigation
        document.querySelectorAll('.nav-item[data-section]').forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                this.switchSection(item.dataset.section);
            });
        });

        // Logout
        document.getElementById('logoutBtn').addEventListener('click', () => {
            auth.signOut();
        });

        // Modal
        document.getElementById('closeModal').addEventListener('click', () => this.hideModal());
        document.getElementById('requestModal').addEventListener('click', (e) => {
            if (e.target === document.getElementById('requestModal')) this.hideModal();
        });

        document.getElementById('replyForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleReplySubmit();
        });
    }

    // 🔥 LIVE REAL-TIME REQUESTS
    startLiveRequests() {
        this.unsubscribeRequests = listenToAllRequests((requests) => {
            this.dbRequests = requests;
            this.updateStats();
            this.loadRequests();
        });
    }

    updateStats() {
        const appointments = this.dbRequests.filter(r => r.type === 'appointment').length;
        const certificates = this.dbRequests.filter(r => r.type === 'certificate').length;
        
        document.getElementById('totalAppointments').textContent = appointments;
        document.getElementById('totalCertificates').textContent = certificates;
    }

    loadRequests() {
        const container = document.getElementById('requestsList');
        const pendingRequests = this.dbRequests.filter(r => r.status === 'pending');

        if (pendingRequests.length === 0) {
            container.innerHTML = '<div style="text-align:center;padding:3rem;color:#666;">No pending requests</div>';
            return;
        }

        container.innerHTML = pendingRequests.map(request => `
            <div class="request-card pending" data-request-id="${request.id}">
                <div class="request-header">
                    <div>
                        <span class="request-type ${request.type}">${request.type.toUpperCase()}</span>
                        <div class="request-meta">
                            <span>${request.userName}</span>
                            <span>• ${request.purok}</span>
                            <span>• ${request.createdAt.toLocaleDateString()}</span>
                        </div>
                    </div>
                </div>
                <div class="request-content">
                    <strong>Purpose:</strong> ${request.purpose}
                </div>
                <div class="request-actions">
                    <button class="btn-small btn-approve" onclick="adminDashboard.approveRequest('${request.id}')">
                        <i class="fas fa-check"></i> Approve
                    </button>
                    <button class="btn-small btn-reject" onclick="adminDashboard.rejectRequest('${request.id}')">
                        <i class="fas fa-times"></i> Reject
                    </button>
                    <button class="btn-small btn-reply" onclick="adminDashboard.showRequestDetails('${request.id}')">
                        <i class="fas fa-reply"></i> Reply
                    </button>
                </div>
            </div>
        `).join('');
    }

    async approveRequest(requestId) {
        await updateRequest(requestId, { status: 'approved' });
        this.showNotification('✅ Request approved!');
    }

    async rejectRequest(requestId) {
        await updateRequest(requestId, { status: 'rejected' });
        this.showNotification('❌ Request rejected!');
    }

    showRequestDetails(requestId) {
        const request = this.dbRequests.find(r => r.id === requestId);
        if (!request) return;

        document.getElementById('modalTitle').textContent = `${request.type.toUpperCase()} - ${request.userName}`;
        document.getElementById('modalContent').innerHTML = `
            <div>
                <strong>User:</strong> ${request.userName}<br>
                <strong>Purok:</strong> ${request.purok}<br>
                <strong>Date:</strong> ${request.createdAt.toLocaleString()}<br>
                <strong>Status:</strong> <span class="status ${request.status}">${request.status.toUpperCase()}</span>
            </div>
            <div style="margin-top:1rem;">
                <strong>Purpose:</strong><br>
                <p style="padding:1rem;background:#f8f9fa;border-radius:8px;">${request.purpose}</p>
            </div>
        `;

        document.getElementById('replyRequestId').value = requestId;
        document.getElementById('replySection').style.display = 'block';
        document.getElementById('requestModal').style.display = 'block';
    }

    async handleReplySubmit() {
        const requestId = document.getElementById('replyRequestId').value;
        const scheduledDate = document.getElementById('scheduledDate').value;
        const scheduledTime = document.getElementById('scheduledTime').value;
        const replyMessage = document.getElementById('replyMessage').value;

        await updateRequest(requestId, {
            status: 'replied',
            reply: {
                scheduledDate,
                scheduledTime,
                message: replyMessage,
                repliedAt: new Date(),
                adminName: this.currentUser.displayName || 'Admin'
            }
        });

        this.hideModal();
        document.getElementById('replyForm').reset();
        this.showNotification('✅ Reply sent to citizen!');
    }

    hideModal() {
        document.getElementById('requestModal').style.display = 'none';
        document.getElementById('replySection').style.display = 'none';
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
            padding:1rem 2rem;border-radius:12px;z-index:10000;box-shadow:0 10px 30px rgba(0,0,0,0.3);
        `;
        notification.textContent = message;
        document.body.appendChild(notification);
        setTimeout(() => notification.remove(), 4000);
    }
}

window.adminDashboard = new AdminDashboard();
