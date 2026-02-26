const express = require('express');
const router = express.Router();
const ACUnit = require('../models/Unit');
const { protect } = require('../middleware/authMiddleware');

// @route   GET /api/units
// @desc    Get all units for the logged-in user
router.get('/', protect, async (req, res) => {
    try {
        const units = await ACUnit.find({ userId: req.user.id });
        res.json(units);
    } catch (err) {
        res.status(500).json({ message: 'Server Error' });
    }
});

// @route   POST /api/units
// @desc    Add a new unit
router.post('/', protect, async (req, res) => {
    const { nickname, brand, hp, type } = req.body;
    try {
        const newUnit = new ACUnit({
            userId: req.user.id,
            nickname,
            brand,
            hp,
            type
        });
        const savedUnit = await newUnit.save();
        res.status(201).json(savedUnit);
    } catch (err) {
        res.status(400).json({ message: 'Data validation failed' });
    }
});

module.exports = router;
