const express = require('express');
const router = express.Router();
const Booking = require('../models/Booking'); 
// Use the EXACT same middleware as your bookings.js
const { protect } = require('../middleware/authMiddleware'); 

// @route   GET /api/history
// @desc    Get the service log for the logged-in user
// @access  Private
router.get('/', protect, async (req, res) => {
    try {
        // IMPORTANT: Ensure your middleware attaches the user to 'req.user'
        // We use req.user._id or req.user.id depending on your protect middleware
        const userId = req.user._id || req.user.id;

        const history = await Booking.find({ userId: userId })
                                     .sort({ createdAt: -1 });

        // Always return an array, even if empty, so the frontend doesn't crash
        res.json(history || []); 

    } catch (err) {
        console.error('History Fetch Error:', err.message);
        res.status(500).json({ 
            message: 'Server Error fetching history',
            error: err.message 
        });
    }
});

module.exports = router;
