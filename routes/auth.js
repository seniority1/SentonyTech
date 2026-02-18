const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const { Resend } = require('resend');
const User = require('../models/User');

const resend = new Resend(process.env.RESEND_API_KEY);

// Helper function to generate alphanumeric code
const generateAlphanumericCode = (length) => {
    const characters = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Removed confusing chars like O, 0, I, 1
    let result = '';
    for (let i = 0; i < length; i++) {
        result += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return result;
};

// Registration Route
router.post('/register', async (req, res) => {
    try {
        const { fullname, email, phone, password } = req.body;

        let user = await User.findOne({ email });
        if (user) return res.status(400).json({ message: "User already exists" });

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Generate 6-character alphanumeric code
        const code = generateAlphanumericCode(6);

        user = new User({
            fullname,
            email,
            phone,
            password: hashedPassword,
            verificationCode: code,
            codeCreatedAt: Date.now()
        });

        await user.save();

        // Send Email via Resend
        await resend.emails.send({
            from: 'SentonyTech <onboarding@resend.dev>',
            to: email,
            subject: 'Your SentonyTech Verification Code',
// Inside your resend.emails.send call:
html: `
    <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 550px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 24px; overflow: hidden; background-color: #ffffff;">
        
        <div style="background-color: #f8fafc; padding: 30px; text-align: center; border-bottom: 1px solid #f1f5f9;">
            <div style="display: inline-block; vertical-align: middle;">
                <div style="background-color: #0284c7; padding: 8px; border-radius: 8px; display: inline-block;">
                    <span style="color: #ffffff; font-size: 20px;">❄</span>
                </div>
                <span style="font-size: 22px; font-weight: 900; letter-spacing: -0.5px; color: #0f172a; margin-left: 10px; text-transform: uppercase;">
                    SENTONY<span style="color: #0ea5e9;">TECH</span>
                </span>
            </div>
        </div>

        <div style="padding: 40px 30px; text-align: center;">
            <div style="display: inline-flex; align-items: center; justify-content: center; width: 80px; height: 80px; background-color: #f0f9ff; color: #0284c7; border-radius: 50%; margin-bottom: 24px; line-height: 80px; font-size: 32px;">
                📬
            </div>
            
            <h2 style="color: #0f172a; font-size: 28px; font-weight: 800; margin: 0 0 10px 0;">Verify Your Account</h2>
            <p style="color: #64748b; font-size: 16px; line-height: 1.6; margin: 0 auto 30px auto; max-width: 400px;">
                Hello <strong>${fullname}</strong>, please use the 6-character security code below to complete your registration.
            </p>
            
            <div style="background-color: #f8fafc; border: 2px solid #f1f5f9; padding: 25px; border-radius: 20px; display: inline-block; min-width: 250px;">
                <span style="font-family: 'Courier New', Courier, monospace; font-size: 36px; font-weight: 900; letter-spacing: 10px; color: #0f172a;">
                    ${code}
                </span>
            </div>

            <p style="color: #ef4444; font-size: 14px; font-weight: 600; margin-top: 30px;">
                ⚠️ This code expires in 10 minutes.
            </p>
        </div>

        <div style="background-color: #f8fafc; padding: 25px; text-align: center; border-top: 1px solid #f1f5f9;">
            <p style="color: #94a3b8; font-size: 12px; margin: 0; line-height: 1.5;">
                &copy; 2026 SentonyTech. Quality AC & Tech Services.<br>
                If you didn't request this, you can safely ignore this email.
            </p>
        </div>
    </div>
`
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

        // EXPIRATION CHECK
        const tenMinutes = 10 * 60 * 1000;
        const now = Date.now();
        
        if (now - user.codeCreatedAt > tenMinutes) {
            return res.status(400).json({ message: "Code has expired. Please register again." });
        }

        // Use .toUpperCase() to ensure it's case-insensitive for the user
        if (user.verificationCode === code.toUpperCase().trim()) {
            user.isVerified = true;
            user.verificationCode = null; 
            user.codeCreatedAt = null;
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
