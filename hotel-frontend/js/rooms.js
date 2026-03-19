let selectedRoomId = null;

async function loadRooms() {
  try {
    const res   = await fetch(`${API}/api/rooms`, {
      headers: { 'Authorization': `Bearer ${getToken()}` }
    });
    const rooms = await res.json();
    const tbody = document.getElementById('roomsTable');

    if (rooms.length === 0) {
      tbody.innerHTML = '<tr><td colspan="7" class="text-center py-4 text-muted">No rooms found.</td></tr>';
      return;
    }

    tbody.innerHTML = rooms.map(r => `
      <tr>
        <td style="color:#94a3b8;font-weight:600;">${r.id}</td>
        <td><strong>${r.room_number}</strong></td>
        <td>Floor ${r.floor}</td>
        <td style="color:#64748b;">${r.room_type}</td>
        <td><strong>₱${parseFloat(r.base_price).toLocaleString()}</strong></td>
        <td>
          <span class="badge-status" style="${getStatusStyle(r.status)}">
            ${r.status}
          </span>
        </td>
        <td>
          <button class="action-btn"
            style="background:#f0f4ff;color:#2563eb;border:1px solid #c7d7ff;"
            onclick="openStatusModal(${r.id},'${r.room_number}','${r.status}')">
            Update Status
          </button>
        </td>
      </tr>`).join('');
  } catch (err) { console.error(err); }
}

async function checkAvailability() {
  const checkIn    = document.getElementById('checkinValue').value;
  const checkOut   = document.getElementById('checkoutValue').value;
  const roomTypeId = document.getElementById('roomTypeFilter').value;
  const resultDiv  = document.getElementById('availabilityResult');

  if (!checkIn || !checkOut) {
    resultDiv.innerHTML = '<div class="alert alert-warning" style="border-radius:10px;">Please select both dates.</div>';
    return;
  }

  let url = `${API}/api/rooms/availability?check_in_date=${checkIn}&check_out_date=${checkOut}`;
  if (roomTypeId) url += `&room_type_id=${roomTypeId}`;

  try {
    const res  = await fetch(url);
    const data = await res.json();

    if (!data.rooms || data.rooms.length === 0) {
      resultDiv.innerHTML = '<div class="alert alert-warning" style="border-radius:10px;">No available rooms for selected dates.</div>';
      return;
    }

    resultDiv.innerHTML = `
      <div class="alert alert-success" style="border-radius:10px;">
        ${data.message} — ${data.nights} night(s)
      </div>
      <div class="row g-2">
        ${data.rooms.map(r => `
          <div class="col-6 col-md-3">
            <div style="background:white;border:1.5px solid #d1fae5;
                        border-radius:12px;padding:16px;">
              <div style="font-weight:700;color:#1a1a2e;">Room ${r.room_number}</div>
              <div style="color:#64748b;font-size:0.8rem;">${r.room_type} — Floor ${r.floor}</div>
              <div style="color:#64748b;font-size:0.78rem;margin-top:4px;">${r.description}</div>
              <div style="margin-top:10px;">
                <span style="font-weight:700;color:#16a34a;">
                  ₱${parseFloat(r.estimated_total).toLocaleString()}
                </span>
                <span style="color:#94a3b8;font-size:0.75rem;"> total</span>
              </div>
              <div style="color:#94a3b8;font-size:0.75rem;">
                ₱${parseFloat(r.base_price).toLocaleString()}/night
              </div>
            </div>
          </div>`).join('')}
      </div>`;
  } catch (err) {
    resultDiv.innerHTML = '<div class="alert alert-danger" style="border-radius:10px;">Error checking availability.</div>';
  }
}

async function addRoom() {
  const room_number  = document.getElementById('roomNumber').value.trim();
  const room_type_id = document.getElementById('roomType').value;
  const floor        = document.getElementById('floor').value;
  const msgDiv       = document.getElementById('addRoomMsg');

  if (!room_number || !floor) {
    msgDiv.innerHTML = '<div class="alert alert-warning" style="border-radius:10px;">Please fill in all fields.</div>';
    return;
  }

  try {
    const res  = await fetch(`${API}/api/rooms`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${getToken()}` },
      body:    JSON.stringify({ room_number, room_type_id, floor })
    });
    const data = await res.json();

    if (res.ok) {
      msgDiv.innerHTML = '<div class="alert alert-success" style="border-radius:10px;">Room added successfully.</div>';
      document.getElementById('roomNumber').value = '';
      document.getElementById('floor').value      = '';
      loadRooms();
    } else {
      msgDiv.innerHTML = `<div class="alert alert-danger" style="border-radius:10px;">${data.message}</div>`;
    }
  } catch (err) {
    msgDiv.innerHTML = '<div class="alert alert-danger" style="border-radius:10px;">Server error.</div>';
  }
}

function openStatusModal(id, roomNumber, currentStatus) {
  selectedRoomId = id;
  document.getElementById('modalRoomNumber').textContent = roomNumber;
  document.getElementById('newStatus').value = currentStatus;
  new bootstrap.Modal(document.getElementById('statusModal')).show();
}

async function updateStatus() {
  const status = document.getElementById('newStatus').value;
  try {
    const res = await fetch(`${API}/api/rooms/${selectedRoomId}/status`, {
      method:  'PATCH',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${getToken()}` },
      body:    JSON.stringify({ status })
    });
    if (res.ok) {
      bootstrap.Modal.getInstance(document.getElementById('statusModal')).hide();
      loadRooms();
    }
  } catch (err) { alert('Server error.'); }
}

loadRooms();