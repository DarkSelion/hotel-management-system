function todayDate() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

function parseDateOnly(dateStr) {
  const match = String(dateStr || '').match(/^(\d{4}-\d{2}-\d{2})/);
  if (!match) return null;
  const d = new Date(`${match[1]}T00:00:00`);
  return isNaN(d.getTime()) ? null : d;
}

function isCheckInDue(checkInDate) {
  const checkIn = parseDateOnly(checkInDate);
  if (!checkIn) return false;
  return checkIn <= todayDate();
}

async function getTotalPaid(conn, reservationId) {
  const [rows] = await conn.query(
    `SELECT COALESCE(SUM(amount), 0) AS total_paid
     FROM payments
     WHERE reservation_id = ? AND status = 'Completed'`,
    [reservationId]
  );
  return parseFloat(rows[0].total_paid);
}

async function performCheckIn(conn, reservation) {
  await conn.query(
    "UPDATE reservations SET status = 'Checked In' WHERE id = ?",
    [reservation.id]
  );
  await conn.query(
    "UPDATE rooms SET status = 'Occupied' WHERE id = ?",
    [reservation.room_id]
  );
}

const VALID_METHODS = ['Cash', 'GCash'];

async function recordPayment(conn, { reservationId, amount, paymentMethod }) {
  const amt = parseFloat(amount);

  if (!paymentMethod || !VALID_METHODS.includes(paymentMethod)) {
    const err = new Error('Invalid payment method. Use Cash or GCash.');
    err.code = 'INVALID_METHOD';
    throw err;
  }

  if (!amt || amt <= 0) {
    const err = new Error('Payment amount must be greater than zero.');
    err.code = 'INVALID_AMOUNT';
    throw err;
  }

  const [resRows] = await conn.query(
    'SELECT total_amount, status FROM reservations WHERE id = ?',
    [reservationId]
  );

  if (resRows.length === 0) {
    const err = new Error('Reservation not found.');
    err.code = 'NOT_FOUND';
    throw err;
  }

  if (resRows[0].status === 'Cancelled') {
    const err = new Error('Cannot record payment for a cancelled reservation.');
    err.code = 'CANCELLED';
    throw err;
  }

  const totalPaid = await getTotalPaid(conn, reservationId);
  const totalAmount = parseFloat(resRows[0].total_amount);
  const balance = totalAmount - totalPaid;

  if (balance <= 0) {
    const err = new Error('This reservation is already fully paid.');
    err.code = 'ALREADY_PAID';
    throw err;
  }

  if (amt > balance) {
    const err = new Error('Payment exceeds remaining balance.');
    err.code = 'EXCEEDS_BALANCE';
    err.remaining_balance = balance.toFixed(2);
    throw err;
  }

  const [payment] = await conn.query(
    `INSERT INTO payments (reservation_id, amount, payment_method, status)
     VALUES (?, ?, ?, 'Completed')`,
    [reservationId, amt, paymentMethod]
  );

  const newTotalPaid = totalPaid + amt;

  return {
    payment_id: payment.insertId,
    amount_paid: amt.toFixed(2),
    total_amount: totalAmount.toFixed(2),
    total_paid: newTotalPaid.toFixed(2),
    balance: (totalAmount - newTotalPaid).toFixed(2),
    payment_status: totalAmount - newTotalPaid <= 0 ? 'Fully Paid' : 'Partially Paid'
  };
}

async function tryAutoCheckIn(conn, reservation) {
  if (reservation.status !== 'Booked') return false;
  if (!isCheckInDue(reservation.check_in_date)) return false;

  const totalPaid = await getTotalPaid(conn, reservation.id);
  if (totalPaid <= 0) return false;

  await performCheckIn(conn, reservation);
  return true;
}

module.exports = {
  todayDate,
  parseDateOnly,
  isCheckInDue,
  getTotalPaid,
  performCheckIn,
  recordPayment,
  tryAutoCheckIn,
  VALID_METHODS
};
