let modalCallback = null;

function showToast(message, type) {
  const existing = document.getElementById('toastMsg');
  if (existing) existing.remove();

  const colors = {
    success: 'background:#f0fdf4;color:#16a34a;border:1.5px solid #bbf7d0;',
    error:   'background:#fef2f2;color:#dc2626;border:1.5px solid #fecaca;'
  };

  const toast = document.createElement('div');
  toast.id = 'toastMsg';
  toast.style.cssText = `
    position:fixed;bottom:24px;right:24px;
    padding:14px 20px;border-radius:12px;
    font-size:0.875rem;font-weight:600;
    box-shadow:0 8px 24px rgba(0,0,0,0.1);
    z-index:9999;transition:all 0.3s;
    ${colors[type] || colors.success}`;
  toast.textContent = message;
  document.body.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

function showModal(type, title, message, callback) {
  const modal      = document.getElementById('confirmModal');
  const icon       = document.getElementById('modalIcon');
  const titleEl    = document.getElementById('modalTitle');
  const messageEl  = document.getElementById('modalMessage');
  const confirmBtn = document.getElementById('modalConfirmBtn');

  const types = {
    checkin: {
      icon:  '🏨',
      bg:    'linear-gradient(135deg,#16a34a,#15803d)',
      label: 'Check In'
    },
    checkout: {
      icon:  '🏁',
      bg:    'linear-gradient(135deg,#475569,#334155)',
      label: 'Check Out'
    },
    cancel: {
      icon:  '❌',
      bg:    'linear-gradient(135deg,#dc2626,#b91c1c)',
      label: 'Cancel Booking'
    }
  };

  const t = types[type];
  icon.textContent            = t.icon;
  titleEl.textContent         = title;
  messageEl.textContent       = message;
  confirmBtn.textContent      = t.label;
  confirmBtn.style.background = t.bg;
  confirmBtn.style.color      = 'white';
  modalCallback               = callback;
  modal.style.display         = 'flex';
}

function closeModal() {
  document.getElementById('confirmModal').style.display = 'none';
  modalCallback = null;
}

function confirmModal() {
  document.getElementById('confirmModal').style.display = 'none';
  if (modalCallback) modalCallback();
  modalCallback = null;
}

let selectedRoomId = null;

async function searchRooms() {
  const checkIn  = document.getElementById('checkinValue').value;
  const checkOut = document.getElementById('checkoutValue').value;
  if (!checkIn || !checkOut) {
    showToast('Please select both dates.', 'error');
    return;
  }
  try {
    const res  = await fetch(
      `${API}/api/rooms/availability?check_in_date=${checkIn}&check_out_date=${checkOut}`
    );
    const data = await res.json();
    const list = document.getElementById('roomDropdownList');

    if (!data.rooms || data.rooms.length === 0) {
      list.innerHTML = `
        <div style="padding:16px;text-align:center;
                    color:#94a3b8;font-size:0.85rem;">
          No available rooms for selected dates
        </div>`;
      list.style.display = 'block';
      return;
    }

    list.innerHTML = data.rooms.map(r => `
      <div onclick="selectRoom(
              '${r.id}','${r.room_number}','${r.room_type}',
              ${r.base_price},${r.estimated_total},${r.nights},
              '${r.description}')"
        style="padding:14px 16px;cursor:pointer;
               border-bottom:1px solid #f1f5f9;transition:background 0.15s;"
        onmouseover="this.style.background='#f8fafc'"
        onmouseout="this.style.background='white'">
        <div style="display:flex;justify-content:space-between;align-items:center;">
          <div>
            <span style="font-weight:700;color:#1a1a2e;">
              Room ${r.room_number}
            </span>
            <span style="color:#94a3b8;font-size:0.78rem;margin-left:8px;">
              ${r.room_type}
            </span>
          </div>
          <span style="font-weight:700;color:#16a34a;">
            ₱${parseFloat(r.base_price).toLocaleString()}/night
          </span>
        </div>
        <div style="margin-top:4px;font-size:0.78rem;color:#64748b;">
          ${r.description} · Total: ₱${parseFloat(r.estimated_total).toLocaleString()}
        </div>
      </div>`).join('');
    list.style.display = 'block';
  } catch (err) {
    showToast('Error searching rooms. Make sure server is running.', 'error');
  }
}

function toggleRoomDropdown() {
  const list = document.getElementById('roomDropdownList');
  list.style.display = list.style.display === 'none' ? 'block' : 'none';
}

function selectRoom(id, number, type, price, total, nights, desc) {
  selectedRoomId = id;
  document.getElementById('roomSelect').value = id;
  document.getElementById('roomDropdownLabel').textContent =
    `Room ${number} — ${type} — ₱${parseFloat(price).toLocaleString()}/night`;
  document.getElementById('roomDropdownLabel').style.color = '#1a1a2e';
  document.getElementById('roomDropdownList').style.display = 'none';

  const subtotal = (total / 1.12).toFixed(2);
  const tax      = (total - subtotal).toFixed(2);

  document.getElementById('costPreview').innerHTML = `
    <div class="cost-preview">
      <div style="font-weight:700;color:#1a1a2e;margin-bottom:10px;">
        Cost Summary — Room ${number}
      </div>
      <div style="display:flex;flex-wrap:wrap;gap:20px;font-size:0.85rem;">
        <div>
          <div style="color:#64748b;">Nights</div>
          <div style="font-weight:700;">${nights}</div>
        </div>
        <div>
          <div style="color:#64748b;">Rate/Night</div>
          <div style="font-weight:700;">
            ₱${parseFloat(price).toLocaleString()}
          </div>
        </div>
        <div>
          <div style="color:#64748b;">Subtotal</div>
          <div style="font-weight:700;">
            ₱${parseFloat(subtotal).toLocaleString()}
          </div>
        </div>
        <div>
          <div style="color:#64748b;">Tax 12%</div>
          <div style="font-weight:700;">
            ₱${parseFloat(tax).toLocaleString()}
          </div>
        </div>
        <div>
          <div style="color:#64748b;">Total</div>
          <div style="font-weight:800;color:#16a34a;font-size:1.05rem;">
            ₱${parseFloat(total).toLocaleString()}
          </div>
        </div>
      </div>
    </div>`;
  document.getElementById('costPreview').classList.remove('d-none');
}

async function createBooking() {
  const room_id        = document.getElementById('roomSelect').value;
  const check_in_date  = document.getElementById('checkinValue').value;
  const check_out_date = document.getElementById('checkoutValue').value;
  const first_name     = document.getElementById('firstName').value.trim();
  const last_name      = document.getElementById('lastName').value.trim();
  const phone          = document.getElementById('phone').value.trim();
  const email          = document.getElementById('guestEmail').value.trim();
  const address        = document.getElementById('address').value.trim();
  const msgDiv         = document.getElementById('createMsg');

  if (!room_id || !first_name || !last_name) {
    msgDiv.innerHTML = `
      <div class="alert alert-warning" style="border-radius:10px;">
        Please fill in all required fields and select a room.
      </div>`;
    return;
  }

  try {
    const res  = await fetch(`${API}/api/reservations`, {
      method:  'POST',
      headers: {
        'Content-Type':  'application/json',
        'Authorization': `Bearer ${getToken()}`
      },
      body: JSON.stringify({
        first_name, last_name, phone, email,
        address, room_id, check_in_date, check_out_date
      })
    });
    const data = await res.json();

    if (res.ok) {
      msgDiv.innerHTML = `
        <div class="alert alert-success" style="border-radius:10px;">
          ✅ Booking #${data.reservation_id} created for
          ${data.guest.first_name} ${data.guest.last_name} —
          Room ${data.room_number} —
          Total: ₱${parseFloat(data.total_amount).toLocaleString()}
        </div>`;
      resetBookingForm();
      loadBookings();
    } else {
      msgDiv.innerHTML = `
        <div class="alert alert-danger" style="border-radius:10px;">
          ${data.message}
        </div>`;
    }
  } catch (err) {
    msgDiv.innerHTML = `
      <div class="alert alert-danger" style="border-radius:10px;">
        Server error.
      </div>`;
  }
}

function resetBookingForm() {
  document.getElementById('firstName').value   = '';
  document.getElementById('lastName').value    = '';
  document.getElementById('phone').value       = '';
  document.getElementById('guestEmail').value  = '';
  document.getElementById('address').value     = '';
  document.getElementById('roomSelect').value  = '';
  document.getElementById('roomDropdownLabel').textContent = '-- Search rooms first --';
  document.getElementById('roomDropdownLabel').style.color = '#94a3b8';
  document.getElementById('costPreview').classList.add('d-none');
  selectedRoomId = null;
  resetCalendar();
}

async function loadBookings() {
  try {
    const res   = await fetch(`${API}/api/reservations`, {
      headers: { 'Authorization': `Bearer ${getToken()}` }
    });
    const list  = await res.json();
    const tbody = document.getElementById('bookingsTable');

    if (list.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="8" class="text-center py-4 text-muted">
            No bookings yet.
          </td>
        </tr>`;
      return;
    }

    tbody.innerHTML = list.map(r => `
      <tr>
        <td style="color:#94a3b8;font-weight:600;">#${r.id}</td>
        <td>
          <div style="font-weight:600;">${r.guest_name}</div>
          <div style="font-size:0.75rem;color:#94a3b8;">${r.email || ''}</div>
        </td>
        <td>
          <strong>${r.room_number}</strong>
          <div style="font-size:0.75rem;color:#94a3b8;">${r.room_type}</div>
        </td>
        <td>${new Date(r.check_in_date).toLocaleDateString()}</td>
        <td>${new Date(r.check_out_date).toLocaleDateString()}</td>
        <td><strong>₱${parseFloat(r.total_amount).toLocaleString()}</strong></td>
        <td>
          <span class="badge-status" style="${getBadgeStyle(r.status)}">
            ${r.status}
          </span>
        </td>
        <td>
          ${r.status === 'Booked' ? `
            <button class="action-btn"
              style="background:#f0fdf4;color:#16a34a;"
              onclick="checkIn(${r.id})">
              Check In
            </button>
            <button class="action-btn"
              style="background:#fef2f2;color:#dc2626;"
              onclick="cancelBooking(${r.id})">
              Cancel
            </button>` : ''}
          ${r.status === 'Checked In' ? `
            <button class="action-btn"
              style="background:#f8fafc;color:#64748b;"
              onclick="checkOut(${r.id})">
              Check Out
            </button>` : ''}
          ${r.status === 'Checked Out' || r.status === 'Cancelled'
            ? '<span style="color:#94a3b8;font-size:0.78rem;">No actions</span>'
            : ''}
        </td>
      </tr>`).join('');
  } catch (err) { console.error(err); }
}

async function checkIn(id) {
  showModal(
    'checkin',
    'Check In Guest',
    'Are you sure you want to check in this guest?',
    async () => {
      try {
        const res  = await fetch(`${API}/api/reservations/${id}/checkin`, {
          method: 'PATCH',
          headers: { 'Authorization': `Bearer ${getToken()}` }
        });
        const data = await res.json();
        showToast(data.message, 'success');
        loadBookings();
      } catch (err) {
        showToast('Server error.', 'error');
      }
    }
  );
}

async function checkOut(id) {
  showModal(
    'checkout',
    'Check Out Guest',
    'Are you sure you want to check out this guest?',
    async () => {
      try {
        const res  = await fetch(`${API}/api/reservations/${id}/checkout`, {
          method: 'PATCH',
          headers: { 'Authorization': `Bearer ${getToken()}` }
        });
        const data = await res.json();
        showToast(data.message, 'success');
        loadBookings();
      } catch (err) {
        showToast('Server error.', 'error');
      }
    }
  );
}

async function cancelBooking(id) {
  showModal(
    'cancel',
    'Cancel Booking',
    'Are you sure you want to cancel this booking? This cannot be undone.',
    async () => {
      try {
        const res  = await fetch(`${API}/api/reservations/${id}/cancel`, {
          method: 'PATCH',
          headers: { 'Authorization': `Bearer ${getToken()}` }
        });
        const data = await res.json();
        showToast(data.message, 'success');
        loadBookings();
      } catch (err) {
        showToast('Server error.', 'error');
      }
    }
  );
}

document.addEventListener('click', function(e) {
  const wrapper = document.getElementById('roomDropdownWrapper');
  if (wrapper && !wrapper.contains(e.target)) {
    document.getElementById('roomDropdownList').style.display = 'none';
  }
});

loadBookings();