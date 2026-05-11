// js/utils.js
export const generateId = () => Date.now().toString(36) + Math.random().toString(36).substr(2, 9);

export const formatDate = (timestamp) => new Date(timestamp).toLocaleString();

export const showNotification = (message, type = 'success') => {
  const notification = document.createElement('div');
  notification.className = `notification notification-${type}`;
  notification.innerHTML = `📱 ${message}`;
  document.body.appendChild(notification);
  
  setTimeout(() => notification.remove(), 4000);
};
