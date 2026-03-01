const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Admin = require('../models/Admin');
const Booking = require('../models/Booking');
const { protect, adminOnly } = require('../middleware/adminMiddleware');

// @route   POST /api/admin/login
// @desc    Admin Login with Hardware/Network Lock
router.post('/login', async (req, res) => {
    const { email, password, fingerprint } = req.body;
    
    // Get IP (handles Render's proxy)
    const clientIp = req.headers['x-forwarded-for']?.split(',')[0] || req.socket.remoteAddress;

    try {
        const admin = await Admin.findOne({ email });
        if (!admin) return res.status(403).json({ message: "Access Denied." });

        const isMatch = await bcrypt.compare(password, admin.password);
        if (!isMatch) return res.status(400).json({ message: "Invalid Credentials" });

        // --- RUGGED SECURITY GATE ---
        if (!admin.adminIp && !admin.adminFingerprint) {
            admin.adminIp = clientIp;
            admin.adminFingerprint = fingerprint;
            await admin.save();
            console.log(`🔒 Rugged Lock established for Admin: ${email} at IP ${clientIp}`);
        } else {
            if (admin.adminIp !== clientIp || admin.adminFingerprint !== fingerprint) {
                console.error(`🚨 UNAUTHORIZED ADMIN ATTEMPT: Expected ${admin.adminIp}, got ${clientIp}`);
                return res.status(403).json({ 
                    message: "Rugged Security Error: Unauthorized Device or Network." 
                });
            }
        }

        const token = jwt.sign(
            { id: admin._id, role: 'admin' }, 
            process.env.JWT_SECRET, 
            { expiresIn: '8h' }
        );

        res.json({
            token,
            admin: { fullname: admin.fullname }
        });

    } catch (err) {
        res.status(500).json({ message: "Server Error" });
    }
});

// @route   GET /api/admin/orders
// @desc    Fetch all bookings for the dashboard
router.get('/orders', protect, adminOnly, async (req, res) => {
    try {
        const orders = await Booking.find().sort({ createdAt: -1 });
        res.json(orders);
    } catch (err) {
        res.status(500).json({ message: "Error fetching orders" });
    }
});

// @route   PUT /api/admin/orders/:id/status
// @desc    Update order status (Pending, En Route, Completed)
router.put('/orders/:id/status', protect, adminOnly, async (req, res) => {
    try {
        const { status } = req.body;
        
        const updatedBooking = await Booking.findByIdAndUpdate(
            req.params.id,
            { status: status },
            { new: true }
        );

        if (!updatedBooking) return res.status(404).json({ message: "Order not found" });

        res.json(updatedBooking);
        console.log(`✅ Order ${req.params.id} status updated to: ${status}`);
    } catch (err) {
        res.status(500).json({ message: "Status update failed" });
    }
});

// @route   PUT /api/admin/orders/:id/assign
// @desc    Assign a technician to an order
router.put('/orders/:id/assign', protect, adminOnly, async (req, res) => {
    try {
        const { assignedTech } = req.body;
        
        const updatedBooking = await Booking.findByIdAndUpdate(
            req.params.id,
            { assignedTech: assignedTech },
            { new: true }
        );

        if (!updatedBooking) return res.status(404).json({ message: "Order not found" });

        res.json(updatedBooking);
        console.log(`👤 Tech Assigned to ${req.params.id}: ${assignedTech}`);
    } catch (err) {
        res.status(500).json({ message: "Assignment failed" });
    }
});

module.exports = router;
