const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const webpush = require('web-push'); // 1. Added web-push
const Admin = require('./models/Admin'); 
require('dotenv').config();

const app = express();

// --- PROXY CONFIGURATION ---
app.set('trust proxy', 1);

// --- MIDDLEWARE ---
app.use(express.json());
app.use(cors());

// --- 2. CONFIGURE WEB PUSH ---
webpush.setVapidDetails(
    'mailto:sentonytech@gmail.com',
    process.env.PUBLIC_VAPID_KEY,
    process.env.PRIVATE_VAPID_KEY
);

// We store the subscription in a variable for now. 
// In a high-traffic app, you'd save this to a "Subscription" MongoDB model.
let adminPushSubscription = null; 

// --- 3. NOTIFICATION ENDPOINT ---
// Your admin dashboard will call this to "register" your browser
app.post('/api/admin/subscribe-push', (req, res) => {
    adminPushSubscription = req.body;
    console.log("✅ Admin browser subscribed for Push Notifications");
    res.status(201).json({ message: 'Subscribed successfully.' });
});

// --- 4. GLOBAL NOTIFICATION TRIGGER ---
// You can use this function anywhere in your backend to send an alert
app.post('/api/admin/test-notification', (req, res) => {
    if (!adminPushSubscription) {
        return res.status(400).json({ error: "No admin subscription found. Open dashboard first." });
    }

    const payload = JSON.stringify({
        title: "Sentony Command",
        body: "Test Notification: System is Online! 🚀"
    });

    webpush.sendNotification(adminPushSubscription, payload)
        .then(() => res.json({ success: true }))
        .catch(err => {
            console.error("Push Error:", err);
            res.status(500).json({ error: "Push failed" });
        });
});

// --- ADMIN SEEDING LOGIC ---
const seedAdmin = async () => {
    try {
        const adminCount = await Admin.countDocuments();
        if (adminCount === 0) {
            console.log("🚀 No admin found. Seeding rugged admin...");
            const adminEmail = "sentonytech@gmail.com";
            const adminPassword = process.env.INITIAL_ADMIN_PASSWORD || "alp@00hoN";
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(adminPassword, salt);

            await Admin.create({
                fullname: "Sentony Master Admin",
                email: adminEmail,
                password: hashedPassword,
                adminIp: null,
                adminFingerprint: null
            });
            console.log(`✅ Admin created: ${adminEmail}.`);
        }
    } catch (err) {
        console.error("❌ Admin seeding failed:", err.message);
    }
};

// --- DATABASE CONNECTION ---
mongoose.connect(process.env.MONGO_URI)
    .then(() => {
        console.log('✅ SentonyTech Database Connected...');
        seedAdmin();
    })
    .catch(err => console.error('❌ Connection Error:', err));

// --- DEFINE ROUTES ---
app.use('/api/auth', require('./routes/auth')); 
app.use('/api/units', require('./routes/units')); 
app.use('/api/bookings', require('./routes/bookings')); 
app.use('/api/history', require('./routes/history')); 
app.use('/api/admin', require('./routes/admin'));

// Basic Health Check Route
app.get('/', (req, res) => res.send('SentonyTech API is Running...'));

// --- SERVER START ---
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server started on port ${PORT}`));
