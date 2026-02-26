const express = require('express');
const router = express.Router();
const Booking = require('../models/Booking');
const { protect } = require('../middleware/authMiddleware');
const axios = require('axios');

// @route   POST /api/bookings
// @desc    Create a booking and notify via Telegram
router.post('/', protect, async (req, res) => {
    try {
        // 1. Create the booking object
        // We manually map fields to ensure everything matches your Schema
        const newBooking = new Booking({
            userId: req.user.id,
            unitId: req.body.unitId,
            serviceType: req.body.serviceType,
            scheduledDate: req.body.date, // Mapping 'date' from frontend to 'scheduledDate' in Schema
            whatsapp: req.body.whatsapp,
            phone: req.body.phone,
            address: req.body.address,
            landmark: req.body.landmark,
            status: 'Pending'
        });

        const savedBooking = await newBooking.save();

        // 2. Format the Notification Message
        // We use a fallback || 'N/A' so the bot doesn't crash on empty fields
        const message = `
🔔 *New SentonyTech Booking!*
----------------------------
👤 *User:* ${req.user.fullname || 'Client'}
🛠 *Service:* ${savedBooking.serviceType}
📅 *Date:* ${new Date(savedBooking.scheduledDate).toDateString()}
📱 *WhatsApp:* ${savedBooking.whatsapp}
📞 *Alt Phone:* ${savedBooking.phone || 'None'}
📍 *Address:* ${savedBooking.address}
🚩 *Landmark:* ${savedBooking.landmark || 'Not specified'}
----------------------------
✅ *Status:* Pending Assignment
        `;

        // 3. Trigger Telegram Alert
        // Only attempt if variables exist to avoid Axios errors
        if (process.env.TELEGRAM_BOT_TOKEN && process.env.TELEGRAM_CHAT_ID) {
            await axios.post(`https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
                chat_id: process.env.TELEGRAM_CHAT_ID,
                text: message,
                parse_mode: 'Markdown'
            });
        }

        res.status(201).json(savedBooking);

    } catch (err) {
        console.error('Booking Error:', err.message);
        res.status(500).json({ 
            message: 'Booking failed', 
            error: err.message 
        });
    }
});

// CRITICAL: Export the router so server.js can use it
module.exports = router;
