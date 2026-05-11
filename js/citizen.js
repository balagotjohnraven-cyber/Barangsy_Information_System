// js/citizen.js - 100% COMPLETE
import { db, auth } from './firebase-config.js';
import { 
  ref, push, onValue, update 
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";
import { generateId, showNotification, formatDate } from './utils.js';

class CitizenDashboard {
  constructor() {
    this.currentUser = JSON.parse(localStorage.getItem('currentUser'));
    this.requestsRef = ref(db, 'requests');
    this.ratingsRef = ref(db, 'ratings');
    this.notificationsRef = ref(db, `notifications/${this.currentUser?.uid}`);
    this.init();
  }

  init() {
    if (!this.currentUser) {
      window.location.href = '../login.html';
      return;
    }
    this.updateUI();
    this.bindEvents();
    this.listenForLiveData();
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
      localStorage.removeItem('currentUser');
      window.location.href = '../index.html';
    });

    document.querySelectorAll('.btn-service').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const service = e.currentTarget.closest('.service-card').dataset.service;
        this.showRequestForm(service);
      });
    });

    document.getElementById('requestForm').addEventListener('submit', (e) => this.handleRequestSubmit(e));
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

  async handleRequestSubmit(e) {
    e.preventDefault();
    const request = {
      id: generateId(),
      userId: this.currentUser.uid,
      userName: this.currentUser.displayName,
      type: document.getElementById('requestType').value,
      purpose: document.getElementById('requestPurpose').value,
      purok: document.getElementById('requestPurok').value,
      status: 'pending',
      createdAt: Date.now(),
      rated: false
    };

    await push(this.requestsRef, request);
    document.getElementById('requestFormModal').style.display = 'none';
    document.getElementById('requestForm').reset();
    showNotification(`✅ Request #${request.id.slice(-6).toUpperCase()} submitted LIVE!`);
  }

  listenForLiveData() {
    // LIVE citizen requests
    onValue(this.requestsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const userRequests = Object.values(data).filter(r => r.userId === this.currentUser.uid);
        this.loadHistory(userRequests);
        this.loadStats(userRequests);
      }
    });
  }

  loadHistory(requests) {
    const container = document.getElementById('historyList');
    if (!requests?.length) {
      container.innerHTML = '<p style="text-align: center; color: #666; padding: 3rem;">No requests yet</p>';
      return;
    }

    container.innerHTML = requests.map(request => `
      <div class="history-item">
        <div class="history-info">
          <h4>${request.type.toUpperCase()} Request</h4>
          <div class="history-meta">
            <span>${request.purok} • ${formatDate(request.createdAt)}</span>
            <span class="status ${request.status}">${request.status.toUpperCase()}${request.reply ? ' • 📅 Replied' : ''}</span>
          </div>
        </div>
        <div>
          <p>${request.purpose.substring(0, 80)}${request.purpose.length > 80 ? '...' : ''}</p>
          ${request.reply ? `
            <div style="background: #e3f2fd; padding: 1rem; border-radius: 8px; border-left: 4px solid #2196f3;">
              <strong>📅 ${request.reply.scheduledDate} at ${request.reply.scheduledTime}</strong><br>
              💬 "${request.reply.message}"<br>
              <small>👤 ${request.reply.adminName}</small>
            </div>
          ` : ''}
        </div>
      </div>
    `).join('');
  }

  loadStats(requests) {
    const appointments = requests?.filter(r => r.type === 'appointment').length || 0;
    const certificates = requests?.filter(r => r.type === 'certificate').length || 0;
    document.getElementById('appointmentCount').textContent = appointments;
    document.getElementById('certificateCount').textContent = certificates;
  }
}

document.addEventListener('DOMContentLoaded', () => new CitizenDashboard());
