// routes/bookings.js
const express = require('express');
const router = express.Router();
const Booking = require('../models/Booking');
const { protect } = require('../middleware/authMiddleware');
const axios = require('axios'); // We use this to talk to Telegram

router.post('/', protect, async (req, res) => {
    try {
        const newBooking = new Booking({
            userId: req.user.id,
            ...req.body // This spreads the fields from the modal
        });

        const savedBooking = await newBooking.save();

        // TELEGRAM NOTIFICATION LOGIC
        const message = `
🔔 *New SentonyTech Booking!*
----------------------------
👤 *User:* ${req.user.fullname}
🛠 *Service:* ${savedBooking.serviceType}
📅 *Date:* ${savedBooking.scheduledDate}
📱 *WhatsApp:* ${savedBooking.whatsapp}
📍 *Address:* ${savedBooking.address}
🚩 *Landmark:* ${savedBooking.landmark}
        `;

        // Send to your Telegram Bot
        await axios.post(`https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
            chat_id: process.env.TELEGRAM_CHAT_ID,
            text: message,
            parse_mode: 'Markdown'
        });

        res.status(201).json(savedBooking);
    } catch (err) {
        res.status(500).json({ message: 'Booking failed', error: err.message });
    }
});
