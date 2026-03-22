function selectMethod(method) {
  document.getElementById('paymentMethod').value = method;

  const cash  = document.getElementById('methodCash');
  const gcash = document.getElementById('methodGCash');

  if (method === 'Cash') {
    cash.style.background   = '#1a1a2e';
    cash.style.color        = 'white';
    cash.style.borderColor  = '#1a1a2e';
    gcash.style.background  = 'white';
    gcash.style.color       = '#64748b';
    gcash.style.borderColor = '#e2e8f0';
  } else {
    gcash.style.background  = '#1a1a2e';
    gcash.style.color       = 'white';
    gcash.style.borderColor = '#1a1a2e';
    cash.style.background   = 'white';
    cash.style.color        = '#64748b';
    cash.style.borderColor  = '#e2e8f0';
  }
}

async function loadReservationDropdown() {
  try {
    const res    = await fetch(`${API}/api/reservations`, {
      headers: { 'Authorization': `Bearer ${getToken()}` }
    });
    const all    = await res.json();
    const active = all.filter(r =>
      r.status === 'Booked' || r.status === 'Checked In'
    );

    const list = document.getElementById('dropdownList');

    if (active.length === 0) {
      list.innerHTML = `
        <div style="padding:16px;text-align:center;
                    color:#94a3b8;font-size:0.85rem;">
          No active reservations found
        </div>`;
      return;
    }

    const withBalance = await Promise.all(active.map(async r => {
      try {
        const payRes  = await fetch(`${API}/api/payments/reservation/${r.id}`, {
          headers: { 'Authorization': `Bearer ${getToken()}` }
        });
        const payData = await payRes.json();
        const paid    = payData.total_paid ? parseFloat(payData.total_paid) : 0;
        return { ...r, balance: parseFloat(r.total_amount) - paid };
      } catch {
        return { ...r, balance: parseFloat(r.total_amount) };
      }
    }));

    const unpaid = withBalance.filter(r => r.balance > 0);

    if (unpaid.length === 0) {
      list.innerHTML = `
        <div style="padding:16px;text-align:center;
                    color:#94a3b8;font-size:0.85rem;">
          All reservations are fully paid
        </div>`;
      return;
    }

    list.innerHTML = unpaid.map(r => `
      <div onclick="selectReservation(
                    '${r.id}','${r.guest_name}',
                    '${r.room_number}','${r.total_amount}',
                    '${r.status}',${r.balance})"
        style="padding:14px 16px;cursor:pointer;
               border-bottom:1px solid #f1f5f9;transition:background 0.15s;"
        onmouseover="this.style.background='#f8fafc'"
        onmouseout="this.style.background='white'">
        <div style="display:flex;justify-content:space-between;align-items:center;">
          <div>
            <span style="font-weight:700;color:#1a1a2e;">${r.guest_name}</span>
            <span style="color:#94a3b8;font-size:0.78rem;margin-left:8px;">
              #${r.id}
            </span>
          </div>
          <span style="font-size:0.72rem;font-weight:600;padding:3px 10px;
                       border-radius:20px;
                       ${r.status === 'Booked'
                         ? 'background:#eff6ff;color:#2563eb;'
                         : 'background:#f0fdf4;color:#16a34a;'}">
            ${r.status}
          </span>
        </div>
        <div style="margin-top:4px;display:flex;gap:16px;font-size:0.78rem;">
          <span style="color:#64748b;">
            Room <strong>${r.room_number}</strong>
          </span>
          <span style="color:#64748b;">
            Total: <strong>₱${parseFloat(r.total_amount).toLocaleString()}</strong>
          </span>
          <span style="color:#dc2626;">
            Balance: <strong>₱${r.balance.toLocaleString()}</strong>
          </span>
        </div>
      </div>`).join('');
  } catch (err) { console.error(err); }
}

function toggleDropdown() {
  const list = document.getElementById('dropdownList');
  list.style.display = list.style.display === 'none' ? 'block' : 'none';
}

function selectReservation(id, name, room, total, status, balance) {
  document.getElementById('reservationDropdown').value = id;
  document.getElementById('dropdownLabel').textContent =
    `#${id} — ${name} — Room ${room} — ₱${parseFloat(total).toLocaleString()}`;
  document.getElementById('dropdownLabel').style.color = '#1a1a2e';
  document.getElementById('dropdownList').style.display = 'none';
  loadReservationDetails(id);
}

document.addEventListener('click', function(e) {
  const wrapper = document.getElementById('dropdownWrapper');
  if (wrapper && !wrapper.contains(e.target)) {
    const list = document.getElementById('dropdownList');
    if (list) list.style.display = 'none';
  }
});

async function loadReservationDetails(id) {
  try {
    const headers = { 'Authorization': `Bearer ${getToken()}` };
    const res     = await fetch(`${API}/api/reservations/${id}`, { headers });
    const data    = await res.json();
    const payRes  = await fetch(`${API}/api/payments/reservation/${id}`, { headers });
    const payData = await payRes.json();
    const paid    = payData.total_paid ? parseFloat(payData.total_paid) : 0;
    const balance = parseFloat(data.total_amount) - paid;

    document.getElementById('detailId').textContent =
      `#${data.id}`;
    document.getElementById('detailGuest').textContent =
      data.guest_name;
    document.getElementById('detailRoom').textContent =
      `${data.room_number} (${data.room_type})`;
    document.getElementById('detailCheckIn').textContent =
      new Date(data.check_in_date).toLocaleDateString();
    document.getElementById('detailTotal').textContent =
      `₱${parseFloat(data.total_amount).toLocaleString()}`;
    document.getElementById('detailBalance').textContent =
      `₱${balance.toLocaleString()}`;
    document.getElementById('reservationDetails').classList.remove('d-none');
    document.getElementById('reservationId').value  = id;
    document.getElementById('paymentAmount').value  =
      balance > 0 ? balance.toFixed(2) : '0.00';
  } catch (err) { console.error(err); }
}

async function recordPayment() {
  const reservation_id = document.getElementById('reservationId').value;
  const payment_method = document.getElementById('paymentMethod').value;
  const amount         = document.getElementById('paymentAmount').value;
  const msgDiv         = document.getElementById('paymentMsg');

  if (!reservation_id || !amount) {
    msgDiv.innerHTML = `
      <div class="alert alert-warning" style="border-radius:10px;">
        Please select a reservation and enter amount.
      </div>`;
    return;
  }

  try {
    // Step 1: Record payment
    const res  = await fetch(`${API}/api/payments`, {
      method:  'POST',
      headers: {
        'Content-Type':  'application/json',
        'Authorization': `Bearer ${getToken()}`
      },
      body: JSON.stringify({
        reservation_id: parseInt(reservation_id),
        amount:         parseFloat(amount),
        payment_method
      })
    });
    const data = await res.json();

    if (res.ok) {
      // Step 2: Check if reservation status is Booked then auto check in
      const resDetails = await fetch(
        `${API}/api/reservations/${reservation_id}`, {
        headers: { 'Authorization': `Bearer ${getToken()}` }
      });
      const resData = await resDetails.json();

      let checkedIn = false;
      if (resData.status === 'Booked') {
        const checkInRes = await fetch(
          `${API}/api/reservations/${reservation_id}/checkin`, {
          method:  'PATCH',
          headers: { 'Authorization': `Bearer ${getToken()}` }
        });
        if (checkInRes.ok) checkedIn = true;
      }

      // Step 3: Show success modal
      showPaymentSuccess(
        data,
        resData,
        checkedIn,
        payment_method,
        amount
      );

      // Step 4: Reset form
      loadReservationDropdown();
      if (getUser().role !== 'Receptionist') loadPayments();
      document.getElementById('reservationDetails').classList.add('d-none');
      document.getElementById('reservationId').value   = '';
      document.getElementById('paymentAmount').value   = '';
      document.getElementById('dropdownLabel').textContent =
        '-- Select a guest reservation --';
      document.getElementById('dropdownLabel').style.color = '#94a3b8';
      document.getElementById('reservationDropdown').value = '';

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

function showPaymentSuccess(payData, resData, checkedIn, method, amount) {
  const existing = document.getElementById('paymentSuccessModal');
  if (existing) existing.remove();

  const modal = document.createElement('div');
  modal.id = 'paymentSuccessModal';
  modal.style.cssText = `
    position:fixed;top:0;left:0;width:100%;height:100%;
    background:rgba(0,0,0,0.5);z-index:9999;
    display:flex;align-items:center;justify-content:center;`;

  modal.innerHTML = `
    <div style="background:white;border-radius:20px;padding:36px;
                max-width:460px;width:90%;text-align:center;
                box-shadow:0 20px 60px rgba(0,0,0,0.3);">

      <div style="font-size:3rem;margin-bottom:12px;">
        ${checkedIn ? '🏨' : '✅'}
      </div>

      <h5 style="font-weight:800;color:#1a1a2e;margin-bottom:6px;">
        Payment Recorded!
      </h5>

      ${checkedIn ? `
        <div style="background:#f0fdf4;border:1.5px solid #bbf7d0;
                    border-radius:10px;padding:10px 16px;
                    margin:12px 0;display:flex;align-items:center;
                    justify-content:center;gap:8px;">
          <span style="font-size:1rem;">✅</span>
          <span style="color:#16a34a;font-weight:700;font-size:0.9rem;">
            Guest has been automatically checked in
          </span>
        </div>` : ''}

      <div style="background:#f8fafc;border-radius:14px;
                  padding:20px;margin:16px 0;text-align:left;">

        <div style="font-size:0.7rem;font-weight:700;letter-spacing:1px;
                    text-transform:uppercase;color:#94a3b8;margin-bottom:14px;">
          Payment Summary
        </div>

        <div style="display:flex;justify-content:space-between;
                    margin-bottom:10px;">
          <span style="color:#64748b;font-size:0.85rem;">Guest</span>
          <span style="font-weight:600;font-size:0.85rem;">
            ${resData.guest_name}
          </span>
        </div>

        <div style="display:flex;justify-content:space-between;
                    margin-bottom:10px;">
          <span style="color:#64748b;font-size:0.85rem;">Room</span>
          <span style="font-weight:600;font-size:0.85rem;">
            ${resData.room_number} (${resData.room_type})
          </span>
        </div>

        <div style="display:flex;justify-content:space-between;
                    margin-bottom:10px;">
          <span style="color:#64748b;font-size:0.85rem;">Payment Method</span>
          <span style="font-weight:600;font-size:0.85rem;">${method}</span>
        </div>

        <div style="display:flex;justify-content:space-between;
                    margin-bottom:10px;">
          <span style="color:#64748b;font-size:0.85rem;">Amount Paid</span>
          <span style="font-weight:700;color:#16a34a;font-size:0.9rem;">
            ₱${parseFloat(amount).toLocaleString()}
          </span>
        </div>

        <div style="display:flex;justify-content:space-between;
                    margin-bottom:10px;">
          <span style="color:#64748b;font-size:0.85rem;">Balance</span>
          <span style="font-weight:700;
                       color:${parseFloat(payData.balance) <= 0
                         ? '#16a34a' : '#dc2626'};
                       font-size:0.9rem;">
            ₱${parseFloat(payData.balance).toLocaleString()}
          </span>
        </div>

        <div style="border-top:1px solid #e2e8f0;padding-top:10px;
                    display:flex;justify-content:space-between;">
          <span style="color:#64748b;font-size:0.85rem;">Status</span>
          <span style="font-weight:700;font-size:0.85rem;
                       padding:4px 12px;border-radius:20px;
                       ${checkedIn
                         ? 'background:#f0fdf4;color:#16a34a;'
                         : 'background:#eff6ff;color:#2563eb;'}">
            ${checkedIn ? 'Checked In' : 'Booked'}
          </span>
        </div>

      </div>

      <button onclick="closePaymentSuccess()"
        style="background:linear-gradient(135deg,#1a1a2e,#0f3460);
               color:white;border:none;border-radius:10px;
               padding:12px 32px;font-weight:600;
               font-size:0.875rem;cursor:pointer;width:100%;">
        Done
      </button>

    </div>`;

  document.body.appendChild(modal);
}

function closePaymentSuccess() {
  const modal = document.getElementById('paymentSuccessModal');
  if (modal) modal.remove();
}


async function loadPayments() {
  try {
    const res  = await fetch(`${API}/api/payments`, {
      headers: { 'Authorization': `Bearer ${getToken()}` }
    });
    const data = await res.json();

    const rev = document.getElementById('totalRevenue');
    const trx = document.getElementById('totalTransactions');
    const avg = document.getElementById('avgPayment');

    if (rev) rev.textContent =
      `₱${parseFloat(data.total_revenue || 0).toLocaleString()}`;
    if (trx) trx.textContent = data.total_transactions || 0;
    if (avg) avg.textContent = data.total_transactions > 0
      ? `₱${(parseFloat(data.total_revenue) / data.total_transactions).toLocaleString()}`
      : '₱0';

    const tbody = document.getElementById('paymentsTable');
    if (!tbody) return;

    if (!data.payments || data.payments.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="10" class="text-center py-4 text-muted">
            No payments yet.
          </td>
        </tr>`;
      return;
    }

    tbody.innerHTML = data.payments.map(p => `
      <tr>
        <td style="color:#94a3b8;font-weight:600;">${p.id}</td>
        <td><strong>${p.guest_name}</strong></td>
        <td>${p.room_number}</td>
        <td>${new Date(p.check_in_date).toLocaleDateString()}</td>
        <td>${new Date(p.check_out_date).toLocaleDateString()}</td>
        <td>₱${parseFloat(p.total_amount).toLocaleString()}</td>
        <td><strong>₱${parseFloat(p.amount).toLocaleString()}</strong></td>
        <td>${p.payment_method}</td>
        <td>${new Date(p.payment_date).toLocaleDateString()}</td>
        <td>
          <span class="badge-status" style="background:#f0fdf4;color:#16a34a;">
            ${p.status}
          </span>
        </td>
      </tr>`).join('');
  } catch (err) { console.error(err); }
}

// Init based on role
const currentUser = getUser();

// Admin and Manager and Receptionist can all record payment
if (currentUser.role === 'Admin' ||
    currentUser.role === 'Manager' ||
    currentUser.role === 'Receptionist') {
  loadReservationDropdown();
}

// Admin and Manager see revenue and history
if (currentUser.role === 'Admin' || currentUser.role === 'Manager') {
  loadPayments();
}