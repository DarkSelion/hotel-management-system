const db = require('../config/db');
const { getConfig } = require('../utils/cache');
const {
  isCheckInDue,
  getTotalPaid,
  performCheckIn,
  recordPayment,
  tryAutoCheckIn
} = require('../utils/reservationHelpers');

// Create a new reservation
const createReservation = async (req, res) => {
  const {
    first_name,
    last_name,
    phone,
    email,
    address,
    room_id,
    check_in_date,
    check_out_date,
    initial_payment
  } = req.body;

  if (!first_name || !last_name || !room_id || !check_in_date || !check_out_date) {
    return res.status(400).json({
      message: 'first_name, last_name, room_id, check_in_date, and check_out_date are required.'
    });
  }

  if (new Date(check_out_date) <= new Date(check_in_date)) {
    return res.status(400).json({
      message: 'check_out_date must be after check_in_date.'
    });
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  if (new Date(check_in_date) < today) {
    return res.status(400).json({
      message: 'check_in_date cannot be in the past.'
    });
  }

  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();

    const [conflict] = await connection.query(
      `SELECT id FROM reservations
       WHERE room_id = ?
         AND status NOT IN ('Cancelled', 'Checked Out')
         AND check_in_date  < ?
         AND check_out_date > ?`,
      [room_id, check_out_date, check_in_date]
    );

    if (conflict.length > 0) {
      await connection.rollback();
      return res.status(409).json({
        message: 'Room is no longer available for the selected dates.'
      });
    }

    const [roomRows] = await connection.query(
      `SELECT r.id, r.room_number, r.status, rt.base_price
       FROM rooms r
       JOIN room_types rt ON r.room_type_id = rt.id
       WHERE r.id = ? FOR UPDATE`,
      [room_id]
    );

    if (roomRows.length === 0) {
      await connection.rollback();
      return res.status(404).json({ message: 'Room not found.' });
    }

    if (roomRows[0].status === 'Under Maintenance') {
      await connection.rollback();
      return res.status(409).json({ message: 'Room is under maintenance.' });
    }

    const nights = Math.round(
      (new Date(check_out_date) - new Date(check_in_date))
      / (1000 * 60 * 60 * 24)
    );
    const basePrice   = parseFloat(roomRows[0].base_price);
    const taxRate     = parseFloat(await getConfig('tax_rate_percent') || '12') / 100;
    const subtotal    = nights * basePrice;
    const taxAmount   = subtotal * taxRate;
    const totalAmount = subtotal + taxAmount;

    let guestId;
    if (email) {
      const [existingGuest] = await connection.query(
        'SELECT id FROM guests WHERE email = ?',
        [email]
      );
      if (existingGuest.length > 0) {
        guestId = existingGuest[0].id;
        await connection.query(
          `UPDATE guests SET first_name=?, last_name=?, phone=?, address=?
           WHERE id=?`,
          [first_name, last_name, phone, address, guestId]
        );
      }
    }

    if (!guestId) {
      const [newGuest] = await connection.query(
        'INSERT INTO guests (first_name, last_name, phone, email, address) VALUES (?,?,?,?,?)',
        [first_name, last_name, phone, email, address]
      );
      guestId = newGuest.insertId;
    }

    const [reservation] = await connection.query(
      `INSERT INTO reservations
        (guest_id, room_id, check_in_date, check_out_date, status, total_amount)
       VALUES (?, ?, ?, ?, 'Booked', ?)`,
      [guestId, room_id, check_in_date, check_out_date, totalAmount]
    );

    const reservationId = reservation.insertId;
    let paymentInfo = null;
    let checkedIn = false;

    if (initial_payment?.amount && initial_payment?.payment_method) {
      paymentInfo = await recordPayment(connection, {
        reservationId,
        amount: initial_payment.amount,
        paymentMethod: initial_payment.payment_method
      });

      checkedIn = await tryAutoCheckIn(connection, {
        id: reservationId,
        status: 'Booked',
        check_in_date,
        room_id
      });
    }

    await connection.commit();

    res.status(201).json({
      message: checkedIn
        ? 'Reservation created and guest checked in successfully.'
        : 'Reservation created successfully.',
      reservation_id: reservationId,
      guest: { id: guestId, first_name, last_name },
      room_number: roomRows[0].room_number,
      check_in_date,
      check_out_date,
      nights,
      subtotal:     subtotal.toFixed(2),
      tax_amount:   taxAmount.toFixed(2),
      total_amount: totalAmount.toFixed(2),
      status:       checkedIn ? 'Checked In' : 'Booked',
      checked_in:   checkedIn,
      payment:      paymentInfo
    });

  } catch (err) {
    await connection.rollback();

    if (err.code === 'EXCEEDS_BALANCE') {
      return res.status(400).json({
        message: err.message,
        remaining_balance: err.remaining_balance
      });
    }
    if (['INVALID_METHOD', 'INVALID_AMOUNT', 'ALREADY_PAID', 'CANCELLED'].includes(err.code)) {
      return res.status(400).json({ message: err.message });
    }

    res.status(500).json({ message: 'Server error.', error: err.message });
  } finally {
    connection.release();
  }
};

// Get all reservations
const getAllReservations = async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT
        res.id,
        res.check_in_date,
        res.check_out_date,
        res.status,
        res.total_amount,
        res.created_at,
        CONCAT(g.first_name, ' ', g.last_name) AS guest_name,
        g.phone,
        g.email,
        r.room_number,
        rt.name AS room_type,
        (SELECT COALESCE(SUM(amount), 0) FROM payments WHERE reservation_id = res.id) AS total_paid
      FROM reservations res
      JOIN guests g       ON res.guest_id = g.id
      JOIN rooms r        ON res.room_id  = r.id
      JOIN room_types rt  ON r.room_type_id = rt.id
      ORDER BY res.created_at DESC
    `);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: 'Server error.', error: err.message });
  }
};

// Get single reservation by ID
const getReservationById = async (req, res) => {
  const { id } = req.params;
  try {
    const [rows] = await db.query(`
      SELECT
        res.*,
        CONCAT(g.first_name, ' ', g.last_name) AS guest_name,
        g.phone,
        g.email,
        g.address,
        r.room_number,
        rt.name       AS room_type,
        rt.base_price,
        (SELECT COALESCE(SUM(amount), 0) FROM payments WHERE reservation_id = res.id) AS total_paid
      FROM reservations res
      JOIN guests g       ON res.guest_id = g.id
      JOIN rooms r        ON res.room_id  = r.id
      JOIN room_types rt  ON r.room_type_id = rt.id
      WHERE res.id = ?
    `, [id]);

    if (rows.length === 0) {
      return res.status(404).json({ message: 'Reservation not found.' });
    }

    const row = rows[0];
    const totalAmount = parseFloat(row.total_amount);
    const totalPaid = parseFloat(row.total_paid || 0);

    res.json({
      ...row,
      balance: (totalAmount - totalPaid).toFixed(2),
      payment_status: totalAmount - totalPaid <= 0 ? 'Fully Paid' : totalPaid > 0 ? 'Partially Paid' : 'Unpaid'
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error.', error: err.message });
  }
};

// Cancel a reservation
const cancelReservation = async (req, res) => {
  const { id } = req.params;
  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();

    const [rows] = await connection.query(
      'SELECT * FROM reservations WHERE id = ?', [id]
    );

    if (rows.length === 0) {
      await connection.rollback();
      return res.status(404).json({ message: 'Reservation not found.' });
    }

    if (rows[0].status === 'Cancelled') {
      await connection.rollback();
      return res.status(400).json({ message: 'Reservation is already cancelled.' });
    }

    if (rows[0].status === 'Checked Out') {
      await connection.rollback();
      return res.status(400).json({ message: 'Cannot cancel a completed reservation.' });
    }

    await connection.query(
      "UPDATE reservations SET status = 'Cancelled' WHERE id = ?", [id]
    );

    if (rows[0].status === 'Checked In') {
      await connection.query(
        "UPDATE rooms SET status = 'Available' WHERE id = ?",
        [rows[0].room_id]
      );
    }

    await connection.commit();
    res.json({ message: 'Reservation cancelled successfully.' });

  } catch (err) {
    await connection.rollback();
    res.status(500).json({ message: 'Server error.', error: err.message });
  } finally {
    connection.release();
  }
};

// Check in a guest (optionally with payment in one step)
const checkIn = async (req, res) => {
  const { id } = req.params;
  const { amount, payment_method } = req.body || {};
  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();

    const [rows] = await connection.query(
      'SELECT * FROM reservations WHERE id = ?', [id]
    );

    if (rows.length === 0) {
      await connection.rollback();
      return res.status(404).json({ message: 'Reservation not found.' });
    }

    const reservation = rows[0];

    if (reservation.status !== 'Booked') {
      await connection.rollback();
      return res.status(400).json({
        message: `Cannot check in. Current status is: ${reservation.status}`
      });
    }

    if (!isCheckInDue(reservation.check_in_date)) {
      await connection.rollback();
      return res.status(400).json({
        message: 'Check-in is only available on or after the scheduled check-in date.'
      });
    }

    let paymentInfo = null;
    if (amount && payment_method) {
      paymentInfo = await recordPayment(connection, {
        reservationId: id,
        amount,
        paymentMethod: payment_method
      });
    }

    const totalPaid = await getTotalPaid(connection, id);
    if (totalPaid <= 0) {
      await connection.rollback();
      return res.status(400).json({
        message: 'Payment is required before check-in.'
      });
    }

    await performCheckIn(connection, reservation);
    await connection.commit();

    const totalAmount = parseFloat(reservation.total_amount);
    const balance = totalAmount - totalPaid;

    res.json({
      message: 'Guest checked in successfully.',
      checked_in: true,
      reservation_id: parseInt(id, 10),
      status: 'Checked In',
      total_amount: totalAmount.toFixed(2),
      total_paid: totalPaid.toFixed(2),
      balance: balance.toFixed(2),
      payment: paymentInfo
    });
  } catch (err) {
    await connection.rollback();

    if (err.code === 'EXCEEDS_BALANCE') {
      return res.status(400).json({
        message: err.message,
        remaining_balance: err.remaining_balance
      });
    }
    if (['INVALID_METHOD', 'INVALID_AMOUNT', 'ALREADY_PAID', 'CANCELLED'].includes(err.code)) {
      return res.status(400).json({ message: err.message });
    }

    res.status(500).json({ message: 'Server error.', error: err.message });
  } finally {
    connection.release();
  }
};

// Check out a guest
const checkOut = async (req, res) => {
  const { id } = req.params;
  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();

    const [rows] = await connection.query(
      'SELECT * FROM reservations WHERE id = ?', [id]
    );
    if (rows.length === 0) {
      await connection.rollback();
      return res.status(404).json({ message: 'Reservation not found.' });
    }
    if (rows[0].status !== 'Checked In') {
      await connection.rollback();
      return res.status(400).json({
        message: `Cannot check out. Current status is: ${rows[0].status}`
      });
    }

    await connection.query(
      "UPDATE reservations SET status = 'Checked Out' WHERE id = ?", [id]
    );

    await connection.query(
      "UPDATE rooms SET status = 'Available' WHERE id = ?",
      [rows[0].room_id]
    );

    await connection.commit();
    res.json({
      message: 'Guest checked out successfully. Room is now available.'
    });

  } catch (err) {
    await connection.rollback();
    res.status(500).json({ message: 'Server error.', error: err.message });
  } finally {
    connection.release();
  }
};

module.exports = {
  createReservation,
  getAllReservations,
  getReservationById,
  cancelReservation,
  checkIn,
  checkOut
};
