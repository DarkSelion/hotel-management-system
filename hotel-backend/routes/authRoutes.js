const express = require('express');
const router  = express.Router();
const { register, login, guestRegister } = require('../controllers/authController');

router.post('/register', register);
router.post('/login',    login);
router.post('/guest/register', guestRegister);

module.exports = router;