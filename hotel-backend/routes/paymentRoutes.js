const express = require('express');
const router  = express.Router();
const {
  createPayment,
  getPaymentsByReservation,
  getAllPayments
} = require('../controllers/paymentController');
const { verifyToken, authorizeRoles } = require('../middleware/authMiddleware');

router.post('/',
  verifyToken,
  authorizeRoles('Admin', 'Receptionist'),
  createPayment
);

router.get('/',
  verifyToken,
  authorizeRoles('Admin', 'Manager'),
  getAllPayments
);

router.get('/reservation/:reservation_id',
  verifyToken,
  getPaymentsByReservation
);

module.exports = router;