const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const jwt = require('jsonwebtoken'); // Added for JWT functionality
const { Resend } = require('resend');
const User = require('../models/User');

const resend = new Resend(process.env.RESEND_API_KEY);

// Helper function to generate alphanumeric code
const generateAlphanumericCode = (length) => {
    const characters = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let result = '';
    for (let i = 0; i < length; i++) {
        result += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return result;
};

// --- LOGIN ROUTE (WITH JWT) ---
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        // 1. Find user by email
        const user = await User.findOne({ email: email.toLowerCase().trim() });
        if (!user) {
            return res.status(400).json({ message: "Invalid email or password." });
        }

        // 2. Check if the user has verified their email
        if (!user.isVerified) {
            return res.status(401).json({ message: "Please verify your email before logging in." });
        }

        // 3. Compare passwords
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: "Invalid email or password." });
        }

        // 4. Create JWT Token
        // Using a secret from .env or a fallback for development
        const token = jwt.sign(
            { id: user._id },
            process.env.JWT_SECRET || 'sentony_secret_123',
            { expiresIn: '1d' }
        );

        // 5. Success - Return token and user details
        res.status(200).json({
            message: "Login successful!",
            token,
            user: {
                id: user._id,
                fullname: user.fullname,
                email: user.email,
                phone: user.phone
            }
        });

    } catch (err) {
        console.error("Login Error:", err);
        res.status(500).json({ message: "Server error during login." });
    }
});

// --- REGISTRATION ROUTE ---
router.post('/register', async (req, res) => {
    try {
        const { fullname, email, phone, password } = req.body;

        let user = await User.findOne({ email: email.toLowerCase().trim() });
        if (user) return res.status(400).json({ message: "User already exists" });

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const code = generateAlphanumericCode(6);

        user = new User({
            fullname,
            email: email.toLowerCase().trim(),
            phone,
            password: hashedPassword,
            verificationCode: code,
            codeCreatedAt: Date.now()
        });

        await user.save();

        await resend.emails.send({
            from: 'SentonyTech <onboarding@resend.dev>',
            to: email,
            subject: 'Your SentonyTech Verification Code',
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
                        <div style="display: inline-flex; align-items: center; justify-content: center; width: 80px; height: 80px; background-color: #f0f9ff; color: #0284c7; border-radius: 50%; margin-bottom: 24px; line-height: 80px; font-size: 32px;">📬</div>
                        <h2 style="color: #0f172a; font-size: 28px; font-weight: 800; margin: 0 0 10px 0;">Verify Your Account</h2>
                        <p style="color: #64748b; font-size: 16px; line-height: 1.6; margin: 0 auto 30px auto; max-width: 400px;">
                            Hello <strong>${fullname}</strong>, please use the 6-character security code below to complete your registration.
                        </p>
                        <div style="background-color: #f8fafc; border: 2px solid #f1f5f9; padding: 25px; border-radius: 20px; display: inline-block; min-width: 250px;">
                            <span style="font-family: 'Courier New', Courier, monospace; font-size: 36px; font-weight: 900; letter-spacing: 10px; color: #0f172a;">${code}</span>
                        </div>
                        <p style="color: #ef4444; font-size: 14px; font-weight: 600; margin-top: 30px;">⚠️ This code expires in 10 minutes.</p>
                    </div>
                </div>`
        });

        res.status(201).json({ message: "Verification code sent to your email!" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server Error" });
    }
});

// --- VERIFICATION ROUTE ---
router.post('/verify', async (req, res) => {
    const { email, code } = req.body;
    try {
        const user = await User.findOne({ email: email.toLowerCase().trim() });
        if (!user) return res.status(400).json({ message: "User not found" });

        const tenMinutes = 10 * 60 * 1000;
        if (Date.now() - user.codeCreatedAt > tenMinutes) {
            return res.status(400).json({ message: "Code has expired. Please register again." });
        }

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

// --- RESEND CODE ROUTE ---
router.post('/resend-code', async (req, res) => {
    const { email } = req.body;
    try {
        const user = await User.findOne({ email: email.toLowerCase().trim() });
        if (!user) return res.status(404).json({ message: "User not found" });
        if (user.isVerified) return res.status(400).json({ message: "Already verified." });

        const newCode = generateAlphanumericCode(6);
        user.verificationCode = newCode;
        user.codeCreatedAt = Date.now();
        await user.save();

        await resend.emails.send({
            from: 'SentonyTech <onboarding@resend.dev>',
            to: email,
            subject: 'Your NEW SentonyTech Verification Code',
            html: `
                <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 550px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 24px; overflow: hidden; background-color: #ffffff;">
                    <div style="background-color: #f8fafc; padding: 30px; text-align: center; border-bottom: 1px solid #f1f5f9;">
                         <span style="font-size: 22px; font-weight: 900; color: #0f172a;">SENTONY<span style="color: #0ea5e9;">TECH</span></span>
                    </div>
                    <div style="padding: 40px 30px; text-align: center;">
                        <div style="font-size: 32px; margin-bottom: 20px;">🔄</div>
                        <h2 style="color: #0f172a;">New Security Code</h2>
                        <p>Hello <strong>${user.fullname}</strong>, here is your new code:</p>
                        <div style="background-color: #f8fafc; border: 2px solid #f1f5f9; padding: 25px; border-radius: 20px; display: inline-block;">
                            <span style="font-size: 36px; font-weight: 900; letter-spacing: 10px;">${newCode}</span>
                        </div>
                    </div>
                </div>`
        });

        res.json({ message: "A new code has been sent!" });
    } catch (err) {
        res.status(500).json({ message: "Failed to resend code" });
    }
});

// --- FORGOT PASSWORD ROUTE ---
router.post('/forgot-password', async (req, res) => {
    const { email } = req.body;
    try {
        const user = await User.findOne({ email: email.toLowerCase().trim() });
        if (!user) return res.status(404).json({ message: "No account found with this email." });

        const token = crypto.randomBytes(20).toString('hex');
        user.resetPasswordToken = token;
        user.resetPasswordExpires = Date.now() + 3600000; // 1 Hour
        await user.save();

        const resetUrl = `https://sentony.netlify.app/reset-password.html?token=${token}`;

        await resend.emails.send({
            from: 'SentonyTech <onboarding@resend.dev>',
            to: email,
            subject: 'Reset Your SentonyTech Password',
            html: `
                <div style="font-family: 'Segoe UI', sans-serif; max-width: 550px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 24px; overflow: hidden; background-color: #ffffff;">
                    <div style="background-color: #f8fafc; padding: 30px; text-align: center; border-bottom: 1px solid #f1f5f9;">
                         <span style="font-size: 22px; font-weight: 900; color: #0f172a;">SENTONY<span style="color: #0ea5e9;">TECH</span></span>
                    </div>
                    <div style="padding: 40px 30px; text-align: center;">
                        <div style="font-size: 32px; margin-bottom: 24px;">🔑</div>
                        <h2 style="color: #0f172a;">Password Reset</h2>
                        <p style="color: #64748b;">Hi <strong>${user.fullname}</strong>, click below to set a new password.</p>
                        <a href="${resetUrl}" style="background-color: #0284c7; color: #ffffff; padding: 16px 32px; border-radius: 12px; text-decoration: none; font-weight: bold; display: inline-block; margin: 20px 0;">Reset Password</a>
                        <p style="color: #94a3b8; font-size: 13px;">Link expires in 60 minutes.</p>
                    </div>
                </div>`
        });

        res.json({ message: "Reset link sent to your email!" });
    } catch (err) {
        res.status(500).json({ message: "Error sending reset email." });
    }
});

// --- RESET PASSWORD (FINAL STEP) ---
router.post('/reset-password/:token', async (req, res) => {
    const { password } = req.body;
    try {
        const user = await User.findOne({
            resetPasswordToken: req.params.token,
            resetPasswordExpires: { $gt: Date.now() }
        });

        if (!user) return res.status(400).json({ message: "Token invalid or expired." });

        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(password, salt);
        user.resetPasswordToken = undefined;
        user.resetPasswordExpires = undefined;
        await user.save();

        res.json({ message: "Password reset successful! You can now login." });
    } catch (err) {
        res.status(500).json({ message: "Error resetting password." });
    }
});

module.exports = router;
