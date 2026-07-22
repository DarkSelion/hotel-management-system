process.env.DOTENV_CONFIG_QUIET = 'true';
const express = require('express');
const cors    = require('cors');
require('dotenv').config();

const compression = require('compression');

const authRoutes        = require('./routes/authRoutes');
const roomRoutes        = require('./routes/roomRoutes');
const reservationRoutes = require('./routes/reservationRoutes');
const paymentRoutes     = require('./routes/paymentRoutes');

const app = express();

// Enable GZIP compression
app.use(compression());

app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/rooms',        roomRoutes);
app.use('/api/reservations', reservationRoutes);
app.use('/api/payments',     paymentRoutes);

app.get('/', (req, res) => {
  res.json({ message: 'Hotel Management System API is running.' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});