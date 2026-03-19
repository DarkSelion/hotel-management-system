async function loadDashboard() {
  try {
    const headers = { 'Authorization': `Bearer ${getToken()}` };
    const user    = getUser();

    const roomsRes = await fetch(`${API}/api/rooms`, { headers });
    const rooms    = await roomsRes.json();

    document.getElementById('totalRooms').textContent     = rooms.length;
    document.getElementById('availableRooms').textContent = rooms.filter(r => r.status === 'Available').length;
    document.getElementById('occupiedRooms').textContent  = rooms.filter(r => r.status === 'Occupied').length;

    const setType = (prefix, arr) => {
      const occ = arr.filter(r => r.status === 'Occupied').length;
      document.getElementById(`${prefix}Avail`).textContent = arr.filter(r => r.status === 'Available').length;
      document.getElementById(`${prefix}Occ`).textContent   = occ;
      document.getElementById(`${prefix}Total`).textContent = arr.length;
      document.getElementById(`${prefix}Bar`).style.width   =
        arr.length > 0 ? `${(occ / arr.length * 100).toFixed(0)}%` : '0%';
    };

    setType('standard', rooms.filter(r => r.room_type === 'Standard'));
    setType('deluxe',   rooms.filter(r => r.room_type === 'Deluxe'));
    setType('suite',    rooms.filter(r => r.room_type === 'Suite'));

    const resRes  = await fetch(`${API}/api/reservations`, { headers });
    const resList = await resRes.json();

    document.getElementById('totalReservations').textContent = resList.length;
    document.getElementById('activeBookings').textContent =
      resList.filter(r => r.status === 'Booked' || r.status === 'Checked In').length;
    document.getElementById('checkedOut').textContent =
      resList.filter(r => r.status === 'Checked Out').length;
    document.getElementById('cancelled').textContent =
      resList.filter(r => r.status === 'Cancelled').length;

    if (user.role !== 'Receptionist') {
      const payRes  = await fetch(`${API}/api/payments`, { headers });
      const payData = await payRes.json();
      document.getElementById('totalRevenue').textContent =
        `₱${parseFloat(payData.total_revenue || 0).toLocaleString()}`;
    }

    const tbody  = document.getElementById('recentReservations');
    const recent = resList.slice(0, 5);
    if (recent.length === 0) {
      tbody.innerHTML = '<tr><td colspan="8" class="text-center py-4 text-muted">No bookings yet.</td></tr>';
      return;
    }
    tbody.innerHTML = recent.map(r => `
      <tr>
        <td style="color:#94a3b8;font-weight:600;">#${r.id}</td>
        <td>
          <div style="font-weight:600;">${r.guest_name}</div>
          <div style="font-size:0.75rem;color:#94a3b8;">${r.email || ''}</div>
        </td>
        <td><strong>${r.room_number}</strong></td>
        <td style="color:#64748b;">${r.room_type}</td>
        <td>${new Date(r.check_in_date).toLocaleDateString()}</td>
        <td>${new Date(r.check_out_date).toLocaleDateString()}</td>
        <td><strong>₱${parseFloat(r.total_amount).toLocaleString()}</strong></td>
        <td>
          <span class="badge-status" style="${getBadgeStyle(r.status)}">
            ${r.status}
          </span>
        </td>
      </tr>`).join('');
  } catch (err) { console.error(err); }
}

loadDashboard();