const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const User = require('../models/User');

// @route   POST api/auth/register
// @desc    Register a user
router.post('/register', async (req, res) => {
    try {
        const { fullname, email, phone, password } = req.body;

        let user = await User.findOne({ email });
        if (user) return res.status(400).json({ message: "User already exists" });

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        user = new User({
            fullname,
            email,
            phone,
            password: hashedPassword
        });

        await user.save();
        res.status(201).json({ message: "User registered successfully!" });

    } catch (err) {
        console.error(err.message);
        res.status(500).send("Server Error");
    }
});

module.exports = router;
