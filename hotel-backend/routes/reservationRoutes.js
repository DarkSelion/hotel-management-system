const express = require('express');
const router  = express.Router();
const {
  createReservation,
  getAllReservations,
  getReservationById,
  cancelReservation,
  checkIn,
  checkOut
} = require('../controllers/reservationController');
const { verifyToken, authorizeRoles } = require('../middleware/authMiddleware');

// All reservation routes require login
router.post('/',                verifyToken, authorizeRoles('Admin', 'Receptionist'), createReservation);
router.get('/',                 verifyToken, getAllReservations);
router.get('/:id',              verifyToken, getReservationById);
router.patch('/:id/cancel',     verifyToken, authorizeRoles('Admin', 'Receptionist'), cancelReservation);
router.patch('/:id/checkin',    verifyToken, authorizeRoles('Admin', 'Receptionist'), checkIn);
router.patch('/:id/checkout',   verifyToken, authorizeRoles('Admin', 'Receptionist'), checkOut);

module.exports = router;