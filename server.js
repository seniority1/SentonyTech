const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const Admin = require('./models/Admin'); // Ensure this model exists!
require('dotenv').config();

const app = express();

// --- PROXY CONFIGURATION ---
app.set('trust proxy', 1);

// --- MIDDLEWARE ---
app.use(express.json());
app.use(cors());

// --- ADMIN SEEDING LOGIC (The Rugged Auto-Generator) ---
const seedAdmin = async () => {
    try {
        const adminCount = await Admin.countDocuments();
        if (adminCount === 0) {
            console.log("🚀 No admin found. Seeding rugged admin...");
            
            // It will check Render Env first, otherwise use your provided password
            const adminEmail = "sentonytech@gmail.com";
            const adminPassword = process.env.INITIAL_ADMIN_PASSWORD || "alp@00hoN";

            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(adminPassword, salt);

            await Admin.create({
                fullname: "Sentony Master Admin",
                email: adminEmail,
                password: hashedPassword,
                adminIp: null, // Ready for your first login to lock it
                adminFingerprint: null
            });

            console.log(`✅ Admin created: ${adminEmail}. Login to establish rugged lock.`);
        }
    } catch (err) {
        console.error("❌ Admin seeding failed:", err.message);
    }
};

// --- DATABASE CONNECTION ---
mongoose.connect(process.env.MONGO_URI)
    .then(() => {
        console.log('✅ SentonyTech Database Connected...');
        seedAdmin(); // Runs every time the server starts
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
