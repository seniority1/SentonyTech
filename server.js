const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();

// --- PROXY CONFIGURATION ---
app.set('trust proxy', 1);

// --- MIDDLEWARE ---
app.use(express.json());
app.use(cors());

// --- DATABASE CONNECTION ---
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log('✅ SentonyTech Database Connected...'))
    .catch(err => console.error('❌ Connection Error:', err));

// --- DEFINE ROUTES ---

// 1. Auth Routes
app.use('/api/auth', require('./routes/auth')); 

// 2. AC Unit Routes
app.use('/api/units', require('./routes/units')); 

// 3. Booking Routes (Handles new modal submissions and Telegram alerts)
app.use('/api/bookings', require('./routes/bookings')); 

// 4. History Routes (NEW: Added to handle the service log and history.js)
// This fixes the "Cannot GET /api/history" 404 error
app.use('/api/history', require('./routes/history')); 

// Basic Health Check Route
app.get('/', (req, res) => res.send('SentonyTech API is Running...'));

// --- SERVER START ---
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server started on port ${PORT}`));
