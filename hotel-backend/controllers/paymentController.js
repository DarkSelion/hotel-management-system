const db = require('../config/db');
const {
  getTotalPaid,
  recordPayment,
  tryAutoCheckIn
} = require('../utils/reservationHelpers');

// Record a payment for a reservation
const createPayment = async (req, res) => {
  const { reservation_id, amount, payment_method, auto_checkin } = req.body;

  if (!reservation_id || !amount || !payment_method) {
    return res.status(400).json({
      message: 'reservation_id, amount, and payment_method are required.'
    });
  }

  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();

    const [reservation] = await connection.query(
      'SELECT * FROM reservations WHERE id = ?',
      [reservation_id]
    );

    if (reservation.length === 0) {
      await connection.rollback();
      return res.status(404).json({ message: 'Reservation not found.' });
    }

    const paymentInfo = await recordPayment(connection, {
      reservationId: reservation_id,
      amount,
      paymentMethod: payment_method
    });

    let checkedIn = false;
    if (auto_checkin) {
      checkedIn = await tryAutoCheckIn(connection, reservation[0]);
    }

    await connection.commit();

    res.status(201).json({
      message: checkedIn
        ? 'Payment recorded and guest checked in successfully.'
        : 'Payment recorded successfully.',
      ...paymentInfo,
      reservation_id,
      payment_method,
      checked_in: checkedIn,
      reservation_status: checkedIn ? 'Checked In' : reservation[0].status
    });

  } catch (err) {
    await connection.rollback();

    if (err.code === 'NOT_FOUND') {
      return res.status(404).json({ message: err.message });
    }
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

// Get all payments for a reservation
const getPaymentsByReservation = async (req, res) => {
  const { reservation_id } = req.params;

  try {
    const [payments] = await db.query(
      `SELECT 
        p.id,
        p.amount,
        p.payment_method,
        p.payment_date,
        p.status,
        CONCAT(g.first_name, ' ', g.last_name) AS guest_name,
        r.room_number,
        res.total_amount,
        res.check_in_date,
        res.check_out_date
       FROM payments p
       JOIN reservations res ON p.reservation_id = res.id
       JOIN guests g         ON res.guest_id = g.id
       JOIN rooms r          ON res.room_id  = r.id
       WHERE p.reservation_id = ?
       ORDER BY p.payment_date DESC`,
      [reservation_id]
    );

    if (payments.length === 0) {
      const [resRows] = await db.query(
        `SELECT res.total_amount, res.check_in_date, res.check_out_date,
                CONCAT(g.first_name, ' ', g.last_name) AS guest_name,
                r.room_number
         FROM reservations res
         JOIN guests g ON res.guest_id = g.id
         JOIN rooms r  ON res.room_id  = r.id
         WHERE res.id = ?`,
        [reservation_id]
      );

      if (resRows.length === 0) {
        return res.status(404).json({ message: 'Reservation not found.' });
      }

      const totalAmount = parseFloat(resRows[0].total_amount);
      return res.json({
        reservation_id,
        guest_name: resRows[0].guest_name,
        room_number: resRows[0].room_number,
        check_in_date: resRows[0].check_in_date,
        check_out_date: resRows[0].check_out_date,
        total_amount: totalAmount.toFixed(2),
        total_paid: '0.00',
        balance: totalAmount.toFixed(2),
        status: 'Unpaid',
        payments: []
      });
    }

    const totalPaid = payments.reduce((sum, p) => sum + parseFloat(p.amount), 0);
    const totalAmount = parseFloat(payments[0].total_amount);
    const balance = totalAmount - totalPaid;

    res.json({
      reservation_id,
      guest_name:   payments[0].guest_name,
      room_number:  payments[0].room_number,
      check_in_date:  payments[0].check_in_date,
      check_out_date: payments[0].check_out_date,
      total_amount: totalAmount.toFixed(2),
      total_paid:   totalPaid.toFixed(2),
      balance:      balance.toFixed(2),
      status:       balance <= 0 ? 'Fully Paid' : 'Partially Paid',
      payments
    });

  } catch (err) {
    res.status(500).json({ message: 'Server error.', error: err.message });
  }
};

// Get all payments (Manager/Admin view)
const getAllPayments = async (req, res) => {
  try {
    const [payments] = await db.query(
      `SELECT
        p.id,
        p.amount,
        p.payment_method,
        p.payment_date,
        p.status,
        CONCAT(g.first_name, ' ', g.last_name) AS guest_name,
        r.room_number,
        res.total_amount,
        res.check_in_date,
        res.check_out_date
       FROM payments p
       JOIN reservations res ON p.reservation_id = res.id
       JOIN guests g         ON res.guest_id = g.id
       JOIN rooms r          ON res.room_id  = r.id
       ORDER BY p.payment_date DESC`
    );

    const totalRevenue = payments.reduce((sum, p) => sum + parseFloat(p.amount), 0);

    res.json({
      total_revenue: totalRevenue.toFixed(2),
      total_transactions: payments.length,
      payments
    });

  } catch (err) {
    res.status(500).json({ message: 'Server error.', error: err.message });
  }
};

module.exports = { createPayment, getPaymentsByReservation, getAllPayments };
