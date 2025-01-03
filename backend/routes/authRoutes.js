// backend/routes/authRoutes.js
const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../utils/db');
require('dotenv').config();

const router = express.Router();

// Logout Endpoint
router.post('/logout', async (req, res) => {
    try {
        // Invalidate the JWT by clearing it on the client-side
        // Optionally, implement server-side token blacklisting if needed
        res.status(200).json({ message: 'Logout successful' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Error logging out user' });
    }
});

// User Signup
router.post('/signup', async (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) {
        return res.status(400).json({ message: 'Username and password are required' });
    }

    try {
        // Check if user already exists
        const userExists = await pool.query('SELECT * FROM users WHERE username = $1', [username]);
        if (userExists.rows.length > 0) {
            return res.status(400).json({ message: 'Username already exists' });
        }

        // Hash the password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Insert new user into the database
        await pool.query('INSERT INTO users (username, password) VALUES ($1, $2)', [username, hashedPassword]);
        res.status(201).json({ message: 'User registered successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Error registering user' });
    }
});

// User Login
router.post('/login', async (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) {
        return res.status(400).json({ message: 'Username and password are required' });
    }

    try {
        // Check if user exists
        const user = await pool.query('SELECT * FROM users WHERE username = $1', [username]);
        if (user.rows.length === 0) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        // Compare passwords
        const isMatch = await bcrypt.compare(password, user.rows[0].password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        // Generate JWT
        const token = jwt.sign({ userId: user.rows[0].id }, process.env.JWT_SECRET, { expiresIn: '1h' });
        res.status(200).json({ message: 'Login successful', token });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Error logging in user' });
    }
});

module.exports = router;
