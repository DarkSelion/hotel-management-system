let selectedRoomId = null;

async function loadRooms() {
  try {
    const res   = await fetch(`${API}/api/rooms`, {
      headers: { 'Authorization': `Bearer ${getToken()}` }
    });
    const rooms = await res.json();
    const tbody = document.getElementById('roomsTable');

    if (rooms.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="6" class="text-center py-4 text-muted">
            No rooms found.
          </td>
        </tr>`;
      return;
    }

    // Group by type
    const grouped = {};
    rooms.forEach(r => {
      if (!grouped[r.room_type]) grouped[r.room_type] = [];
      grouped[r.room_type].push(r);
    });

    const typeColors = {
      'Standard': { bg:'#eff6ff', color:'#2563eb', border:'#bfdbfe' },
      'Deluxe':   { bg:'#f0fdf4', color:'#16a34a', border:'#bbf7d0' },
      'Suite':    { bg:'#fff7ed', color:'#ea580c', border:'#fed7aa' }
    };
    const typeIcons = { 'Standard':'🛏️', 'Deluxe':'🌟', 'Suite':'👑' };

    const container = document.getElementById('roomsGrid');
    container.innerHTML = Object.keys(grouped).map(type => {
      const c    = typeColors[type] || { bg:'#f8fafc', color:'#64748b', border:'#e2e8f0' };
      const icon = typeIcons[type] || '🏨';
      return `
        <div style="margin-bottom:28px;">
          <div style="display:flex;align-items:center;gap:10px;margin-bottom:14px;">
            <span style="font-size:1.2rem;">${icon}</span>
            <span style="font-weight:700;color:#1a1a2e;font-size:1rem;">
              ${type} Rooms
            </span>
            <span style="background:${c.bg};color:${c.color};
                         border:1px solid ${c.border};
                         padding:3px 12px;border-radius:20px;
                         font-size:0.72rem;font-weight:700;">
              ${grouped[type].filter(r => r.status === 'Available').length} available
            </span>
            <span style="color:#94a3b8;font-size:0.8rem;">
              ₱${parseFloat(grouped[type][0].base_price).toLocaleString()}/night
            </span>
          </div>
          <div style="display:grid;
                      grid-template-columns:repeat(auto-fill,minmax(130px,1fr));
                      gap:10px;">
            ${grouped[type].map(r => {
              const statusStyle =
                r.status === 'Available'
                  ? `background:#f0fdf4;border-color:#bbf7d0;`
                  : r.status === 'Occupied'
                  ? `background:#fef2f2;border-color:#fecaca;`
                  : `background:#fff7ed;border-color:#fed7aa;`;

              const statusColor =
                r.status === 'Available' ? '#16a34a'
                : r.status === 'Occupied' ? '#dc2626'
                : '#ea580c';

              const statusIcon =
                r.status === 'Available' ? '✅'
                : r.status === 'Occupied' ? '🔴'
                : '🔧';

              return `
                <div style="border:2px solid #e2e8f0;border-radius:12px;
                            padding:14px;background:white;text-align:center;
                            transition:all 0.2s;cursor:pointer;${statusStyle}"
                  onclick="openStatusModal(${r.id},'${r.room_number}','${r.status}')"
                  onmouseover="this.style.transform='translateY(-2px)';
                               this.style.boxShadow='0 4px 14px rgba(0,0,0,0.08)'"
                  onmouseout="this.style.transform='translateY(0)';
                              this.style.boxShadow='none'">
                  <div style="font-size:1.4rem;margin-bottom:6px;">🚪</div>
                  <div style="font-weight:800;color:#1a1a2e;font-size:1rem;">
                    ${r.room_number}
                  </div>
                  <div style="font-size:0.65rem;color:#94a3b8;margin-top:2px;">
                    Floor ${r.floor}
                  </div>
                  <div style="margin-top:8px;padding-top:8px;
                              border-top:1px solid #e2e8f0;">
                    <span style="font-size:0.7rem;font-weight:700;
                                 color:${statusColor};">
                      ${statusIcon} ${r.status}
                    </span>
                  </div>
                </div>`;
            }).join('')}
          </div>
        </div>`;
    }).join('');

  } catch (err) { console.error(err); }
}

async function checkAvailability() {
  const checkIn    = document.getElementById('checkinValue').value;
  const checkOut   = document.getElementById('checkoutValue').value;
  const roomTypeId = document.getElementById('roomTypeFilter').value;
  const resultDiv  = document.getElementById('availabilityResult');

  if (!checkIn || !checkOut) {
    resultDiv.innerHTML = `
      <div class="alert alert-warning" style="border-radius:10px;">
        Please select both dates.
      </div>`;
    return;
  }

  let url = `${API}/api/rooms/availability?check_in_date=${checkIn}&check_out_date=${checkOut}`;
  if (roomTypeId) url += `&room_type_id=${roomTypeId}`;

  try {
    const res  = await fetch(url);
    const data = await res.json();

    if (!data.rooms || data.rooms.length === 0) {
      resultDiv.innerHTML = `
        <div class="alert alert-warning" style="border-radius:10px;">
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
      'Standard': { bg:'#eff6ff', color:'#2563eb', border:'#bfdbfe' },
      'Deluxe':   { bg:'#f0fdf4', color:'#16a34a', border:'#bbf7d0' },
      'Suite':    { bg:'#fff7ed', color:'#ea580c', border:'#fed7aa' }
    };
    const typeIcons = { 'Standard':'🛏️', 'Deluxe':'🌟', 'Suite':'👑' };

    resultDiv.innerHTML = `
      <div class="alert alert-success" style="border-radius:10px;">
        ${data.message} — ${data.nights} night(s)
      </div>
      ${Object.keys(grouped).map(type => {
        const c    = typeColors[type] || { bg:'#f8fafc', color:'#64748b', border:'#e2e8f0' };
        const icon = typeIcons[type] || '🏨';
        return `
          <div style="margin-bottom:16px;">
            <div style="display:flex;align-items:center;gap:8px;margin-bottom:10px;">
              <span>${icon}</span>
              <span style="font-weight:700;color:#1a1a2e;font-size:0.875rem;">
                ${type}
              </span>
              <span style="background:${c.bg};color:${c.color};
                           border:1px solid ${c.border};
                           padding:2px 10px;border-radius:20px;
                           font-size:0.7rem;font-weight:700;">
                ${grouped[type].length} available
              </span>
            </div>
            <div style="display:grid;
                        grid-template-columns:repeat(auto-fill,minmax(120px,1fr));
                        gap:8px;">
              ${grouped[type].map(r => `
                <div style="border:1.5px solid ${c.border};border-radius:10px;
                            padding:12px;background:white;text-align:center;">
                  <div style="font-weight:800;color:#1a1a2e;">
                    Room ${r.room_number}
                  </div>
                  <div style="font-size:0.72rem;color:#64748b;margin-top:2px;">
                    Floor ${r.floor}
                  </div>
                  <div style="margin-top:6px;font-weight:700;color:${c.color};
                              font-size:0.85rem;">
                    ₱${parseFloat(r.estimated_total).toLocaleString()}
                  </div>
                  <div style="font-size:0.68rem;color:#94a3b8;">total</div>
                </div>`).join('')}
            </div>
          </div>`;
      }).join('')}`;
  } catch (err) {
    resultDiv.innerHTML = `
      <div class="alert alert-danger" style="border-radius:10px;">
        Error checking availability.
      </div>`;
  }
}

async function addRoom() {
  const room_number  = document.getElementById('roomNumber').value.trim();
  const room_type_id = document.getElementById('roomType').value;
  const floor        = document.getElementById('floor').value;
  const msgDiv       = document.getElementById('addRoomMsg');

  if (!room_number || !floor) {
    msgDiv.innerHTML = `
      <div class="alert alert-warning" style="border-radius:10px;">
        Please fill in all fields.
      </div>`;
    return;
  }

  try {
    const res  = await fetch(`${API}/api/rooms`, {
      method:  'POST',
      headers: {
        'Content-Type':  'application/json',
        'Authorization': `Bearer ${getToken()}`
      },
      body: JSON.stringify({ room_number, room_type_id, floor })
    });
    const data = await res.json();

    if (res.ok) {
      msgDiv.innerHTML = `
        <div class="alert alert-success" style="border-radius:10px;">
          Room added successfully.
        </div>`;
      document.getElementById('roomNumber').value = '';
      document.getElementById('floor').value      = '';
      loadRooms();
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
      headers: {
        'Content-Type':  'application/json',
        'Authorization': `Bearer ${getToken()}`
      },
      body: JSON.stringify({ status })
    });
    if (res.ok) {
      bootstrap.Modal.getInstance(
        document.getElementById('statusModal')
      ).hide();
      loadRooms();
    }
  } catch (err) { alert('Server error.'); }
}

loadRooms();