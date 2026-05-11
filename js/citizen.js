class CitizenDashboard {
    constructor() {
        this.currentUser = JSON.parse(localStorage.getItem('currentUser'));
        this.db = JSON.parse(localStorage.getItem('barangayDB')) || { users: [], requests: [], ratings: [], notifications: [] };
        this.init();
    }

    init() {
        if (!this.currentUser) {
            window.location.href = '../login.html';
            return;
        }

        this.updateUI();
        this.bindEvents();
        this.loadData();
    }

    updateUI() {
        document.getElementById('citizenName').textContent = this.currentUser.name;
        document.title = `${this.currentUser.name} - Barangay Information System`;
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

        // Service buttons
        document.querySelectorAll('.btn-service').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const service = e.currentTarget.closest('.service-card').dataset.service;
                this.showRequestForm(service);
            });
        });

        // Form handling
        document.getElementById('requestForm').addEventListener('submit', (e) => this.handleRequestSubmit(e));
        document.getElementById('closeFormModal').addEventListener('click', () => this.hideModal('requestFormModal'));
        document.getElementById('closeRatingModal').addEventListener('click', () => this.hideModal('ratingModal'));

        // Rating stars
        document.getElementById('ratingStars').addEventListener('click', (e) => this.handleStarClick(e));
        document.getElementById('submitRating').addEventListener('click', () => this.submitRating());

        // Modal backdrop click
        document.querySelectorAll('.modal').forEach(modal => {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) this.hideModal(modal.id);
            });
        });
    }

    switchSection(section) {
        document.querySelectorAll('.dashboard-section').forEach(s => s.classList.remove('active'));
        document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
        
        document.getElementById(section).classList.add('active');
        document.querySelector(`[data-section="${section}"]`).classList.add('active');
    }

    showRequestForm(serviceType) {
        document.getElementById('requestType').value = serviceType;
        document.getElementById('formTitle').textContent = 
            serviceType === 'appointment' ? 'New Appointment Request' : 'New Certificate Request';
        document.getElementById('requestFormModal').style.display = 'block';
    }

    hideModal(modalId) {
        document.getElementById(modalId).style.display = 'none';
    }

    handleRequestSubmit(e) {
        e.preventDefault();
        
        const request = {
            id: Date.now(),
            userId: this.currentUser.id,
            userName: this.currentUser.name,
            type: document.getElementById('requestType').value,
            purpose: document.getElementById('requestPurpose').value,
            purok: document.getElementById('requestPurok').value,
            status: 'pending',
            createdAt: new Date().toISOString(),
            rated: false
        };

        this.db.requests.push(request);
        this.saveDB();

        // Show rating modal
        this.hideModal('requestFormModal');
        setTimeout(() => {
            document.getElementById('ratingModal').style.display = 'block';
        }, 500);

        // Reset form
        document.getElementById('requestForm').reset();
        this.showNotification(`Request submitted successfully! ID: ${request.id}`);
    }

    handleStarClick(e) {
        const star = e.target.closest('i');
        if (!star) return;

        const rating = parseInt(star.dataset.rating);
        document.getElementById('currentRating').value = rating;
        
        // Update stars
        document.querySelectorAll('#ratingStars i').forEach((s, index) => {
            if (index < rating) {
                s.className = 'fas fa-star active';
            } else {
                s.className = 'far fa-star';
            }
        });

        document.getElementById('ratingText').textContent = 
            rating === 1 ? 'Poor' :
            rating === 2 ? 'Fair' :
            rating === 3 ? 'Good' :
            rating === 4 ? 'Very Good' : 'Excellent';
        
        document.getElementById('submitRating').disabled = false;
    }

    submitRating() {
        const rating = parseInt(document.getElementById('currentRating').value);
        const ratingData = {
            id: Date.now(),
            userId: this.currentUser.id,
            requestId: this.db.requests[this.db.requests.length - 1].id,
            rating: rating,
            createdAt: new Date().toISOString()
        };

        this.db.ratings.push(ratingData);
        
        // Mark last request as rated
        this.db.requests[this.db.requests.length - 1].rated = true;
        
        this.saveDB();
        this.hideModal('ratingModal');
        this.loadData();
        this.showNotification('Thank you for your rating!');
    }

    loadData() {
        this.loadHistory();
        this.loadRatings();
        this.loadStats();
    }

    loadHistory() {
        const userRequests = this.db.requests.filter(r => r.userId === this.currentUser.id);
        const container = document.getElementById('historyList');
        
        if (userRequests.length === 0) {
            container.innerHTML = '<p style="text-align: center; color: #666; padding: 2rem;">No requests yet</p>';
            return;
        }

        container.innerHTML = userRequests.map(request => `
            <div class="history-item" style="display: flex; padding: 1.5rem; border-bottom: 1px solid #f0f0f0;">
                <div class="history-info" style="flex: 0 0 250px;">
                    <h4 style="color: #333; margin-bottom: 0.5rem;">${request.type.replace(/\b\w/g, l => l.toUpperCase())} Request</h4>
                    <div class="history-meta" style="color: #666; font-size: 0.9rem;">
                        <span>${request.purok} • ${new Date(request.createdAt).toLocaleDateString()}</span>
                        <span class="status ${request.status}" style="display: inline-block; padding: 0.25rem 0.75rem; border-radius: 20px; font-size: 0.85rem; font-weight: 600; margin-top: 0.25rem;">
                            ${request.status.toUpperCase()}${request.reply ? ' • 📅 Replied' : ''}
                        </span>
                    </div>
                </div>
                <div style="flex: 1; margin-left: 1rem;">
                    <p style="margin-bottom: 0.5rem; color: #555;">${request.purpose.substring(0, 80)}${request.purpose.length > 80 ? '...' : ''}</p>
                    ${request.reply ? `
                        <div style="background: linear-gradient(45deg, #e3f2fd, #bbdefb); padding: 1rem; border-radius: 12px; border-left: 4px solid #2196f3; margin-top: 0.75rem;">
                            <div style="font-weight: 600; color: #1976d2; margin-bottom: 0.25rem; font-size: 0.95rem;">
                                📅 Visit Barangay Hall: <strong>${request.reply.scheduledDate}</strong> at <strong>${request.reply.scheduledTime}</strong>
                            </div>
                            <div style="font-size: 0.9rem; color: #555; margin-bottom: 0.25rem;">
                                💬 "${request.reply.message}"
                            </div>
                            <div style="font-size: 0.8rem; color: #666;">
                                👤 From: <strong>${request.reply.adminName}</strong>
                            </div>
                        </div>
                    ` : ''}
                </div>
            </div>
        `).join('');
    }

    loadRatings() {
        const userRatings = this.db.ratings.filter(r => r.userId === this.currentUser.id);
        const container = document.getElementById('ratingsList');
        
        if (userRatings.length === 0) {
            container.innerHTML = '<p style="text-align: center; color: #666; padding: 2rem;">No ratings yet</p>';
            return;
        }

        container.innerHTML = userRatings.map(rating => `
            <div class="rating-item">
                <div class="rating-info">
                    <h4>Rating: ${'★'.repeat(rating.rating)}${'☆'.repeat(5 - rating.rating)}</h4>
                    <div class="rating-meta">
                        <span>${new Date(rating.createdAt).toLocaleDateString()}</span>
                    </div>
                </div>
            </div>
        `).join('');
    }

    loadStats() {
        const userRequests = this.db.requests.filter(r => r.userId === this.currentUser.id);
        const userRatings = this.db.ratings.filter(r => r.userId === this.currentUser.id);
        
        document.getElementById('totalRatings').textContent = userRatings.length;
        document.getElementById('appointmentCount').textContent = 
            userRequests.filter(r => r.type === 'appointment').length;
        document.getElementById('certificateCount').textContent = 
            userRequests.filter(r => r.type === 'certificate').length;
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
            box-shadow: 0 10px 30px rgba(0,0,0,0.3);
            z-index: 10000;
            font-weight: 600;
            animation: slideInRight 0.3s ease;
        `;
        notification.textContent = message;
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.remove();
        }, 4000);
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new CitizenDashboard();
});