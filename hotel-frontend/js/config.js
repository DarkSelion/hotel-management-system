const API = 'http://localhost:3000' /*'http://3.106.251.7:3000';*/

const ROLE_COLORS = {
  'Admin':        'background:#fef2f2;color:#dc2626;',
  'Receptionist': 'background:#f0fdf4;color:#16a34a;',
  'Manager':      'background:#eff6ff;color:#2563eb;',
  'Guest':        'background:#f5f3ff;color:#7c3aed;'
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

const GUEST_MENU = `
  <div class="menu-label">Main Menu</div>
  <a href="dashboard.html">My Dashboard</a>
  <a href="booking.html">Book a Room</a>
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
    role === 'Receptionist' ? 'Front Desk' :
    role === 'Guest' ? 'Guest Portal' : 'Management';

  const menu =
    role === 'Admin' ? ADMIN_MENU :
    role === 'Guest' ? GUEST_MENU : STAFF_MENU;
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
    <span class="user-name">${escapeHtml(user.name)}</span>
    <span class="role-tag" style="${ROLE_COLORS[user.role] || ''}">${escapeHtml(user.role)}</span>`;
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

function parseDate(value) {
  if (!value) return null;
  if (value instanceof Date) return isNaN(value.getTime()) ? null : value;

  const str = String(value).trim();
  const match = str.match(/^(\d{4}-\d{2}-\d{2})/);
  if (match) return new Date(`${match[1]}T00:00:00`);

  const d = new Date(str);
  return isNaN(d.getTime()) ? null : d;
}

function fmtDisplay(value) {
  const d = parseDate(value);
  if (!d) return 'Invalid date';
  return d.toLocaleDateString('en-US', {
    weekday: 'short', month: 'long', day: 'numeric', year: 'numeric'
  });
}

function fmtShort(value) {
  const d = parseDate(value);
  if (!d) return 'Invalid date';
  return d.toLocaleDateString();
}

function isCheckInDue(dateStr) {
  const d = parseDate(dateStr);
  if (!d) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return d <= today;
}

function getPaymentStatus(totalAmount, totalPaid) {
  const total = parseFloat(totalAmount) || 0;
  const paid  = parseFloat(totalPaid) || 0;
  if (paid <= 0) return 'Unpaid';
  if (paid >= total) return 'Fully Paid';
  return 'Partially Paid';
}

function getPaymentBadgeStyle(status) {
  const styles = {
    'Unpaid':        'background:#fef2f2;color:#dc2626;',
    'Partially Paid':'background:#fff7ed;color:#ea580c;',
    'Fully Paid':    'background:#f0fdf4;color:#16a34a;'
  };
  return styles[status] || 'background:#f8fafc;color:#64748b;';
}
function toggleSidebar() {
  const sidebar  = document.querySelector('.sidebar');
  const overlay  = document.getElementById('sidebarOverlay');
  sidebar.classList.toggle('open');
  overlay.classList.toggle('show');
}

function closeSidebar() {
  const sidebar  = document.querySelector('.sidebar');
  const overlay  = document.getElementById('sidebarOverlay');
  sidebar.classList.remove('open');
  overlay.classList.remove('show');
}

function escapeHtml(str) {
  if (!str) return '';
  const div = document.createElement('div');
  div.textContent = String(str);
  return div.innerHTML;
}

function escapeAttr(str) {
  if (!str) return '';
  return String(str)
    .replace(/\\/g, '\\\\')
    .replace(/'/g, "\\'")
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}