const express = require('express');
const router = express.Router();
const Booking = require('../models/Booking'); // Uses the existing Booking model
const auth = require('../middleware/auth');

// @route   GET /api/history
// @desc    Get the service log for the logged-in user
router.get('/', auth, async (req, res) => {
    try {
        // Fetch all records for this user, newest first
        const history = await Booking.find({ userId: req.user.id })
                                     .sort({ scheduledDate: -1 });
        
        if (!history) {
            return res.status(404).json({ msg: 'No service history found' });
        }

        res.json(history);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error fetching history');
    }
});

module.exports = router;
