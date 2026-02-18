const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const { Resend } = require('resend'); // Import Resend
const User = require('../models/User');

const resend = new Resend(process.env.RESEND_API_KEY);

// Registration Route
router.post('/register', async (req, res) => {
    try {
        const { fullname, email, phone, password } = req.body;

        let user = await User.findOne({ email });
        if (user) return res.status(400).json({ message: "User already exists" });

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Generate 4-digit code
        const code = Math.floor(1000 + Math.random() * 9000).toString();

        user = new User({
            fullname,
            email,
            phone,
            password: hashedPassword,
            verificationCode: code
        });

        await user.save();

        // Send Email via Resend
        await resend.emails.send({
            from: 'SentonyTech <onboarding@resend.dev>', // You can update this later with your domain
            to: email,
            subject: 'Your SentonyTech Verification Code',
            html: `<h1>Welcome to SentonyTech!</h1>
                   <p>Hello ${fullname},</p>
                   <p>Your 4-digit verification code is: <strong>${code}</strong></p>
                   <p>This code will allow you to complete your registration.</p>`
        });

        res.status(201).json({ message: "Verification code sent to your email!" });

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server Error" });
    }
});

// Verification Route
router.post('/verify', async (req, res) => {
    const { email, code } = req.body;
    try {
        const user = await User.findOne({ email });
        if (!user) return res.status(400).json({ message: "User not found" });

        if (user.verificationCode === code) {
            user.isVerified = true;
            user.verificationCode = null; // Clear code after success
            await user.save();
            res.status(200).json({ message: "Email verified successfully!" });
        } else {
            res.status(400).json({ message: "Invalid code. Please check your email." });
        }
    } catch (err) {
        res.status(500).json({ message: "Verification failed" });
    }
});

module.exports = router;
