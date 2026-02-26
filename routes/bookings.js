const express = require('express');
const router = express.Router();
const axios = require('axios');
const Booking = require('../models/Booking');
const { protect } = require('../middleware/authMiddleware');

// @route   POST /api/bookings
// @desc    Create a new booking and alert via Telegram
router.post('/', protect, async (req, res) => {
    try {
        const { unitId, serviceType, date, whatsapp, phone, address, landmark } = req.body;

        // 1. Save to MongoDB
        const newBooking = new Booking({
            userId: req.user.id,
            unitId,
            serviceType,
            scheduledDate: date,
            whatsapp,
            phone,
            address,
            landmark,
            status: 'Pending'
        });

        const savedBooking = await newBooking.save();

        // 2. Prepare Telegram Message
        const botToken = process.env.TELEGRAM_BOT_TOKEN;
        const chatId = process.env.TELEGRAM_CHAT_ID;
        
        const message = `
🔔 *New SentonyTech Booking!*
----------------------------
👤 *Client:* ${req.user.fullname || 'User'}
🛠 *Service:* ${serviceType}
📅 *Date:* ${date}
📱 *WhatsApp:* ${whatsapp}
📍 *Address:* ${address}
🚩 *Landmark:* ${landmark}
----------------------------
_Check Admin Panel for details_
        `;

        // 3. Send to Telegram via Axios
        await axios.post(`https://api.telegram.org/bot${botToken}/sendMessage`, {
            chat_id: chatId,
            text: message,
            parse_mode: 'Markdown'
        });

        res.status(201).json(savedBooking);

    } catch (err) {
        console.error('Booking Error:', err.message);
        res.status(500).json({ message: 'Server Error', error: err.message });
    }
});

// IMPORTANT: This export prevents the error you just saw!
module.exports = router;
