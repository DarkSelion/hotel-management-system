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

// Public route — guests can reserve without login
router.post('/guest', createReservation);

// Protected routes — staff only
router.post('/',              verifyToken, authorizeRoles('Admin', 'Receptionist', 'Manager'), createReservation);
router.get('/',               verifyToken, getAllReservations);
router.get('/:id',            verifyToken, getReservationById);
router.patch('/:id/cancel',   verifyToken, authorizeRoles('Admin', 'Receptionist', 'Manager'), cancelReservation);
router.patch('/:id/checkin',  verifyToken, authorizeRoles('Admin', 'Receptionist', 'Manager'), checkIn);
router.patch('/:id/checkout', verifyToken, authorizeRoles('Admin', 'Receptionist', 'Manager'), checkOut);

module.exports = router;