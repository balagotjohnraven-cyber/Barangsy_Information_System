class AdminDashboard {
    constructor() {
        this.currentUser = JSON.parse(localStorage.getItem('currentUser'));
        this.db = JSON.parse(localStorage.getItem('barangayDB')) || { users: [], requests: [], ratings: [], notifications: [] };
        this.ratingChart = null;
        this.requestsChart = null;
        this.init();
    }

    init() {
        if (!this.currentUser || this.currentUser.role !== 'admin') {
            window.location.href = '../login.html';
            return;
        }

        this.updateUI();
        this.bindEvents();
        this.loadData();
    }

    updateUI() {
        document.getElementById('adminName').textContent = this.currentUser.name;
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
        document.getElementById('logoutBtn').addEventListener('click', (e) => {
            e.preventDefault();
            if (confirm('Are you sure you want to logout?')) {
                localStorage.removeItem('currentUser');
                window.location.href = '../index.html';
            }
        });

        // Modal handling
        document.getElementById('closeModal').addEventListener('click', () => {
            this.hideModal();
        });

        document.getElementById('requestModal').addEventListener('click', (e) => {
            if (e.target === document.getElementById('requestModal')) {
                this.hideModal();
            }
        });

        // Reply form submit handler
        const replyForm = document.getElementById('replyForm');
        if (replyForm) {
            replyForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleReplySubmit();
            });
        }
    }

    switchSection(section) {
        document.querySelectorAll('.dashboard-section').forEach(s => s.classList.remove('active'));
        document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
        
        document.getElementById(section).classList.add('active');
        document.querySelector(`[data-section="${section}"]`).classList.add('active');

        if (section === 'analytics') {
            setTimeout(() => this.renderCharts(), 100);
        }
    }

    /** 🚀 NEW: Force switch to requests (100% reliable) */
    forceSwitchToRequests() {
        // Remove all active classes first
        document.querySelectorAll('.dashboard-section').forEach(s => s.classList.remove('active'));
        document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
        
        // Activate requests section
        const requestsSection = document.getElementById('requests');
        const requestsNav = document.querySelector('[data-section="requests"]');
        
        if (requestsSection) requestsSection.classList.add('active');
        if (requestsNav) requestsNav.classList.add('active');
    }

    loadData() {
        this.loadStats();
        this.loadRequests();
    }

    loadStats() {
        const appointments = this.db.requests.filter(r => r.type === 'appointment').length;
        const certificates = this.db.requests.filter(r => r.type === 'certificate').length;
        const ratings = this.db.ratings;
        
        const avgRating = ratings.length > 0 
            ? (ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length).toFixed(1)
            : 0;

        document.getElementById('totalAppointments').textContent = appointments;
        document.getElementById('totalCertificates').textContent = certificates;
        document.getElementById('avgRating').textContent = avgRating;
    }

    loadRequests() {
        const container = document.getElementById('requestsList');
        const requests = [...this.db.requests].reverse();

        if (requests.length === 0) {
            container.innerHTML = '<p style="text-align: center; color: #666; padding: 3rem;">No requests yet</p>';
            return;
        }

        container.innerHTML = requests.map(request => `
            <div class="request-card ${request.status} ${request.reply ? 'replied' : ''}" data-request-id="${request.id}">
                <div class="request-header">
                    <div>
                        <span class="request-type ${request.type}">${request.type.toUpperCase()}</span>
                        <div class="request-meta">
                            <span>${request.userName}</span>
                            <span>• ${request.purok}</span>
                            <span>• ${new Date(request.createdAt).toLocaleDateString()}</span>
                        </div>
                    </div>
                    ${request.reply ? `<span class="status replied">Replied</span>` : ''}
                </div>
                <div class="request-content">
                    <strong>Purpose:</strong> ${request.purpose}
                    ${request.reply ? `
                        <div style="margin-top: 1rem; padding: 1rem; background: #e8f5e8; border-radius: 8px; font-size: 0.9rem;">
                            <strong>📅 Scheduled:</strong> ${request.reply.scheduledDate} at ${request.reply.scheduledTime}<br>
                            <strong>Message:</strong> ${request.reply.message}
                        </div>
                    ` : ''}
                </div>
                <div class="request-actions">
                    ${request.status === 'pending' && !request.reply ? `
                        <button class="btn-small btn-approve" onclick="adminDashboard.approveRequest(${request.id})">
                            <i class="fas fa-check"></i> Approve
                        </button>
                        <button class="btn-small btn-reject" onclick="adminDashboard.rejectRequest(${request.id})">
                            <i class="fas fa-times"></i> Reject
                        </button>
                        <button class="btn-small btn-reply" onclick="adminDashboard.showRequestDetails(${request.id})">
                            <i class="fas fa-reply"></i> Reply
                        </button>
                    ` : ''}
                    <button class="btn-small btn-reply" onclick="adminDashboard.showRequestDetails(${request.id})">
                        <i class="fas fa-eye"></i> Details
                    </button>
                </div>
            </div>
        `).join('');
    }

    approveRequest(requestId) {
        const request = this.db.requests.find(r => r.id === requestId);
        if (request) {
            request.status = 'approved';
            this.saveDB();
            this.loadRequests();
            this.showNotification('Request approved successfully!');
        }
    }

    rejectRequest(requestId) {
        const request = this.db.requests.find(r => r.id === requestId);
        if (request) {
            request.status = 'rejected';
            this.saveDB();
            this.loadRequests();
            this.showNotification('Request rejected!');
        }
    }

    /** 🚀 PERFECTLY FIXED: Auto-navigates to requests when modal opens */
    showRequestDetails(requestId) {
        const request = this.db.requests.find(r => r.id === requestId);
        if (!request) return;

        document.getElementById('modalTitle').textContent = `${request.type.toUpperCase()} Request - ${request.userName}`;
        
        document.getElementById('modalContent').innerHTML = `
            <div style="margin-bottom: 1.5rem;">
                <strong>User:</strong> ${request.userName}<br>
                <strong>Purok:</strong> ${request.purok}<br>
                <strong>Date:</strong> ${new Date(request.createdAt).toLocaleString()}<br>
                <strong>Status:</strong> <span class="status ${request.status}">${request.status.toUpperCase()}</span>
            </div>
            <div style="margin-bottom: 1.5rem;">
                <strong>Purpose:</strong><br>
                <p style="padding: 1rem; background: #f8f9fa; border-radius: 8px; white-space: pre-wrap;">${request.purpose}</p>
            </div>
            ${request.reply ? `
                <div style="background: #e8f5e8; padding: 1.5rem; border-radius: 8px; margin-bottom: 1rem;">
                    <strong>✅ Admin Reply:</strong><br>
                    <strong>📅 Date:</strong> ${request.reply.scheduledDate} at ${request.reply.scheduledTime}<br>
                    <strong>💬 Message:</strong> ${request.reply.message}<br>
                    <small><em>Replied by: ${request.reply.adminName} on ${new Date(request.reply.repliedAt).toLocaleString()}</em></small>
                </div>
            ` : ''}
            ${request.rated ? `
                <div style="margin-top: 1rem;">
                    <strong>⭐ Rating:</strong> ${'★'.repeat(this.getRatingForRequest(requestId) || 0)}
                </div>
            ` : ''}
        `;

        // Show reply section if pending and no reply yet
        const replySection = document.getElementById('replySection');
        const replyRequestIdInput = document.getElementById('replyRequestId');
        
        if (request.status === 'pending' && !request.reply) {
            replyRequestIdInput.value = requestId;
            replySection.style.display = 'block';
        } else {
            replySection.style.display = 'none';
        }

        // Show modal
        document.getElementById('requestModal').style.display = 'block';
        
        // ✅ FORCE SWITCH TO REQUESTS SECTION
        setTimeout(() => {
            this.forceSwitchToRequests();
        }, 150);
    }

    /** 🚀 100% GUARANTEED: Auto-back after Reply & Notify */
    handleReplySubmit() {
        const requestId = parseInt(document.getElementById('replyRequestId').value);
        const scheduledDate = document.getElementById('scheduledDate').value;
        const scheduledTime = document.getElementById('scheduledTime').value;
        const replyMessage = document.getElementById('replyMessage').value.trim();

        // Validation
        if (!requestId || !scheduledDate || !scheduledTime || !replyMessage) {
            this.showNotification('❌ Please fill all fields!');
            return;
        }

        const request = this.db.requests.find(r => r.id === requestId);
        if (!request) {
            this.showNotification('❌ Request not found!');
            return;
        }

        // 1. Update request with reply
        request.reply = {
            scheduledDate,
            scheduledTime,
            message: replyMessage,
            repliedAt: new Date().toISOString(),
            adminName: this.currentUser.name
        };
        request.status = 'replied';

        // 2. DIRECT NOTIFICATION TO CITIZEN
        const citizen = this.db.users.find(u => u.id === request.userId);
        if (citizen) {
            this.db.notifications.push({
                id: Date.now(),
                userId: request.userId,
                title: `📅 Reply Received - ${request.type.toUpperCase()}`,
                message: `Your ${request.type} request is scheduled for ${scheduledDate} at ${scheduledTime}. "${replyMessage}"`,
                type: 'reply',
                requestId: requestId,
                read: false,
                createdAt: new Date().toISOString()
            });
        }

        // 3. PERFECT TIMING SEQUENCE:
        // Save data FIRST
        this.saveDB();
        
        // Close modal IMMEDIATELY
        this.hideModal();
        
        // Force switch to requests section
        this.forceSwitchToRequests();
        
        // Refresh requests list AFTER section switch
        setTimeout(() => {
            this.loadRequests();
        }, 100);
        
        // Show success notification
        setTimeout(() => {
            this.showNotification(`✅ Reply sent to ${request.userName}! 📋 Back to requests list.`);
        }, 200);
        
        // Reset form
        document.getElementById('replyForm').reset();
    }

    hideModal() {
        document.getElementById('requestModal').style.display = 'none';
        document.getElementById('replySection').style.display = 'none';
    }

    getRatingForRequest(requestId) {
        const rating = this.db.ratings.find(r => r.requestId === requestId);
        return rating ? rating.rating : null;
    }

    renderCharts() {
        this.renderRatingChart();
        this.renderRequestsChart();
    }

    renderRatingChart() {
        const ctx = document.getElementById('ratingChart');
        if (this.ratingChart) this.ratingChart.destroy();

        const ratingsByDay = this.getRatingsByDay();
        this.ratingChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: Object.keys(ratingsByDay),
                datasets: [{
                    label: 'Average Rating',
                    data: Object.values(ratingsByDay),
                    borderColor: '#667eea',
                    backgroundColor: 'rgba(102, 126, 234, 0.1)',
                    tension: 0.4,
                    fill: true
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: { position: 'top' }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        max: 5
                    }
                }
            }
        });
    }

    renderRequestsChart() {
        const ctx = document.getElementById('requestsChart');
        if (this.requestsChart) this.requestsChart.destroy();

        const requestsByType = this.getRequestsByType();
        this.requestsChart = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: ['Appointments', 'Certificates'],
                datasets: [{
                    data: [requestsByType.appointment, requestsByType.certificate],
                    backgroundColor: ['#667eea', '#764ba2']
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: { position: 'bottom' }
                }
            }
        });
    }

    getRatingsByDay() {
        const ratingsByDay = {};
        this.db.ratings.forEach(rating => {
            const date = new Date(rating.createdAt).toLocaleDateString();
            ratingsByDay[date] = ratingsByDay[date] || [];
            ratingsByDay[date].push(rating.rating);
        });

        return Object.fromEntries(
            Object.entries(ratingsByDay).map(([date, ratings]) => [
                date, 
                ratings.reduce((sum, r) => sum + r, 0) / ratings.length
            ])
        );
    }

    getRequestsByType() {
        const appointments = this.db.requests.filter(r => r.type === 'appointment').length;
        const certificates = this.db.requests.filter(r => r.type === 'certificate').length;
        return { appointment: appointments, certificate: certificates };
    }

    saveDB() {
        localStorage.setItem('barangayDB', JSON.stringify(this.db));
    }

    showNotification(message) {
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: linear-gradient(45deg, #28a745, #20c997);
            color: white;
            padding: 1rem 2rem;
            border-radius: 12px;
            box-shadow: 0 15px 35px rgba(0,0,0,0.3);
            z-index: 10000;
            font-weight: 600;
            animation: slideInRight 0.3s ease;
            max-width: 400px;
            word-wrap: break-word;
        `;
        notification.innerHTML = message;
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.style.animation = 'slideOutRight 0.3s ease';
            setTimeout(() => notification.remove(), 300);
        }, 5000);
    }
}

// Global access for onclick handlers
const adminDashboard = new AdminDashboard();