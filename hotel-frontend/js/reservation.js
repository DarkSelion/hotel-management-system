let selectedRoomId = null;
let selectedRoom   = null;

async function searchRooms() {
  const checkIn  = document.getElementById('checkinValue').value;
  const checkOut = document.getElementById('checkoutValue').value;
  if (!checkIn || !checkOut) {
    alert('Please select both check-in and check-out dates.');
    return;
  }
  try {
    const res  = await fetch(
      `${API}/api/rooms/availability?check_in_date=${checkIn}&check_out_date=${checkOut}`
    );
    const data = await res.json();
    document.getElementById('step2').style.display = 'block';
    const roomList = document.getElementById('roomList');

    if (!data.rooms || data.rooms.length === 0) {
      roomList.innerHTML = `
        <div class="text-center py-4 text-muted">
          No available rooms for your selected dates.
        </div>`;
      return;
    }

    // Group rooms by type
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

const typeIcons = {
  'Standard': '🛏️',
  'Deluxe':   '🌟',
  'Suite':    '👑'
};

roomList.innerHTML = Object.keys(grouped).map(type => {
  const c = typeColors[type] || { bg:'#f8fafc', color:'#64748b', border:'#e2e8f0' };
  const icon = typeIcons[type] || '🏨';
  return `
    <div style="margin-bottom:20px;">
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:12px;">
        <span style="font-size:1.1rem;">${icon}</span>
        <span style="font-weight:700;color:#1a1a2e;font-size:0.95rem;">
          ${type} Rooms
        </span>
        <span style="background:${c.bg};color:${c.color};
                     border:1px solid ${c.border};
                     padding:2px 10px;border-radius:20px;font-size:0.72rem;
                     font-weight:700;">
          ${grouped[type].length} available
        </span>
      </div>
      <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(160px,1fr));gap:10px;">
        ${grouped[type].map(r => `
          <div id="room-${r.id}"
            onclick="selectRoom(${r.id},'${r.room_number}','${r.room_type}',
                     ${r.base_price},${r.estimated_total},${r.nights},
                     '${r.description}',${r.floor})"
            style="border:2px solid ${c.border};border-radius:12px;
                   padding:14px;cursor:pointer;background:white;
                   transition:all 0.2s;text-align:center;"
            onmouseover="this.style.background='${c.bg}';
                         this.style.borderColor='${c.color}'"
            onmouseout="if(!this.classList.contains('selected')){
                          this.style.background='white';
                          this.style.borderColor='${c.border}';}">
            <div style="font-size:1.5rem;margin-bottom:6px;">🚪</div>
            <div style="font-weight:800;color:#1a1a2e;font-size:1rem;">
              ${r.room_number}
            </div>
            <div style="font-size:0.72rem;color:#64748b;margin-top:2px;">
              Floor ${r.floor}
            </div>
            <div style="margin-top:8px;padding-top:8px;
                        border-top:1px solid ${c.border};">
              <div style="font-weight:700;color:${c.color};font-size:0.9rem;">
                ₱${parseFloat(r.base_price).toLocaleString()}
              </div>
              <div style="font-size:0.7rem;color:#94a3b8;">per night</div>
            </div>
          </div>`).join('')}
      </div>
    </div>`;
}).join('');

    document.getElementById('step2').scrollIntoView({ behavior: 'smooth' });
  } catch (err) {
    alert('Error searching rooms. Please make sure the server is running.');
  }
}

function selectRoom(id, number, type, price, total, nights, desc, floor) {
  selectedRoomId = id;
  selectedRoom   = { id, number, type, price, total, nights };
  // Reset all room cards
document.querySelectorAll('[id^="room-"]').forEach(c => {
  c.style.background   = 'white';
  c.style.borderColor  = '#e2e8f0';
  c.style.boxShadow    = 'none';
});

// Highlight selected
const selected = document.getElementById(`room-${id}`);
if (selected) {
  selected.style.background  = '#1a1a2e';
  selected.style.borderColor = '#1a1a2e';
  selected.style.boxShadow   = '0 4px 14px rgba(26,26,46,0.3)';
  selected.querySelector('div:nth-child(2)').style.color = 'white';
}

  const subtotal = (total / 1.12).toFixed(2);
  const tax      = (total - subtotal).toFixed(2);

  document.getElementById('costSummary').innerHTML = `
    <div class="cost-preview" style="margin-top:16px;">
      <div style="font-weight:700;color:#1a1a2e;margin-bottom:12px;">
        Cost Summary — Room ${number}
      </div>
      <div style="display:flex;flex-wrap:wrap;gap:20px;font-size:0.85rem;">
        <div>
          <div style="color:#64748b;">Room Type</div>
          <div style="font-weight:600;">${type}</div>
        </div>
        <div>
          <div style="color:#64748b;">Duration</div>
          <div style="font-weight:600;">${nights} night(s)</div>
        </div>
        <div>
          <div style="color:#64748b;">Rate/Night</div>
          <div style="font-weight:600;">₱${parseFloat(price).toLocaleString()}</div>
        </div>
        <div>
          <div style="color:#64748b;">Subtotal</div>
          <div style="font-weight:600;">₱${parseFloat(subtotal).toLocaleString()}</div>
        </div>
        <div>
          <div style="color:#64748b;">VAT 12%</div>
          <div style="font-weight:600;">₱${parseFloat(tax).toLocaleString()}</div>
        </div>
        <div>
          <div style="color:#64748b;">Total</div>
          <div style="font-weight:800;color:#16a34a;font-size:1.05rem;">
            ₱${parseFloat(total).toLocaleString()}
          </div>
        </div>
      </div>
    </div>`;
  document.getElementById('costSummary').classList.remove('d-none');
  document.getElementById('step3').style.display = 'block';
  document.getElementById('step3').scrollIntoView({ behavior: 'smooth' });
}

async function submitReservation() {
  const first_name = document.getElementById('gFirstName').value.trim();
  const last_name  = document.getElementById('gLastName').value.trim();
  const phone      = document.getElementById('gPhone').value.trim();
  const email      = document.getElementById('gEmail').value.trim();
  const address    = document.getElementById('gAddress').value.trim();
  const msgDiv     = document.getElementById('bookingMsg');

  if (!first_name || !last_name || !phone || !email || !address) {
    msgDiv.innerHTML = `
      <div class="alert alert-warning" style="border-radius:10px;">
        Please fill in all required fields.
      </div>`;
    return;
  }
  if (!selectedRoomId) {
    msgDiv.innerHTML = `
      <div class="alert alert-warning" style="border-radius:10px;">
        Please select a room.
      </div>`;
    return;
  }
  try {
    const res  = await fetch(`${API}/api/reservations/guest`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({
        first_name, last_name, phone, email, address,
        room_id:        selectedRoomId,
        check_in_date:  calState.checkinDate,
        check_out_date: calState.checkoutDate
      })
    });
    const data = await res.json();

    if (res.ok) {
      document.getElementById('step2').style.display      = 'none';
      document.getElementById('step3').style.display      = 'none';
      document.getElementById('successCard').style.display = 'block';
      document.getElementById('confirmDetails').innerHTML  = `
        <div style="display:grid;gap:10px;">
          <div style="display:flex;justify-content:space-between;">
            <span style="color:#64748b;font-size:0.85rem;">Reservation ID</span>
            <span style="font-weight:700;">#${data.reservation_id}</span>
          </div>
          <div style="display:flex;justify-content:space-between;">
            <span style="color:#64748b;font-size:0.85rem;">Guest Name</span>
            <span style="font-weight:700;">
              ${data.guest.first_name} ${data.guest.last_name}
            </span>
          </div>
          <div style="display:flex;justify-content:space-between;">
            <span style="color:#64748b;font-size:0.85rem;">Room</span>
            <span style="font-weight:700;">${data.room_number}</span>
          </div>
          <div style="display:flex;justify-content:space-between;">
            <span style="color:#64748b;font-size:0.85rem;">Check In</span>
            <span style="font-weight:700;">${fmtDisplay(data.check_in_date)}</span>
          </div>
          <div style="display:flex;justify-content:space-between;">
            <span style="color:#64748b;font-size:0.85rem;">Check Out</span>
            <span style="font-weight:700;">${fmtDisplay(data.check_out_date)}</span>
          </div>
          <div style="display:flex;justify-content:space-between;
                      border-top:1px solid #e2e8f0;padding-top:10px;">
            <span style="color:#64748b;font-size:0.85rem;">Total Amount</span>
            <span style="font-weight:800;color:#16a34a;font-size:1rem;">
              ₱${parseFloat(data.total_amount).toLocaleString()}
            </span>
          </div>
        </div>`;
      document.getElementById('successCard').scrollIntoView({ behavior: 'smooth' });
    } else {
      msgDiv.innerHTML = `
        <div class="alert alert-danger" style="border-radius:10px;">
          ${data.message}
        </div>`;
    }
  } catch (err) {
    msgDiv.innerHTML = `
      <div class="alert alert-danger" style="border-radius:10px;">
        Server error. Please try again.
      </div>`;
  }
}