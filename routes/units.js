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

// @route   DELETE /api/units/:id
// @desc    Delete an AC unit
router.delete('/:id', protect, async (req, res) => {
    try {
        const unit = await ACUnit.findById(req.params.id);

        if (!unit) {
            return res.status(404).json({ message: 'Unit not found' });
        }

        // Security Check: Does this unit belong to the logged-in user?
        if (unit.userId.toString() !== req.user.id) {
            return res.status(401).json({ message: 'User not authorized to delete this unit' });
        }

        await unit.deleteOne();
        res.json({ message: 'Unit removed successfully' });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ message: 'Server Error' });
    }
});

module.exports = router;
