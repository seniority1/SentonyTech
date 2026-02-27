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
        // Including the new fields: unitNickname, hp, and quantity
        const newBooking = new Booking({
            userId: req.user.id,
            unitId: req.body.unitId,
            unitNickname: req.body.unitNickname, // Capture the name (e.g., "Living Room")
            hp: req.body.hp,                     // NEW: Capacity (e.g., "1.5 HP")
            quantity: req.body.quantity,         // NEW: Number of units
            serviceType: req.body.serviceType,
            scheduledDate: req.body.date,        // Mapping 'date' from frontend to 'scheduledDate' in Schema
            whatsapp: req.body.whatsapp,
            phone: req.body.phone,
            address: req.body.address,
            landmark: req.body.landmark,
            status: 'Pending'
        });

        const savedBooking = await newBooking.save();

        // 2. Format the Notification Message
        // Updated to include HP and Quantity in the Telegram alert
        const message = `
🔔 *New SentonyTech Booking!*
----------------------------
👤 *User:* ${req.user.fullname || 'Client'}
🏠 *Unit:* ${savedBooking.unitNickname || 'AC Unit'}
❄️ *Capacity:* ${savedBooking.hp || 'N/A'}
🔢 *Quantity:* ${savedBooking.quantity || 1}
🛠 *Service:* ${savedBooking.serviceType}
📅 *Date:* ${new Date(savedBooking.scheduledDate).toDateString()}
----------------------------
📱 *WhatsApp:* ${savedBooking.whatsapp}
📞 *Alt Phone:* ${savedBooking.phone || 'None'}
📍 *Address:* ${savedBooking.address}
🚩 *Landmark:* ${savedBooking.landmark || 'Not specified'}
----------------------------
✅ *Status:* Pending Assignment
        `;

        // 3. Trigger Telegram Alert
        if (process.env.TELEGRAM_BOT_TOKEN && process.env.TELEGRAM_CHAT_ID) {
            try {
                await axios.post(`https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
                    chat_id: process.env.TELEGRAM_CHAT_ID,
                    text: message,
                    parse_mode: 'Markdown'
                });
            } catch (teleErr) {
                console.error('Telegram Notification Failed:', teleErr.message);
                // We don't fail the request if just the notification fails
            }
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

module.exports = router;
