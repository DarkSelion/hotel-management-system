const db     = require('../config/db');
const bcrypt = require('bcryptjs');
const jwt    = require('jsonwebtoken');

const register = async (req, res) => {
  const { name, email, password, role_id } = req.body;
  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    await db.query(
      'INSERT INTO users (name, email, password, role_id) VALUES (?, ?, ?, ?)',
      [name, email, hashedPassword, role_id]
    );
    res.status(201).json({ message: 'User registered successfully.' });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ message: 'Email already exists.' });
    }
    res.status(500).json({ message: 'Server error.', error: err.message });
  }
};

const login = async (req, res) => {
  const { email, password } = req.body;
  try {
    const [rows] = await db.query(
      `SELECT u.*, r.name AS role 
       FROM users u 
       JOIN roles r ON u.role_id = r.id 
       WHERE u.email = ?`,
      [email]
    );
    if (rows.length === 0) {
      return res.status(401).json({ message: 'Invalid email or password.' });
    }
    const user = rows[0];
    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      return res.status(401).json({ message: 'Invalid email or password.' });
    }
    const token = jwt.sign(
      { id: user.id, name: user.name, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '8h' }
    );
    res.json({
      message: 'Login successful.',
      token,
      user: { id: user.id, name: user.name, role: user.role }
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error.', error: err.message });
  }
};

module.exports = { register, login };