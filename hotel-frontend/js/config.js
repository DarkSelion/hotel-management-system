const API = 'http://localhost:3000';

const ROLE_COLORS = {
  'Admin':        'background:#fef2f2;color:#dc2626;',
  'Receptionist': 'background:#f0fdf4;color:#16a34a;',
  'Manager':      'background:#eff6ff;color:#2563eb;'
};

const ADMIN_MENU = `
  <div class="menu-label">Main Menu</div>
  <a href="dashboard.html">Dashboard</a>
  <a href="rooms.html">Rooms</a>
  <a href="booking.html">Bookings</a>
  <a href="payments.html">Payments</a>
  <hr class="divider">
  <a href="#" onclick="logout()">Logout</a>`;

const STAFF_MENU = `
  <div class="menu-label">Main Menu</div>
  <a href="dashboard.html">Dashboard</a>
  <a href="booking.html">Bookings</a>
  <a href="payments.html">Payments</a>
  <hr class="divider">
  <a href="#" onclick="logout()">Logout</a>`;

function getToken() {
  return localStorage.getItem('token');
}

function getUser() {
  return JSON.parse(localStorage.getItem('user') || '{}');
}

function logout() {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  window.location.href = 'login.html';
}

function requireAuth() {
  if (!getToken()) window.location.href = 'login.html';
}

function setupSidebar(activePage) {
  const user = getUser();
  const role = user.role;

  document.getElementById('sidebarRole').textContent =
    role === 'Admin' ? 'Admin Panel' :
    role === 'Receptionist' ? 'Front Desk' : 'Management';

  const menu = role === 'Admin' ? ADMIN_MENU : STAFF_MENU;
  document.getElementById('sidebarMenu').innerHTML = menu;

  // Set active link
  document.querySelectorAll('.sidebar-menu a').forEach(a => {
    if (a.getAttribute('href') === activePage) {
      a.classList.add('active');
    }
  });
}

function setupWelcome() {
  const user = getUser();
  document.getElementById('welcomeMsg').innerHTML = `
    <span class="user-name">${user.name}</span>
    <span class="role-tag" style="${ROLE_COLORS[user.role] || ''}">${user.role}</span>`;
}

function getBadgeStyle(status) {
  const s = {
    'Booked':      'background:#eff6ff;color:#2563eb;',
    'Checked In':  'background:#f0fdf4;color:#16a34a;',
    'Checked Out': 'background:#f8fafc;color:#64748b;',
    'Cancelled':   'background:#fef2f2;color:#dc2626;'
  };
  return s[status] || 'background:#f8fafc;color:#64748b;';
}

function getStatusStyle(status) {
  const s = {
    'Available':         'background:#f0fdf4;color:#16a34a;',
    'Occupied':          'background:#fef2f2;color:#dc2626;',
    'Under Maintenance': 'background:#fff7ed;color:#ea580c;'
  };
  return s[status] || 'background:#f8fafc;color:#64748b;';
}

function fmtDate(date) {
  return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;
}

function fmtDisplay(dateStr) {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-US', {
    weekday: 'short', month: 'long', day: 'numeric', year: 'numeric'
  });
}