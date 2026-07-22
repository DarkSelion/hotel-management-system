let modalCallback = null;
let selectedRoomId = null;
let currentTaxRatePercent = 12; // Dynamic default

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
    checkin:  { icon:'', bg:'linear-gradient(135deg,#16a34a,#15803d)', label:'Check In' },
    checkout: { icon:'', bg:'linear-gradient(135deg,#475569,#334155)', label:'Check Out' },
    cancel:   { icon:'', bg:'linear-gradient(135deg,#dc2626,#991b1b)', label:'Cancel' }
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

function showBookingSuccess(data) {
  const existing = document.getElementById('bookingSuccessModal');
  if (existing) existing.remove();

  const modal = document.createElement('div');
  modal.id = 'bookingSuccessModal';
  modal.style.cssText = `
    position:fixed;top:0;left:0;width:100%;height:100%;
    background:rgba(0,0,0,0.5);z-index:9999;
    display:flex;align-items:center;justify-content:center;`;

  modal.innerHTML = `
    <div style="background:white;border-radius:20px;padding:36px;
                max-width:460px;width:90%;text-align:center;
                box-shadow:0 20px 60px rgba(0,0,0,0.3);">
      <div style="width:56px;height:56px;margin:0 auto 12px;background:#059669;border-radius:50%;display:flex;align-items:center;justify-content:center;color:white;font-weight:800;font-size:1.6rem;">&#10003;</div>
      <h5 style="font-weight:800;color:#1a1a2e;margin-bottom:4px;">
        ${data.checked_in ? 'Booking Confirmed & Checked In!' : 'Booking Confirmed!'}
      </h5>
      <p style="color:#64748b;font-size:0.85rem;margin-bottom:20px;">
        ${data.checked_in
          ? 'Reservation created, payment recorded, and guest is now checked in.'
          : 'Reservation has been successfully created.'}
      </p>
      <div style="background:#f8fafc;border-radius:14px;
                  padding:20px;text-align:left;margin-bottom:20px;">
        <div style="font-size:0.7rem;font-weight:700;letter-spacing:1px;
                    text-transform:uppercase;color:#94a3b8;margin-bottom:14px;">
          Booking Details
        </div>
        <div style="display:flex;justify-content:space-between;margin-bottom:10px;">
          <span style="color:#64748b;font-size:0.85rem;">Booking ID</span>
          <span style="font-weight:700;color:#1a1a2e;">#${data.reservation_id}</span>
        </div>
        <div style="display:flex;justify-content:space-between;margin-bottom:10px;">
          <span style="color:#64748b;font-size:0.85rem;">Guest Name</span>
          <span style="font-weight:700;color:#1a1a2e;">
            ${data.guest.first_name} ${data.guest.last_name}
          </span>
        </div>
        <div style="display:flex;justify-content:space-between;margin-bottom:10px;">
          <span style="color:#64748b;font-size:0.85rem;">Room</span>
          <span style="font-weight:700;color:#1a1a2e;">${data.room_number}</span>
        </div>
        <div style="display:flex;justify-content:space-between;margin-bottom:10px;">
          <span style="color:#64748b;font-size:0.85rem;">Check In</span>
          <span style="font-weight:700;color:#1a1a2e;">
            ${fmtDisplay(data.check_in_date)}
          </span>
        </div>
        <div style="display:flex;justify-content:space-between;margin-bottom:10px;">
          <span style="color:#64748b;font-size:0.85rem;">Check Out</span>
          <span style="font-weight:700;color:#1a1a2e;">
            ${fmtDisplay(data.check_out_date)}
          </span>
        </div>
        <div style="display:flex;justify-content:space-between;
                    border-top:1px solid #e2e8f0;padding-top:10px;">
          <span style="color:#64748b;font-size:0.85rem;">Status</span>
          <span style="font-weight:700;color:#1a1a2e;">
            ${data.status || 'Booked'}
          </span>
        </div>
        ${data.payment ? `
        <div style="display:flex;justify-content:space-between;margin-top:10px;">
          <span style="color:#64748b;font-size:0.85rem;">Amount Paid</span>
          <span style="font-weight:700;color:#16a34a;">
            ₱${parseFloat(data.payment.amount_paid).toLocaleString()}
          </span>
        </div>` : ''}
        <div style="display:flex;justify-content:space-between;
                    border-top:1px solid #e2e8f0;padding-top:10px;margin-top:10px;">
          <span style="color:#64748b;font-size:0.85rem;">Total Amount</span>
          <span style="font-weight:800;color:#16a34a;font-size:1.1rem;">
            ₱${parseFloat(data.total_amount).toLocaleString()}
          </span>
        </div>
      </div>
      <div style="display:flex;gap:10px;">
        <button onclick="closeBookingSuccess()"
          style="flex:1;background:#f1f5f9;color:#64748b;border:none;
                 border-radius:10px;padding:12px;font-weight:600;
                 font-size:0.875rem;cursor:pointer;">
          Close
        </button>
        <button onclick="closeBookingSuccess()"
          style="flex:1;background:linear-gradient(135deg,#1a1a2e,#0f3460);
                 color:white;border:none;border-radius:10px;
                 padding:12px;font-weight:600;font-size:0.875rem;cursor:pointer;">
          Done
        </button>
      </div>
    </div>`;

  document.body.appendChild(modal);
}

function closeBookingSuccess() {
  const modal = document.getElementById('bookingSuccessModal');
  if (modal) modal.remove();
}

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
    currentTaxRatePercent = data.tax_rate_percent || 12;

    if (!data.rooms || data.rooms.length === 0) {
      document.getElementById('roomSelectorSection').innerHTML = `
        <div style="text-align:center;padding:20px;color:#94a3b8;font-size:0.85rem;">
          No available rooms for selected dates.
        </div>`;
      return;
    }

    // Group by type
    const grouped = {};
    data.rooms.forEach(r => {
      if (!grouped[r.room_type]) grouped[r.room_type] = [];
      grouped[r.room_type].push(r);
    });

    const typeColors = {
      'Standard': { bg:'#eff6ff', color:'#2563eb', border:'#bfdbfe', selected:'#2563eb' },
      'Deluxe':   { bg:'#f0fdf4', color:'#16a34a', border:'#bbf7d0', selected:'#16a34a' },
      'Suite':    { bg:'#fff7ed', color:'#ea580c', border:'#fed7aa', selected:'#ea580c' }
    };
    document.getElementById('roomSelectorSection').innerHTML =
      Object.keys(grouped).map(type => {
        const c    = typeColors[type] || { bg:'#f8fafc', color:'#64748b', border:'#e2e8f0' };
        return `
          <div style="margin-bottom:20px;">
            <div style="display:flex;align-items:center;gap:8px;margin-bottom:10px;">
              <span style="width:8px;height:8px;border-radius:50%;background:${c.color};display:inline-block;"></span>
              <span style="font-weight:700;color:#1a1a2e;font-size:0.875rem;">
                ${type} Rooms
              </span>
              <span style="background:${c.bg};color:${c.color};
                           border:1px solid ${c.border};
                           padding:2px 10px;border-radius:20px;
                           font-size:0.7rem;font-weight:700;">
                ${grouped[type].length} available
              </span>
              <span style="color:#94a3b8;font-size:0.78rem;margin-left:4px;">
                ₱${parseFloat(grouped[type][0].base_price).toLocaleString()}/night
              </span>
            </div>
            <div style="display:grid;
                        grid-template-columns:repeat(auto-fill,minmax(90px,1fr));
                        gap:8px;">
              ${grouped[type].map(r => `
                <div id="room-${r.id}"
                  onclick="selectRoom('${r.id}','${escapeAttr(r.room_number)}',
                           '${escapeAttr(r.room_type)}',${r.base_price},
                           ${r.estimated_total},${r.nights},
                           '${escapeAttr(r.description)}',${r.floor})"
                  style="border:2px solid ${c.border};border-radius:10px;
                         padding:12px 8px;cursor:pointer;background:white;
                         transition:all 0.2s;text-align:center;">
                  <div style="width:24px;height:24px;margin:0 auto 4px;border:1.5px solid #cbd5e1;border-radius:4px;display:flex;align-items:center;justify-content:center;font-size:0.65rem;font-weight:800;color:#64748b;">R</div>
                  <div style="font-weight:800;color:#1a1a2e;font-size:0.9rem;">
                    ${escapeHtml(r.room_number)}
                  </div>
                  <div style="font-size:0.65rem;color:#94a3b8;margin-top:2px;">
                    Floor ${r.floor}
                  </div>
                </div>`).join('')}
            </div>
          </div>`;
      }).join('');

  } catch (err) {
    showToast('Error searching rooms. Make sure server is running.', 'error');
  }
}

function selectRoom(id, number, type, price, total, nights, desc, floor) {
  selectedRoomId = id;
  document.getElementById('roomSelect').value = id;

  // Reset ALL room cards back to original
  document.querySelectorAll('[id^=\'room-\']').forEach(card => {
    card.style.background  = 'white';
    card.style.borderColor = '#e2e8f0';
    card.style.transform   = 'scale(1)';
    card.style.boxShadow   = 'none';
    // Reset all text inside back to original colors
    card.querySelectorAll('div').forEach(d => {
      d.style.color = '';
    });
  });

  // Highlight selected card
  const selected = document.getElementById(`room-${id}`);
  if (selected) {
    selected.style.background  = '#1a1a2e';
    selected.style.borderColor = '#1a1a2e';
    selected.style.transform   = 'scale(1.05)';
    selected.style.boxShadow   = '0 4px 14px rgba(26,26,46,0.3)';
    // Set all text inside to white
    selected.querySelectorAll('div').forEach(d => {
      d.style.color = 'white';
    });
  }

  // total passed from backend is actually the estimated_total (subtotal)
  const subtotal = parseFloat(total);
  const tax      = subtotal * (currentTaxRatePercent / 100);
  const grandTotal = subtotal + tax;

  document.getElementById('selectedRoomInfo').innerHTML = `
    <div style="background:#f0fdf4;border:1.5px solid #bbf7d0;
                border-radius:12px;padding:16px;margin-top:12px;">
      <div style="display:flex;justify-content:space-between;
                  align-items:center;margin-bottom:12px;">
        <div>
          <span style="font-weight:700;color:#1a1a2e;">Room ${number}</span>
          <span style="color:#64748b;font-size:0.8rem;margin-left:8px;">
            ${type} · Floor ${floor}
          </span>
        </div>
        <span style="background:#f0fdf4;color:#16a34a;
                     border:1px solid #bbf7d0;padding:3px 10px;
                     border-radius:20px;font-size:0.72rem;font-weight:700;">
          Selected ✓
        </span>
      </div>
      <div style="display:flex;flex-wrap:wrap;gap:16px;font-size:0.82rem;">
        <div>
          <div style="color:#64748b;">Nights</div>
          <div style="font-weight:700;color:#1a1a2e;">${nights}</div>
        </div>
        <div>
          <div style="color:#64748b;">Rate/Night</div>
          <div style="font-weight:700;color:#1a1a2e;">
            ₱${parseFloat(price).toLocaleString()}
          </div>
        </div>
        <div>
          <div style="color:#64748b;">Subtotal</div>
          <div style="font-weight:700;color:#1a1a2e;">
            ₱${subtotal.toLocaleString(undefined, {minimumFractionDigits:2, maximumFractionDigits:2})}
          </div>
        </div>
        <div>
          <div style="color:#64748b;">VAT ${currentTaxRatePercent}%</div>
          <div style="font-weight:700;color:#1a1a2e;">
            ₱${tax.toLocaleString(undefined, {minimumFractionDigits:2, maximumFractionDigits:2})}
          </div>
        </div>
        <div>
          <div style="color:#64748b;">Total</div>
          <div style="font-weight:800;color:#16a34a;font-size:1.05rem;">
            ₱${grandTotal.toLocaleString(undefined, {minimumFractionDigits:2, maximumFractionDigits:2})}
          </div>
        </div>
      </div>
    </div>`;
  document.getElementById('selectedRoomInfo').classList.remove('d-none');

  const payInput = document.getElementById('initialPaymentAmount');
  if (payInput && !payInput.value) {
    payInput.value = grandTotal.toFixed(2);
  }
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
  const paymentAmount  = parseFloat(document.getElementById('initialPaymentAmount').value) || 0;
  const paymentMethod  = document.getElementById('initialPaymentMethod').value;
  const msgDiv         = document.getElementById('createMsg');

  if (!room_id || !first_name || !last_name || !check_in_date || !check_out_date) {
    msgDiv.innerHTML = `
      <div class="alert alert-warning" style="border-radius:10px;">
        Please fill in all required fields and select a room.
      </div>`;
    return;
  }

  const payload = {
    first_name, last_name, phone, email,
    address, room_id, check_in_date, check_out_date
  };

  if (paymentAmount > 0) {
    payload.initial_payment = {
      amount: paymentAmount,
      payment_method: paymentMethod
    };
  }

  try {
    const res  = await fetch(`${API}/api/reservations`, {
      method:  'POST',
      headers: {
        'Content-Type':  'application/json',
        'Authorization': `Bearer ${getToken()}`
      },
      body: JSON.stringify(payload)
    });
    const data = await res.json();

    if (res.ok) {
      msgDiv.innerHTML = '';
      showBookingSuccess(data);
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
  document.getElementById('firstName').value  = '';
  document.getElementById('lastName').value   = '';
  document.getElementById('phone').value      = '';
  document.getElementById('guestEmail').value = '';
  document.getElementById('address').value    = '';
  document.getElementById('roomSelect').value = '';
  document.getElementById('initialPaymentAmount').value = '';
  document.getElementById('initialPaymentMethod').value = 'Cash';
  document.getElementById('roomSelectorSection').innerHTML = `
    <div style="text-align:center;padding:20px;color:#94a3b8;font-size:0.85rem;">
      Search rooms first to see availability.
    </div>`;
  document.getElementById('selectedRoomInfo').classList.add('d-none');
  selectedRoomId = null;
  resetCalendar();
}

async function loadBookings() {
  try {
    const res   = await fetch(`${API}/api/reservations`, {
      headers: { 'Authorization': `Bearer ${getToken()}` }
    });

    if (!res.ok) {
      document.getElementById('bookingsTable').innerHTML = `
        <tr>
          <td colspan="9" class="text-center py-4 text-danger">
            Error loading bookings.
          </td>
        </tr>`;
      return;
    }

    const list  = await res.json();
    const tbody = document.getElementById('bookingsTable');

    if (list.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="9" class="text-center py-4 text-muted">
            No bookings yet.
          </td>
        </tr>`;
      return;
    }

    tbody.innerHTML = list.map(r => `
      <tr>
        <td style="color:#94a3b8;font-weight:600;">#${r.id}</td>
        <td>
          <div style="font-weight:600;">${escapeHtml(r.guest_name)}</div>
          <div style="font-size:0.75rem;color:#94a3b8;">${escapeHtml(r.email) || ''}</div>
        </td>
        <td>
          <strong>${escapeHtml(r.room_number)}</strong>
          <div style="font-size:0.75rem;color:#94a3b8;">${escapeHtml(r.room_type)}</div>
        </td>
        <td>${fmtShort(r.check_in_date)}</td>
        <td>${fmtShort(r.check_out_date)}</td>
        <td><strong>₱${parseFloat(r.total_amount).toLocaleString()}</strong></td>
        <td>
          <span class="badge-status" style="${getPaymentBadgeStyle(getPaymentStatus(r.total_amount, r.total_paid))}">
            ${getPaymentStatus(r.total_amount, r.total_paid)}
          </span>
        </td>
        <td>
          <span class="badge-status" style="${getBadgeStyle(r.status)}">
            ${escapeHtml(r.status)}
          </span>
        </td>
        <td>
          ${r.status === 'Booked' ? `
          <button class="action-btn"
            style="background:#eff6ff;color:#2563eb;"
            onclick="checkIn(${r.id},'${escapeAttr(r.guest_name)}','${escapeAttr(r.room_number)}',${r.total_amount})">
            Pay & Check In
          </button>
            <button class="action-btn"
              style="background:#fef2f2;color:#dc2626;"
              onclick="cancelBooking(${r.id})">Cancel</button>` : ''}
          ${r.status === 'Checked In' ? `
            <button class="action-btn"
              style="background:#f8fafc;color:#64748b;"
              onclick="checkOut(${r.id})">Check Out</button>` : ''}
          ${r.status === 'Checked Out' || r.status === 'Cancelled'
            ? '<span style="color:#94a3b8;font-size:0.78rem;">No actions</span>'
            : ''}
        </td>
      </tr>`).join('');
  } catch (err) { console.error(err); }
}

async function checkIn(id, guestName, roomNumber, total) {
  showModal(
    'checkin',
    'Proceed to Payment',
    'Payment must be recorded before check-in. Proceed to the payments page?',
    async () => {
      // Save reservation info for payments page
      localStorage.setItem('pendingPayment', JSON.stringify({
        id, guestName, roomNumber, total
      }));
      // Redirect to payments
      window.location.href = 'payments.html';
    }
  );
}

async function checkOut(id) {
  showModal('checkout', 'Check Out Guest',
    'Are you sure you want to check out this guest?',
    async () => {
      try {
        const res  = await fetch(`${API}/api/reservations/${id}/checkout`, {
          method: 'PATCH', headers: { 'Authorization': `Bearer ${getToken()}` }
        });
        const data = await res.json();
        if (res.ok) {
          showToast(data.message, 'success');
          loadBookings();
        } else {
          showToast(data.message, 'error');
        }
      } catch { showToast('Server error.', 'error'); }
    }
  );
}

async function cancelBooking(id) {
  showModal('cancel', 'Cancel Booking',
    'Are you sure you want to cancel this booking? This cannot be undone.',
    async () => {
      try {
        const res  = await fetch(`${API}/api/reservations/${id}/cancel`, {
          method: 'PATCH', headers: { 'Authorization': `Bearer ${getToken()}` }
        });
        const data = await res.json();
        showToast(data.message, 'success');
        loadBookings();
      } catch { showToast('Server error.', 'error'); }
    }
  );
}

loadBookings();
