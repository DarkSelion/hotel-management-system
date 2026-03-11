const db = require('../config/db');

// Get all rooms with their types
const getAllRooms = async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT 
        r.id,
        r.room_number,
        r.floor,
        r.status,
        rt.name        AS room_type,
        rt.base_price,
        rt.description
      FROM rooms r
      JOIN room_types rt ON r.room_type_id = rt.id
      ORDER BY r.room_number
    `);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: 'Server error.', error: err.message });
  }
};

// Check available rooms between two dates
const checkAvailability = async (req, res) => {
  const { check_in_date, check_out_date, room_type_id } = req.query;

  // Validate required fields
  if (!check_in_date || !check_out_date) {
    return res.status(400).json({ 
      message: 'check_in_date and check_out_date are required.' 
    });
  }

  // Validate check_out is after check_in
  if (new Date(check_out_date) <= new Date(check_in_date)) {
    return res.status(400).json({ 
      message: 'check_out_date must be after check_in_date.' 
    });
  }

  // Validate dates are not in the past
  if (new Date(check_in_date) < new Date().setHours(0,0,0,0)) {
    return res.status(400).json({ 
      message: 'check_in_date cannot be in the past.' 
    });
  }

  try {
    // Get max stay from system config
    const [config] = await db.query(
      'SELECT config_value FROM system_configurations WHERE config_key = ?',
      ['max_stay_nights']
    );

    if (config.length > 0) {
      const maxNights = parseInt(config[0].config_value);
      const nights = (new Date(check_out_date) - new Date(check_in_date)) 
                     / (1000 * 60 * 60 * 24);
      if (nights > maxNights) {
        return res.status(400).json({ 
          message: `Maximum stay is ${maxNights} nights.` 
        });
      }
    }

    // Build query dynamically based on whether room_type_id is provided
    let query = `
      SELECT 
        r.id,
        r.room_number,
        r.floor,
        rt.name                                              AS room_type,
        rt.base_price,
        rt.description,
        DATEDIFF(?, ?)  * rt.base_price                     AS estimated_total,
        DATEDIFF(?, ?)                                       AS nights
      FROM rooms r
      JOIN room_types rt ON r.room_type_id = rt.id
      WHERE r.status = 'Available'
        AND r.id NOT IN (
          SELECT room_id FROM reservations
          WHERE status NOT IN ('Cancelled', 'Checked Out')
            AND check_in_date  < ?
            AND check_out_date > ?
        )
    `;

    let params = [
      check_out_date, check_in_date,   // for DATEDIFF estimated_total
      check_out_date, check_in_date,   // for DATEDIFF nights
      check_out_date, check_in_date    // for overlap check
    ];

    // Add room type filter if provided
    if (room_type_id) {
      query += ' AND rt.id = ?';
      params.push(room_type_id);
    }

    query += ' ORDER BY rt.base_price ASC';

    const [rooms] = await db.query(query, params);

    if (rooms.length === 0) {
      return res.json({ 
        message: 'No available rooms for the selected dates.', 
        rooms: [] 
      });
    }

    res.json({
      message: `${rooms.length} room(s) available.`,
      check_in_date,
      check_out_date,
      nights: rooms[0].nights,
      rooms
    });

  } catch (err) {
    res.status(500).json({ message: 'Server error.', error: err.message });
  }
};

// Add a new room (Admin only)
const addRoom = async (req, res) => {
  const { room_number, room_type_id, floor } = req.body;

  if (!room_number || !room_type_id || !floor) {
    return res.status(400).json({ 
      message: 'room_number, room_type_id, and floor are required.' 
    });
  }

  try {
    await db.query(
      'INSERT INTO rooms (room_number, room_type_id, floor) VALUES (?, ?, ?)',
      [room_number, room_type_id, floor]
    );
    res.status(201).json({ message: 'Room added successfully.' });
  } catch (err) {
    res.status(500).json({ message: 'Server error.', error: err.message });
  }
};

// Update room status (Admin/Receptionist)
const updateRoomStatus = async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  const validStatuses = ['Available', 'Occupied', 'Under Maintenance'];
  if (!validStatuses.includes(status)) {
    return res.status(400).json({ 
      message: 'Invalid status. Use Available, Occupied, or Under Maintenance.' 
    });
  }

  try {
    await db.query(
      'UPDATE rooms SET status = ? WHERE id = ?',
      [status, id]
    );
    res.json({ message: 'Room status updated successfully.' });
  } catch (err) {
    res.status(500).json({ message: 'Server error.', error: err.message });
  }
};

module.exports = { getAllRooms, checkAvailability, addRoom, updateRoomStatus };