const express = require('express');
const router = express.Router();
const axios = require('axios'); // Add axios for Telegram requests
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Admin = require('../models/Admin');
const Booking = require('../models/Booking');
const { protect, adminOnly } = require('../middleware/adminMiddleware');

// --- TELEGRAM HELPER ---
const sendTelegramUpdate = async (message) => {
    try {
        const botToken = process.env.TELEGRAM_BOT_TOKEN;
        const chatId = process.env.TELEGRAM_CHAT_ID;
        const url = `https://api.telegram.org/bot${botToken}/sendMessage`;
        await axios.post(url, { chat_id: chatId, text: message, parse_mode: 'HTML' });
    } catch (err) {
        console.error("Telegram Notification Failed:", err.message);
    }
};

// ... (Keep your Login and Get Orders routes exactly as they are) ...

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

        // --- SEND TELEGRAM ALERT ---
        const telegramMsg = `🔔 <b>Status Update</b>\n\n` +
                          `<b>Service:</b> ${updatedBooking.serviceType}\n` +
                          `<b>Customer:</b> ${updatedBooking.customerName}\n` +
                          `<b>New Status:</b> 🔵 ${status}\n` +
                          `<b>Location:</b> ${updatedBooking.address}`;
        
        sendTelegramUpdate(telegramMsg);

        res.json(updatedBooking);
        console.log(`✅ Order ${req.params.id} updated to: ${status}`);
    } catch (err) {
        res.status(500).json({ message: "Status update failed" });
    }
});

// @route   PUT /api/admin/orders/:id/assign
router.put('/orders/:id/assign', protect, adminOnly, async (req, res) => {
    try {
        const { assignedTech } = req.body;
        
        const updatedBooking = await Booking.findByIdAndUpdate(
            req.params.id,
            { assignedTech: assignedTech },
            { new: true }
        );

        if (!updatedBooking) return res.status(404).json({ message: "Order not found" });

        // --- SEND TELEGRAM ALERT ---
        const techMsg = `👤 <b>Technician Assigned</b>\n\n` +
                        `<b>Service:</b> ${updatedBooking.serviceType}\n` +
                        `<b>Assigned to:</b> ${assignedTech}\n` +
                        `<b>Customer:</b> ${updatedBooking.customerName}`;
        
        sendTelegramUpdate(techMsg);

        res.json(updatedBooking);
    } catch (err) {
        res.status(500).json({ message: "Assignment failed" });
    }
});

module.exports = router;
