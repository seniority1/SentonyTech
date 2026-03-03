const express = require('express');
const router = express.Router();
const Booking = require('../models/Booking');
const { protect } = require('../middleware/authMiddleware');
const axios = require('axios');
const webpush = require('web-push'); // 1. Import web-push

/**
 * HELPER: Send Push Notification to Admin
 * This reaches out to the subscription stored in your server.js
 */
const sendAdminNotification = async (booking) => {
    // Access the global variable we defined in server.js
    // Note: If you move to a multi-admin setup later, you'd fetch subscriptions from DB
    if (global.adminPushSubscription) {
        const payload = JSON.stringify({
            title: "New Sentony Deployment! 🛠️",
            body: `${booking.serviceType} requested by ${booking.customerName || 'Client'} at ${booking.address}`,
            icon: "/logo.png",
            data: { url: "/admin-dashboard.html" }
        });

        try {
            await webpush.sendNotification(global.adminPushSubscription, payload);
            console.log("✅ Push Notification sent to Admin");
        } catch (err) {
            console.error("❌ Push Notification Failed:", err.message);
        }
    }
};

/**
 * 1. GET /api/bookings/active
 */
router.get('/active', protect, async (req, res) => {
    try {
        const activeBooking = await Booking.findOne({
            userId: req.user.id,
            status: { $in: ['Technician Assigned', 'En Route', 'Arrived'] }
        }).sort({ createdAt: -1 }); 

        res.json(activeBooking);
    } catch (err) {
        res.status(500).json({ message: 'Server error fetching active job' });
    }
});

/**
 * 2. GET /api/bookings/:id/track
 */
router.get('/:id/track', protect, async (req, res) => {
    try {
        const booking = await Booking.findById(req.params.id);
        if (!booking) return res.status(404).json({ message: 'Booking not found' });

        if (booking.userId.toString() !== req.user.id) {
            return res.status(401).json({ message: 'Unauthorized' });
        }

        res.json({
            techLat: booking.techLocation.lat,
            techLng: booking.techLocation.lng,
            userLat: booking.userLocation.lat,
            userLng: booking.userLocation.lng,
            techName: booking.assignedTech,
            techPhone: booking.techPhone,
            eta: booking.eta,
            address: booking.address,
            status: booking.status,
            serviceType: booking.serviceType
        });
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
});

/**
 * 3. PATCH /api/bookings/:id/location
 */
router.patch('/:id/location', protect, async (req, res) => {
    try {
        const { lat, lng, eta } = req.body;
        const updateData = {
            'techLocation.lat': lat,
            'techLocation.lng': lng
        };
        if (eta) updateData.eta = eta;

        const updatedBooking = await Booking.findByIdAndUpdate(
            req.params.id,
            { $set: updateData },
            { new: true }
        );

        res.json(updatedBooking);
    } catch (err) {
        res.status(500).json({ message: 'Failed to update location' });
    }
});

/**
 * 4. POST /api/bookings
 * Create a booking and notify via Telegram + Web Push
 */
router.post('/', protect, async (req, res) => {
    try {
        const newBooking = new Booking({
            userId: req.user.id,
            unitId: req.body.unitId,
            customerName: req.user.fullname || 'Client',
            unitNickname: req.body.unitNickname,
            hp: req.body.hp,
            quantity: req.body.quantity,
            serviceType: req.body.serviceType,
            scheduledDate: req.body.date,
            whatsapp: req.body.whatsapp,
            phone: req.body.phone,
            address: req.body.address,
            landmark: req.body.landmark,
            status: 'Pending',
            userLocation: { lat: 6.5244, lng: 3.3792 } 
        });

        const savedBooking = await newBooking.save();

        // --- WEB PUSH NOTIFICATION ---
        // Fired immediately upon successful save
        sendAdminNotification(savedBooking);

        // --- TELEGRAM MESSAGE LOGIC ---
        const message = `
🔔 *New SentonyTech Booking!*
----------------------------
👤 *User:* ${req.user.fullname || 'Client'}
🏠 *Unit:* ${savedBooking.unitNickname || 'AC Unit'}
🛠 *Service:* ${savedBooking.serviceType}
📅 *Date:* ${new Date(savedBooking.scheduledDate).toDateString()}
----------------------------
📍 *Address:* ${savedBooking.address}
✅ *Status:* Pending Assignment
        `;

        if (process.env.TELEGRAM_BOT_TOKEN && process.env.TELEGRAM_CHAT_ID) {
            try {
                await axios.post(`https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
                    chat_id: process.env.TELEGRAM_CHAT_ID,
                    text: message,
                    parse_mode: 'Markdown'
                });
            } catch (teleErr) {
                console.error('Telegram Notification Failed:', teleErr.message);
            }
        }

        res.status(201).json(savedBooking);

    } catch (err) {
        console.error('Booking Error:', err.message);
        res.status(500).json({ message: 'Booking failed', error: err.message });
    }
});

module.exports = router;
