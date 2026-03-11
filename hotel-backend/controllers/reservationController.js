const db = require('../config/db');

// Helper: get config value from system_configurations
const getConfig = async (key) => {
  const [rows] = await db.query(
    'SELECT config_value FROM system_configurations WHERE config_key = ?',
    [key]
  );
  return rows.length > 0 ? rows[0].config_value : null;
};

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
    check_out_date
  } = req.body;

  // Validate required fields
  if (!first_name || !last_name || !room_id || !check_in_date || !check_out_date) {
    return res.status(400).json({
      message: 'first_name, last_name, room_id, check_in_date, and check_out_date are required.'
    });
  }

  // Validate dates
  if (new Date(check_out_date) <= new Date(check_in_date)) {
    return res.status(400).json({
      message: 'check_out_date must be after check_in_date.'
    });
  }

  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();

    // Step 1: Check room is still available (prevent race conditions)
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

    // Step 2: Get room price
    const [roomRows] = await connection.query(
      `SELECT r.id, r.room_number, r.status, rt.base_price
       FROM rooms r
       JOIN room_types rt ON r.room_type_id = rt.id
       WHERE r.id = ?`,
      [room_id]
    );

    if (roomRows.length === 0) {
      await connection.rollback();
      return res.status(404).json({ message: 'Room not found.' });
    }

    if (roomRows[0].status !== 'Available') {
      await connection.rollback();
      return res.status(409).json({ message: 'Room is not available.' });
    }

    // Step 3: Calculate total amount with tax
    const nights = (new Date(check_out_date) - new Date(check_in_date))
                   / (1000 * 60 * 60 * 24);
    const basePrice   = parseFloat(roomRows[0].base_price);
    const taxRate     = parseFloat(await getConfig('tax_rate_percent') || 0) / 100;
    const subtotal    = nights * basePrice;
    const taxAmount   = subtotal * taxRate;
    const totalAmount = subtotal + taxAmount;

    // Step 4: Create or find guest
    let guestId;
    if (email) {
      const [existingGuest] = await connection.query(
        'SELECT id FROM guests WHERE email = ?',
        [email]
      );
      if (existingGuest.length > 0) {
        guestId = existingGuest[0].id;
        // Update guest info in case it changed
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

    // Step 5: Create reservation
    const [reservation] = await connection.query(
      `INSERT INTO reservations 
        (guest_id, room_id, check_in_date, check_out_date, status, total_amount)
       VALUES (?, ?, ?, ?, 'Booked', ?)`,
      [guestId, room_id, check_in_date, check_out_date, totalAmount]
    );

    // Step 6: Mark room as Occupied
    await connection.query(
      "UPDATE rooms SET status = 'Occupied' WHERE id = ?",
      [room_id]
    );

    await connection.commit();

    res.status(201).json({
      message: 'Reservation created successfully.',
      reservation_id: reservation.insertId,
      guest: { id: guestId, first_name, last_name },
      room_number: roomRows[0].room_number,
      check_in_date,
      check_out_date,
      nights,
      subtotal:     subtotal.toFixed(2),
      tax_amount:   taxAmount.toFixed(2),
      total_amount: totalAmount.toFixed(2)
    });

  } catch (err) {
    await connection.rollback();
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
        rt.name AS room_type
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
        rt.base_price
      FROM reservations res
      JOIN guests g       ON res.guest_id = g.id
      JOIN rooms r        ON res.room_id  = r.id
      JOIN room_types rt  ON r.room_type_id = rt.id
      WHERE res.id = ?
    `, [id]);

    if (rows.length === 0) {
      return res.status(404).json({ message: 'Reservation not found.' });
    }
    res.json(rows[0]);
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

    // Cancel reservation
    await connection.query(
      "UPDATE reservations SET status = 'Cancelled' WHERE id = ?", [id]
    );

    // Free up the room
    await connection.query(
      "UPDATE rooms SET status = 'Available' WHERE id = ?",
      [rows[0].room_id]
    );

    await connection.commit();
    res.json({ message: 'Reservation cancelled successfully.' });

  } catch (err) {
    await connection.rollback();
    res.status(500).json({ message: 'Server error.', error: err.message });
  } finally {
    connection.release();
  }
};

// Check in a guest
const checkIn = async (req, res) => {
  const { id } = req.params;
  try {
    const [rows] = await db.query(
      'SELECT * FROM reservations WHERE id = ?', [id]
    );
    if (rows.length === 0) {
      return res.status(404).json({ message: 'Reservation not found.' });
    }
    if (rows[0].status !== 'Booked') {
      return res.status(400).json({
        message: `Cannot check in. Current status is: ${rows[0].status}`
      });
    }
    await db.query(
      "UPDATE reservations SET status = 'Checked In' WHERE id = ?", [id]
    );
    res.json({ message: 'Guest checked in successfully.' });
  } catch (err) {
    res.status(500).json({ message: 'Server error.', error: err.message });
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

    // Mark reservation as checked out
    await connection.query(
      "UPDATE reservations SET status = 'Checked Out' WHERE id = ?", [id]
    );

    // Free up the room
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