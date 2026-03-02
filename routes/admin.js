const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const axios = require('axios'); // Required for Telegram alerts
const Admin = require('../models/Admin');
const Booking = require('../models/Booking');
const { protect, adminOnly } = require('../middleware/adminMiddleware');

// --- TELEGRAM NOTIFICATION HELPER ---
const sendTelegramAlert = async (message) => {
    try {
        const botToken = process.env.TELEGRAM_BOT_TOKEN;
        const chatId = process.env.TELEGRAM_CHAT_ID;
        if (!botToken || !chatId) return;

        const url = `https://api.telegram.org/bot${botToken}/sendMessage`;
        await axios.post(url, {
            chat_id: chatId,
            text: message,
            parse_mode: 'HTML'
        });
    } catch (err) {
        console.error("Telegram Alert Failed:", err.message);
    }
};

// @route   POST /api/admin/login
router.post('/login', async (req, res) => {
    const { email, password, fingerprint } = req.body;
    const clientIp = req.headers['x-forwarded-for']?.split(',')[0] || req.socket.remoteAddress;

    try {
        const admin = await Admin.findOne({ email });
        if (!admin) return res.status(403).json({ message: "Access Denied." });

        const isMatch = await bcrypt.compare(password, admin.password);
        if (!isMatch) return res.status(400).json({ message: "Invalid Credentials" });

        if (!admin.adminIp && !admin.adminFingerprint) {
            admin.adminIp = clientIp;
            admin.adminFingerprint = fingerprint;
            await admin.save();
        } else {
            if (admin.adminIp !== clientIp || admin.adminFingerprint !== fingerprint) {
                return res.status(403).json({ message: "Rugged Security Error: Unauthorized Device." });
            }
        }

        const token = jwt.sign(
            { id: admin._id, role: 'admin' }, 
            process.env.JWT_SECRET, 
            { expiresIn: '8h' }
        );

        res.json({ token, admin: { fullname: admin.fullname } });
    } catch (err) {
        res.status(500).json({ message: "Server Error" });
    }
});

// @route   GET /api/admin/orders
router.get('/orders', protect, adminOnly, async (req, res) => {
    try {
        const orders = await Booking.find().sort({ createdAt: -1 });
        res.json(orders);
    } catch (err) {
        res.status(500).json({ message: "Error fetching orders" });
    }
});

// @route   PUT /api/admin/orders/:id/status
router.put('/orders/:id/status', protect, adminOnly, async (req, res) => {
    try {
        const { status } = req.body;
        const updatedBooking = await Booking.findByIdAndUpdate(
            req.params.id,
            { status: status },
            { new: true }
        );

        if (!updatedBooking) return res.status(404).json({ message: "Order not found" });

        const statusEmoji = status === 'Completed' ? '✅' : '🔵';
        const msg = `${statusEmoji} <b>SENTONY STATUS UPDATE</b>\n\n` +
                    `<b>Status:</b> ${status}\n` +
                    `<b>Service:</b> ${updatedBooking.serviceType}\n` +
                    `<b>Customer:</b> ${updatedBooking.whatsapp}\n` +
                    `--------------------------\n` +
                    `<b>Unit:</b> ${updatedBooking.unitNickname || 'Not specified'}\n` +
                    `<b>Specs:</b> ${updatedBooking.hp} (${updatedBooking.quantity} unit/s)\n` +
                    `<b>Address:</b> ${updatedBooking.address}\n` +
                    `<b>Landmark:</b> ${updatedBooking.landmark || 'No landmark'}`;
        
        sendTelegramAlert(msg);
        res.json(updatedBooking);
    } catch (err) {
        res.status(500).json({ message: "Status update failed" });
    }
});

// @route   PUT /api/admin/orders/:id/assign
// @desc    Assign a technician + Tech Phone + Telegram Notification
router.put('/orders/:id/assign', protect, adminOnly, async (req, res) => {
    try {
        // Now accepting techPhone from the request body
        const { assignedTech, techPhone } = req.body; 
        
        const updatedBooking = await Booking.findByIdAndUpdate(
            req.params.id,
            { 
                assignedTech: assignedTech,
                techPhone: techPhone // Saving to DB for client map access
            },
            { new: true }
        );

        if (!updatedBooking) return res.status(404).json({ message: "Order not found" });

        // Trigger Telegram Alert including the tech's contact
        const msg = `👤 <b>TECH ASSIGNED</b>\n\n` +
                    `<b>Technician:</b> ${assignedTech}\n` +
                    `<b>Tech Contact:</b> ${techPhone || 'Not provided'}\n` +
                    `<b>Service:</b> ${updatedBooking.serviceType}\n` +
                    `--------------------------\n` +
                    `<b>Unit Info:</b> ${updatedBooking.hp} - ${updatedBooking.unitNickname}\n` +
                    `<b>Client WhatsApp:</b> ${updatedBooking.whatsapp}\n` +
                    `<b>Location:</b> ${updatedBooking.address}`;
        
        sendTelegramAlert(msg);

        res.json(updatedBooking);
    } catch (err) {
        res.status(500).json({ message: "Assignment failed" });
    }
});

module.exports = router;
