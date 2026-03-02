const express = require('express');
const router = express.Router();
const Booking = require('../models/Booking');
const { protect } = require('../middleware/authMiddleware');
const axios = require('axios');

/**
 * 1. GET /api/bookings/active
 * Used by Dashboard to check if the tracking card should be visible
 */
router.get('/active', protect, async (req, res) => {
    try {
        const activeBooking = await Booking.findOne({
            userId: req.user.id,
            // Include 'Technician Assigned' so the card shows up as soon as someone is picked
            status: { $in: ['Technician Assigned', 'En Route', 'Arrived'] }
        }).sort({ createdAt: -1 }); 

        res.json(activeBooking);
    } catch (err) {
        res.status(500).json({ message: 'Server error fetching active job' });
    }
});

/**
 * 2. GET /api/bookings/:id/track
 * Used by track.html to get map coordinates and tech details
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
            techPhone: booking.techPhone, // This is now sent to the client's map
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
 * Used by the Tech/Admin to update GPS coordinates
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
 * Create a booking and notify via Telegram
 */
router.post('/', protect, async (req, res) => {
    try {
        const newBooking = new Booking({
            userId: req.user.id,
            unitId: req.body.unitId,
            customerName: req.user.fullname || 'Client', // Added to save to the model
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
            // Default user location (Lagos Center)
            userLocation: { lat: 6.5244, lng: 3.3792 } 
        });

        const savedBooking = await newBooking.save();

        // Telegram Message logic
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
