// backend/routes/seatRoutes.js
const express = require('express');
const pool = require('../utils/db');
const router = express.Router();
const authenticateToken = require('../middleware/authenticateToken');

// View Available Seats
router.get('/available-seats', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM seats ORDER BY row_number, seat_number');
        res.status(200).json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Error fetching available seats' });
    }
});


/// Book Seats (Updated with priority for rows and nearby seats)
router.post('/book-seats', async (req, res) => {
    const { userId, seatCount } = req.body;
    if (!userId || !seatCount || seatCount > 7) {
        console.error('Invalid seat count or missing userId');
        return res.status(400).json({ message: 'Invalid seat count or missing userId' });
    }

    try {
        let bookedSeats = [];
        let remainingSeats = seatCount;

        // Try booking in one row
        const availableSeatsInRow = await pool.query(`
            SELECT id, row_number, seat_number
            FROM seats
            WHERE is_booked = FALSE
            ORDER BY row_number, seat_number
        `);
        
        for (let i = 0; i < availableSeatsInRow.rows.length; i++) {
            if (remainingSeats > 0) {
                bookedSeats.push(availableSeatsInRow.rows[i].id);
                remainingSeats--;
            }
        }

        // If not enough seats in one row, book nearby seats
        if (remainingSeats > 0) {
            const availableSeatsNearby = await pool.query(`
               SELECT id, row_number, seat_number
                FROM seats
                WHERE is_booked = FALSE
                ORDER BY row_number, seat_number
                    LIMIT 80
            `);
            for (let i = 0; i < availableSeatsNearby.rows.length && remainingSeats > 0; i++) {
                bookedSeats.push(availableSeatsNearby.rows[i].id);
                remainingSeats--;
            }
        }

        if (remainingSeats > 0) {
            return res.status(400).json({ message: 'Not enough available seats' });
        }

        // Book the selected seats
        const bookingPromises = bookedSeats.map(seatId =>
            pool.query('UPDATE seats SET is_booked = TRUE, booked_by = $1 WHERE id = $2', [userId, seatId])
        );
        await Promise.all(bookingPromises);

        res.status(200).json({ message: 'Seats booked successfully', seats: bookedSeats });
    } catch (err) {
        console.error('Error booking seats:', err);
        res.status(500).json({ message: 'Error booking seats' });
    }
});



// Cancel Booking (Updated)
router.post('/cancel-booking', async (req, res) => {
    const { userId } = req.body;
    if (!userId) {
        return res.status(400).json({ message: 'User ID is required' });
    }

    try {
        // Cancel all bookings for the user
        await pool.query('UPDATE seats SET is_booked = FALSE, booked_by = NULL WHERE booked_by = $1', [userId]);
        res.status(200).json({ message: 'Booking cancelled successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Error cancelling booking' });
    }
});

/// Reset All Bookings
router.post('/reset-booking', async (req, res) => {
    try {
        await pool.query('UPDATE seats SET is_booked = FALSE, booked_by = NULL');
        res.status(200).json({ message: 'All bookings have been reset' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Error resetting bookings' });
    }
});



module.exports = router;
