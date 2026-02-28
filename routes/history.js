const express = require('express');
const router = express.Router();
const Booking = require('../models/Booking'); 
const auth = require('../middleware/auth');

// @route   GET /api/history
// @desc    Get the service log for the logged-in user
router.get('/', auth, async (req, res) => {
    try {
        // Find bookings where userId matches the ID from the JWT token
        const history = await Booking.find({ userId: req.user.id })
                                     .sort({ createdAt: -1 }); // Better to sort by creation time

        // Return empty array if none found (don't send 404, it confuses the frontend)
        res.json(history || []); 
        
    } catch (err) {
        console.error("History Route Error:", err.message);
        res.status(500).json({ msg: 'Server Error fetching history' });
    }
});

module.exports = router;
