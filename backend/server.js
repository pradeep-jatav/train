// backend/server.js
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const pool = require('./utils/db'); // Import the database connection
const authRoutes = require('./routes/authRoutes');
const seatRoutes = require('./routes/seatRoutes');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use('/auth', authRoutes);
app.use('/seats', seatRoutes);

// Basic route
app.get('/', (req, res) => {
    res.send('Backend is running!');
});

// Test Database Connection
app.get('/test-db', async (req, res) => {
    try {
        const result = await pool.query('SELECT NOW()');
        res.status(200).json({ message: 'Database connected!', time: result.rows[0].now });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Database connection failed' });
    }
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
