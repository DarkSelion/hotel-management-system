const db = require('../config/db');

// Record a payment for a reservation
const createPayment = async (req, res) => {
  const { reservation_id, amount, payment_method } = req.body;

  if (!reservation_id || !amount || !payment_method) {
    return res.status(400).json({
      message: 'reservation_id, amount, and payment_method are required.'
    });
  }

  const validMethods = ['Cash', 'Credit Card', 'Debit Card', 'GCash', 'Bank Transfer'];
  if (!validMethods.includes(payment_method)) {
    return res.status(400).json({
      message: `Invalid payment method. Use: ${validMethods.join(', ')}`
    });
  }

  try {
    // Check reservation exists
    const [reservation] = await db.query(
      'SELECT * FROM reservations WHERE id = ?',
      [reservation_id]
    );

    if (reservation.length === 0) {
      return res.status(404).json({ message: 'Reservation not found.' });
    }

    if (reservation[0].status === 'Cancelled') {
      return res.status(400).json({
        message: 'Cannot record payment for a cancelled reservation.'
      });
    }

    // Check if already fully paid
    const [existingPayments] = await db.query(
      `SELECT COALESCE(SUM(amount), 0) AS total_paid
       FROM payments
       WHERE reservation_id = ? AND status = 'Completed'`,
      [reservation_id]
    );

    const totalPaid     = parseFloat(existingPayments[0].total_paid);
    const totalAmount   = parseFloat(reservation[0].total_amount);
    const remainingBalance = totalAmount - totalPaid;

    if (remainingBalance <= 0) {
      return res.status(400).json({
        message: 'This reservation is already fully paid.',
        total_amount:  totalAmount.toFixed(2),
        total_paid:    totalPaid.toFixed(2),
        balance:       '0.00'
      });
    }

    if (parseFloat(amount) > remainingBalance) {
      return res.status(400).json({
        message: `Payment exceeds remaining balance.`,
        remaining_balance: remainingBalance.toFixed(2)
      });
    }

    // Record payment
    const [payment] = await db.query(
      `INSERT INTO payments (reservation_id, amount, payment_method, status)
       VALUES (?, ?, ?, 'Completed')`,
      [reservation_id, amount, payment_method]
    );

    // Calculate new balance
    const newTotalPaid = totalPaid + parseFloat(amount);
    const newBalance   = totalAmount - newTotalPaid;

    res.status(201).json({
      message:        'Payment recorded successfully.',
      payment_id:     payment.insertId,
      reservation_id,
      amount_paid:    parseFloat(amount).toFixed(2),
      total_amount:   totalAmount.toFixed(2),
      total_paid:     newTotalPaid.toFixed(2),
      balance:        newBalance.toFixed(2),
      payment_method,
      status:         newBalance <= 0 ? 'Fully Paid' : 'Partially Paid'
    });

  } catch (err) {
    res.status(500).json({ message: 'Server error.', error: err.message });
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
      return res.json({
        message: 'No payments found for this reservation.',
        payments: []
      });
    }

    // Calculate totals
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