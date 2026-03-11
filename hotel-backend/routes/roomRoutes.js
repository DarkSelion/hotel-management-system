const express    = require('express');
const router     = express.Router();
const { getAllRooms, checkAvailability, addRoom, updateRoomStatus } 
                 = require('../controllers/roomController');
const { verifyToken, authorizeRoles } 
                 = require('../middleware/authMiddleware');

// Public — check availability (frontend search form will use this)
router.get('/availability', checkAvailability);

// Protected — must be logged in
router.get('/',     verifyToken, getAllRooms);
router.post('/',    verifyToken, authorizeRoles('Admin'), addRoom);
router.patch('/:id/status', verifyToken, 
  authorizeRoles('Admin', 'Receptionist'), updateRoomStatus);

module.exports = router;