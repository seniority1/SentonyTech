const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();

// --- PROXY CONFIGURATION ---
// Essential for getting the correct Client IP on Render for your Rugged Security
app.set('trust proxy', 1);

// --- MIDDLEWARE ---
app.use(express.json());
app.use(cors());

// --- DATABASE CONNECTION ---
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log('✅ SentonyTech Database Connected...'))
    .catch(err => console.error('❌ Connection Error:', err));

// --- DEFINE ROUTES ---

// 1. Auth Routes (Regular Users)
app.use('/api/auth', require('./routes/auth')); 

// 2. AC Unit Routes
app.use('/api/units', require('./routes/units')); 

// 3. Booking Routes (Handles new modal submissions and Telegram alerts)
app.use('/api/bookings', require('./routes/bookings')); 

// 4. History Routes (Handles the user's personal service log)
app.use('/api/history', require('./routes/history')); 

// 5. Admin Routes (NEW: Rugged Login, Order Management, and Dashboard)
// This links to your specialized Admin model and IP-lock logic
app.use('/api/admin', require('./routes/admin'));

// Basic Health Check Route
app.get('/', (req, res) => res.send('SentonyTech API is Running...'));

// --- SERVER START ---
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server started on port ${PORT}`));
